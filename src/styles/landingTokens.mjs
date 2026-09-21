/**
 * Landing page design tokens - the one place their values are written.
 *
 * The landing page has its own palette and font pairing (Manrope headlines,
 * Inter body), which is the reverse of the app theme's display/body fonts and
 * does not match its text greys. Owner decision 2026-09-16: keep the landing
 * system, name it here, expose it through the Tailwind theme under `lp-*`,
 * and use it on the landing page only. The rest of the app keeps its tokens.
 *
 * Read by tailwind.config.js (classes: text-lp-body, bg-lp-glass,
 * shadow-lp-panel, font-lp-head, ...) and by the landing charts, which draw
 * SVG and canvas and need the raw values. scripts/verify-landing-tokens.mjs
 * fails if a colour literal is written anywhere else in the landing files.
 */

const hex = (h, a) => {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const LP_COLORS = {
  ink:        '#0B0C15', // page background
  text:       '#F3F5EF',
  body:       '#8B919C',
  muted:      '#5C6470',
  track:      '#1B1E2B', // empty bar / chart track
  lime:       '#BEF264',
  indigo:     '#6366F1',
  indigo2:    '#5457E8', // gradient stop
  indigoSoft: '#C8C9FB', // pill eyebrow text
  indigoTag:  '#A9AAFB', // indigo tag text
  // Chart series, always in this order.
  chartLime:   '#BEF264',
  chartMint:   '#A6E0CF',
  chartIndigo: '#7C7BF5',
  chartAmber:  '#F2B24A',
  chartPink:   '#F2748C',
  tooltip:     '#10121C',
};

export const LP_CHART_ORDER = [
  LP_COLORS.chartLime, LP_COLORS.chartMint, LP_COLORS.chartIndigo, LP_COLORS.chartAmber, LP_COLORS.chartPink,
];

/** rgba() of a token, for canvas and SVG. */
export const lpAlpha = (name, a) => hex(LP_COLORS[name], a);

export const LP_FONTS = {
  head: ['Manrope', 'system-ui', 'sans-serif'],
  text: ['Inter', 'system-ui', 'sans-serif'],
};

export const LP_BACKGROUNDS = {
  glass:     `linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012))`,
  demo:      `linear-gradient(180deg,${hex(LP_COLORS.indigo, 0.08)},rgba(255,255,255,0.012))`,
  terminal:  `linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))`,
  cta:       `linear-gradient(150deg,${hex(LP_COLORS.indigo, 0.2)},${hex(LP_COLORS.lime, 0.06)})`,
  hairline:  `linear-gradient(90deg,transparent,${hex(LP_COLORS.indigo, 0.7)},transparent)`,
  'btn-indigo': `linear-gradient(135deg,${LP_COLORS.indigo},${LP_COLORS.indigo2})`,
  'aurora-indigo': `radial-gradient(circle,${hex(LP_COLORS.indigo, 0.4)},transparent 62%)`,
  'aurora-lime':   `radial-gradient(circle,${hex(LP_COLORS.lime, 0.22)},transparent 65%)`,
  'cursor-glow':   `radial-gradient(circle,${hex(LP_COLORS.chartIndigo, 0.07)},transparent 60%)`,
  'timeline':      `linear-gradient(90deg,${LP_COLORS.chartMint},${LP_COLORS.lime})`,
};

export const LP_SHADOWS = {
  panel:        `0 40px 100px -50px ${hex(LP_COLORS.indigo, 0.6)}`,
  terminal:     `0 30px 80px -30px ${hex(LP_COLORS.indigo, 0.5)}`,
  'btn-indigo': `0 10px 26px ${hex(LP_COLORS.indigo, 0.34)}`,
  'btn-lime':   `0 10px 26px ${hex(LP_COLORS.lime, 0.24)}`,
  'dot-lime':   `0 0 8px ${hex(LP_COLORS.lime, 0.5)}`,
  'dot-indigo': `0 0 8px ${hex(LP_COLORS.chartIndigo, 0.5)}`,
  tooltip:      '0 14px 36px rgba(0,0,0,0.5)',
  'card-on':    `inset 0 0 0 1px ${LP_COLORS.lime}`,
  'list-on':    `inset 3px 0 0 ${LP_COLORS.lime}`,
};

/** The `lp` slice of the Tailwind theme. */
export const lpTailwindTheme = {
  colors: {
    lp: {
      ink: LP_COLORS.ink,
      text: LP_COLORS.text,
      body: LP_COLORS.body,
      muted: LP_COLORS.muted,
      track: LP_COLORS.track,
      lime: LP_COLORS.lime,
      indigo: LP_COLORS.indigo,
      'indigo-soft': LP_COLORS.indigoSoft,
      'indigo-tag': LP_COLORS.indigoTag,
      mint: LP_COLORS.chartMint,
      'chart-indigo': LP_COLORS.chartIndigo,
      amber: LP_COLORS.chartAmber,
      pink: LP_COLORS.chartPink,
      tooltip: LP_COLORS.tooltip,
    },
  },
  fontFamily: { 'lp-head': LP_FONTS.head, 'lp-text': LP_FONTS.text },
  backgroundImage: Object.fromEntries(Object.entries(LP_BACKGROUNDS).map(([k, v]) => [`lp-${k}`, v])),
  boxShadow: Object.fromEntries(Object.entries(LP_SHADOWS).map(([k, v]) => [`lp-${k}`, v])),
};
