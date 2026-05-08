import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';

/**
 * Pass 35 C4 — VETT vs traditional research.
 * Category page covering ad-hoc agency research / focus groups /
 * panel studies / DIY survey tools. The "where does VETT fit" page.
 */
export function VsTraditionalResearchPage() {
  return (
    <VsPageTemplate
      competitorName="traditional research"
      competitorTagline="Ad-hoc agency research, focus groups, real-panel quantitative studies, DIY survey tools (SurveyMonkey, Typeform, Google Forms). The established research industry."
      vettTagline="Methodology-first synthetic-respondent platform that fits between DIY tools and full agency engagements — fast, cheap, framework-bound, but not panel-grade."
      slug="/vs/traditional-research"
      competitorRefUrl="https://www.esomar.org/"
      rows={[
        {
          dimension: 'Cost per study',
          vett: '$9-1990 per mission, one-time',
          competitor: 'Focus groups: $5-20k. Panel quant: $5-50k. Agency engagements: $10-200k.',
          verdict: 'vett',
        },
        {
          dimension: 'Turnaround',
          vett: 'Minutes for $9-99 tiers; 30 min max for largest tiers',
          competitor: '4-12 weeks typical for panel quant; 6-16 weeks for agency engagements',
          verdict: 'vett',
        },
        {
          dimension: 'Stakeholder credibility',
          vett: 'Directional signal; treat as "what would a calibrated audience likely say"',
          competitor: 'Panel-grade documentation + ESOMAR / Insights Association standards',
          verdict: 'competitor',
        },
        {
          dimension: 'Sample size',
          vett: '5-5000 personas per mission',
          competitor: 'Typically 200-2000 panel respondents per quant study',
          verdict: 'tie',
        },
        {
          dimension: 'Methodology rigor',
          vett: 'Framework-bound (Van Westendorp, MaxDiff, NPS, brand-lift) — same as agency-grade instruments',
          competitor: 'Same frameworks — agencies are typically rigorous on methodology',
          verdict: 'tie',
        },
        {
          dimension: 'Iteration speed',
          vett: 'Run 5-10 versions in a day for $50-200 total',
          competitor: 'One-and-done — iteration usually means a follow-up study',
          verdict: 'vett',
        },
        {
          dimension: 'Best for',
          vett: 'Pre-launch iteration, fast directional reads, range-finding before bigger studies',
          competitor: 'Locked-in decisions, board / IPO / regulator deliverables, longitudinal tracking',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`Pre-launch iteration where you want to test 10 concepts in a week, not 1 in 12 weeks. Solo founder / small-team budget that can't justify $20k+ on a panel study. MENA-specific markets where panel coverage is patchy. Range-finding before commissioning a real-panel agency study (saves the agency a round of pre-research, often pays for itself).`}
      whenToUseCompetitor={`High-stakes decisions: pricing in a regulated category, brand campaign with $1M+ media spend, annual-tracking that goes in the annual report. Real-panel quant or agency engagements remain the right tool for these. VETT does not replace them — it accelerates the work upstream of them.`}
      faqs={[
        {
          q: 'Does VETT replace agency research?',
          a: 'No. VETT shortens the iteration loop before you commission an agency study. The agency study is still where the locked-in research lives. Many teams use VETT for the cheap, fast first 5-10 rounds of exploration; once a hypothesis is firm enough, they hand it off to an agency for the panel-grade validation that is actually defensible to a board.',
        },
        {
          q: 'When should I NOT use VETT?',
          a: 'When the deliverable goes to a regulator, an IPO prospectus, or a board pack that requires ESOMAR-grade documentation. When you need real-panel verification of behavioral intent (e.g. price elasticity for a major brand). When sub-segment significance testing is the headline output. For these, traditional research is the right tool.',
        },
      ]}
    />
  );
}
export default VsTraditionalResearchPage;
