import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { COUNTRY_COVERAGE, RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';
import { SELF_SERVE_FROM, SELF_SERVE_RANGE, SELF_SERVE_RATE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs SurveyMonkey.
 *
 * REWRITTEN 2026-09-14 onto the shared template, against SurveyMonkey's own
 * site. What the previous page said, and what was wrong with it:
 *   - SurveyMonkey Audience "~190 countries" and "Days to weeks": its panel page
 *     says "more than 335M+ people in over 130 countries" and results "in as
 *     little as an hour".
 *   - "$1 - $5 (basic) / $10+ (qualified)" and "panels min ~$200": not on
 *     surveymonkey.com. The site says "starting at $1 USD per response".
 *   - VETT at 78 cents to 3.50 dollars per respondent: the ladder gives the range in
 *     SELF_SERVE_RATE_RANGE. "$99 for 50 respondents (Confidence tier)": there
 *     is no 50-respondent tier; Confidence is 100.
 *   - VETT "cross-tabs" and "branching": VETT has neither.
 *   - "~2% of the time" a persona misses the screener: never measured.
 *   - "many of our users" run both, and the VETT signal is "usually
 *     directionally identical to the panel result": no such comparison exists.
 *   - A ChatGPT FAQ ending with a line saying VETT runs on the same AI, which implied a model vendor.
 *   - an API described as on the roadmap: the /api page makes no roadmap promise.
 *
 * What surveymonkey.com says, 2026-09-14:
 *   - /market-research/solutions/audience-panel (redirects to
 *     /product/features/audience-panel): "starting at $1 USD per response",
 *     "more than 335M+ people in over 130 countries, with over 200 targeting
 *     options", "Collect actionable insights in as little as an hour",
 *     "AI-powered bot and fraud detection", "crosstab reports", integrations
 *     "from SPSS to Tableau and Microsoft PowerBI".
 *   - /pricing (served in AED to a UAE visitor): Team Advantage "AED 99 / user
 *     / month", "Starting at 3 users, billed annually", "50,000 responses per
 *     year"; Team Premier "AED 240 / user / month", "100,000 responses per
 *     year", "Crosstabs"; Enterprise "Get a demo". "SurveyMonkey Audience
 *     responses sold separately". "See all 400+ templates".
 *   - /product/integrations: "200+ integrations", naming Salesforce, HubSpot
 *     and Marketo.
 */
export function VsSurveyMonkeyPage() {
  return (
    <VsPageTemplate
      competitorName="SurveyMonkey"
      competitorTagline="Survey platform with 400+ templates and 200+ integrations, plus SurveyMonkey Audience: a panel of 335M+ people in over 130 countries, from $1 USD per response, with results in as little as an hour."
      vettTagline={`Synthetic-respondent research: describe the audience, and VETT simulates respondents and returns results in minutes. ${RESEARCH_TYPES_LABEL}, ${SELF_SERVE_RANGE} per mission, no subscription.`}
      slug="/vs/surveymonkey"
      sources={[
        'https://www.surveymonkey.com/product/features/audience-panel/',
        'https://www.surveymonkey.com/pricing/',
        'https://www.surveymonkey.com/product/integrations/',
      ]}
      checkedOn="14 September 2026"
      sourceNote="SurveyMonkey shows plan prices in the visitor's local currency. The plan prices quoted here are the ones its pricing page showed in UAE dirhams."
      tldr={[
        'Respondents: SurveyMonkey Audience reaches real people, 335M+ in over 130 countries. VETT simulates respondents with AI.',
        'Speed: SurveyMonkey says Audience results can arrive in as little as an hour. VETT returns results in minutes, with no fieldwork.',
        `Price: Audience responses start at $1 USD each, on top of a plan. VETT is ${SELF_SERVE_RANGE} per mission, which works out at ${SELF_SERVE_RATE_RANGE} per respondent.`,
        'Analysis: SurveyMonkey paid plans include AI analysis and thematic analysis, with crosstabs on Team Premier. VETT writes a summary of every study and breaks results down by segment, but has no crosstabs.',
        'Integrations: SurveyMonkey has 200+, including Salesforce, HubSpot and Marketo. VETT exports PDF, PowerPoint and Excel, and has no public API.',
        'Use SurveyMonkey when real people must answer; use VETT for a fast, cheap directional read before you pay for responses.',
      ]}
      whereWeLose="Real respondents and a mature platform: SurveyMonkey Audience surveys real people in over 130 countries, with crosstabs, branching-capable surveys and 200+ integrations. VETT's respondents are simulated, and it has no crosstabs, no branching and no integrations."
      rows={[
        {
          dimension: 'Who answers',
          vett: 'Synthetic personas generated to your audience description',
          competitor: 'Real people from SurveyMonkey Audience: 335M+ in over 130 countries, over 200 targeting options',
          verdict: 'competitor',
        },
        {
          dimension: 'Time to results',
          vett: 'Minutes; no fieldwork',
          competitor: 'Results in as little as an hour',
          verdict: 'vett',
        },
        {
          dimension: 'Price',
          vett: `${SELF_SERVE_RANGE} per mission (${SELF_SERVE_RATE_RANGE} per respondent), no subscription`,
          competitor: 'Audience from $1 USD per response, sold separately from plans; Team Advantage AED 99 per user per month, billed annually, from 3 users',
          verdict: 'tie',
        },
        {
          dimension: 'Targeting',
          vett: `Free-text audience description and screening questions, plus location, demographic, professional, income and behavioural targeting across ${COUNTRY_COVERAGE}`,
          competitor: 'Over 200 targeting options, census balancing and custom screening questions',
          verdict: 'tie',
        },
        {
          dimension: 'Analysis',
          vett: 'Written executive summary, contradictions between answers, segment breakdowns, confidence intervals; no crosstabs',
          competitor: 'AI analysis and thematic analysis on Team Advantage; crosstabs and statistical significance on paid plans',
          verdict: 'tie',
        },
        {
          dimension: 'Integrations',
          vett: 'PDF, PowerPoint and Excel exports; no public API',
          competitor: '200+ integrations, including Salesforce, HubSpot and Marketo; SPSS, Tableau and Power BI',
          verdict: 'competitor',
        },
        {
          dimension: 'Framework studies',
          vett: `${RESEARCH_TYPES_LABEL}, including Van Westendorp and Gabor-Granger pricing, MaxDiff and Kano, NPS and a brand-lift study`,
          competitor: '400+ templates; you design the study',
          verdict: 'vett',
        },
      ]}
      whenToUseVett={`You want a directional read in minutes, before paying for real responses. You are still working out the question, and expect to run several versions. You want a framework, such as Van Westendorp pricing or a brand-lift study, designed for you rather than built from a template.`}
      whenToUseCompetitor={`The answer has to come from real people. You need crosstabs, survey logic or integrations with Salesforce, HubSpot or Marketo. Your team already runs surveys on SurveyMonkey and wants a panel inside the same tool.`}
      faqs={[
        {
          q: 'Can synthetic respondents replace a SurveyMonkey Audience panel?',
          a: 'Not for a decision that has to rest on real people. VETT results come from simulated respondents and are a directional read, and VETT has not published a study comparing its results with real panel results. Use VETT to narrow the question and test versions quickly, then a real panel when the answer matters.',
        },
        {
          q: 'How much does VETT cost compared with SurveyMonkey?',
          a: `SurveyMonkey Audience responses start at $1 USD each and are sold separately from SurveyMonkey plans; in the UAE its pricing page lists Team Advantage at AED 99 per user per month, billed annually, from 3 users. VETT charges per mission, ${SELF_SERVE_RANGE}, with no subscription, which works out at ${SELF_SERVE_RATE_RANGE} per respondent.`,
        },
        {
          q: 'How is VETT different from asking an AI chatbot?',
          a: 'A chatbot gives you one answer to one prompt. VETT builds a set of distinct personas to your audience description, runs each one through every question in the survey, and then reports the answers as a study: distributions per question, segment breakdowns, confidence intervals and a written summary, bound to a research framework where one applies.',
        },
        {
          q: 'What if my screener is very strict?',
          a: 'VETT generates personas to your screening criteria rather than filtering a panel against them, and generates replacements for personas that do not qualify. A real panel filters real people against the same criteria, so a strict screener there means fewer people to reach.',
        },
        {
          q: 'Does VETT have crosstabs or survey logic?',
          a: 'No. VETT breaks results down by segment and shows confidence intervals, but it has no crosstab builder, and its surveys have no branching or skip logic. SurveyMonkey offers crosstabs on paid plans and survey logic in its builder.',
        },
        {
          q: 'Where does VETT lose to SurveyMonkey?',
          a: `Real respondents, analysis tools and integrations. SurveyMonkey Audience surveys real people in over 130 countries, its paid plans add crosstabs and statistical significance, and it has 200+ integrations. VETT's respondents are simulated, ${SELF_SERVE_FROM} a mission, with exports rather than integrations.`,
        },
      ]}
    />
  );
}
export default VsSurveyMonkeyPage;
