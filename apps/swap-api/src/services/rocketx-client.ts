import type {
  RocketXQuotationResponse,
  RocketXTokensResponse,
  RocketXConfigsResponse,
  RocketXSwapRequest,
  RocketXSwapResponse,
  RocketXStatusResponse,
} from '@zkira/swap-types';

export class RocketXApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `RocketX API error (${status})`);
    this.name = 'RocketXApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export class RocketXClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params } = options;

    let url = `${this.baseUrl}${path}`;

    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += `?${qs}`;
      }
    }

    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    };

    const fetchOptions: RequestInit = { method, headers };

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text().catch(() => null);
      }
      throw new RocketXApiError(response.status, errorBody);
    }

    return response.json() as Promise<T>;
  }

  async getConfigs(): Promise<RocketXConfigsResponse> {
    return this.request<RocketXConfigsResponse>('/v1/configs');
  }

  async getTokens(params: {
    chainId?: string;
    keyword?: string;
    page?: number;
    perPage?: number;
  } = {}): Promise<RocketXTokensResponse> {
    return this.request<RocketXTokensResponse>('/v1/tokens', {
      params: {
        chainId: params.chainId,
        keyword: params.keyword,
        page: params.page,
        perPage: params.perPage,
      },
    });
  }

  async getQuotation(params: {
    fromTokenId: number;
    toTokenId: number;
    fromNetwork: string;
    toNetwork: string;
    amount: number;
  }): Promise<RocketXQuotationResponse> {
    return this.request<RocketXQuotationResponse>('/v1/quotation', {
      params: {
        fromTokenId: params.fromTokenId,
        toTokenId: params.toTokenId,
        fromNetwork: params.fromNetwork,
        toNetwork: params.toNetwork,
        amount: params.amount,
      },
    });
  }

  async createSwap(body: RocketXSwapRequest): Promise<RocketXSwapResponse> {
    return this.request<RocketXSwapResponse>('/v1/swap', {
      method: 'POST',
      body,
    });
  }

  async getStatus(requestId: string): Promise<RocketXStatusResponse> {
    return this.request<RocketXStatusResponse>(`/v1/status`, {
      params: {
        requestId,
      },
    });
  }
}
