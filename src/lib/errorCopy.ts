/**
 * Pass 42 G3 — BUG-021. User-friendly error copy.
 *
 * Maps low-level network / fetch / HTTP errors to language that
 * doesn't leak technical terms or stack traces to the customer.
 * Internal logs keep the original Error message; only user-visible
 * surfaces should use this helper.
 *
 * Usage:
 *   try { ... }
 *   catch (err) {
 *     toast.error(userFacingError(err));
 *     console.error('fetch missions failed', err);   // internal log
 *   }
 */
export function userFacingError(err: unknown): string {
  if (!err) return "Something didn't work. Please try again.";
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes('Failed to fetch')) {
    return "We're having trouble connecting. Please try again in a moment.";
  }
  if (msg.includes('NetworkError') || msg.includes('ERR_NETWORK')) {
    return 'Your internet connection seems unstable. Please check and retry.';
  }
  if (/Request failed with status code 5\d\d/.test(msg) || /\b5\d\d\b/.test(msg)) {
    return 'Our servers are temporarily unavailable. Please try again shortly.';
  }
  if (/Request failed with status code 401/.test(msg) || msg.includes('Unauthorized')) {
    return 'Please sign in again to continue.';
  }
  if (/Request failed with status code 403/.test(msg) || msg.includes('Forbidden')) {
    return "You don't have permission to do that.";
  }
  if (/Request failed with status code 404/.test(msg) || msg.includes('Not Found')) {
    return "We couldn't find that. It may have been deleted.";
  }
  if (msg.includes('AbortError') || msg.includes('Timeout')) {
    return 'That took longer than expected. Please try again.';
  }
  return "Something didn't work as expected. Please try again or contact support.";
}
