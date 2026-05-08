import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';

/**
 * Pass 35 C3 — VETT vs Aaru.
 * Aaru is an academic-provenance synthetic-respondent platform
 * focused on policy / public-opinion modeling, not commercial market
 * research per se. Be honest about the difference in target use case.
 */
export function VsAaruPage() {
  return (
    <VsPageTemplate
      competitorName="Aaru"
      competitorTagline="Academic-provenance synthetic-respondent platform focused on policy modeling, election forecasting, public-opinion simulation. Different target use case than commercial market research."
      vettTagline="Commercial market-research synthetic-respondent platform — pricing, feature priority, brand-lift, creative attention. Methodology-first, $9-1990 per mission."
      slug="/vs/aaru"
      competitorRefUrl="https://www.aaru.com/"
      rows={[
        {
          dimension: 'Primary use case',
          vett: 'Commercial market research — pricing, brand, creative, concept testing',
          competitor: 'Policy / public-opinion modeling, election forecasting, demographic simulation',
          verdict: 'tie',
        },
        {
          dimension: 'Output deliverable',
          vett: 'Methodology-bound research reports (PDF / PPTX / XLSX) for product + marketing teams',
          competitor: 'Public-opinion forecasts, scenario simulations for academic / policy clients',
          verdict: 'tie',
        },
        {
          dimension: 'Pricing transparency',
          vett: '$9-1990 published tiers; one-time per mission',
          competitor: 'Enterprise / academic licensing; not transparently published',
          verdict: 'vett',
        },
        {
          dimension: 'Methodology coverage',
          vett: '11 named frameworks (Van Westendorp, MaxDiff, NPS, brand-lift, etc.) with framework-specific results',
          competitor: 'Bespoke simulation per study; not framework-bound in the same sense',
          verdict: 'tie',
        },
        {
          dimension: 'Academic provenance',
          vett: 'Frameworks themselves are academically established (VW 1976, MaxDiff Sawtooth, Reichheld NPS); platform is commercial',
          competitor: 'Stronger academic positioning + research-team provenance',
          verdict: 'competitor',
        },
        {
          dimension: 'MENA market focus',
          vett: 'Persona calibration tuned for MENA demographics + 160+ countries',
          competitor: 'US-political-research roots; global expansion',
          verdict: 'vett',
        },
      ]}
      whenToUseVett={`Commercial product / marketing decisions — pricing a SaaS subscription, ranking a feature roadmap, testing an ad before media spend, measuring brand awareness pre/post campaign. Anything where the output goes to a product manager, founder, or marketing lead. MENA-specific work.`}
      whenToUseCompetitor={`Public-policy modeling, election forecasting, large-scale demographic simulation, academic research where institutional credibility + provenance matter more than commercial framework binding. Aaru's roots in this space are strong.`}
      faqs={[
        {
          q: 'Both use synthetic respondents — does Aaru replace VETT or vice versa?',
          a: 'No — they are pointed at different categories. Aaru\'s strength is public-opinion / policy simulation. VETT\'s is commercial product + marketing research bound to named methodologies. The synthetic-respondent generation is a shared technical primitive but the research surfaces and deliverables differ.',
        },
      ]}
    />
  );
}
export default VsAaruPage;
