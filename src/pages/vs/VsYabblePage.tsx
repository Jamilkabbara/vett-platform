import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';

/**
 * Pass 35 C3 — VETT vs Yabble.
 * Yabble is an AI-powered insights platform with audience generation
 * + survey gen, NZ-rooted, mid-market pricing.
 */
export function VsYabblePage() {
  return (
    <VsPageTemplate
      competitorName="Yabble"
      competitorTagline="AI insights platform with synthetic-audience generation + AI survey design + thematic analysis. NZ-headquartered, mid-market pricing, enterprise-friendly UX."
      vettTagline="Methodology-first synthetic-respondent platform with 11 named frameworks (Van Westendorp / MaxDiff / NPS / brand-health funnel), $9-35 entry pricing, MENA-rooted."
      slug="/vs/yabble"
      competitorRefUrl="https://www.yabble.com/"
      rows={[
        {
          dimension: 'Methodology binding',
          vett: 'Each mission binds to a named framework (Van Westendorp, MaxDiff, NPS, etc.) with framework-specific question generators + results pages',
          competitor: 'AI-driven survey generation; methodology choice less explicit in product surface',
          verdict: 'vett',
        },
        {
          dimension: 'Pricing entry point',
          vett: '$9 Sniff Test (5 personas)',
          competitor: 'Subscription tiers starting in the low thousands per year',
          verdict: 'vett',
        },
        {
          dimension: 'Geographic focus',
          vett: 'MENA-rooted persona calibration; 160+ countries supported',
          competitor: 'NZ + AU + UK + US deep; EMEA + APAC supported',
          verdict: 'tie',
        },
        {
          dimension: 'Thematic / qualitative analysis',
          vett: 'Per-question + cross-cut + executive summary; not a full thematic-coding tool',
          competitor: 'Strong AI-driven thematic analysis on open-text + verbatim',
          verdict: 'competitor',
        },
        {
          dimension: 'Mature platform UX for enterprise teams',
          vett: 'Single-user-account today; team workspace deferred',
          competitor: 'Multi-user workspace, sharing, comments, versioning',
          verdict: 'competitor',
        },
        {
          dimension: 'Time to first result',
          vett: 'Minutes (5-15 min for entry tiers)',
          competitor: 'Hours to days depending on study type',
          verdict: 'vett',
        },
      ]}
      whenToUseVett={`Solo founder / small team with no research budget who wants to iterate 5-10 concept variants before committing. MENA-specific work where Yabble's panel/persona calibration may be thinner. Methodology-bound studies (Van Westendorp pricing, MaxDiff feature ranking) where you want explicit framework documentation. Pre-launch iteration cycles measured in hours not days.`}
      whenToUseCompetitor={`Enterprise team with multi-user workflow needs. Heavy thematic / qualitative analysis on existing open-text data. Established research function with annual research budget that can absorb subscription pricing. APAC-deep market work where Yabble's regional calibration is strongest.`}
      faqs={[
        {
          q: 'Both use synthetic respondents — what is different?',
          a: 'VETT is methodology-first: each mission binds to a named framework (Van Westendorp, MaxDiff, NPS, brand-health funnel) with framework-specific question generators and results pages. Yabble is more general-purpose AI survey + thematic analysis. Different shapes of the same broad category.',
        },
      ]}
    />
  );
}
export default VsYabblePage;
