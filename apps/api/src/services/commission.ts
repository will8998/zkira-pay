import { db } from '../db/index.js';
import { merchants, distributors, distributorCommissions } from '../db/schema.js';
import { toBigInt6, fromBigInt6, SCALE } from '../utils/bigint-math.js';
import { eq } from 'drizzle-orm';

interface ProcessCommissionsParams {
  merchantId: string;
  sessionId: string;
  platformFee: string;
  currency: string;
}

export async function processCommissions(params: ProcessCommissionsParams): Promise<void> {
  try {
    const { merchantId, sessionId, platformFee, currency } = params;

    // Fetch merchant to get distributor ID
    const merchantResult = await db.select().from(merchants).where(
      eq(merchants.id, merchantId)
    ).limit(1);

    if (merchantResult.length === 0 || !merchantResult[0].distributorId) {
      // No distributor associated with this merchant
      return;
    }

    const merchant = merchantResult[0];
    let currentDistributorId = merchant.distributorId;
    let remainingFeeBI = toBigInt6(platformFee);
    let level = 0;
    const maxLevels = 3; // Circuit breaker to prevent infinite loops

    // Walk up the distributor hierarchy
    while (currentDistributorId && remainingFeeBI > BigInt(0) && level < maxLevels) {
      // Fetch current distributor
      const distributorResult = await db.select().from(distributors).where(
        eq(distributors.id, currentDistributorId)
      ).limit(1);

      if (distributorResult.length === 0) {
        break;
      }

      const distributor = distributorResult[0];
      const commissionPercentBI = toBigInt6(distributor.commissionPercent);

      if (commissionPercentBI > BigInt(0)) {
        const commissionBI = remainingFeeBI * commissionPercentBI / SCALE / BigInt(100);
        const commission = fromBigInt6(commissionBI);

        // Insert distributor commission record
        await db.insert(distributorCommissions).values({
          distributorId: distributor.id,
          merchantId,
          sessionId,
          amount: commission,
          currency,
          sourceAmount: platformFee,
          tier: distributor.tier,
          status: 'pending'
        });

        remainingFeeBI -= commissionBI;
      }

      // Move to parent distributor
      currentDistributorId = distributor.parentId;
      level++;
    }

    // Remaining fee goes to OMNIPAY (no additional record needed)
    console.log(`Commission processing completed for session ${sessionId}. OMNIPAY keeps: ${fromBigInt6(remainingFeeBI)} ${currency}`);

  } catch (error) {
    console.error('Error processing commissions:', error);
    // Don't throw - this is fire-and-forget
  }
}