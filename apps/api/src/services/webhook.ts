import { db } from '../db/index.js';
import { merchants, gatewayWebhooks, gatewaySessions } from '../db/schema.js';
import { eq, and, lte, isNull, or } from 'drizzle-orm';
import { createHmac } from 'node:crypto';

// Exponential backoff delays: 10s, 30s, 2min, 10min, 1hr
const RETRY_DELAYS_MS = [10_000, 30_000, 120_000, 600_000, 3_600_000];

/**
 * Calculate next retry delay based on attempt number
 */
function getNextRetryDelay(attempt: number): number {
  return RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
}

/**
 * Sign webhook payload using HMAC-SHA256
 * @param payload - JSON string payload
 * @param secret - Webhook secret key
 * @param timestamp - Unix timestamp
 * @returns Hex-encoded HMAC signature
 */
export function signWebhookPayload(payload: string, secret: string, timestamp: number): string {
  const message = `${timestamp}.${payload}`;
  const hmac = createHmac('sha256', secret);
  hmac.update(message);
  return hmac.digest('hex');
}

/**
 * Deliver webhook to merchant endpoint with HMAC signing
 * @param params - Webhook delivery parameters
 */
export async function deliverWebhook(params: {
  merchantId: string;
  sessionId: string;
  event: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const { merchantId, sessionId, event, payload } = params;

  // Look up merchant to get webhook configuration
  const merchant = await db
    .select({
      webhookUrl: merchants.webhookUrl,
      webhookSecret: merchants.webhookSecret,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (merchant.length === 0) {
    console.warn(`Merchant ${merchantId} not found for webhook delivery`);
    return;
  }

  const { webhookUrl, webhookSecret } = merchant[0];

  // If no webhook URL configured, log and return
  if (!webhookUrl) {
    console.log(`Merchant ${merchantId} has no webhook URL configured, skipping delivery`);
    return;
  }

  // Build payload JSON string
  const payloadJson = JSON.stringify(payload);
  
  // Generate timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Sign payload
  const signature = signWebhookPayload(payloadJson, webhookSecret, timestamp);

  // Insert webhook record with pending status
  const webhookRecord = await db
    .insert(gatewayWebhooks)
    .values({
      merchantId,
      sessionId,
      event,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: 5,
      nextRetryAt: null,
      lastAttemptAt: new Date(),
      lastError: null,
    })
    .returning({ id: gatewayWebhooks.id });

  const webhookId = webhookRecord[0].id;

  try {
    // Attempt webhook delivery
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ZKIRA-Signature': `sha256=${signature}`,
        'X-ZKIRA-Timestamp': timestamp.toString(),
        'X-ZKIRA-Event': event,
      },
      body: payloadJson,
      signal: AbortSignal.timeout(10_000), // 10 second timeout
    });

    if (response.ok) {
      // Success - update status to delivered
      await db
        .update(gatewayWebhooks)
        .set({
          status: 'delivered',
          attempts: 1,
          lastAttemptAt: new Date(),
        })
        .where(eq(gatewayWebhooks.id, webhookId));
      
      console.log(`Webhook delivered successfully to ${webhookUrl} for event ${event}`);
    } else {
      // HTTP error - mark as failed and schedule retry
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      const nextRetryAt = new Date(Date.now() + getNextRetryDelay(0));
      
      await db
        .update(gatewayWebhooks)
        .set({
          status: 'failed',
          attempts: 1,
          lastError: errorMessage,
          nextRetryAt,
          lastAttemptAt: new Date(),
        })
        .where(eq(gatewayWebhooks.id, webhookId));
      
      console.warn(`Webhook delivery failed to ${webhookUrl}: ${errorMessage}, scheduled retry at ${nextRetryAt}`);
    }
  } catch (error) {
    // Network error or timeout - mark as failed and schedule retry
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const nextRetryAt = new Date(Date.now() + getNextRetryDelay(0));
    
    await db
      .update(gatewayWebhooks)
      .set({
        status: 'failed',
        attempts: 1,
        lastError: errorMessage,
        nextRetryAt,
        lastAttemptAt: new Date(),
      })
      .where(eq(gatewayWebhooks.id, webhookId));
    
    console.error(`Webhook delivery error to ${webhookUrl}: ${errorMessage}, scheduled retry at ${nextRetryAt}`);
  }
}

/**
 * Process webhook retries for failed deliveries
 * @returns Number of webhooks processed
 */
