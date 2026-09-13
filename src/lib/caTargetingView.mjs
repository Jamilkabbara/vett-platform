/**
 * What a Creative Attention run was measured against, worded for the results
 * page.
 *
 * The same wording the backend exports use (vettit-backend
 * src/services/creativeAttention/targetingView.js), so the results page and
 * the PDF, PPTX and XLSX a customer downloads say the same sentence. Both
 * sides are pinned to identical literal sentences by their checks
 * (scripts/verify-ca-targeting-view.mjs here, test/ca_targeting_exports.test.js
 * there); change the wording in both or neither.
 *
 * Reads only what the analysis stored. Returns null for analyses that predate
 * placement and market, so older results pages render exactly as before.
 * House style: hyphens, never em or en dashes.
 */

const NOTE_SECTIONS = [
  ['cultural_fit', 'Cultural fit'],
  ['localisation_risks', 'Localisation risks'],
  ['placement_notes', 'How the placement is used there'],
];

const fmtSeconds = (n) => `${Number(n).toFixed(1)}s`;

export function placementSentence(pb) {
  const norm = fmtSeconds(pb.norm_active_seconds);
  if (pb.predicted_active_seconds == null || pb.delta_vs_norm_pct == null) {
    return `The published attention norm for ${pb.placement_label} is ${norm} of active attention. This run returned no attention prediction to compare against it.`;
  }
  const predicted = fmtSeconds(pb.predicted_active_seconds);
  const d = pb.delta_vs_norm_pct;
  if (d === 0) {
    return `Predicted ${predicted} of active attention on ${pb.placement_label}, in line with the published norm of ${norm}.`;
  }
  const direction = d > 0 ? 'above' : 'below';
  return `Predicted ${predicted} of active attention on ${pb.placement_label}, ${Math.abs(d)}% ${direction} the published norm of ${norm}.`;
}

export function caTargetingView(creativeAnalysis) {
  const ca = creativeAnalysis && typeof creativeAnalysis === 'object' ? creativeAnalysis : {};
  const pb = ca.placement_benchmark && typeof ca.placement_benchmark === 'object' ? ca.placement_benchmark : null;
  const market = ca.market && typeof ca.market === 'object' && ca.market.name ? ca.market : null;
  if (!pb && !market) return null;

  const ctx = ca.market_context && typeof ca.market_context === 'object' ? ca.market_context : null;
  const marketNoteSections = ctx
    ? NOTE_SECTIONS
      .map(([key, heading]) => ({ key, heading, items: (Array.isArray(ctx[key]) ? ctx[key] : []).filter((s) => typeof s === 'string' && s) }))
      .filter((s) => s.items.length > 0)
    : [];

  return {
    placement: pb ? {
      id: pb.placement_id,
      label: pb.placement_label,
      normSeconds: pb.norm_active_seconds,
      predictedSeconds: pb.predicted_active_seconds,
      deltaPct: pb.delta_vs_norm_pct,
      normLabel: fmtSeconds(pb.norm_active_seconds),
      predictedLabel: pb.predicted_active_seconds == null ? 'Not predicted' : fmtSeconds(pb.predicted_active_seconds),
      deltaLabel: pb.delta_vs_norm_pct == null
        ? 'Not compared'
        : (pb.delta_vs_norm_pct === 0 ? 'In line' : `${pb.delta_vs_norm_pct > 0 ? '+' : '-'}${Math.abs(pb.delta_vs_norm_pct)}%`),
      sentence: placementSentence(pb),
    } : null,
    market: market ? { code: market.code, name: market.name } : null,
    marketNoteSections,
    marketNotesUnavailable: !!market && marketNoteSections.length === 0,
  };
}
