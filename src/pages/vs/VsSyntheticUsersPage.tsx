import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { SELF_SERVE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs Synthetic Users.
 *
 * Checked 2026-09-14 against Synthetic Users' own site. Every competitor claim
 * below comes from it:
 *   - syntheticusers.com/pricing: "Plans start at $12,500/year", one pool of
 *     Research Tokens, "$2-60 Per interview", "A standard-depth interview
 *     burns about 10,000 tokens".
 *   - syntheticusers.com: "User research at the speed of AI". Study types:
 *     problem exploration interviews, concept testing, custom script
 *     interviews. "For quantitative confidence, you can scale to hundreds in
 *     the same study." Clients shown include TikTok, J.P. Morgan and Samsung.
 *     Cites "85-92% synthetic-organic parity in independent comparison
 *     studies".
 * Claims that could not be sourced there (journey mapping, regional focus,
 * YC backing) were removed.
 */
export function VsSyntheticUsersPage() {
  return (
    <VsPageTemplate
      competitorName="Synthetic Users"
      competitorTagline="AI user-research platform: interview-style studies with synthetic users - problem exploration, concept testing, custom script interviews - scalable to hundreds per study. Annual plans from $12,500."
      vettTagline={`Methodology-first synthetic-respondent platform for quantitative market research - Van Westendorp pricing, MaxDiff feature priority, brand-health funnel, ${SELF_SERVE_RANGE} per mission.`}
      slug="/vs/synthetic-users"
      competitorRefUrl="https://www.syntheticusers.com/pricing"
      tldr={[
        'Shape: Synthetic Users runs interview-style qualitative research. VETT runs survey-style quantitative research with per-question distributions.',
        'Frameworks: VETT binds each mission to a named framework (Van Westendorp, MaxDiff, NPS, brand lift). Synthetic Users runs problem exploration, concept testing and custom script interviews.',
        `Buying: VETT is ${SELF_SERVE_RANGE} per mission. Synthetic Users plans start at $12,500 a year, drawn down at $2 to $60 per interview.`,
        'Scale: Synthetic Users interviews can scale to hundreds per study; VETT missions run 5 to 1,250 respondents.',
        'Proof points: Synthetic Users shows clients including TikTok, J.P. Morgan and Samsung, and cites 85-92% synthetic-organic parity in comparison studies. VETT publishes neither yet.',
        'Use Synthetic Users to explore a problem in depth; use VETT to measure a price, a priority or a concept with a named framework.',
      ]}
      whereWeLose="Qualitative depth and published proof: Synthetic Users runs interview-style studies and shows named enterprise clients and a published parity figure. VETT runs survey-style studies and publishes neither yet."
      rows={[
        {
          dimension: 'Research shape',
          vett: 'Quantitative - n=5 to 1,250 per mission, per-question distributions, statistical-shape outputs',
          competitor: 'Interview-style qualitative research - problem exploration, concept testing, custom scripts - scalable to hundreds per study',
          verdict: 'tie',
        },
        {
          dimension: 'Methodology binding',
          vett: 'Named frameworks (Van Westendorp, MaxDiff, NPS, brand lift) with explicit instruments',
          competitor: 'Interview scripts, including custom scripts',
          verdict: 'vett',
        },
        {
          dimension: 'Price',
          vett: `${SELF_SERVE_RANGE} per mission (one-time)`,
          competitor: 'Annual plans from $12,500/year: one token pool, $2 to $60 per interview (a standard-depth interview uses about 10,000 tokens)',
          verdict: 'vett',
        },
        {
          dimension: 'Published proof points',
          vett: 'No named client list or published validation study yet',
          competitor: 'Clients shown include TikTok, J.P. Morgan and Samsung; cites 85-92% synthetic-organic parity in comparison studies',
          verdict: 'competitor',
        },
        {
          dimension: 'Output deliverable',
          vett: 'Branded PDF, PPTX and XLSX exports (CSV and JSON for Creative Attention)',
          competitor: 'Interview-based thematic analysis and insights reports',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`When the question is quantitative - "what is the optimal price point", "which feature should ship first", "how does brand lift compare exposed versus control". When the deliverable needs framework documentation (Van Westendorp price points, MaxDiff utility scores, NPS). When you want exportable charts and tables for a stakeholder deck, bought one study at a time.`}
      whenToUseCompetitor={`When the question is qualitative - "what problems does my user care about", "what is the unmet need behind this purchase". When you want interview-style depth rather than statistical breadth. When a team runs research continuously and an annual plan suits the way it buys.`}
      faqs={[
        {
          q: 'Both are synthetic-respondent platforms. Different jobs?',
          a: 'Yes - same broad category, different research shape. Synthetic Users runs interview-style studies (problem exploration, concept testing, custom scripts). VETT runs quantitative, framework-bound studies (per-question distributions, Van Westendorp, MaxDiff, NPS). Many teams could use both: Synthetic Users to explore the problem, VETT to measure willingness to pay or feature priority.',
        },
      ]}
    />
  );
}
export default VsSyntheticUsersPage;
