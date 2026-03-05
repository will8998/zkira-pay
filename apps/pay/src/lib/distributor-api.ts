const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function distributorFetch(path: string, options?: RequestInit) {
  const adminPassword = localStorage.getItem('zkira_distributor_password');
  if (!adminPassword) throw new Error('Not authenticated');
  
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPassword,
        ...options?.headers,
      },
    });
    
    if (res.status === 401) {
      localStorage.removeItem('zkira_distributor_password');
      window.location.href = '/distributor';
      throw new Error('Unauthorized - Invalid admin password');
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

export async function distributorLogin(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/gateway/distributors?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
    });
    
    if (res.status === 401 || res.status === 403) {
      return { success: false, error: 'Invalid admin password' };
    }
    
    if (res.ok) {
      localStorage.setItem('zkira_distributor_password', password);
      return { success: true };
    }
    
    return { success: false, error: `API error: ${res.status}` };
  } catch (error) {
    if (error instanceof TypeError) {
      return { success: false, error: 'Unable to connect to server. Please check that the API server is running.' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export function distributorLogout() {
  localStorage.removeItem('zkira_distributor_password');
  window.location.href = '/distributor';
}

export function isDistributorAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('zkira_distributor_password');
}