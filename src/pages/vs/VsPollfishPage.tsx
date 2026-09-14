import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { COUNTRY_COVERAGE, RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';
import { SELF_SERVE_FROM, SELF_SERVE_RANGE, SELF_SERVE_RATE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs Pollfish.
 *
 * REWRITTEN 2026-09-14 onto the shared template, WITH EVERY POLLFISH CLAIM
 * REMOVED. The standard for these pages is that each statement about a
 * competitor comes from the competitor's own site on the day it was checked.
 * pollfish.com could not be read that day: the TLS handshake to www.pollfish.com
 * timed out from curl, from a web fetcher and from a browser, while
 * typeform.com loaded normally from the same machine as a control, and
 * resources.pollfish.com only redirected back to www.pollfish.com.
 *
 * The previous page's own header said its pricing was never read either
 * ("pollfish.com was returning a TLS error on WebFetch at the time of
 * writing"), yet it published Pollfish supply, pricing-model, coverage and
 * speed claims ("Strong supply in EU + emerging markets", "Pay-as-you-go CPI +
 * minimum spend", "typically a few dollars per completed interview", "Hours;
 * sometimes minutes", "tens of thousands of completes"), plus VETT at "$0.78 to
 * $3.50" per respondent and "Most teams find the directional signal lines up".
 * None of that could be sourced, so none of it is here.
 *
 * When pollfish.com can be read, source Pollfish's prices, panel, coverage and
 * speed from it and restore the competitor side of the table.
 */
const NOT_CHECKED = 'Not stated here: pollfish.com could not be read when this page was checked';

export function VsPollfishPage() {
  return (
    <VsPageTemplate
      competitorName="Pollfish"
      competitorTagline="Pollfish's own site could not be read when this page was last checked, so this page makes no claims about its prices, panel, coverage or speed."
      vettTagline={`Synthetic-respondent research: describe the audience, and VETT simulates respondents and returns results in minutes. ${RESEARCH_TYPES_LABEL}, ${SELF_SERVE_RANGE} per mission, no subscription.`}
      slug="/vs/pollfish"
      checkedOn="14 September 2026"
      sourceNote="Every statement about a competitor on these pages comes from the competitor's own site. pollfish.com could not be reached on 14 September 2026, so the Pollfish side of this page is left blank until it can be checked. For Pollfish's current prices and panel, see pollfish.com."
      tldr={[
        'Respondents: VETT simulates respondents with AI, so there is no one to recruit and no fieldwork.',
        `Price: VETT is ${SELF_SERVE_RANGE} per mission, which works out at ${SELF_SERVE_RATE_RANGE} per respondent, with no subscription.`,
        `Targeting: a free-text audience description and screening questions, plus location, demographic, professional, income and behavioural targeting across ${COUNTRY_COVERAGE}.`,
        'Evidence: VETT results are a directional read, and VETT has not published a study comparing them with real-respondent results.',
        "Pollfish: we could not read Pollfish's site when this page was checked, so it quotes nothing about Pollfish. Check pollfish.com for its current offer.",
        'Use VETT for a fast, cheap directional read; use a real-respondent panel when the decision has to rest on real people.',
      ]}
      whereWeLose="Real respondents: any study answered by real people gives you measured responses. VETT's respondents are simulated, so its results are a directional read."
      rows={[
        {
          dimension: 'Who answers',
          vett: 'Synthetic personas generated to your audience description',
          competitor: NOT_CHECKED,
          verdict: 'tie',
        },
        {
          dimension: 'Time to results',
          vett: 'Minutes; no fieldwork',
          competitor: NOT_CHECKED,
          verdict: 'tie',
        },
        {
          dimension: 'Price',
          vett: `${SELF_SERVE_RANGE} per mission (${SELF_SERVE_RATE_RANGE} per respondent), no subscription`,
          competitor: NOT_CHECKED,
          verdict: 'tie',
        },
        {
          dimension: 'Framework studies',
          vett: `${RESEARCH_TYPES_LABEL}, including Van Westendorp and Gabor-Granger pricing, MaxDiff and Kano, NPS and a brand-lift study`,
          competitor: NOT_CHECKED,
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`You want a directional read in minutes, before paying for real responses. You are still shaping the question and expect to run several versions. You want a framework, such as Van Westendorp pricing or a brand-lift study, set up for you.`}
      whenToUseCompetitor={`The answer has to come from real people. Check pollfish.com for what Pollfish offers today; this page does not describe it.`}
      faqs={[
        {
          q: 'Why does this page say so little about Pollfish?',
          a: "Every statement about a competitor on VETT's comparison pages comes from that competitor's own site, checked on the date shown. pollfish.com could not be reached when this page was checked, so rather than repeat older or second-hand claims, the Pollfish side is left blank until it can be checked.",
        },
        {
          q: 'How much does VETT cost?',
          a: `VETT charges per mission, ${SELF_SERVE_RANGE}, with no subscription. That works out at ${SELF_SERVE_RATE_RANGE} per respondent.`,
        },
        {
          q: 'Are VETT respondents real people?',
          a: 'No. VETT simulates respondents with AI to the audience you describe. Its results are a directional read, and VETT has not published a study comparing them with real-respondent results.',
        },
        {
          q: 'Can I target a specific audience?',
          a: `Yes. You describe the audience in your own words and can add screening questions, plus location, demographic, professional, income and behavioural targeting across ${COUNTRY_COVERAGE}. VETT generates personas to that description rather than filtering a panel.`,
        },
        {
          q: 'Can I run the same study on VETT and a real panel?',
          a: `Yes. A small VETT mission, ${SELF_SERVE_FROM}, before a real-panel study is a cheap way to narrow the question. VETT has not published how often its results agree with real panels, so compare them on your own study.`,
        },
        {
          q: 'Where does VETT lose to a real-respondent panel?',
          a: 'Real respondents. A panel study gives you measured answers from real people, which is what a high-stakes decision should rest on. VETT simulates respondents and gives you a directional read.',
        },
      ]}
    />
  );
}
export default VsPollfishPage;
