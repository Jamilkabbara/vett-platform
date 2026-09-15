/**
 * Load outcomes that keep a failed read distinct from an empty result.
 *
 * Three screens used to turn a failed request into something that looked like
 * real data: the invoice tab showed "No invoices yet", the segment explorer
 * kept a segment selected while showing every respondent's figures, and the
 * results chat swallowed the server's error frame and printed an empty reply.
 * Plain .mjs so scripts/verify-loud-read-errors.mjs can execute them.
 */

/** Invoices: a failed request is an error, never an empty list. */
export async function settleInvoices(request) {
  try {
    const data = await request;
    if (!Array.isArray(data)) return { invoices: null, error: 'Your invoices could not be loaded.' };
    return { invoices: data, error: null };
  } catch {
    return { invoices: null, error: 'Your invoices could not be loaded.' };
  }
}

/**
 * Segment explorer: on failure, fall back to ALL respondents with the selector
 * showing "all" and a visible message, so no figure is ever labelled with a
 * segment it was not computed for.
 */
export async function settleSegment(key, request) {
  try {
    const res = await request;
    if (!res || !res.report) return { seg: 'all', active: null, error: 'That segment could not be loaded. Showing all respondents.' };
    return { seg: key, active: res.report, error: null };
  } catch {
    return { seg: 'all', active: null, error: 'That segment could not be loaded. Showing all respondents.' };
  }
}

/** One `data:` payload from POST /api/chat/stream. */
export function parseChatFrame(payload) {
  let obj;
  try { obj = JSON.parse(payload); } catch { return { type: 'malformed' }; }
  if (obj && typeof obj.error === 'string') return { type: 'error', error: obj.error };
  if (obj && obj.blocked) return { type: 'blocked', quota: obj.quota || null };
  if (obj && obj.done) return { type: 'done', quota: obj.quota || null };
  if (obj && typeof obj.delta === 'string') return { type: 'delta', delta: obj.delta };
  return { type: 'malformed' };
}
