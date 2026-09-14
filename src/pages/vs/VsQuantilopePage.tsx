import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { SELF_SERVE_MIN_USD, SELF_SERVE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs Quantilope.
 *
 * CORRECTED 2026-09-14 against quantilope.com. The previous version said
 * "Enterprise SaaS contracts; per-study costs in the thousands", "90+ countries
 * via panel partners", named IRT and Gabor-Granger among its methods, and
 * linked to a methodology URL that returns 404. What quantilope.com says:
 *   - Pricing page: "Pricing starts at $2,000/month" for the Business plan
 *     (3 users); Pro and Enterprise are "Contact us for pricing".
 *   - Homepage: "Access 300M+ Consumers world wide through quantilope's
 *     trusted panel network".
 *   - Homepage methods: A/B test, choice-based conjoint, NPS, key driver
 *     analysis, MaxDiff, price sensitivity meter, segmentation, implicit
 *     association tests, TURF, and others. IRT and Gabor-Granger are not named.
 * Claims that could not be sourced there (country count, turnaround,
 * "ESOMAR-style documentation", thinner MENA coverage) were removed.
 */
export function VsQuantilopePage() {
  return (
    <VsPageTemplate
      competitorName="Quantilope"
      competitorTagline="Consumer-insights platform running automated quantitative methods (conjoint, MaxDiff, TURF, price sensitivity, implicit association tests) on real consumers through its panel network. Plans from $2,000/month."
      vettTagline={`Synthetic-respondent platform on named frameworks (MaxDiff, TURF, Van Westendorp, NPS, segmentation, brand lift), ${SELF_SERVE_RANGE} per mission, methodology-first.`}
      slug="/vs/quantilope"
      competitorRefUrl="https://www.quantilope.com/pricing"
      tldr={[
        'Respondents: Quantilope reaches real consumers through its panel network (it cites 300M+ worldwide). VETT simulates respondents with AI.',
        'Methods: both cover MaxDiff, TURF, price sensitivity and NPS. Quantilope adds choice-based conjoint, key driver analysis and implicit association tests, which VETT does not offer. Both offer segmentation.',
        `Cost shape: VETT is ${SELF_SERVE_RANGE} per mission, no subscription. Quantilope plans start at $2,000/month for three users.`,
        'Speed: VETT returns a directional read in minutes, without panel fieldwork.',
        'Evidence: Quantilope results are measured from real consumers; VETT results are simulated and directional.',
        'Use VETT to test many versions cheaply before a panel study; use Quantilope when the result has to come from real consumers.',
      ]}
      whereWeLose="Real consumers and method depth: Quantilope measures real people and offers conjoint and implicit association tests. VETT simulates respondents and offers neither."
      rows={[
        {
          dimension: 'Respondent type',
          vett: 'Synthetic personas',
          competitor: 'Real consumers through a panel network (300M+ worldwide, per quantilope.com)',
          verdict: 'competitor',
        },
        {
          dimension: 'Methods',
          vett: 'MaxDiff and Kano, TURF (in tagline tests), Van Westendorp and Gabor-Granger, NPS, k-means segmentation (from 50 respondents), brand lift, concept tests',
          competitor: 'Choice-based conjoint, MaxDiff, TURF, price sensitivity meter, NPS, key driver analysis, segmentation, implicit association tests, A/B tests',
          verdict: 'competitor',
        },
        {
          dimension: 'Price',
          vett: `From $${SELF_SERVE_MIN_USD} per mission; no subscription`,
          competitor: 'Plans from $2,000/month (Business, 3 users); Pro and Enterprise priced on request',
          verdict: 'vett',
        },
        {
          dimension: 'Evidence behind a result',
          vett: 'Synthetic respondents: a directional signal, not panel-grade',
          competitor: 'Measured responses from real consumers',
          verdict: 'competitor',
        },
      ]}
      whenToUseVett={`Pre-launch iteration where you want to test 5-10 versions cheaply before committing to a panel study. Methodology range-finding, for example an approximate price band from Van Westendorp before locking it in with real consumers. Solo founders and small teams without a research subscription.`}
      whenToUseCompetitor={`Teams with a research budget who need results from real consumers. Conjoint or implicit association work, which VETT does not offer. Anything where the deliverable goes to a CMO, board or planning committee that needs a real-respondent study.`}
      faqs={[
        {
          q: 'Quantilope offers conjoint and implicit association tests. Does VETT?',
          a: 'No. VETT offers Van Westendorp and Gabor-Granger pricing, MaxDiff and Kano, NPS, TURF for tagline tests, k-means segmentation and a brand-lift study, but not conjoint or implicit association tests. For those, use Quantilope or a conjoint specialist.',
        },
        {
          q: 'How much does each cost?',
          a: `Quantilope plans start at $2,000/month for the Business plan with three users; Pro and Enterprise are priced on request. VETT charges per mission, ${SELF_SERVE_RANGE}, with no subscription.`,
        },
        {
          q: 'Are VETT respondents real people?',
          a: 'No. VETT simulates respondents with AI, so its results are a directional read, not a panel study. Quantilope reaches real consumers through its panel network, which it puts at 300M+ worldwide.',
        },
        {
          q: 'Which methods do both cover?',
          a: 'MaxDiff, TURF, price sensitivity, NPS and segmentation. Quantilope also offers choice-based conjoint, key driver analysis, implicit association tests and A/B tests. VETT adds Kano, Gabor-Granger, a brand-lift study and concept tests, on simulated respondents.',
        },
        {
          q: 'How fast is VETT?',
          a: "Minutes, because there is no panel fieldwork. Quantilope's site does not state a turnaround, so we do not quote one here.",
        },
        {
          q: 'Where does VETT lose to Quantilope?',
          a: 'Real consumers and method depth. Quantilope measures real people and offers conjoint and implicit association tests. VETT simulates respondents and offers neither.',
        },
      ]}
    />
  );
}
export default VsQuantilopePage;
