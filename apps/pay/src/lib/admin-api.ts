const API_URL = '';

export type AdminRole = 'master' | 'merchant';

export interface AdminSession {
  role: AdminRole;
  credential: string; // admin password or API key
  merchantId: string | null;
  merchantName: string | null;
}

function getSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('zkira_admin_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    // Legacy format: plain password string
    sessionStorage.removeItem('zkira_admin_session');
    return null;
  }
}

function setSession(session: AdminSession) {
  sessionStorage.setItem('zkira_admin_session', JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem('zkira_admin_session');
}

export async function adminFetch(path: string, options?: RequestInit) {
  const session = getSession();
  if (!session) throw new Error('Not authenticated');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Master uses admin password header, merchant uses API key header
  if (session.role === 'master') {
    headers['X-Admin-Password'] = session.credential;
  } else {
    headers['X-API-Key'] = session.credential;
    headers['X-Admin-Password'] = session.credential; // Dual header for backward compat
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (res.status === 401) {
      clearSession();
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

export async function adminLogin(credential: string): Promise<{
  success: boolean;
  error?: string;
  session?: AdminSession;
}> {
  try {
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    if (res.status === 401) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (!res.ok) {
      return { success: false, error: `Server error: ${res.status}` };
    }

    const data = await res.json();
    const session: AdminSession = {
      role: data.role,
      credential,
      merchantId: data.merchantId || null,
      merchantName: data.merchantName || null,
    };

    setSession(session);
    return { success: true, session };
  } catch (error) {
    if (error instanceof TypeError) {
      return { success: false, error: 'Unable to connect to server. Please check that the API server is running.' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export function adminLogout() {
  clearSession();
  window.location.href = '/admin/login';
}

export function isAdminAuthenticated(): boolean {
  return getSession() !== null;
}

export function getAdminSession(): AdminSession | null {
  return getSession();
}
