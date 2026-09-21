/**
 * The one real study the landing page is allowed to quote.
 *
 * Every figure here was counted from the delivered study's own stored answers,
 * not from its written report. Anything the page states about real research
 * comes from this file, so there is one place to check and one place to change.
 *
 * Study: "Premium plant-based ready-meals, Saudi Arabia and Egypt"
 *   mission 3fc15087-1432-468e-bc97-3b2776cccb88, completed 2026-09-21,
 *   80 respondents (43 Saudi Arabia, 37 Egypt).
 *
 * RE-RUN, AND WHY THE FIGURES MOVED. The 20 September run was flagged by the
 * quality audit: its barrier question offered no way to answer "none of these",
 * and three of its answers had been filed under a question that never offered
 * them. A flagged study may not appear in public material, so it was re-run on
 * 21 September with the question fixed and answer validation live. The figures
 * below are from that run; the 20 September numbers (78% and 60%) are not
 * usable and must not reappear.
 *
 * PURCHASE INTENT - 88%
 *   "If these were available ... how likely would you be to buy them?"
 *   Definitely would buy 8 + probably would buy 62, of 80 = 87.5%, shown as 88%.
 *   Per-market figures exist and are subgroup figures; the page does not use
 *   them, and the report guard would catch an unlabelled one.
 *
 * WILLINGNESS TO PAY - 51% chose SAR 29 to 38
 *   "What is the maximum price you would pay per serving?"
 *   41 of 80 chose the SAR 29 to 38 band (EGP 151 to 200), the most common
 *   answer of four price bands.
 *
 * NOT PUBLISHED: the barrier question. The instrument is fixed now (it offers
 * "None of these" and caps selections at three), but a battery answered under
 * the old wording is not comparable with one answered under the new, so this
 * study's barrier figures stay unpublished either way.
 *
 * Two earlier runs are not usable at all: the original panel repeated the same
 * people (61 distinct of 80), and the 20 September re-run carried the two
 * defects described above.
 */

export interface LandingStudyStat {
  label: string;
  value: string;
  emphasis?: boolean;
}

export const LANDING_STUDY = {
  /** Shown verbatim wherever the study is cited. */
  attribution: 'A VETT study, 21 September',
  question: 'Will premium plant-based ready-meals sell in Saudi Arabia and Egypt?',
  basis: '80 respondents, Saudi Arabia and Egypt',
  respondents: 80,
  stats: [
    { label: 'Purchase intent', value: '88%', emphasis: true },
    { label: 'Most common price', value: 'SAR 29 to 38 a meal' },
    { label: 'Chose that price', value: '51%' },
  ] as LandingStudyStat[],
} as const;

/**
 * The published placement norm the Creative Attention demo is scored against.
 * Source: TikTok's own published Feed benchmark. It is a third-party norm, not
 * a VETT measurement, and is labelled that way on the page.
 */
export const TIKTOK_FEED_NORM_SECONDS = 1.4;
