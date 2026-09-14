import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';
import { MAX_SELF_SERVE_RESPONDENTS, SELF_SERVE_FROM, SELF_SERVE_MIN_RESPONDENTS, SELF_SERVE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs UserTesting.
 *
 * REWRITTEN 2026-09-14 onto the shared template, against UserTesting's own
 * site. What the previous page said, and what was wrong with it:
 *   - "Industry chatter puts a typical enterprise contract in the low-five-
 *     figures", "per-session cost roughly $49-$80": not on usertesting.com.
 *   - "5-30 testers per study is typical": not on usertesting.com.
 *   - UserTesting survey data "Limited": its plans include "Unmoderated tests,
 *     including surveys".
 *   - "Hours to a day" per round: UserTesting says it delivers "80% of sessions
 *     in just a few hours".
 *   - "Native iOS / Android session recording": its mobile page says you can
 *     "test iOS, Android, and TestFlight links" with "full screen recording";
 *     the rows below use its words.
 *   - VETT at 78 cents to 3.50 dollars per respondent, "$99 for 50 respondents
 *     (Confidence tier)", "structured cross-tabs": none of these is true.
 *
 * What usertesting.com says, 2026-09-14:
 *   - /plans: editions Advanced, Ultimate, Ultimate+, each "Request pricing";
 *     "Test-based Consumption" and "Team-based Unlimited" plans; "Unlimited
 *     users across the enterprise (no per-seat charges)". Advanced includes
 *     "AI-generated Insight Summaries", "Global participant panel across 60+
 *     countries", "Unmoderated tests, including surveys, interaction tests, and
 *     think-out-loud", "Moderated, Live Conversation", "Sentiment analysis",
 *     "Integrations with Slack, Teams, Jira, Figma, FigJam, Miro". FAQ: "run a
 *     test for free now and receive a video of a real person reviewing your
 *     website, typically in less than an hour"; "the price for each plan varies
 *     depending on the number of users, types, and features". "deliver 80% of
 *     sessions in just a few hours". "3,000+ customers, including 75 of the
 *     Fortune 100".
 *   - /solutions/mobile-testing: "test iOS, Android, and TestFlight links",
 *     "full screen recording", "Just upload your IPA or APK files".
 */
export function VsUserTestingPage() {
  return (
    <VsPageTemplate
      competitorName="UserTesting"
      competitorTagline="Human insight platform: recorded think-out-loud and moderated sessions, interaction tests and surveys with real participants from a panel across 60+ countries, including mobile app testing. Plans priced on request."
      vettTagline={`Synthetic-respondent research: describe the audience, and VETT simulates respondents answering a survey and returns results in minutes. ${RESEARCH_TYPES_LABEL}, ${SELF_SERVE_RANGE} per mission.`}
      slug="/vs/usertesting"
      sources={[
        'https://www.usertesting.com/plans',
        'https://www.usertesting.com/solutions/mobile-testing',
      ]}
      checkedOn="14 September 2026"
      tldr={[
        'Different jobs: UserTesting shows you real people using your website, app or prototype. VETT asks simulated respondents survey questions about a concept, price or message.',
        'Respondents: UserTesting uses real participants from a panel across 60+ countries. VETT simulates respondents with AI.',
        'Video: UserTesting records sessions, including full screen recording on mobile. VETT produces no video of anyone using anything.',
        `Price: UserTesting plans are priced on request by users, test types and features. VETT is ${SELF_SERVE_RANGE} per mission, paid at checkout.`,
        'Speed: UserTesting says it delivers 80% of sessions in a few hours. VETT returns results in minutes.',
        'Use UserTesting to watch real people use a product; use VETT to test whether a concept, price or message lands before you build.',
      ]}
      whereWeLose="Watching real people: UserTesting records real participants using your website, app or prototype, on desktop and mobile. VETT cannot show you anyone using anything; it simulates survey answers."
      rows={[
        {
          dimension: 'What you get',
          vett: 'Survey results from simulated respondents, with a written summary and segment breakdowns',
          competitor: 'Recorded think-out-loud and moderated sessions, interaction tests, surveys, transcripts and AI-generated insight summaries',
          verdict: 'tie',
        },
        {
          dimension: 'Who takes part',
          vett: 'Synthetic personas generated to your audience description',
          competitor: 'Real participants from a global panel across 60+ countries',
          verdict: 'competitor',
        },
        {
          dimension: 'Usability and mobile app testing',
          vett: 'Not offered',
          competitor: 'Tests on websites, prototypes, and iOS, Android and TestFlight apps with full screen recording',
          verdict: 'competitor',
        },
        {
          dimension: 'Time to results',
          vett: 'Minutes',
          competitor: '80% of sessions delivered in a few hours; a free test video typically in less than an hour',
          verdict: 'vett',
        },
        {
          dimension: 'Price',
          vett: `${SELF_SERVE_RANGE} per mission, paid at checkout`,
          competitor: 'Advanced, Ultimate and Ultimate+ editions, each priced on request; unlimited users with no per-seat charges',
          verdict: 'vett',
        },
        {
          dimension: 'Study size',
          vett: `${SELF_SERVE_MIN_RESPONDENTS} to ${MAX_SELF_SERVE_RESPONDENTS.toLocaleString('en-US')} respondents per mission`,
          competitor: 'Not stated on the plans page',
          verdict: 'tie',
        },
        {
          dimension: 'Framework studies',
          vett: `${RESEARCH_TYPES_LABEL}, including Van Westendorp and Gabor-Granger pricing, MaxDiff and Kano, NPS and a brand-lift study`,
          competitor: 'Card sorting and tree testing on Ultimate; test templates',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`You do not have a product to test yet, only a concept, a price or a message. You want a survey-style answer from a target audience in minutes, several times over, before building. You want a framework such as Van Westendorp pricing or MaxDiff feature ranking.`}
      whenToUseCompetitor={`You have a website, app or prototype and need to see real people use it. You are testing a mobile app, including unreleased builds. You need recordings and quotes from real users for a stakeholder review. Your organisation buys research on an annual plan.`}
      faqs={[
        {
          q: 'Is VETT an alternative to UserTesting?',
          a: 'Mostly not. UserTesting shows you real people using your website, app or prototype, with recordings, transcripts and interaction tests. VETT asks simulated respondents survey questions about a concept, a price or a message. If you need to see where a checkout flow breaks, use UserTesting. If you want to know whether an idea appeals to a target audience before you build it, VETT is built for that.',
        },
        {
          q: 'Can VETT do usability or mobile app testing?',
          a: 'No. VETT produces no recording of anyone, real or simulated, using a product. UserTesting tests websites, prototypes and iOS, Android and TestFlight apps with full screen recording.',
        },
        {
          q: 'How much does UserTesting cost compared with VETT?',
          a: `UserTesting does not publish prices. Its plans page says the price varies with the number of users, test types and features, and every edition is priced on request; it also offers a free test. VETT charges per mission, ${SELF_SERVE_RANGE}, paid at checkout.`,
        },
        {
          q: 'Does UserTesting run surveys too?',
          a: 'Yes. Its plans include unmoderated tests covering surveys, interaction tests and think-out-loud sessions, with real participants. The difference is who answers: UserTesting surveys real people, and VETT simulates the respondents.',
        },
        {
          q: 'Can I use both?',
          a: `Yes, at different stages. VETT, ${SELF_SERVE_FROM} a mission, can test whether a concept or message appeals before there is anything to use. UserTesting can then show real people using the product you built. VETT has not published a study comparing its results with real participants, so treat a VETT result as a directional read.`,
        },
        {
          q: 'Where does VETT lose to UserTesting?',
          a: 'Real people and real products. UserTesting records real participants from a panel across 60+ countries using your website, app or prototype, and gives you transcripts, sentiment analysis and AI summaries. VETT simulates respondents and cannot test a product at all.',
        },
      ]}
    />
  );
}
export default VsUserTestingPage;
