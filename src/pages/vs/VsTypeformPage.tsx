import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';
import { CREATIVE_ATTENTION_RANGE, SELF_SERVE_FROM, SELF_SERVE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs Typeform.
 *
 * REWRITTEN 2026-09-14 onto the shared template, against Typeform's own site.
 * The previous page had gone stale in ways that mattered:
 *   - It said Typeform users "bring your own audience" and that Typeform had
 *     "not a research-synthesis layer". Typeform now sells Research Flow:
 *     "Recruit and screen participants with built-in panel access",
 *     "AI-moderated research studies", "AI-powered analysis and insight
 *     generation" (typeform.com/pricing, typeform.com/research-flow).
 *   - "annual saves ~17%": the pricing page says "Yearly (Save 30%)".
 *   - "800+ form templates": no template count appears on typeform.com.
 *   - VETT claims that were false: branching / logic jumps (VETT has no
 *     branching or skip logic), an API "on the roadmap" (the /api page says
 *     there is no public API and makes no roadmap promise), "$99 for 50
 *     respondents (Confidence tier)" (Confidence is 100 respondents), and
 *     "Most teams find the manual port takes 5-10 minutes" (never measured).
 *
 * What typeform.com says, 2026-09-14:
 *   - /pricing: Basic "39 USD / mo", "100 responses/mo included", "1 user";
 *     Plus "79 USD / mo", "1,000 responses/mo", "3 users"; Business "129 USD /
 *     mo", "10,000 responses/mo", "5 users"; "Yearly (Save 30%)"; Growth Flow
 *     "379 USD /mo"; Talent "169 USD / mo"; Enterprise "Contact sales".
 *     Research Flow: "Contact sales", "Recruit and screen participants with
 *     built-in panel access", "Moderated and unmoderated video research",
 *     "AI-powered analysis and insight generation". Integrations: "over 500
 *     services through Zapier", HubSpot, Google Sheets, Airtable; Salesforce
 *     integration listed on Growth Flow.
 *   - /research-flow: "Research Flow supports multiple ways to source
 *     participants, including access to a verified panel as well as your own
 *     audience." "Studies can be designed and launched in minutes, with
 *     insights generated in hours as responses come in."
 */
export function VsTypeformPage() {
  return (
    <VsPageTemplate
      competitorName="Typeform"
      competitorTagline="Form and survey builder for the audience you already have, with plans from 39 USD a month. Its newer Research Flow adds a verified participant panel, AI-moderated studies and AI analysis, sold through sales."
      vettTagline={`Synthetic-respondent research: describe the audience, and VETT simulates respondents and returns results in minutes. ${RESEARCH_TYPES_LABEL}, ${SELF_SERVE_RANGE} per mission, no subscription.`}
      slug="/vs/typeform"
      sources={[
        'https://www.typeform.com/pricing',
        'https://www.typeform.com/research-flow',
      ]}
      checkedOn="14 September 2026"
      tldr={[
        'Forms: Typeform is a form and survey builder. VETT is not; you do not design a form for people to fill in.',
        'Respondents: on its core plans you send a Typeform to your own audience. Research Flow adds a verified panel. VETT simulates respondents with AI, so there is no one to recruit.',
        `Price: Typeform plans run 39, 79 and 129 USD a month (30% less billed yearly) for 100, 1,000 and 10,000 responses. VETT is ${SELF_SERVE_RANGE} per mission with no subscription.`,
        'Speed: Typeform says Research Flow insights arrive in hours as responses come in. VETT returns results in minutes because the respondents are simulated.',
        'Connections: Typeform connects to over 500 services through Zapier, plus HubSpot and Google Sheets. VETT exports PDF, PowerPoint and Excel, and has no public API.',
        'Use Typeform when real people must answer your form; use VETT for a fast directional read when you have no audience to ask.',
      ]}
      whereWeLose="Real respondents and integrations: Typeform collects answers from real people, your own audience or its Research Flow panel, and connects to over 500 services. VETT's respondents are simulated and it exports files instead of integrating."
      rows={[
        {
          dimension: 'Who answers',
          vett: 'Synthetic personas generated to your audience description',
          competitor: 'Your own audience on core plans; Research Flow adds a verified panel',
          verdict: 'competitor',
        },
        {
          dimension: 'Time to results',
          vett: 'Minutes; no fieldwork',
          competitor: 'Research Flow: launched in minutes, insights in hours as responses come in',
          verdict: 'vett',
        },
        {
          dimension: 'Price',
          vett: `${SELF_SERVE_RANGE} per mission, no subscription`,
          competitor: 'Basic 39, Plus 79, Business 129 USD a month (100, 1,000 and 10,000 responses); 30% less yearly; Research Flow through sales',
          verdict: 'tie',
        },
        {
          dimension: 'Survey building',
          vett: 'Single choice, multiple choice, rating, opinion and open-text questions, plus screening questions; no branching or skip logic',
          competitor: 'A full form builder with logic to connect, skip and rearrange questions, scores and calculations, video questions',
          verdict: 'competitor',
        },
        {
          dimension: 'Analysis',
          vett: 'Written executive summary, contradictions between answers, segment breakdowns and confidence intervals on every study',
          competitor: 'Research Flow: AI-generated summaries, themes, sentiment and highlight reels',
          verdict: 'tie',
        },
        {
          dimension: 'Integrations',
          vett: 'PDF, PowerPoint and Excel exports; no public API',
          competitor: 'Over 500 services through Zapier; HubSpot, Google Sheets, Airtable; Salesforce on Growth Flow',
          verdict: 'competitor',
        },
        {
          dimension: 'Framework studies',
          vett: `${RESEARCH_TYPES_LABEL}, including Van Westendorp pricing, MaxDiff, a brand-lift study and Creative Attention (${CREATIVE_ATTENTION_RANGE} per creative)`,
          competitor: 'Templates for forms, surveys and quizzes; Research Flow covers concept and messaging tests, usage and attitudes, brand perception',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`You have no audience to send a form to yet: pre-launch, a new market, a new customer segment. You want a directional read in minutes, several times over, before paying for real responses. You want a named framework, such as Van Westendorp pricing or a brand-lift study, set up for you.`}
      whenToUseCompetitor={`Real people have to answer: your customers, leads or employees. You need a form that converts on your website or in an email. Your workflow runs through Zapier, HubSpot or Salesforce. You want AI-moderated studies with a verified panel and can buy through sales.`}
      faqs={[
        {
          q: 'Can Typeform recruit respondents for me?',
          a: 'Through Research Flow, yes. Typeform says Research Flow supports a verified panel as well as your own audience, with screening on your criteria, and it is sold through sales. On its core plans you share the form with an audience you already have. VETT does not recruit anyone: it simulates respondents to the audience you describe.',
        },
        {
          q: 'How much does VETT cost compared with Typeform?',
          a: `Typeform's core plans are 39, 79 and 129 USD a month for 100, 1,000 and 10,000 responses, and 30% less billed yearly; Research Flow is priced through sales. VETT charges per mission, ${SELF_SERVE_RANGE}, with no subscription. They are priced for different jobs: Typeform for collecting responses from real people every month, VETT for one simulated study at a time.`,
        },
        {
          q: 'Does VETT support branching or skip logic like Typeform?',
          a: 'No. VETT supports single choice, multiple choice, rating, opinion and open-text questions, plus screening questions that decide who qualifies, but no branching or skip logic. Every qualified respondent answers every question. If your survey depends on logic jumps, Typeform is the better tool.',
        },
        {
          q: 'Can I import a Typeform into VETT?',
          a: 'No. There is no import and no public VETT API. You would copy the questions into a new VETT mission by hand.',
        },
        {
          q: 'Are VETT results as reliable as real Typeform responses?',
          a: `No, and they are not meant to be. VETT results come from simulated respondents and are a directional read. VETT has not published a study comparing its results with real responses. Use VETT, ${SELF_SERVE_FROM} a mission, to narrow a question quickly, and real respondents when the decision has to rest on them.`,
        },
        {
          q: 'Where does VETT lose to Typeform?',
          a: 'Real respondents, form design and integrations. Typeform collects answers from real people, has a full form builder with logic, and connects to over 500 services through Zapier. VETT simulates respondents, has no branching, and exports files rather than integrating.',
        },
      ]}
    />
  );
}
export default VsTypeformPage;
