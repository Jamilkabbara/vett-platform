import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  async get(path: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}${path}`, { headers });
    return handleResponse(res);
  },

  async post(path: string, body?: unknown) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  async patch(path: string, body?: unknown) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  // Pass 21 Bug 12: extend DELETE to accept an optional JSON body so
  // destructive endpoints (e.g. /api/auth/account) can require an
  // explicit { confirm: 'DELETE' } token. Spec-compliant — RFC 9110
  // permits a body on DELETE.
  async delete(path: string, body?: unknown) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },
};
