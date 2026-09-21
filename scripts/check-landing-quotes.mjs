/**
 * check-landing-quotes - the landing page's prices against the LIVE quote API.
 * Network, so not part of the build. Run before merging a pricing change:
 *
 *   node scripts/check-landing-quotes.mjs [apiBase]
 *
 * Sample sizes sit on and either side of every tier boundary, where the
 * "never cheaper than the tier below" floor applies.
 */
import { loadLandingPrices } from './lib/landingPrices.mjs';

const API = process.argv[2] || 'https://vettit-backend-production.up.railway.app';
const lp = await loadLandingPrices();
const sizes = new Set([lp.SLIDER_MIN, lp.SLIDER_DEFAULT, lp.SLIDER_MAX, 101, 333, 777]);
for (const r of lp.LADDER) for (const d of [-5, 0, 5]) {
  const n = r.anchor + d;
  if (n >= lp.SLIDER_MIN && n <= lp.SLIDER_MAX) sizes.add(n);
}

let bad = 0;
for (const n of [...sizes].sort((a, b) => a - b)) {
  const res = await fetch(`${API}/api/pricing/quote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ goalType: 'validate', respondentCount: n }),
  });
  const body = await res.json();
  const live = Number(body.total);
  const page = lp.quote(n);
  const ok = res.ok && live === page;
  if (!ok) bad++;
  console.log(`${ok ? 'ok ' : 'BAD'} n=${String(n).padStart(4)}  landing $${page}  live quote $${live}${res.ok ? '' : ` (HTTP ${res.status})`}`);
}
console.log(bad ? `\n${bad} size(s) disagree with the live quote` : `\nall ${sizes.size} sizes match the live quote at ${API}`);
process.exit(bad ? 1 : 0);
