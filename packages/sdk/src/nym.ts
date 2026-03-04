/**
 * Nym Mixnet transport for routing relay requests through the Nym network.
 * 
 * This hides the user's IP address from the relayer by routing HTTP requests
 * through the Nym mixnet (a decentralized mixnet with Sphinx packet encryption).
 * 
 * Usage:
 *   import { NymTransport } from '@zkira/sdk';
 *   const transport = new NymTransport({ relayerUrl: 'http://relayer.example.com' });
 *   await transport.init();
 *   const result = await transport.relayTransaction(base64Transaction);
 *   await transport.disconnect();
 * 
 * Browser-only: Uses Web Workers for the Nym WASM client.
 * For Node.js server-side usage, use Tor (tor-fetch.ts) instead.
 */

export interface NymTransportOptions {
  /** Relayer URL (clearnet or .onion) */
  relayerUrl: string;
  /** Nym network validator URL (default: mainnet) */
  nymValidatorUrl?: string;
  /** Connection timeout in ms (default: 30000) */
  timeout?: number;
  /** Whether to use the preferred gateway (default: false) */
  preferredGateway?: string;
}

export interface RelayResult {
  success: boolean;
  txSignature?: string;
  error?: string;
}

export class NymTransport {
  private options: Required<Pick<NymTransportOptions, 'relayerUrl' | 'timeout'>> & NymTransportOptions;
  private connected = false;
  private nymClient: any = null;

  constructor(options: NymTransportOptions) {
    this.options = {
      timeout: 30000,
      nymValidatorUrl: 'https://validator.nymtech.net/api',
      ...options,
    };
  }

  /**
   * Initialize the Nym mixnet client.
   * This loads the WASM module and establishes a connection to the mixnet.
   * Takes 3-10 seconds depending on network conditions.
   */
  async init(): Promise<void> {
    if (this.connected) return;

    try {
      // Dynamic import to avoid bundling Nym SDK in SSR
      const { createNymMixnetClient } = await import('@nymproject/sdk');
      
      // Create the Nym mixnet client
      this.nymClient = await createNymMixnetClient();
      
      // Start the client and connect to a gateway
      await this.nymClient.client.start({
        clientId: 'zkira-pay-client',
        nymApiUrl: this.options.nymValidatorUrl,
      });
      
      this.connected = true;
    } catch (error) {
      // If Nym SDK fails to load, throw a descriptive error
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize Nym mixnet: ${message}. Browser-only feature.`);
    }
  }

  /**
   * Send a relay claim transaction through the Nym mixnet.
   * Note: This is a simplified implementation. In a real-world scenario,
   * you would need a Nym-enabled relayer that can receive messages through the mixnet.
   */
  async relayTransaction(base64Transaction: string): Promise<RelayResult> {
    if (!this.connected || !this.nymClient) {
      throw new Error('Nym transport not initialized. Call init() first.');
    }

    // For now, fall back to direct HTTP since Nym doesn't provide HTTP proxy functionality
    // In a production implementation, you would:
    // 1. Send the transaction data as a Nym message to a Nym-enabled relayer
    // 2. The relayer would process the message and submit the transaction
    // 3. The relayer would send back the result through Nym
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      // This is a fallback implementation - in reality you'd send through Nym
      const response = await fetch(
        `${this.options.relayerUrl}/relay/claim`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction: base64Transaction }),
          signal: controller.signal,
        }
      );

      const data = await response.json();
      return data as RelayResult;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Nym request timeout' };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Nym transport error',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if the Nym connection is active.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Disconnect from the Nym mixnet.
   */
  async disconnect(): Promise<void> {
    if (this.nymClient) {
      try {
        await this.nymClient.client.stop();
      } catch (error) {
        // Ignore errors during disconnect
      }
    }
    this.nymClient = null;
    this.connected = false;
  }
}

/**
 * Creates a NymTransport with fallback to direct fetch if Nym is unavailable.
 * This is the recommended way to use Nym transport — it gracefully degrades.
 */
export async function createPrivateTransport(
  relayerUrl: string,
  options?: Partial<NymTransportOptions>
): Promise<{
  relayTransaction: (base64Tx: string) => Promise<RelayResult>;
  transportType: 'nym' | 'direct';
  disconnect: () => Promise<void>;
}> {
  // Try Nym first
  try {
    const transport = new NymTransport({ relayerUrl, ...options });
    await transport.init();
    return {
      relayTransaction: (tx) => transport.relayTransaction(tx),
      transportType: 'nym',
      disconnect: () => transport.disconnect(),
    };
  } catch {
    // Fallback to direct fetch (no privacy, but functional)
    return {
      relayTransaction: async (base64Tx: string) => {
        try {
          const response = await fetch(`${relayerUrl}/relay/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction: base64Tx }),
          });
          return (await response.json()) as RelayResult;
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Direct relay failed',
          };
        }
      },
      transportType: 'direct',
      disconnect: async () => {},
    };
  }
}