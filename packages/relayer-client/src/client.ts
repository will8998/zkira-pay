import type {
  RelayerClientConfig,
  RelayClaimRequest,
  RelayClaimResponse,
  RelayStatusResponse,
  SessionCreateRequest,
  SessionCreateResponse,
  SessionTransactionRequest,
  SessionTransactionResponse,
  SessionBalanceResponse,
} from './types.js';

export class RelayerClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: RelayerClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * Submit a partially-signed claim transaction for gas sponsoring.
   * The relayer will add its signature as fee payer and submit to Solana.
   */
  async relayClaim(request: RelayClaimRequest): Promise<RelayClaimResponse> {
    return this.post<RelayClaimResponse>('/relay/claim', request);
  }

  /**
   * Check the status of a previously relayed transaction.
   */
  async getRelayStatus(txSignature: string): Promise<RelayStatusResponse> {
    return this.get<RelayStatusResponse>(`/relay/status/${encodeURIComponent(txSignature)}`);
  }

  /**
   * Create a walletless session — creates USDC ATA for the ephemeral keypair.
   */
  async createSession(publicKey: string): Promise<SessionCreateResponse> {
    return this.post<SessionCreateResponse>('/session/create', { publicKey });
  }

  /**
   * Co-sign and submit a shielded pool deposit transaction.
   */
  async relayDeposit(transaction: string): Promise<SessionTransactionResponse> {
    return this.post<SessionTransactionResponse>('/session/deposit', { transaction });
  }

  /**
   * Co-sign and submit a shielded pool withdrawal transaction.
   */
  async relayWithdraw(transaction: string): Promise<SessionTransactionResponse> {
    return this.post<SessionTransactionResponse>('/session/withdraw', { transaction });
  }

  /**
   * Check USDC balance at an address.
   */
  async getBalance(address: string): Promise<SessionBalanceResponse> {
    return this.get<SessionBalanceResponse>(`/session/balance/${encodeURIComponent(address)}`);
  }

  /**
   * Co-sign and submit an SPL token transfer transaction.
   */
  async relayTransfer(transaction: string): Promise<SessionTransactionResponse> {
    return this.post<SessionTransactionResponse>('/session/transfer', { transaction });
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options: RequestInit = {
        method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error(`Unknown error: ${String(error)}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
