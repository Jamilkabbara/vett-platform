/**
 * verify-ca-targeting - the Creative Attention placement/market wiring on the
 * website, executed rather than assumed.
 *
 * 1. The results-page wording matches the exports word for word. The literal
 *    sentences below are the same ones vettit-backend's
 *    test/ca_targeting_exports.test.js asserts against the PDF/PPTX/XLSX
 *    wording, so the two sides cannot quietly diverge.
 * 2. The mission row the page inserts writes the audience to
 *    ca_target_audience and never to the shared target_audience JSONB (which
 *    holds an object on every other mission type and once reached the model
 *    as "[object Object]").
 * 3. A placement the upload cannot be scored for (TV on a still image) is
 *    refused before anything is written.
 */
import { readFileSync } from 'node:fs';
import { caTargetingView } from '../src/lib/caTargetingView.mjs';
import { buildCaMissionInsert, placementsForUpload, CA_AUDIENCE_MAX_LENGTH } from '../src/lib/caMissionInsert.mjs';

const failures = [];
const eq = (label, got, want) => {
  const g = JSON.stringify(got); const w = JSON.stringify(want);
  if (g !== w) failures.push(`${label}\n    got:  ${g}\n    want: ${w}`);
};
const ok = (label, cond) => { if (!cond) failures.push(label); };

// ── 1. wording, identical to the backend exports ─────────────────────────────
const pb = { placement_id: 'tiktok_feed', placement_label: 'TikTok Feed', norm_active_seconds: 1.4 };
const v = (d, p) => caTargetingView({ placement_benchmark: { ...pb, delta_vs_norm_pct: d, predicted_active_seconds: p } }).placement;
eq('below', v(-14, 1.2).sentence, 'Predicted 1.2s of active attention on TikTok Feed, 14% below the published norm of 1.4s.');
eq('above', v(50, 2.1).sentence, 'Predicted 2.1s of active attention on TikTok Feed, 50% above the published norm of 1.4s.');
eq('in line', v(0, 1.4).sentence, 'Predicted 1.4s of active attention on TikTok Feed, in line with the published norm of 1.4s.');
eq('no prediction', v(null, null).sentence, 'The published attention norm for TikTok Feed is 1.4s of active attention. This run returned no attention prediction to compare against it.');
eq('delta labels', [v(-14, 1.2).deltaLabel, v(50, 2.1).deltaLabel, v(0, 1.4).deltaLabel, v(null, null).deltaLabel], ['-14%', '+50%', 'In line', 'Not compared']);
eq('older analysis renders nothing', caTargetingView({ summary: {} }), null);
const withMarket = caTargetingView({ market: { code: 'SA', name: 'Saudi Arabia' } });
eq('market with failed notes still shows', [withMarket.market, withMarket.marketNotesUnavailable], [{ code: 'SA', name: 'Saudi Arabia' }, true]);
ok('no em or en dash in the wording',
  !/[–—]/.test(JSON.stringify(caTargetingView({ placement_benchmark: { ...pb, delta_vs_norm_pct: 5, predicted_active_seconds: 1.5 }, market: { code: 'SA', name: 'Saudi Arabia' }, market_context: { cultural_fit: ['Fits.'] } }))));

// ── 2 + 3. the inserted row ─────────────────────────────────────────────────
const PLACEMENTS = [
  { id: 'instagram_feed', label: 'Instagram Feed', norm_active_seconds: 1.2, formats: ['image', 'video'] },
  { id: 'tv_30s', label: 'TV (30s spot)', norm_active_seconds: 12, formats: ['video'] },
  { id: 'print_luxury_magazine', label: 'Print (luxury magazine)', norm_active_seconds: 2.5, formats: ['image'] },
];
const base = {
  userId: 'u1', brandName: '  Orchard ', description: ' Launch ', respondentCount: 10,
  tier: { id: 'image', packagePrice: 19 }, mediaType: 'image', mediaUrl: 'https://x/y.jpg',
  targetAudience: '  Working parents  ', placementId: 'instagram_feed', marketCode: 'SA',
  desiredEmotions: ['Joy'], keyMessage: ' Try it ', briefAttachment: { path: 'p', mimeType: 'image/jpeg', originalName: 'a.jpg', sizeBytes: 1 },
  placements: PLACEMENTS,
};
const row = buildCaMissionInsert(base);
ok('the row never writes the shared target_audience column', !('target_audience' in row));
eq('audience, placement and market go to the Creative Attention columns',
  [row.ca_target_audience, row.ca_placement, row.ca_market], ['Working parents', 'instagram_feed', 'SA']);
eq('no market is stored as null, not an empty string', buildCaMissionInsert({ ...base, marketCode: '' }).ca_market, null);
eq('audience is capped at the database limit',
  buildCaMissionInsert({ ...base, targetAudience: 'x'.repeat(5000) }).ca_target_audience.length, CA_AUDIENCE_MAX_LENGTH);
eq('image uploads are offered image placements only', placementsForUpload(PLACEMENTS, 'image').map((p) => p.id), ['instagram_feed', 'print_luxury_magazine']);
eq('video uploads are offered video placements only', placementsForUpload(PLACEMENTS, 'video').map((p) => p.id), ['instagram_feed', 'tv_30s']);
for (const [label, args] of [
  ['TV on a still image is refused', { ...base, placementId: 'tv_30s' }],
  ['a missing placement is refused', { ...base, placementId: '' }],
  ['a placement not in the served list is refused', { ...base, placementId: 'shahid' }],
]) {
  let threw = false;
  try { buildCaMissionInsert(args); } catch { threw = true; }
  ok(label, threw);
}

// ── the page really uses the builder ────────────────────────────────────────
const page = readFileSync(new URL('../src/pages/CreativeAttentionPage.tsx', import.meta.url), 'utf8');
ok('CreativeAttentionPage inserts the row built by buildCaMissionInsert', /buildCaMissionInsert\(/.test(page) && /\.insert\(\[row\]\)/.test(page));
ok('CreativeAttentionPage writes no target_audience key itself', !/^\s*target_audience\s*:/m.test(page));

if (failures.length) {
  console.error('\nverify-ca-targeting FAILED\n');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('verify-ca-targeting ok: wording matches the exports, the row writes ca_* only, unscoreable placements are refused');
