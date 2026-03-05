import type {
  GatewayClientConfig,
  GatewaySession,
  GatewayBalance,
  GatewayDispute,
  PoolAssignment,
  LedgerEntry,
  VolumeReport,
  SessionSummary,
  Reconciliation,
  CreateSessionRequest,
  ConfirmSessionRequest,
  CreateWithdrawalRequest,
  ConfirmWithdrawalRequest,
  CancelWithdrawalRequest,
  CreateDisputeRequest,
  AddEvidenceRequest,
  UpdateDisputeStatusRequest,
  AssignPoolRequest,
  UpdatePoolRequest,
  SessionResponse,
  SessionsResponse,
  BalanceResponse,
  BalancesResponse,
  DisputeResponse,
  DisputesResponse,
  PoolResponse,
  PoolsResponse,
  LedgerResponse,
  VolumeReportResponse,
  SessionSummaryResponse,
  ReconciliationResponse,
  ListParams,
  TransactionParams,
  VolumeParams,
  ExportParams,
} from './types.js';

export class GatewayClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: GatewayClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30000;
  }

  // ============================================================================
  // Sessions
  // ============================================================================

  async createSession(request: CreateSessionRequest): Promise<SessionResponse> {
    return this.post<SessionResponse>('/sessions', request);
  }

  async getSession(sessionId: string): Promise<SessionResponse> {
    return this.get<SessionResponse>(`/sessions/${encodeURIComponent(sessionId)}`);
  }

  async listSessions(params?: ListParams): Promise<SessionsResponse> {
    return this.get<SessionsResponse>('/sessions', params as Record<string, unknown>);
  }

  async confirmSession(
    sessionId: string,
    request: ConfirmSessionRequest
  ): Promise<SessionResponse> {
    return this.post<SessionResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/confirm`,
      request
    );
  }

  async expireSession(sessionId: string): Promise<SessionResponse> {
    return this.post<SessionResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/expire`,
      {}
    );
  }

  // ============================================================================
  // Withdrawals
  // ============================================================================

  async createWithdrawal(request: CreateWithdrawalRequest): Promise<SessionResponse> {
    return this.post<SessionResponse>('/withdrawals', request);
  }

  async getWithdrawal(sessionId: string): Promise<SessionResponse> {
    return this.get<SessionResponse>(`/withdrawals/${encodeURIComponent(sessionId)}`);
  }

  async listWithdrawals(params?: ListParams): Promise<SessionsResponse> {
    return this.get<SessionsResponse>('/withdrawals', params as Record<string, unknown>);
  }

  async confirmWithdrawal(
    sessionId: string,
    request: ConfirmWithdrawalRequest
  ): Promise<SessionResponse> {
    return this.post<SessionResponse>(
      `/withdrawals/${encodeURIComponent(sessionId)}/confirm`,
      request
    );
  }

  async cancelWithdrawal(
    sessionId: string,
    request?: CancelWithdrawalRequest
  ): Promise<SessionResponse> {
    return this.post<SessionResponse>(
      `/withdrawals/${encodeURIComponent(sessionId)}/cancel`,
      request ?? {}
    );
  }

  // ============================================================================
  // Reports
  // ============================================================================

  async getTransactions(params?: TransactionParams): Promise<LedgerResponse> {
    return this.get<LedgerResponse>('/reports/transactions', params as Record<string, unknown>);
  }

  async getBalances(params?: ListParams): Promise<BalancesResponse> {
    return this.get<BalancesResponse>('/reports/balances', params as Record<string, unknown>);
  }

  async getVolume(params?: VolumeParams): Promise<VolumeReportResponse> {
    return this.get<VolumeReportResponse>('/reports/volume', params as Record<string, unknown>);
  }

  async getSessionSummary(params?: ListParams): Promise<SessionSummaryResponse> {
    return this.get<SessionSummaryResponse>('/reports/sessions', params as Record<string, unknown>);
  }

  async exportCsv(params?: ExportParams): Promise<Blob> {
    const url = this.buildUrl('/reports/export', params as Record<string, unknown>);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`
        );
      }

      return response.blob();
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

  // ============================================================================
  // Disputes
  // ============================================================================

  async createDispute(request: CreateDisputeRequest): Promise<DisputeResponse> {
    return this.post<DisputeResponse>('/disputes', request);
  }

  async addEvidence(
    disputeId: string,
    request: AddEvidenceRequest
  ): Promise<DisputeResponse> {
    return this.post<DisputeResponse>(
      `/disputes/${encodeURIComponent(disputeId)}/evidence`,
      request
    );
  }

  async updateDisputeStatus(
    disputeId: string,
    request: UpdateDisputeStatusRequest
  ): Promise<DisputeResponse> {
    return this.patch<DisputeResponse>(
      `/disputes/${encodeURIComponent(disputeId)}`,
      request
    );
  }

  async listDisputes(params?: ListParams): Promise<DisputesResponse> {
    return this.get<DisputesResponse>('/disputes', params as Record<string, unknown>);
  }

  async getDispute(disputeId: string): Promise<DisputeResponse> {
    return this.get<DisputeResponse>(`/disputes/${encodeURIComponent(disputeId)}`);
  }

  // ============================================================================
  // Pools
  // ============================================================================

  async assignPool(request: AssignPoolRequest): Promise<PoolResponse> {
    return this.post<PoolResponse>('/pools', request);
  }

  async listPools(params?: ListParams): Promise<PoolsResponse> {
    return this.get<PoolsResponse>('/pools', params as Record<string, unknown>);
  }

  async getPool(assignmentId: string): Promise<PoolResponse> {
    return this.get<PoolResponse>(`/pools/${encodeURIComponent(assignmentId)}`);
  }

  async updatePool(
    assignmentId: string,
    request: UpdatePoolRequest
  ): Promise<PoolResponse> {
    return this.patch<PoolResponse>(
      `/pools/${encodeURIComponent(assignmentId)}`,
      request
    );
  }

  async removePool(assignmentId: string): Promise<void> {
    await this.delete(`/pools/${encodeURIComponent(assignmentId)}`);
  }

  async reconcilePool(assignmentId: string): Promise<ReconciliationResponse> {
    return this.post<ReconciliationResponse>(
      `/pools/${encodeURIComponent(assignmentId)}/reconcile`,
      {}
    );
  }

  // ============================================================================
  // Private HTTP Methods
  // ============================================================================

  private async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>('GET', url);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', `${this.baseUrl}${path}`, body);
  }

  private async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', `${this.baseUrl}${path}`, body);
  }

  private async delete(path: string): Promise<void> {
    await this.request<void>('DELETE', `${this.baseUrl}${path}`);
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options: RequestInit = {
        method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
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
