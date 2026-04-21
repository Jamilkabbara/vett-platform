/**
 * Centralised mapping from raw Supabase auth errors to human-friendly copy.
 * Used by SignInPage, ForgotPasswordPage, and OAuthButtons so the whole auth
 * surface speaks the same language.
 *
 * Supabase errors can arrive in several shapes:
 *   - `AuthError` from supabase-js (has `.message`, sometimes `.status`, `.code`)
 *   - Generic `Error` from network / thrown code paths
 *   - Unknown object (OAuth returns a loose `{ code, error_code, msg }` shape)
 *
 * We match case-insensitively on message substrings since Supabase phrasing
 * has drifted across versions and we'd rather err on the side of matching.
 */

export interface PrettifyOptions {
  /** Context-specific default when nothing else matches. */
  fallback?: string;
}

const DEFAULT_FALLBACK = 'Something went wrong. Please try again or contact support.';

/** Best-effort extraction of a string message from any thrown value. */
function extractMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const o = err as Record<string, unknown>;
    // Supabase OAuth sometimes returns { msg } instead of { message }.
    const m = o.message ?? o.msg ?? o.error_description ?? o.error;
    if (typeof m === 'string') return m;
  }
  return '';
}

/** Returns true if this error represents "the OAuth provider isn't wired up". */
export function isProviderNotEnabledError(err: unknown): boolean {
  const msg = extractMessage(err).toLowerCase();
  if (!msg) return false;
  return (
    msg.includes('provider is not enabled') ||
    msg.includes('unsupported provider') ||
    msg.includes('validation_failed')
  );
}

/**
 * Map a Supabase/auth error to short, human-friendly copy suitable for a
 * toast. Always returns a non-empty string — falls back to a generic
 * "Something went wrong…" if nothing matches.
 */
export function prettifyAuthError(
  err: unknown,
  options: PrettifyOptions = {},
): string {
  const fallback = options.fallback ?? DEFAULT_FALLBACK;
  const raw = extractMessage(err);
  if (!raw) return fallback;
  const msg = raw.toLowerCase();

  // ── Sign-in / password ─────────────────────────────────────────────
  if (msg.includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Check your inbox to verify your email before signing in.';
  }
  if (msg.includes('invalid email')) {
    return 'That email doesn\u2019t look right \u2014 double-check and try again.';
  }

  // ── Sign-up ────────────────────────────────────────────────────────
  if (
    msg.includes('user already registered') ||
    msg.includes('already registered') ||
    msg.includes('already been registered')
  ) {
    return 'This email already has an account \u2014 try signing in instead.';
  }
  if (msg.includes('password should be at least')) {
    return 'Password is too short \u2014 use at least 8 characters.';
  }
  if (msg.includes('weak password') || msg.includes('password is too weak')) {
    return 'Please choose a stronger password.';
  }
  if (msg.includes('signup is disabled') || msg.includes('signups not allowed')) {
    return 'New sign-ups are temporarily disabled. Please contact support.';
  }

  // ── Rate limiting ──────────────────────────────────────────────────
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts \u2014 try again in a few minutes.';
  }

  // ── OAuth ──────────────────────────────────────────────────────────
  if (isProviderNotEnabledError(err)) {
    return 'This sign-in option is being configured \u2014 try email sign-up instead.';
  }

  // ── Network ────────────────────────────────────────────────────────
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Network error \u2014 check your connection and try again.';
  }

  // Unknown — surface a generic fallback rather than the raw error.
  return fallback;
}
