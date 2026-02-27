const API_URL = '';

export async function adminFetch(path: string, options?: RequestInit) {
  const password = sessionStorage.getItem('zkira_admin_session');
  if (!password) throw new Error('Not authenticated');
  
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
        ...options?.headers,
      },
    });
    
    if (res.status === 401) {
      sessionStorage.removeItem('zkira_admin_session');
      window.location.href = '/admin/login';
      throw new Error('Unauthorized');
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

export async function adminLogin(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/admin/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
    });
    
    if (res.status === 401 || res.status === 403) {
      return { success: false, error: 'Invalid password' };
    }
    
    if (res.ok) {
      sessionStorage.setItem('zkira_admin_session', password);
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

export function adminLogout() {
  sessionStorage.removeItem('zkira_admin_session');
  window.location.href = '/admin/login';
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('zkira_admin_session');
}