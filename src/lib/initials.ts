// Pass 27 I — initials derivation + localStorage cache.
// Extracted so the cache key is canonical and reusable across surfaces.

const CACHE_KEY = 'vett_cached_initials';

export function computeInitials(email: string | null | undefined): string {
  if (!email) return '';
  const local = email.split('@')[0] || '';
  const alpha = local.replace(/[^a-zA-Z]/g, '');
  if (alpha.length >= 2) return alpha.slice(0, 2).toUpperCase();
  if (alpha.length === 1) return alpha.toUpperCase();
  return '';
}

export function readCachedInitials(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

export function writeCachedInitials(initials: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, initials);
  } catch {
    /* localStorage unavailable, ignore */
  }
}

export function clearCachedInitials(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
