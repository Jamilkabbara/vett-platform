/**
 * PLACEHOLDER. Delete this file when the first real study lands.
 *
 * An invented worked example whose only job is to show the SHAPE of a case
 * study page before any real mission has been run. Everything in it is made up:
 *
 *   - the brand does not exist and is named "Placeholder Coffee Co." so that it
 *     cannot be mistaken for a customer;
 *   - every figure is a round number chosen to be legible, not measured;
 *   - there is no mission id, because no mission was run;
 *   - `placeholder: true` renders a banner at the top of the page saying all of
 *     the above. Deleting that one flag is what turns a shape into a claim, so
 *     it stays until real numbers replace these.
 *
 * No production mission data was copied into this file, and nothing here was
 * derived from a customer report.
 *
 * TO REPLACE THIS WITH A REAL STUDY, transcribe from the canonical report
 * (GET /api/results/:id/report). The field-by-field map lives on the `CaseStudy`
 * type in src/components/marketing/CaseStudyPageTemplate.tsx.
 *
 * `finding` MUST stay a single-line, single-quoted literal with no escapes:
 * scripts/verify-seo-routes.mjs reads it straight out of this source and
 * compares it to the manifest h1 for this route.
 */
import type { CaseStudy } from '../../components/marketing/CaseStudyPageTemplate';

export const PLACEHOLDER_EXAMPLE_STUDY: CaseStudy = {
  slug: '/case-studies/placeholder-pricing-example',
  placeholder: true,

  /* ── Band 1 ──────────────────────────────────────────────────────── */
  eyebrow: 'Case study - Pricing',
  finding: 'Placeholder Coffee Co. can charge 20 percent more without losing demand',
  method: {
    methodology: 'Van Westendorp pricing, with a Gabor-Granger ladder',
    n: 60,
    markets: 'United Arab Emirates and Saudi Arabia',
    month: 'Example month',
  },

  /* ── Band 2 ──────────────────────────────────────────────────────── */
  stats: [
    { label: 'Optimal price point', value: '$24', tone: 'lime' },
    { label: 'Acceptable range', value: '$18-30' },
    { label: 'Willingness to pay ceiling (mean)', value: '$32' },
    { label: 'Would still buy at $24', value: '70%' },
  ],

  /* ── Band 3: authored prose, and where anonymisation happens ─────── */
  situation: [
    'A speciality coffee roaster had been selling a 250g bag at $20 for two years and had never tested the number. Costs had moved, the team suspected the bag was underpriced, and the founder wanted to go to $24. Nobody in the room could say what $24 would do to volume, so the argument kept resetting.',
    'The decision was worth roughly one quarter of gross margin and needed making before the next roast cycle, which ruled out a four week panel study. The brief was narrow on purpose: find the price the market accepts, and find the point where demand falls off a cliff.',
  ],

  /* ── Band 4: the centerpiece ─────────────────────────────────────── */
  centerpiece: {
    title: 'What the market will pay',
    eyebrow: 'Price sensitivity',
    chip: 'Gabor-Granger',
    caption:
      'The demand ladder: the share of the sample who said they would still buy at each price. n = 60, authoritative posture. Demand holds through $24 and then drops 25 points between $24 and $27, which is where the ceiling sits.',
    chart: {
      kind: 'bars',
      base: 60,
      unit: '%',
      rows: [
        { label: '$18', count: 54, pct: 90 },
        { label: '$21', count: 48, pct: 80 },
        { label: '$24', count: 42, pct: 70 },
        { label: '$27', count: 27, pct: 45 },
        { label: '$30', count: 15, pct: 25 },
      ],
    },
  },

  /* ── Band 5: question cards ──────────────────────────────────────── */
  questions: [
    {
      question: 'How likely would you be to buy a 250g bag at $24?',
      rendererLabel: 'Rating scale, 1 to 10',
      meta: 'Rating scale, 1 to 10 - n = 60',
      insight:
        'The distribution is single peaked at 8, not split. That matters more than the mean: a bimodal curve would mean two audiences with two different prices, and there is only one here.',
      chart: {
        kind: 'histogram',
        total: 60,
        buckets: [
          { label: '1', count: 0 },
          { label: '2', count: 1 },
          { label: '3', count: 2 },
          { label: '4', count: 3 },
          { label: '5', count: 5 },
          { label: '6', count: 8 },
          { label: '7', count: 12 },
          { label: '8', count: 14 },
          { label: '9', count: 10 },
          { label: '10', count: 5 },
        ],
      },
    },
    {
      question: 'What makes a bag of coffee worth paying more for?',
      rendererLabel: 'Multi select',
      meta: 'Multi select - share of 60 respondents',
      insight:
        'Provenance and freshness outrank packaging by more than two to one. The premium is a story about the bean, not about the bag.',
      chart: {
        kind: 'bars',
        base: 60,
        unit: '%',
        rows: [
          { label: 'Single origin with a named farm', count: 39, pct: 65 },
          { label: 'Roasted within the last week', count: 33, pct: 55 },
          { label: 'Tastes better than the supermarket bag', count: 27, pct: 45 },
          { label: 'Recyclable or refillable packaging', count: 18, pct: 30 },
          { label: 'A brand I already know', count: 12, pct: 20 },
        ],
      },
    },
    {
      question: 'In your own words, what would stop you paying $27 for a bag?',
      rendererLabel: 'Open text',
      meta: 'Open text - themes across 60 responses',
      chart: {
        kind: 'themes',
        n: 60,
        themes: [
          {
            label: 'Cheaper alternative on the supermarket shelf',
            count: 24,
            pct: 40,
            sentiment: 'negative',
            quotes: ['At that price I would want to know why it beats the $12 bag.'],
          },
          {
            label: 'Wants to taste it before committing',
            count: 18,
            pct: 30,
            sentiment: 'neutral',
            quotes: ['Give me a sample size first and I would probably go up to $27.'],
          },
          {
            label: 'Happy to pay for freshness',
            count: 15,
            pct: 25,
            sentiment: 'positive',
            quotes: ['If it was roasted this week, $27 is fine.'],
          },
        ],
      },
    },
  ],

  verbatims: [
    'I buy coffee every fortnight, so an extra four dollars a bag is about a hundred dollars a year. I would pay it if the bag actually tasted different.',
    'Twenty four is the number where I stop thinking about it. Twenty seven and I start comparing.',
    'The roast date on the bag does more for me than any of the branding.',
  ],

  /* ── Band 6 ──────────────────────────────────────────────────────── */
  personas: [
    {
      name: 'Weekday commuters',
      share: '40%',
      description:
        'Buy a bag every two weeks, brew at home before the office, price aware but not price led.',
    },
    {
      name: 'Home brew hobbyists',
      share: '35%',
      description:
        'Own a grinder and a scale, read roast dates, least sensitive group in the sample.',
    },
    {
      name: 'Gift buyers',
      share: '25%',
      description:
        'Buy three or four times a year for someone else, anchor on packaging and on the story.',
    },
  ],

  /* ── Band 7 ──────────────────────────────────────────────────────── */
  gate: {
    posture: 'authoritative',
    note: 'n=60. Above the n>=30 threshold VETT requires before headlining a price point.',
    n: 60,
    threshold: 30,
  },
  cost: '$99',
  duration: 'About 12 minutes',
};

export default PLACEHOLDER_EXAMPLE_STUDY;
