/**
 * The one real study the landing page is allowed to quote.
 *
 * Every figure here was counted from the delivered study's own stored answers,
 * not from its written report. Anything the page states about real research
 * comes from this file, so there is one place to check and one place to change.
 *
 * Study: "Premium plant-based ready-meals, Saudi Arabia and Egypt"
 *   mission 3fc15087-1432-468e-bc97-3b2776cccb88, completed 2026-09-20,
 *   80 respondents (44 Saudi Arabia, 36 Egypt).
 *
 * PURCHASE INTENT — 78%
 *   "If these were available ... how likely would you be to buy them?"
 *   Definitely would buy 0 + probably would buy 62, of 80 = 77.5%, shown as 78%.
 *   By market: 86% Saudi Arabia (38 of 44), 67% Egypt (24 of 36). Those are
 *   subgroup figures and the page does not use them.
 *
 * WILLINGNESS TO PAY — 60% chose SAR 29 to 38
 *   "What is the maximum price you would pay per serving?"
 *   48 of 80 chose the SAR 29 to 38 band (EGP 151 to 200), the most common
 *   answer of four price bands.
 *
 * NOT PUBLISHED: the barrier question. It was a nine-option "select all that
 * apply" with no "none of these" and no cap, so its percentages measure the
 * question as much as the market. The instrument is fixed for future studies
 * (backend services/ai/multiSelectHygiene.js); this study's barrier figures
 * stay unpublished.
 *
 * An earlier run of this study is not usable at all: its panel repeated the
 * same people (61 distinct of 80), so it was re-run on 2026-09-20 after the
 * generator was fixed.
 */

export interface LandingStudyStat {
  label: string;
  value: string;
  emphasis?: boolean;
}

export const LANDING_STUDY = {
  /** Shown verbatim wherever the study is cited. */
  attribution: 'A VETT study, 20 September',
  question: 'Will premium plant-based ready-meals sell in Saudi Arabia and Egypt?',
  basis: '80 respondents, Saudi Arabia and Egypt',
  respondents: 80,
  stats: [
    { label: 'Purchase intent', value: '78%', emphasis: true },
    { label: 'Most common price', value: 'SAR 29 to 38 a meal' },
    { label: 'Chose that price', value: '60%' },
  ] as LandingStudyStat[],
} as const;

/**
 * The published placement norm the Creative Attention demo is scored against.
 * Source: TikTok's own published Feed benchmark. It is a third-party norm, not
 * a VETT measurement, and is labelled that way on the page.
 */
export const TIKTOK_FEED_NORM_SECONDS = 1.4;
