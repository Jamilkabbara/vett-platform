/**
 * Pass 33 W9 — shared brand-tokens for printed/exportable surfaces.
 *
 * The Pass 32 X3 exports (PDF/PPTX/XLSX) shipped with default jsPDF
 * styling — black-on-white, no logo, generic Arial. Pass 33 W9
 * rebuilds them with VETT brand tokens. Critical: dark-mode
 * background `#0B0C15` does NOT translate to print surfaces. Print
 * surfaces use white background, near-black body text, lime/indigo
 * accents only.
 *
 * Both PDF (jsPDF) and PPTX (pptxgenjs) import from here so the two
 * export paths stay in lockstep. XLSX uses the EXPORT_COLORS lime
 * for the frozen header fill.
 */

// ── Colors (hex strings — RGB tuples derived where needed) ───────────

export const EXPORT_COLORS = {
  /** Near-black body text. Matches the brand `#0B0C15` dark token. */
  ink:        '#0B0C15',
  /** Page background for printed surfaces. Always white. */
  paper:      '#FFFFFF',
  /** Off-white accent panel background. */
  paperSoft:  '#FAFAFA',
  /** Section divider line + chart accent #1. */
  lime:       '#BEF264',
  /** Chart accent #2 + link/CTA color. */
  indigo:     '#6366F1',
  /** Muted body / footer / page-number. */
  gray:       '#9CA3AF',
  /** Section divider on light surfaces. */
  graySoft:   '#E5E7EB',
  /** Negative-data accent. */
  red:        '#EF4444',
  /** Caution-data accent. */
  amber:      '#F59E0B',
} as const;

/** RGB tuples for jsPDF setFillColor / setTextColor / setDrawColor. */
export const EXPORT_RGB = {
  ink:       [11, 12, 21]      as [number, number, number],
  paper:     [255, 255, 255]   as [number, number, number],
  paperSoft: [250, 250, 250]   as [number, number, number],
  lime:      [190, 242, 100]   as [number, number, number],
  indigo:    [99, 102, 241]    as [number, number, number],
  gray:      [156, 163, 175]   as [number, number, number],
  graySoft:  [229, 231, 235]   as [number, number, number],
  red:       [239, 68, 68]     as [number, number, number],
  amber:     [245, 158, 11]    as [number, number, number],
};

// ── Typography ───────────────────────────────────────────────────────

/**
 * Font families for export surfaces. jsPDF default fonts ship with
 * Helvetica/Times/Courier — no Manrope or Inter. We use Helvetica's
 * bold variant for headings (closest visual analog to Manrope-bold)
 * and Helvetica regular for body. pptxgenjs uses the same names; if
 * the host has Calibri or Inter installed it'll substitute.
 */
export const EXPORT_FONTS = {
  heading: { jsPdf: 'helvetica', pptxgen: 'Calibri', weight: 'bold'   as const },
  body:    { jsPdf: 'helvetica', pptxgen: 'Calibri', weight: 'normal' as const },
};

// ── Standard disclosures ─────────────────────────────────────────────

export const EXPORT_DISCLOSURES = {
  /** Footer line on every printed page. */
  pageFooter:
    'vettit.ai · Methodology First · Synthetic respondents calibrated to category baseline.',

  /** Per-export methodology paragraph. Single paragraph, no markdown. */
  creativeAttentionMethodology:
    'This analysis simulates how a target-audience viewer would attend to and emotionally respond to the creative. VETT uses synthetic respondents calibrated to category demographic patterns — not a human panel. The framework follows the structure of established creative-diagnostic protocols (Kantar Link, Nielsen Catalina, TVision/Lumen attention norms) with the synthetic substitution clearly disclosed. Treat the output as fast directional signal, not panel-grade truth.',

  /** Generic disclosure for any methodology export. */
  syntheticRespondents:
    'VETT outputs are synthetic-respondent simulations of industry-standard research frameworks. The frameworks themselves are peer-reviewed in the academic literature; the simulation pipeline is not. Treat outputs as fast directional signal, not panel-grade truth.',
};

// ── Logo lockup ──────────────────────────────────────────────────────

/**
 * VETT logo as raw SVG path strings. We render it with jsPDF's native
 * graphics primitives (drawRect for the lime square, drawLine/lines
 * for the lightning bolt) instead of embedding an SVG so the export
 * stays small and the logo is always crisp.
 *
 * Coordinates are in a 0-100 viewBox; multiply by the desired pixel
 * size in the consumer to scale.
 */
export const EXPORT_LOGO = {
  /** Square dimensions (square is 1:1). */
  square: { x0: 0, y0: 0, x1: 100, y1: 100, radius: 18 },
  /** Lightning bolt path — 7 points, percent-of-square coordinates. */
  bolt: [
    [54, 12],
    [28, 56],
    [44, 56],
    [38, 88],
    [70, 38],
    [50, 38],
    [62, 12],
  ] as Array<[number, number]>,
  /** Wordmark to render to the right of the square. */
  wordmark: 'VETT',
};

/**
 * Render the VETT lime-on-black square logo + wordmark into a jsPDF
 * doc at the given anchor. `size` is the side length of the square
 * in pt; the wordmark renders at 1.6x that size to its right.
 */
export function drawJsPdfLogo(
  doc: import('jspdf').jsPDF,
  x: number,
  y: number,
  size: number,
  options?: { withWordmark?: boolean },
): void {
  const withWordmark = options?.withWordmark ?? true;
  // Lime square w/ rounded corner (use roundedRect when available)
  doc.setFillColor(...EXPORT_RGB.lime);
  if (typeof (doc as { roundedRect?: unknown }).roundedRect === 'function') {
    doc.roundedRect(x, y, size, size, size * 0.18, size * 0.18, 'F');
  } else {
    doc.rect(x, y, size, size, 'F');
  }
  // Lightning bolt as connected lines (jsPDF lacks polygons; use lines).
  doc.setDrawColor(...EXPORT_RGB.ink);
  doc.setFillColor(...EXPORT_RGB.ink);
  doc.setLineWidth(0);
  // Build poly from bolt path scaled to the square.
  const pts = EXPORT_LOGO.bolt.map(([px, py]) => [
    x + (px / 100) * size,
    y + (py / 100) * size,
  ]);
  // Draw filled polygon via successive lines + fill.
  // jsPDF's `lines` API lets us specify a path; use it.
  const start = pts[0]!;
  const rel: Array<[number, number]> = [];
  for (let i = 1; i < pts.length; i++) {
    rel.push([pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]]);
  }
  doc.lines(rel, start[0], start[1], [1, 1], 'F', true);

  if (withWordmark) {
    doc.setFont(EXPORT_FONTS.heading.jsPdf, 'bold');
    doc.setFontSize(size * 0.7);
    doc.setTextColor(...EXPORT_RGB.ink);
    doc.text('VETT', x + size + size * 0.4, y + size * 0.78);
  }
}
