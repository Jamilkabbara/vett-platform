import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';
import { SELF_SERVE_FROM, SELF_SERVE_MIN_RESPONDENTS, SELF_SERVE_MIN_USD, SELF_SERVE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs Qualtrics.
 *
 * Written 2026-09-14. Every competitor claim below comes from Qualtrics' own
 * site as it read that day:
 *   - qualtrics.com/free-account: free plan "500 responses", "8 question
 *     types", "3 active surveys/30 questions per survey", "No credit card
 *     required", "No account expiration". Paid comparison column: "Strategic
 *     Research $420/month ($5,040/year)", with a free trial.
 *   - qualtrics.com/pricing: customer experience, employee experience and
 *     market research products, each behind "Request Pricing"; pricing metric
 *     "Interactions" for CX and research, employee count for EX.
 *   - qualtrics.com/strategy/audiences: "Access 200+ global markets through
 *     traditional panels or research-grade synthetic respondents trained on
 *     millions of rows of anonymized and validated survey responses";
 *     "Advanced techniques like Conjoint and MaxDiff run automatically".
 *   - qualtrics.com/edge: Edge Audiences "generates synthetic responses ...
 *     in a matter of minutes".
 *   - Qualtrics support, Synthetic Panels: "Synthetic panels can only be
 *     purchased using subscription credits with Edge Qualtrics Audiences. You
 *     can only purchase these credits from your Account Executive."
 *     "Synthetic panels do not support an incidence rate below 80%." They
 *     "can't answer several question types" (matrix table formats and text
 *     entry on multiple choice among them).
 * Qualtrics' own speed and cost percentages for synthetic research are its
 * marketing claims, not published studies, so they are not repeated here.
 */
export function VsQualtricsPage() {
  return (
    <VsPageTemplate
      competitorName="Qualtrics"
      competitorTagline="Enterprise experience-management platform for customer, employee and market research, with human panels in 200+ markets and synthetic panels through Edge Audiences. Free survey account; Strategic Research at $420/month; most products priced on request."
      vettTagline={`Self-serve synthetic-respondent research on named frameworks (Van Westendorp, MaxDiff, NPS, brand lift), ${SELF_SERVE_RANGE} per mission, no sales call. A directional read in minutes.`}
      slug="/vs/qualtrics"
      competitorRefUrl="https://www.qualtrics.com/free-account/"
      tldr={[
        'Both offer synthetic respondents: Qualtrics through Edge Audiences, VETT as its whole product.',
        'Buying synthetic: Qualtrics synthetic panels are bought with subscription credits from an account executive. VETT is self-serve, with published prices.',
        'Real people: Qualtrics also runs human panels across 200+ markets. VETT has no human panel.',
        'Breadth: Qualtrics covers customer experience, employee experience and market research, with conjoint and MaxDiff built in. VETT does market research only.',
        `Price: Qualtrics has a free survey account and Strategic Research at $420/month; most products are priced on request. VETT is ${SELF_SERVE_RANGE} per mission.`,
        'Use VETT for a quick synthetic study without a contract; use Qualtrics when you need human panels, a research programme or the wider platform.',
      ]}
      whereWeLose="Breadth and real respondents: Qualtrics runs human panels in 200+ markets alongside its synthetic panels, offers conjoint, and covers customer and employee experience too. VETT is synthetic-only market research."
      rows={[
        {
          dimension: 'Respondent type',
          vett: 'Synthetic personas only',
          competitor: 'Both: human panels across 200+ markets, and synthetic panels (Edge Audiences)',
          verdict: 'competitor',
        },
        {
          dimension: 'Getting a synthetic study',
          vett: 'Self-serve: set up a mission and pay at checkout',
          competitor: 'Synthetic panels are bought with subscription credits, only through a Qualtrics account executive',
          verdict: 'vett',
        },
        {
          dimension: 'Published pricing',
          vett: `$${SELF_SERVE_MIN_USD} for ${SELF_SERVE_MIN_RESPONDENTS} personas, up to ${SELF_SERVE_RANGE.split(' to ')[1]}; no subscription`,
          competitor: 'Free survey account (500 responses); Strategic Research $420/month ($5,040/year); customer, employee and market research products priced on request',
          verdict: 'vett',
        },
        {
          dimension: 'Methods',
          vett: `${RESEARCH_TYPES_LABEL}: concept tests, Van Westendorp pricing, MaxDiff, NPS, brand lift, creative attention and more; no conjoint`,
          competitor: 'Conjoint and MaxDiff built in, plus a full survey platform with statistical analysis tools',
          verdict: 'competitor',
        },
        {
          dimension: 'Scope',
          vett: 'Market research only',
          competitor: 'Customer experience, employee experience and market research on one platform',
          verdict: 'competitor',
        },
        {
          dimension: 'Synthetic panel limits',
          vett: 'Survey-style missions designed for synthetic respondents',
          competitor: 'Synthetic panels cannot answer several question types (matrix tables among them) and do not support an incidence rate below 80%',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`You want a synthetic study today without a contract, a sales call or a credit purchase. Early iteration on concepts, names or price bands before a real-respondent study. Small teams with no research platform, buying one study at a known price.`}
      whenToUseCompetitor={`Your organisation already runs research, customer or employee programmes on Qualtrics. You need human panels, or synthetic and human studies from one platform. You need conjoint, or statistical analysis on data you collect yourself. The study needs an enterprise contract and procurement anyway.`}
      faqs={[
        {
          q: 'Qualtrics has synthetic panels too. Why use VETT?',
          a: 'Mainly access and price. Qualtrics synthetic panels are bought with subscription credits through an account executive. VETT is self-serve: you describe the audience, pay a published price and get a directional read in minutes. If you already have Qualtrics and Edge Audiences credits, using them may be simpler.',
        },
        {
          q: 'How much does Qualtrics cost compared with VETT?',
          a: `Qualtrics has a free survey account with 500 responses, and its Strategic Research plan is $420/month ($5,040/year). Its customer experience, employee experience and market research products are priced on request. VETT charges per mission, ${SELF_SERVE_RANGE}, with no subscription.`,
        },
        {
          q: 'Can Qualtrics survey real people?',
          a: 'Yes. Qualtrics runs traditional panels across 200+ markets as well as synthetic panels. VETT has no human panel; every VETT respondent is simulated.',
        },
        {
          q: 'Does VETT offer conjoint?',
          a: 'No. VETT offers Van Westendorp price sensitivity, MaxDiff, NPS, a brand-lift funnel and other frameworks, but not conjoint. Qualtrics runs conjoint and MaxDiff on its platform.',
        },
        {
          q: 'Is the Qualtrics free account enough to replace VETT?',
          a: `They do different jobs. The free Qualtrics account is for building surveys (3 active surveys, 30 questions each, 500 responses), and panel respondents are not among the features it lists. VETT supplies simulated respondents to your audience spec, ${SELF_SERVE_FROM} a mission.`,
        },
        {
          q: 'Where does VETT lose to Qualtrics?',
          a: 'Breadth and real respondents. Qualtrics runs human panels in 200+ markets alongside synthetic panels, offers conjoint and statistical analysis, and covers customer and employee experience as well as market research. VETT is synthetic-only market research.',
        },
      ]}
    />
  );
}
export default VsQualtricsPage;
