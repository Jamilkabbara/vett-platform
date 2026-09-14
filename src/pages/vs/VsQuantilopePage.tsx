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
      vettTagline={`Synthetic-respondent platform on named frameworks (MaxDiff, TURF, Van Westendorp, NPS, brand lift), ${SELF_SERVE_RANGE} per mission, MENA-rooted, methodology-first.`}
      slug="/vs/quantilope"
      competitorRefUrl="https://www.quantilope.com/pricing"
      tldr={[
        'Respondents: Quantilope reaches real consumers through its panel network (it cites 300M+ worldwide). VETT simulates respondents with AI.',
        'Methods: both cover MaxDiff, TURF, price sensitivity and NPS. Quantilope adds choice-based conjoint, key driver analysis, segmentation and implicit association tests, which VETT does not offer.',
        `Cost shape: VETT is ${SELF_SERVE_RANGE} per mission, no subscription. Quantilope plans start at $2,000/month for three users.`,
        'Speed: VETT returns a directional read in minutes, without panel fieldwork.',
        'Evidence: Quantilope results are measured from real consumers; VETT results are simulated and directional.',
        'Use VETT to test many versions cheaply before a panel study; use Quantilope when the result has to come from real consumers.',
      ]}
      whereWeLose="Real consumers and method depth: Quantilope measures real people and offers conjoint, segmentation and implicit association tests. VETT simulates respondents and offers none of those three."
      rows={[
        {
          dimension: 'Respondent type',
          vett: 'Synthetic personas',
          competitor: 'Real consumers through a panel network (300M+ worldwide, per quantilope.com)',
          verdict: 'competitor',
        },
        {
          dimension: 'Methods',
          vett: 'MaxDiff, TURF (in naming tests), Van Westendorp, NPS, brand lift, concept tests',
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
      whenToUseCompetitor={`Teams with a research budget who need results from real consumers. Conjoint, segmentation or implicit association work, which VETT does not offer. Anything where the deliverable goes to a CMO, board or planning committee that needs a real-respondent study.`}
      faqs={[
        {
          q: 'Quantilope offers conjoint and implicit association tests. Does VETT?',
          a: 'No. VETT supports simpler frameworks: Van Westendorp price sensitivity, MaxDiff, NPS and a brand-lift funnel. For choice-based conjoint, segmentation or implicit association tests, use Quantilope or a conjoint specialist.',
        },
      ]}
    />
  );
}
export default VsQuantilopePage;