export async function processWebhookRetries(): Promise<number> {
  const now = new Date();
  
  // Query failed webhooks ready for retry
  const failedWebhooks = await db
    .select({
      id: gatewayWebhooks.id,
      merchantId: gatewayWebhooks.merchantId,
      sessionId: gatewayWebhooks.sessionId,
      event: gatewayWebhooks.event,
      payload: gatewayWebhooks.payload,
      attempts: gatewayWebhooks.attempts,
      maxAttempts: gatewayWebhooks.maxAttempts,
    })
    .from(gatewayWebhooks)
    .innerJoin(merchants, eq(gatewayWebhooks.merchantId, merchants.id))
    .where(
      and(
        eq(gatewayWebhooks.status, 'failed'),
        lte(gatewayWebhooks.attempts, gatewayWebhooks.maxAttempts),
        or(
          isNull(gatewayWebhooks.nextRetryAt),
          lte(gatewayWebhooks.nextRetryAt, now)
        )
      )
    );

  let processedCount = 0;

  for (const webhook of failedWebhooks) {
    try {
      // Get merchant webhook configuration
      const merchant = await db
        .select({
          webhookUrl: merchants.webhookUrl,
          webhookSecret: merchants.webhookSecret,
        })
        .from(merchants)
        .where(eq(merchants.id, webhook.merchantId))
        .limit(1);

      if (merchant.length === 0 || !merchant[0].webhookUrl) {
        // Merchant not found or no webhook URL - mark as dead letter
        await db
          .update(gatewayWebhooks)
          .set({
            status: 'dead_letter',
            lastError: 'Merchant webhook URL not configured',
            lastAttemptAt: new Date(),
          })
          .where(eq(gatewayWebhooks.id, webhook.id));
        continue;
      }

      const { webhookUrl, webhookSecret } = merchant[0];
      
      // Build payload and sign
      const payloadJson = JSON.stringify(webhook.payload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = signWebhookPayload(payloadJson, webhookSecret, timestamp);

      // Attempt delivery
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ZKIRA-Signature': `sha256=${signature}`,
          'X-ZKIRA-Timestamp': timestamp.toString(),
          'X-ZKIRA-Event': webhook.event,
        },
        body: payloadJson,
        signal: AbortSignal.timeout(10_000),
      });

      const newAttempts = webhook.attempts + 1;

      if (response.ok) {
        // Success - mark as delivered
        await db
          .update(gatewayWebhooks)
          .set({
            status: 'delivered',
            attempts: newAttempts,
            lastAttemptAt: new Date(),
          })
          .where(eq(gatewayWebhooks.id, webhook.id));
        
        console.log(`Webhook retry successful for ${webhookUrl} (attempt ${newAttempts})`);
      } else {
        // Failed delivery
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (newAttempts >= webhook.maxAttempts) {
          // Max attempts reached - mark as dead letter
          await db
            .update(gatewayWebhooks)
            .set({
              status: 'dead_letter',
              attempts: newAttempts,
              lastError: errorMessage,
              lastAttemptAt: new Date(),
            })
            .where(eq(gatewayWebhooks.id, webhook.id));
          
          console.error(`Webhook max attempts reached for ${webhookUrl}, marked as dead letter`);
        } else {
          // Schedule next retry
          const nextRetryAt = new Date(Date.now() + getNextRetryDelay(newAttempts - 1));
          
          await db
            .update(gatewayWebhooks)
            .set({
              status: 'failed',
              attempts: newAttempts,
              lastError: errorMessage,
              nextRetryAt,
              lastAttemptAt: new Date(),
            })
            .where(eq(gatewayWebhooks.id, webhook.id));
          
          console.warn(`Webhook retry failed for ${webhookUrl} (attempt ${newAttempts}), next retry at ${nextRetryAt}`);
        }
      }
    } catch (error) {
      // Network error or timeout
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const newAttempts = webhook.attempts + 1;
      
      if (newAttempts >= webhook.maxAttempts) {
        // Max attempts reached - mark as dead letter
        await db
          .update(gatewayWebhooks)
          .set({
            status: 'dead_letter',
            attempts: newAttempts,
            lastError: errorMessage,
            lastAttemptAt: new Date(),
          })
          .where(eq(gatewayWebhooks.id, webhook.id));
        
        console.error(`Webhook max attempts reached due to error, marked as dead letter: ${errorMessage}`);
      } else {
        // Schedule next retry
        const nextRetryAt = new Date(Date.now() + getNextRetryDelay(newAttempts - 1));
        
        await db
          .update(gatewayWebhooks)
          .set({
            status: 'failed',
            attempts: newAttempts,
            lastError: errorMessage,
            nextRetryAt,
            lastAttemptAt: new Date(),
          })
          .where(eq(gatewayWebhooks.id, webhook.id));
        
        console.error(`Webhook retry error (attempt ${newAttempts}), next retry at ${nextRetryAt}: ${errorMessage}`);
      }
    }
    
    processedCount++;
  }

  if (processedCount > 0) {
    console.log(`Processed ${processedCount} webhook retries`);
  }

  return processedCount;
}

/**
 * Start webhook retry processor
 * @returns Interval ID for cleanup
 */
export function startWebhookProcessor(): NodeJS.Timeout {
  console.log('Starting webhook retry processor (30 second intervals)');
  
  return setInterval(async () => {
    try {
      await processWebhookRetries();
    } catch (error) {
      console.error('Error in webhook retry processor:', error);
    }
  }, 30_000); // 30 seconds
}

/**
 * Stop webhook retry processor
 * @param intervalId - Interval ID to clear
 */
export function stopWebhookProcessor(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('Webhook retry processor stopped');
}