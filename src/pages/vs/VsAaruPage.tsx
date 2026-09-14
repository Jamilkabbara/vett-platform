import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { SELF_SERVE_RANGE } from '../../utils/priceCopy';
import { COUNTRY_COVERAGE, RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';

/**
 * VETT vs Aaru.
 *
 * REWRITTEN 2026-09-14. This page used to present Aaru as an academic,
 * policy-modelling and election-forecasting platform - "a different target
 * use case than commercial market research", so not really a competitor. That
 * is no longer how Aaru describes itself. Its homepage, checked on 2026-09-14:
 *
 *   "Simulate what people will do before you decide."
 *   "Test a product, price, message, or strategy on the populations that
 *    matter to your business - then predict the outcome before you commit."
 *
 * which is the job VETT does. Every competitor claim below is taken from
 * https://aaru.com as it read that day; rows we could not source from Aaru's
 * own site were dropped rather than estimated. Aaru's homepage makes no
 * mention of politics, elections or public policy, and shows no pricing.
 */
export function VsAaruPage() {
  return (
    <VsPageTemplate
      competitorName="Aaru"
      competitorTagline="Simulation platform that builds simulated populations grounded in real-world behavior and outcomes, to test a product, price, message or strategy before a decision. Engaged through a contact form; pricing is not published."
      vettTagline={`Self-serve synthetic-respondent research - pricing, feature priority, brand lift, creative attention. Methodology-first, ${SELF_SERVE_RANGE} per mission.`}
      slug="/vs/aaru"
      competitorRefUrl="https://www.aaru.com/"
      tldr={[
        'Same job: Aaru and VETT both simulate how people will respond, to test a product, price, message or strategy before a decision.',
        `Buying: VETT is self-serve with published prices, ${SELF_SERVE_RANGE} per mission. Aaru works through a contact form and publishes no pricing.`,
        'Evidence: Aaru publishes an EY case study reporting a 0.90 median correlation against six months of real wealth research. VETT has published no validation study yet.',
        'Frameworks: most VETT research types are bound to a named framework (Van Westendorp, MaxDiff, NPS, brand lift). Aaru does not describe a framework per study on its site.',
        "Where Aaru's published work sits: wealth research, capital markets and home goods.",
        'Use VETT to run a study yourself today at a known price; use Aaru for a commissioned, high-stakes simulation where published correlation with real outcomes matters.',
      ]}
      whereWeLose="Published evidence: Aaru shows an EY case study reporting a 0.90 median correlation with real research, and named clients. VETT has published neither yet."
      rows={[
        {
          dimension: 'What it is for',
          vett: 'Commercial market research: pricing, concept tests, feature priority, brand lift, creative attention',
          competitor: 'Testing a product, price, message or strategy on the populations that matter to a business, before committing',
          verdict: 'tie',
        },
        {
          dimension: 'How you buy it',
          vett: `Self-serve. Published prices, ${SELF_SERVE_RANGE} per mission, paid at checkout`,
          competitor: 'Through a contact form. No self-serve signup and no published pricing on aaru.com',
          verdict: 'vett',
        },
        {
          dimension: 'Published evidence against real outcomes',
          vett: 'The research frameworks are peer-reviewed; VETT results are a directional read, and no validation study against real outcomes is published yet',
          competitor: 'Publishes an EY case study recreating six months of global wealth research in one day, reporting a 0.90 median correlation',
          verdict: 'competitor',
        },
        {
          dimension: 'Published case studies',
          vett: 'None published yet',
          competitor: 'EY (wealth research) and Breakwater (a quarterly tracker of 71 judgments across 40,000 simulated investors)',
          verdict: 'competitor',
        },
        {
          dimension: 'Research framework per study',
          vett: `${RESEARCH_TYPES_LABEL}, most built on a named framework (Van Westendorp, MaxDiff, NPS, brand lift) with framework-specific results`,
          competitor: 'Not described on aaru.com',
          verdict: 'vett',
        },
        {
          dimension: 'Market coverage',
          vett: `Persona calibration tuned for MENA, targeting across ${COUNTRY_COVERAGE}`,
          competitor: 'Not stated on aaru.com; named work covers wealth research, capital markets and home goods',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`You want to run the study yourself, today, at a published price. Pricing a subscription, ranking a feature roadmap, testing an ad before media spend, measuring brand awareness before and after a campaign. You want the result bound to a named research framework, with exportable reports for a product or marketing team. MENA-specific work.`}
      whenToUseCompetitor={`A high-stakes decision where you would rather commission a simulation than run one, and published evidence of correlation with real outcomes matters to the people you report to - as in Aaru's EY wealth-research case study. Financial-services work, where Aaru's published case studies sit.`}
      faqs={[
        {
          q: 'Aaru and VETT both simulate people. Are they competitors?',
          a: `Yes. Aaru describes its platform as a way to simulate what people will do before you decide, and to test a product, price, message or strategy on the populations that matter to your business. That is the same job VETT does. The differences are in how you buy it and what evidence is published. VETT is self-serve, with published prices from ${SELF_SERVE_RANGE.split(' to ')[0]} per mission and a named research framework behind most studies. Aaru works through a contact form, does not publish pricing, and publishes case studies, including one in which EY reports a 0.90 median correlation against six months of wealth research.`,
        },
      ]}
    />
  );
}
export default VsAaruPage;
