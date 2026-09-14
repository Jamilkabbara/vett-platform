import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';
import { SELF_SERVE_FROM, SELF_SERVE_MIN_RESPONDENTS, SELF_SERVE_MIN_USD, SELF_SERVE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs Conjointly.
 *
 * CORRECTED 2026-09-14 against Conjointly's own site. The previous version
 * said Conjointly offered a "synthetic option (Conjointly Plus)" from
 * "~$200/month", cited academic publications "via UNSW Sydney", and put its
 * panel at "90+ countries". None of that holds:
 *   - There is no Conjointly Plus. Plans (conjointly.com/pricing): Basic, no
 *     cost; Professional "$2,895 per team per year"; Ultimate "Starts at
 *     $10,000 per year". Panel responses are paid on top, "Minimum bid of
 *     USD 0.55".
 *   - Conjointly does not sell synthetic respondents and argues against them:
 *     its director's article "Synthetic respondents are the homoeopathy of
 *     market research" ends "Please do not feed the fake data cottage
 *     industry." Claiming it offers them misstated its position.
 *   - No UNSW Sydney publication and no country count could be found on
 *     conjointly.com, so both are gone rather than guessed at.
 *   - Its about page gives its strongest expertise as "product and pricing
 *     research (discrete choice methods / conjoint analysis, Van Westendorp,
 *     Gabor-Granger, monadic concept testing)".
 * The FAQ's figure for VETT's own per-mission inference cost was removed too:
 * it was unverified and it was an internal number.
 */
export function VsConjointlyPage() {
  return (
    <VsPageTemplate
      competitorName="Conjointly"
      competitorTagline="Survey research platform that runs studies on real human respondents, strongest in product and pricing research (conjoint, Van Westendorp, Gabor-Granger, monadic concept tests). Free Basic plan; paid plans from $2,895 per team per year, with panel responses bought on top."
      vettTagline={`Synthetic-respondent research on named frameworks (Van Westendorp, MaxDiff, NPS), ${SELF_SERVE_RANGE} per mission, MENA-rooted, methodology-first. A directional read in minutes, not a panel study.`}
      slug="/vs/conjointly"
      competitorRefUrl="https://conjointly.com/pricing/"
      tldr={[
        'Respondents: Conjointly runs studies on real people from its panels. VETT simulates respondents with AI.',
        'Conjointly does not offer synthetic respondents and has argued publicly against using them, so this is a comparison between two different kinds of evidence, not two versions of one product.',
        'Conjoint: Conjointly is built around discrete choice and conjoint analysis. VETT does not offer conjoint.',
        `Speed: VETT returns a directional read in minutes. Conjointly quotes insights "within days" on its predefined panels.`,
        `Cost shape: VETT is ${SELF_SERVE_RANGE} per mission with no subscription. Conjointly has a free Basic plan and paid plans from $2,895 per team per year, with panel responses bought on top.`,
        'Use VETT to narrow a question cheaply; use Conjointly when the answer has to come from real respondents.',
      ]}
      whereWeLose="Evidence: Conjointly's results come from real people. VETT's are simulated, so for any decision that must rest on measured human responses, Conjointly wins."
      rows={[
        {
          dimension: 'Respondent type',
          vett: 'Synthetic personas, AI-calibrated to demographic patterns',
          competitor: 'Real human respondents from panels (10,000+ predefined panels). Conjointly does not offer synthetic respondents',
          verdict: 'competitor',
        },
        {
          dimension: 'What the result rests on',
          vett: 'Peer-reviewed frameworks (Van Westendorp, MaxDiff, NPS); the simulation that produces VETT results is not peer-reviewed',
          competitor: 'The same kinds of framework, answered by real respondents',
          verdict: 'competitor',
        },
        {
          dimension: 'Methods',
          vett: `${RESEARCH_TYPES_LABEL}: concept tests, Van Westendorp pricing, MaxDiff and Kano, NPS, brand lift, creative attention and more; no conjoint`,
          competitor: 'Strongest in product and pricing research: conjoint (discrete choice), Van Westendorp, Gabor-Granger, monadic concept testing',
          verdict: 'competitor',
        },
        {
          dimension: 'Turnaround',
          vett: 'Minutes (5-15 min for smaller studies; scales with respondent count)',
          competitor: 'Days: Conjointly quotes insights "within days" on its predefined panels',
          verdict: 'vett',
        },
        {
          dimension: 'Price',
          vett: `$${SELF_SERVE_MIN_USD} for ${SELF_SERVE_MIN_RESPONDENTS} personas, up to ${SELF_SERVE_RANGE.split(' to ')[1]}; no subscription, no per-respondent fees`,
          competitor: 'Basic plan at no cost; Professional $2,895 per team per year; Ultimate from $10,000 per year. Panel responses on top, from a $0.55 minimum bid',
          verdict: 'tie',
        },
        {
          dimension: 'Credibility with a board or regulator',
          vett: 'Synthetic-respondent simulation; treat as a directional signal',
          competitor: 'Measured responses from real people',
          verdict: 'competitor',
        },
      ]}
      whenToUseVett={`Pre-launch iteration where you want to test 5-10 versions of a concept before committing to one. Naming and messaging exploration where the question is "which lands at all" not "which lands by 3.2 percentage points." Pricing range-finding before a real-respondent study locks in the curves. Early-stage work with no research budget.`}
      whenToUseCompetitor={`Anything where the answer must come from real people: high-stakes decisions that go to a board, an investor or a regulator. Conjoint analysis, which VETT does not offer. Pricing studies where the optimal price point needs to survive scrutiny.`}
      faqs={[
        {
          q: 'Does VETT replace Conjointly?',
          a: `No. They produce different kinds of evidence. VETT iterates cheaply (${SELF_SERVE_FROM} a round, minutes) on simulated respondents; Conjointly runs the study on real people. A sensible sequence is VETT to narrow the question, then a real-respondent study for the decision.`,
        },
        {
          q: 'Is VETT peer-reviewed?',
          a: 'Not the part that produces the numbers. The frameworks VETT uses (Van Westendorp 1976, MaxDiff via Sawtooth, NPS via Reichheld 2003) are peer-reviewed in the academic literature. The synthetic-respondent simulation that produces VETT results is not. Conjointly runs the same kinds of framework on real respondents, and has argued publicly that synthetic respondents should not be used at all.',
        },
        {
          q: 'How do the costs compare?',
          a: `They are shaped differently. VETT charges per mission, ${SELF_SERVE_RANGE}, with no subscription and no per-respondent fees. Conjointly has a free Basic plan and paid plans from $2,895 per team per year, and panel responses are bought on top, from a $0.55 minimum bid each. Which costs less depends on the study; only Conjointly's side gives you real respondents.`,
        },
      ]}
    />
  );
}
export default VsConjointlyPage;
