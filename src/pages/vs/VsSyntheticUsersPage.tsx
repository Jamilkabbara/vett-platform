import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';

/**
 * Pass 35 C3 — VETT vs Synthetic Users.
 * Synthetic Users is a YC-backed UX research platform that generates
 * synthetic interview personas for qualitative research.
 */
export function VsSyntheticUsersPage() {
  return (
    <VsPageTemplate
      competitorName="Synthetic Users"
      competitorTagline="Synthetic-respondent platform focused on qualitative UX research — interview-style persona conversations, problem-discovery, journey mapping. YC-backed, US-rooted."
      vettTagline="Methodology-first synthetic-respondent platform for quantitative market research — Van Westendorp pricing, MaxDiff feature priority, brand-health funnel, $9-35 entry tiers."
      slug="/vs/synthetic-users"
      competitorRefUrl="https://www.syntheticusers.com/"
      rows={[
        {
          dimension: 'Research shape',
          vett: 'Quantitative — n=5-5000 per mission, per-question distributions, statistical-shape outputs',
          competitor: 'Qualitative — interview-style conversations with synthetic personas, problem discovery, journey mapping',
          verdict: 'tie',
        },
        {
          dimension: 'Methodology binding',
          vett: 'Named frameworks (Van Westendorp, MaxDiff, NPS, brand-lift) with explicit instruments',
          competitor: 'Discovery interviews + persona-driven Q&A; methodology surface less explicit',
          verdict: 'vett',
        },
        {
          dimension: 'Pricing',
          vett: '$9-1990 per mission (one-time)',
          competitor: 'Subscription tiers starting ~$249/month',
          verdict: 'vett',
        },
        {
          dimension: 'Use case fit',
          vett: 'Pricing studies, concept tests, ad effectiveness, brand-lift, NPS / CSAT — quantitative go/no-go',
          competitor: 'Pre-research discovery, journey mapping, qualitative iteration on early-stage product ideas',
          verdict: 'tie',
        },
        {
          dimension: 'Output deliverable',
          vett: 'Branded PDF + PPTX + XLSX + JSON + CSV exports with VETT brand tokens',
          competitor: 'Conversation transcripts + thematic synthesis',
          verdict: 'tie',
        },
        {
          dimension: 'Geographic calibration',
          vett: 'MENA-rooted; 160+ countries',
          competitor: 'US + EU primary; global supported',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`When the question is quantitative — "what is the optimal price point", "which feature should ship first", "how does brand-lift compare exposed-vs-control". When the deliverable needs framework documentation (Van Westendorp PMC/PME/IPP/OPP, MaxDiff utility scores, NPS standardized scoring). When you want exportable charts + tables for a stakeholder deck.`}
      whenToUseCompetitor={`When the question is qualitative — "what problems does my user care about", "what's the unmet need behind this purchase", "how would a Gen Z user describe this experience". When you want interview-style depth not statistical breadth. When the upstream research goal is discovery + empathy not measurement.`}
      faqs={[
        {
          q: 'Both are synthetic-respondent platforms. Different jobs?',
          a: 'Yes — same broad category, different research shape. Synthetic Users is qualitative discovery (interview transcripts, journey mapping). VETT is quantitative measurement (per-question distributions, framework-bound results). Many teams use both: Synthetic Users to discover the problem, VETT to measure willingness-to-pay or feature priority.',
        },
      ]}
    />
  );
}
export default VsSyntheticUsersPage;
