import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';
import { SELF_SERVE_FROM, SELF_SERVE_MIN_RESPONDENTS, SELF_SERVE_MIN_USD, SELF_SERVE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs Attest.
 *
 * Written 2026-09-14. Every competitor claim below comes from Attest's own
 * site as it read that day:
 *   - askattest.com/pricing: plans Basic ("Up to 50,000 credits"), Standard
 *     ("Up to 100,000 credits"), Elite ("Up to 200,000 credits") and Custom
 *     ("Over 400,000+ credits"), each behind "Book a demo" with no price shown.
 *     "we count a credit as an answer to one survey question from one person.
 *     Eg. a 10 question survey to 500 people would equal 5,000 credits."
 *     Every plan: "A designated research expert", "Access to our global
 *     multi-panel audience across 59 countries, supporting 70+ languages",
 *     "One flat audience fee, no matter who or where your audience is",
 *     "Unlimited seats". "150M+ consumers".
 *   - askattest.com: Attest Measure (quantitative research), Attest Explore
 *     ("AI-moderated interviews"), Compass co-pilot. "bot-eliminating quality
 *     checks - backed by human reviews".
 *   - askattest.com/new-product-development: "Surveys launch in minutes and
 *     return results in hours ... AI-moderated interviews return findings in
 *     days."
 *   - Attest blog, 24 June 2026, "Not just faster, better": synthetic
 *     audiences are among developments "we are excited to explore", with "a
 *     little caution". Nothing on the site offers synthetic respondents.
 * Not used, because the site does not state them in text: client names (the
 * homepage shows logos only) and any price.
 */
export function VsAttestPage() {
  return (
    <VsPageTemplate
      competitorName="Attest"
      competitorTagline="Consumer research platform that surveys real consumers through a multi-panel audience across 59 countries, with AI-moderated interviews (Attest Explore) and an AI research assistant (Compass). Credit-based plans; prices are not published."
      vettTagline={`Synthetic-respondent research on named frameworks (Van Westendorp, MaxDiff, NPS, brand lift), ${SELF_SERVE_RANGE} per mission, self-serve. A directional read in minutes, not a panel study.`}
      slug="/vs/attest"
      competitorRefUrl="https://www.askattest.com/pricing"
      tldr={[
        'Respondents: Attest surveys real consumers, 150M+ across 59 countries. VETT simulates respondents with AI.',
        'Synthetic: Attest\'s site does not offer synthetic respondents. In June 2026 it wrote that synthetic audiences are something it is excited to explore, with caution.',
        'Speed: Attest says surveys return results in hours. VETT returns a directional read in minutes.',
        `Buying: Attest plans are sized in credits (one answer to one question from one person) and priced after a demo. VETT publishes its prices: ${SELF_SERVE_RANGE} per mission, paid at checkout.`,
        'Support: every Attest plan includes a designated research expert. VETT is self-serve.',
        'Use VETT to narrow a question cheaply and quickly; use Attest when real consumers have to answer.',
      ]}
      whereWeLose="Real consumers and research support: Attest's results come from real people in 59 countries, and every plan includes a designated research expert. VETT's respondents are simulated, and there is no research expert assigned to you."
      rows={[
        {
          dimension: 'Respondent type',
          vett: 'Synthetic personas, AI-calibrated to your audience spec',
          competitor: 'Real consumers from a global multi-panel audience: 150M+ consumers across 59 countries, 70+ languages',
          verdict: 'competitor',
        },
        {
          dimension: 'Turnaround',
          vett: 'Minutes (5-15 min for smaller studies; scales with respondent count)',
          competitor: 'Surveys launch in minutes and return results in hours; AI-moderated interviews return findings in days',
          verdict: 'vett',
        },
        {
          dimension: 'Published pricing',
          vett: `$${SELF_SERVE_MIN_USD} for ${SELF_SERVE_MIN_RESPONDENTS} personas, up to ${SELF_SERVE_RANGE.split(' to ')[1]}; no subscription, paid at checkout`,
          competitor: 'Not published. Plans are sized in credits (Basic up to 50,000; Standard up to 100,000; Elite up to 200,000; Custom 400,000+) and quoted after a demo',
          verdict: 'vett',
        },
        {
          dimension: 'Research support',
          vett: 'Self-serve; results come with an AI-written synthesis',
          competitor: 'A designated research expert and a human customer success team on every plan',
          verdict: 'competitor',
        },
        {
          dimension: 'Interviews',
          vett: 'Survey-style studies only',
          competitor: 'Attest Explore: AI-moderated interviews with real consumers',
          verdict: 'competitor',
        },
        {
          dimension: 'Research uses',
          vett: `${RESEARCH_TYPES_LABEL}: concept tests, Van Westendorp pricing, MaxDiff, NPS, brand lift, creative attention and more`,
          competitor: 'Brand and campaign tracking, concept testing, consumer profiling, creative testing',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`Early iteration where you want to test several versions of a concept, name or price band before paying for real fieldwork. Questions you need answered in minutes rather than hours. Teams without a research subscription who want to buy one study at a known price.`}
      whenToUseCompetitor={`Anything where the answer must come from real consumers: a launch decision, a board paper, a tracker you will run for years. Studies across Attest's 59 countries where measured responses matter. Teams that want a research expert assigned to them, or AI-moderated interviews with real people.`}
      faqs={[
        {
          q: 'Does VETT replace Attest?',
          a: `No. They produce different kinds of evidence. VETT simulates respondents and returns a directional read in minutes, ${SELF_SERVE_FROM} a mission. Attest surveys real consumers and returns results in hours. A sensible sequence is VETT to narrow the question, then Attest to measure it on real people.`,
        },
        {
          q: 'How do the costs compare?',
          a: `Attest does not publish prices. Its plans are sized in credits, where one credit is one answer to one question from one person, so a 10-question survey to 500 people uses 5,000 credits; the price is quoted after a demo. VETT charges per mission, ${SELF_SERVE_RANGE}, with no subscription.`,
        },
        {
          q: 'Does Attest offer synthetic respondents?',
          a: 'Not on its site today. Attest describes a panel of real consumers, and in a June 2026 post it said synthetic audiences are something it is excited to explore, with caution. If you want simulated respondents, that is what VETT does; if you want real ones, Attest is the right tool.',
        },
        {
          q: 'Which is faster?',
          a: 'VETT, because there is no fieldwork: a directional read comes back in minutes. Attest says its surveys launch in minutes and return results in hours, and its AI-moderated interviews return findings in days.',
        },
        {
          q: 'Does VETT give me a research expert?',
          a: 'No. VETT is self-serve: you set up the mission and get the results with an AI-written synthesis. Every Attest plan includes a designated research expert and a human customer success team.',
        },
        {
          q: 'Where does VETT lose to Attest?',
          a: "Evidence and support. Attest's results come from real consumers in 59 countries, it runs AI-moderated interviews with real people, and it assigns a research expert. VETT's respondents are simulated, it runs survey-style studies only, and it is self-serve.",
        },
      ]}
    />
  );
}
export default VsAttestPage;
