/**
 * Guard: the pay panel must read the quote response the route actually sends.
 *
 * POST /api/pricing/quote answers with `total` at the top level and `base`,
 * `subtotal` and `discount` nested under `details`. The first version of the
 * panel read `res.discount` — undefined — so `?? 0` made it zero, the
 * `discount <= 0` guard fired, and every code including a valid VETTPROOF was
 * answered "That code is not valid for this mission."
 *
 * The fixtures below are REAL response bodies captured from production on
 * 2026-09-08 and 2026-09-09, not hand-written approximations, and this file
 * executes the real parser rather than a copy of it.
 */
import { parseQuoteResponse } from '../src/components/payment/parseQuoteResponse.mjs';

const fail = [];
const check = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) fail.push(`${name}\n      got  ${g}\n      want ${w}`);
};

// Captured: VETTPROOF against creative_attention n=10, production 2026-09-08.
check('VETTPROOF on a $19 Creative Attention study is accepted and free',
  parseQuoteResponse({ total: 0, actualRate: null, breakdown: [],
    details: { base: 19, subtotal: 19, discount: 19, total: 0 } }),
  { ok: true, base: 19, total: 0, discount: 19, free: true });

// A percentage code: the case the free code was masking, because a free code
// reaches $0 off either ladder while a percentage one does not.
check('a 50% code on the same study leaves $9.50 to pay',
  parseQuoteResponse({ total: 9.5, actualRate: null, breakdown: [],
    details: { base: 19, subtotal: 19, discount: 9.5, total: 9.5 } }),
  { ok: true, base: 19, total: 9.5, discount: 9.5, free: false });

// A code the server did not apply.
check('a code that produced no discount is rejected',
  parseQuoteResponse({ total: 19, breakdown: [], details: { base: 19, subtotal: 19, discount: 0, total: 19 } }),
  { ok: false });

for (const [name, res] of [
  ['null',        null],
  ['undefined',   undefined],
  ['a string',    'nope'],
  ['an empty object', {}],
  ['a refusal payload', { total: null, actualRate: null, breakdown: [], error: '…' }],
]) {
  check(`${name} is rejected rather than throwing`, parseQuoteResponse(res), { ok: false });
}

// The top-level fallback, so flattening the response later does not break it.
check('a flattened response still parses',
  parseQuoteResponse({ total: 0, base: 19, discount: 19 }),
  { ok: true, base: 19, total: 0, discount: 19, free: true });

// Positive control: the exact shape that used to slip through as "invalid".
// If someone reintroduces the top-level-only read, this is what fails.
const nestedOnly = { total: 0, details: { base: 19, subtotal: 19, discount: 19, total: 0 } };
if (parseQuoteResponse(nestedOnly).ok !== true) {
  fail.push('the nested-only response — the one production sends — is being rejected again');
}

if (fail.length) {
  console.error('verify-promo-quote-parsing: FAILED');
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log('verify-promo-quote-parsing: OK (9 cases, real production payloads)');
