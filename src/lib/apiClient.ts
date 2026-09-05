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

/**
 * An API failure that still knows its HTTP status.
 *
 * `handleResponse` used to throw a bare Error carrying only the server's
 * message, so callers could not tell "you are signed out" (401) from "that is
 * not your mission" (404) from a genuine server fault - and the only way to
 * react was to pattern-match the message text, which then leaks the raw
 * backend string to the user. /results-v2 rendered
 * "Missing or invalid authorization header" as its entire signed-out page for
 * exactly this reason.
 *
 * Additive: nothing reads `.status` today, and it stays an Error subclass, so
 * every existing `catch (e) { e.message }` behaves the same.
 */
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(error.error || `Request failed: ${res.status}`, res.status);
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
