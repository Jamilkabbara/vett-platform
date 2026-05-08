import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';

/**
 * Pass 35 C3 — VETT vs Quantilope.
 * Quantilope is an established quantitative research platform with
 * panel + DIY survey + automation. Mid-to-enterprise pricing.
 */
export function VsQuantilopePage() {
  return (
    <VsPageTemplate
      competitorName="Quantilope"
      competitorTagline="Established consumer-insights platform with real-panel access + automated quantitative methodologies (TURF, MaxDiff, claims test, IRT). Mid-to-enterprise pricing."
      vettTagline="Synthetic-respondent platform with the same quantitative frameworks (MaxDiff, TURF, NPS, brand-lift) at $9-1990 entry tiers, MENA-rooted, methodology-first."
      slug="/vs/quantilope"
      competitorRefUrl="https://www.quantilope.com/methodology"
      rows={[
        {
          dimension: 'Respondent type',
          vett: 'Synthetic personas',
          competitor: 'Real panel respondents (global access)',
          verdict: 'competitor',
        },
        {
          dimension: 'Methodology overlap',
          vett: 'MaxDiff, TURF (in naming_messaging), Van Westendorp, NPS, brand-lift, concept test',
          competitor: 'MaxDiff, TURF, IRT, Brand KPIs, claims test, conjoint, gabor-granger',
          verdict: 'tie',
        },
        {
          dimension: 'Pricing entry',
          vett: '$9 Sniff Test',
          competitor: 'Enterprise SaaS contracts; per-study costs in the thousands',
          verdict: 'vett',
        },
        {
          dimension: 'Stakeholder credibility for board',
          vett: 'Synthetic respondents — directional signal, not panel-grade',
          competitor: 'Panel-grade documentation + ESOMAR-style documentation',
          verdict: 'competitor',
        },
        {
          dimension: 'Time to result',
          vett: 'Minutes',
          competitor: 'Hours to days depending on panel availability',
          verdict: 'vett',
        },
        {
          dimension: 'Geographic depth',
          vett: 'MENA-rooted persona calibration; 160+ countries',
          competitor: '90+ countries via panel partners; deepest in NA + EU',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`Pre-launch iteration where you want to test 5-10 versions cheaply before committing to a Quantilope study. MENA-specific work where Quantilope's panel coverage is thinner. Methodology range-finding (e.g. find an approximate optimal price band on VW + GG before locking it in with a panel study). Solo-founder or small-team budgets.`}
      whenToUseCompetitor={`Mid-to-enterprise teams with established research budget. Studies where the deliverable goes to a CMO / board / annual-plan committee that needs ESOMAR-style documentation. Anything where the panel-grade real-respondent claim is a hard requirement (regulated category, public-listing prep).`}
      faqs={[
        {
          q: 'Quantilope has IRT and conjoint. Does VETT?',
          a: 'VETT does not currently support full IRT / conjoint. We support the simpler frameworks (Van Westendorp PSM, MaxDiff via sample-size-adjusted, NPS, brand-lift funnel). For IRT or full conjoint you need Quantilope, Conjointly, or Sawtooth.',
        },
      ]}
    />
  );
}
export default VsQuantilopePage;
