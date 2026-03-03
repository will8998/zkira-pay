import { API_BASE } from './constants';
import type {
  TokensResponse,
  QuotationResponse,
  SwapRequest,
  SwapResponse,
  StatusResponse,
  HealthResponse,
  ConfigsResponse,
} from '@zkira/swap-types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = `API Error: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body && typeof body === 'object') {
        if (typeof body.error === 'string') {
          try {
            const parsed = JSON.parse(body.error);
            message = parsed.error || parsed.message || body.error;
          } catch {
            message = body.error;
          }
        }
      }
    } catch {
      // response wasn't JSON, use default message
    }
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

export async function getTokens(params?: {
  chainId?: string;
  keyword?: string;
  page?: number;
  perPage?: number;
}): Promise<TokensResponse> {
  const searchParams = new URLSearchParams();
  if (params?.chainId) searchParams.set('chainId', params.chainId);
  if (params?.keyword) searchParams.set('keyword', params.keyword);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.perPage) searchParams.set('perPage', params.perPage.toString());

  const qs = searchParams.toString();
  const url = qs ? `${API_BASE}/tokens?${qs}` : `${API_BASE}/tokens`;
  return fetchJson<TokensResponse>(url);
}

export async function getQuotation(params: {
  fromToken?: string;
  toToken?: string;
  fromNetwork: string;
  toNetwork: string;
  amount: number;
}): Promise<QuotationResponse> {
  const searchParams = new URLSearchParams({
    fromNetwork: params.fromNetwork,
    toNetwork: params.toNetwork,
    amount: params.amount.toString(),
  });
  if (params.fromToken) {
    searchParams.set('fromToken', params.fromToken);
  }
  if (params.toToken) {
    searchParams.set('toToken', params.toToken);
  }

  return fetchJson<QuotationResponse>(`${API_BASE}/quote?${searchParams}`);
}

export async function createSwap(data: SwapRequest): Promise<SwapResponse> {
  return fetchJson<SwapResponse>(`${API_BASE}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getStatus(requestId: string): Promise<StatusResponse> {
  return fetchJson<StatusResponse>(`${API_BASE}/status/${requestId}`);
}

export async function getHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>(`${API_BASE}/health`);
}

export async function getConfigs(): Promise<ConfigsResponse> {
  return fetchJson<ConfigsResponse>(`${API_BASE}/configs`);
}

