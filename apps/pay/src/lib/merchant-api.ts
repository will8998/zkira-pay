const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function merchantFetch(path: string, options?: RequestInit) {
  const apiKey = localStorage.getItem('zkira_merchant_api_key');
  if (!apiKey) throw new Error('Not authenticated');
  
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        ...options?.headers,
      },
    });
    
    if (res.status === 401) {
      localStorage.removeItem('zkira_merchant_api_key');
      window.location.href = '/merchant';
      throw new Error('Unauthorized - Invalid API key');
    }
    
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Unable to connect to server. Please check that the API server is running.');
    }
    throw error;
  }
}

export async function merchantLogin(apiKey: string): Promise<{ success: boolean; error?: string; merchantName?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/gateway/reports/balances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
    
    if (res.status === 401 || res.status === 403) {
      return { success: false, error: 'Invalid API key' };
    }
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('zkira_merchant_api_key', apiKey);
      
      // Extract merchant name from API key or use a default
      const merchantName = `Merchant-${apiKey.slice(-8)}`;
      localStorage.setItem('zkira_merchant_name', merchantName);
      
      return { success: true, merchantName };
    }
    
    return { success: false, error: `API error: ${res.status}` };
  } catch (error) {
    if (error instanceof TypeError) {
      return { success: false, error: 'Unable to connect to server. Please check that the API server is running.' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export function merchantLogout() {
  localStorage.removeItem('zkira_merchant_api_key');
  localStorage.removeItem('zkira_merchant_name');
  window.location.href = '/merchant';
}

export function isMerchantAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('zkira_merchant_api_key');
}

export function getMerchantName(): string {
  if (typeof window === 'undefined') return 'Merchant';
  return localStorage.getItem('zkira_merchant_name') || 'Merchant';
}