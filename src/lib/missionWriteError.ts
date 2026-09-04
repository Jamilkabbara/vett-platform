import toast from 'react-hot-toast';

/**
 * Surface the REAL reason a write to `missions` failed.
 *
 * Why this exists: the client writes mission rows straight to Postgres through
 * supabase-js, so every write is governed by RLS *and* by column-level
 * privileges. Pass 50 revokes UPDATE on the money and lifecycle columns. If any
 * write path we did not find still touches one of them, the failure has to be
 * unmistakable and diagnosable on sight - not a generic "try again".
 *
 * Before this, the three debounced autosaves in DashboardPage swallowed errors
 * into console.error with no user-visible surface at all, and the setup insert
 * collapsed everything that was not the literal string "row-level security"
 * into "Could not save mission - try again in a moment." A permission denial
 * looked exactly like a network blip.
 */

/** The shape supabase-js returns. All fields optional - never assume. */
interface PostgrestLikeError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

const asPgError = (err: unknown): PostgrestLikeError =>
  (err && typeof err === 'object' ? (err as PostgrestLikeError) : {});

/**
 * PostgreSQL 42501 = insufficient_privilege. It covers BOTH an RLS policy
 * refusal and a column-privilege denial, and the two are only distinguishable
 * by the message text - which is exactly why the message has to reach us.
 */
export function isPermissionDenied(err: unknown): boolean {
  const e = asPgError(err);
  if (e.code === '42501') return true;
  const m = (e.message || '').toLowerCase();
  return m.includes('row-level security') || m.includes('permission denied');
}

/** True when the message names a column privilege specifically. */
export function isColumnPrivilegeDenied(err: unknown): boolean {
  const m = (asPgError(err).message || '').toLowerCase();
  return m.includes('permission denied for column')
      || (m.includes('permission denied') && m.includes('column'));
}

/**
 * A one-line description carrying the actual Postgres message. Deliberately
 * NOT sanitised into something friendly: an operator reading a screenshot of
 * this toast should be able to name the failing column without asking.
 */
export function describeMissionWriteError(err: unknown): string {
  const e = asPgError(err);
  const detail = e.message || e.details || 'no error message returned';
  if (isColumnPrivilegeDenied(err)) {
    return `Save blocked by a column permission: ${detail}`;
  }
  if (isPermissionDenied(err)) {
    // An RLS refusal on a signed-in user usually means the session lapsed.
    return `Save was not permitted: ${detail}`;
  }
  return `Save failed: ${detail}`;
}

/**
 * Log the full error object and show the real reason.
 * @param scope  where it happened, e.g. 'save questions'
 */
export function reportMissionWriteError(scope: string, err: unknown): void {
  const e = asPgError(err);
  console.error(`[missions] ${scope} failed`, {
    code: e.code, message: e.message, details: e.details, hint: e.hint, err,
  });
  toast.error(`${scope}: ${describeMissionWriteError(err)}`, { duration: 8000 });
}
