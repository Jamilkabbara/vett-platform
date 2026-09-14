import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { COUNTRY_COVERAGE, RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';
import { SELF_SERVE_MIN_RESPONDENTS, SELF_SERVE_MIN_USD, SELF_SERVE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs Yabble.
 *
 * Checked 2026-09-14 against Yabble's own site. Every competitor claim below
 * comes from it:
 *   - yabble.com: "Test your creative ideas using AI personas that react just
 *     like your audience." Tools named: Virtual Audiences (AI personas), Gen
 *     (AI research agent), Count (theming and sentiment on existing open-text
 *     and survey data). Offices in New York (c/o YouGov) and Auckland; backed
 *     by YouGov. "Subscriptions start from only US$800 per month."
 *   - yabble.com/pricing: cheapest plan Tier 0 at "$8,900 USD" billed
 *     "ANNUALLY", no monthly option, described as "less than $800 p/m". Both
 *     prices are stated so a reader does not assume monthly billing exists.
 * Rows that could not be sourced there (regional depth, multi-user workspace,
 * turnaround, a single headquarters) were removed.
 */
export function VsYabblePage() {
  return (
    <VsPageTemplate
      competitorName="Yabble"
      competitorTagline="Generative AI insights platform backed by YouGov: AI personas (Virtual Audiences), an AI research agent (Gen), and theming and sentiment analysis of your existing open-text data (Count). Annual subscriptions from US$8,900."
      vettTagline={`Methodology-first synthetic-respondent platform: ${RESEARCH_TYPES_LABEL} on named frameworks (Van Westendorp, MaxDiff, NPS, brand-health funnel), ${SELF_SERVE_RANGE} per mission, MENA-rooted.`}
      slug="/vs/yabble"
      competitorRefUrl="https://www.yabble.com/pricing"
      tldr={[
        'Both simulate an audience with AI personas: Yabble calls its version Virtual Audiences.',
        'Framework: each VETT mission is bound to a named research framework (Van Westendorp, MaxDiff, NPS and others) with its own results page.',
        `Buying: VETT is pay-per-mission, ${SELF_SERVE_RANGE}, with no subscription. Yabble is an annual subscription from US$8,900 (under US$800/month equivalent).`,
        "Your existing data: Yabble's Count themes and scores sentiment across open-text and survey responses you already have. VETT analyses only the studies it runs.",
        'Backing: Yabble is backed by YouGov.',
        'Use VETT for a one-off, framework-bound study without a subscription; use Yabble if you have a steady flow of open-text data to analyse and a research budget for an annual plan.',
      ]}
      whereWeLose="Analysing data you already have: Yabble themes and scores sentiment across your existing open-text and survey responses. VETT cannot import that data; it only analyses the studies it runs."
      rows={[
        {
          dimension: 'Methodology binding',
          vett: 'Each mission binds to a named framework (Van Westendorp, MaxDiff, NPS, etc.) with framework-specific question generators and results pages',
          competitor: 'AI personas (Virtual Audiences) and an AI research agent (Gen)',
          verdict: 'vett',
        },
        {
          dimension: 'Price',
          vett: `$${SELF_SERVE_MIN_USD} for ${SELF_SERVE_MIN_RESPONDENTS} personas (Sniff Test), pay per mission, no subscription`,
          competitor: 'Annual subscriptions from US$8,900/year (under US$800/month equivalent), billed annually',
          verdict: 'vett',
        },
        {
          dimension: 'Analysing your existing open-text data',
          vett: 'Not supported: VETT analyses only the studies it runs',
          competitor: 'Count: theming and sentiment across existing open-text and survey responses',
          verdict: 'competitor',
        },
        {
          dimension: 'Market coverage',
          vett: `MENA-rooted persona calibration; ${COUNTRY_COVERAGE} supported`,
          competitor: 'Offices in New York and Auckland; backed by YouGov',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`A solo founder or small team with no research budget who wants to test 5-10 concept variants before committing. Methodology-bound studies (Van Westendorp pricing, MaxDiff feature ranking) where you want explicit framework documentation. Pay-per-study work where an annual subscription would not pay for itself. MENA-specific work.`}
      whenToUseCompetitor={`A team with a steady flow of open-text or survey responses to theme and analyse. An organisation with an annual research budget that suits a subscription. Work where YouGov backing matters to the people you report to.`}
      faqs={[
        {
          q: 'Both use AI personas. What is different?',
          a: 'VETT is methodology-first: each mission binds to a named framework (Van Westendorp, MaxDiff, NPS, brand-health funnel) with framework-specific question generators and results pages, bought one mission at a time. Yabble is an annual subscription that pairs AI personas with an AI research agent and analysis of the open-text data you already hold.',
        },
      ]}
    />
  );
}
export default VsYabblePage;
