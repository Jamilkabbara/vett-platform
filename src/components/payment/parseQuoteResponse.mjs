/**
 * Turn a POST /api/pricing/quote response into the promo quote the pay panel
 * renders. Plain ESM so Vite bundles it for the component AND the Node guard
 * in scripts/ can execute it directly, with no test runner and no new
 * dependency. The point is that the guard exercises the REAL function rather
 * than a copy of it.
 *
 * WHY THIS EXISTS AS ITS OWN FILE. The route answers with `total` at the top
 * level and `base`, `subtotal` and `discount` nested under `details` — the
 * PricingBreakdown shape the setup page has always reconciled against. The
 * first version of the pay panel read `res.discount`, which is undefined, so
 * `?? 0` made it zero, the `discount <= 0` guard fired, and EVERY code —
 * including a valid VETTPROOF — was answered with "That code is not valid for
 * this mission."
 *
 * The field looked shipped and worked for nobody. It went unnoticed because
 * the checks run against it were the response body (correct), the deployed
 * bundle (contained the field), and the tests (there were none for the
 * parsing) — never the thing on screen.
 */

/**
 * @param {object|null|undefined} res raw quote response
 * @returns {{ok: true, base: number, total: number, discount: number, free: boolean}
 *          |{ok: false}}
 */
export function parseQuoteResponse(res) {
  if (!res || typeof res !== 'object') return { ok: false };

  // Nested first, top-level as a fallback, so a future flattening of the
  // response does not silently break this the other way.
  const discount = Number(res.details?.discount ?? res.discount ?? 0);
  const total    = Number(res.details?.total    ?? res.total    ?? 0);

  if (!Number.isFinite(discount) || discount <= 0) return { ok: false };
  if (!Number.isFinite(total) || total < 0) return { ok: false };

  const base = Number(
    res.details?.subtotal ?? res.details?.base ?? res.base ?? total + discount,
  );

  return {
    ok: true,
    base: Number.isFinite(base) ? base : total + discount,
    total,
    discount,
    free: total <= 0,
  };
}
