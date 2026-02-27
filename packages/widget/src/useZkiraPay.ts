import { useState, useCallback } from 'react';

export interface UseZkiraPayConfig {
  payAppUrl?: string;
  apiUrl?: string;
  apiKey?: string;
}

export interface PaymentResult {
  paymentId: string;
  claimUrl: string;
  payUrl: string;
  amount: number;
  tokenMint: string;
  claimHash: string;
  metaAddress: string;
  expiresAt: string;
}

export type ZkiraPayStatus = 'idle' | 'pending' | 'success' | 'error';

export interface CreatePaymentParams {
  amount: number;
  token?: string;
  expiryDays?: number;
}

export function useZkiraPay(config: UseZkiraPayConfig = {}) {
  const [status, setStatus] = useState<ZkiraPayStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<PaymentResult | null>(null);

  const {
    apiUrl = 'http://localhost:3002', // Default to local API
    apiKey,
  } = config;

  const createPayment = useCallback(async (params: CreatePaymentParams): Promise<PaymentResult> => {
    try {
      setStatus('pending');
      setError(null);

      const { amount, token = 'USDC', expiryDays = 7 } = params;

      // Validate amount
      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('Amount must be a positive number');
      }

      // Prepare request headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add API key if provided
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      // Make API request
      const response = await fetch(`${apiUrl}/api/payments/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount,
          tokenMint: token,
          expiryDays,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PaymentResult = await response.json();

      setStatus('success');
      setLastResult(result);
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create payment');
      setError(error);
      setStatus('error');
      throw error;
    }
  }, [apiUrl, apiKey]);

  const checkPaymentStatus = useCallback(async (escrowAddress: string) => {
    try {
      setError(null);

      // Prepare request headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add API key if provided
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      // Make API request
      const response = await fetch(`${apiUrl}/api/payments/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          escrowAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.escrow;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to check payment status');
      setError(error);
      throw error;
    }
  }, [apiUrl, apiKey]);

  const getPayment = useCallback(async (paymentId: string) => {
    try {
      setError(null);

      // Prepare request headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add API key if provided
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      // Make API request
      const response = await fetch(`${apiUrl}/api/payments/${paymentId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.payment;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get payment');
      setError(error);
      throw error;
    }
  }, [apiUrl, apiKey]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setLastResult(null);
  }, []);

  return {
    createPayment,
    checkPaymentStatus,
    getPayment,
    status,
    error,
    lastResult,
    reset,
  };
}