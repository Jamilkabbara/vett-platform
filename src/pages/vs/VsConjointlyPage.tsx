import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { COUNTRY_COVERAGE, RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';
import { SELF_SERVE_FROM, SELF_SERVE_RANGE } from '../../utils/priceCopy';

/**
 * Pass 35 C3 — VETT vs Conjointly.
 *
 * Conjointly genuinely has peer-reviewed methodology validation
 * (academic publications via UNSW Sydney). State that. VETT does
 * NOT replace Conjointly — VETT runs the same frameworks (Van
 * Westendorp, MaxDiff, NPS) on synthetic respondents, priced from $9
 * tiers, useful for fast iteration before a Conjointly study,
 * not as a substitute for Conjointly's panel-grade output.
 */
export function VsConjointlyPage() {
  return (
    <VsPageTemplate
      competitorName="Conjointly"
      competitorTagline="Mature research platform with real-panel + synthetic options, peer-reviewed methodology validation, mid-market pricing ($200-1000+ per study)."
      vettTagline={`Synthetic-respondent fast iteration on the same frameworks (Van Westendorp, MaxDiff, NPS), ${SELF_SERVE_RANGE} pricing, MENA-rooted, methodology-first.`}
      slug="/vs/conjointly"
      competitorRefUrl="https://conjointly.com/methodology/"
      rows={[
        {
          dimension: 'Respondent type',
          vett: 'Synthetic personas (AI calibrated to demographic patterns)',
          competitor: 'Real-panel (default) + synthetic option (Conjointly Plus)',
          verdict: 'competitor',
        },
        {
          dimension: 'Peer-reviewed methodology validation',
          vett: 'Frameworks themselves are peer-reviewed (VW, MaxDiff, NPS); VETT outputs are simulations of them',
          competitor: 'Yes — academic publications via UNSW Sydney research team',
          verdict: 'competitor',
        },
        {
          dimension: 'Methodology coverage',
          vett: `All ${RESEARCH_TYPES_LABEL} live (validate / pricing / roadmap / brand_lift / CSAT / churn / competitor / naming / marketing / compare / audience_profiling / market_entry / creative_attention / general research)`,
          competitor: 'Conjoint, MaxDiff, BPTO, monadic, claims tests + 10+ specialty designs',
          verdict: 'competitor',
        },
        {
          dimension: 'Turnaround time',
          vett: 'Minutes (5-15 min for smaller studies; scales with respondent count)',
          competitor: 'Hours to days for synthetic; days to weeks for panel',
          verdict: 'vett',
        },
        {
          dimension: 'Entry-tier price',
          vett: '$9 for 5 personas (Sniff Test)',
          competitor: 'Conjointly Plus subscription starts ~$200/month + per-study costs',
          verdict: 'vett',
        },
        {
          dimension: 'Geographic depth',
          vett: `${COUNTRY_COVERAGE}; MENA-calibrated demographics specifically`,
          competitor: '90+ countries via partner panels; deepest in NA + EU + AU',
          verdict: 'tie',
        },
        {
          dimension: 'Stakeholder credibility for board / regulator',
          vett: 'Synthetic-respondent simulation; treat as directional signal',
          competitor: 'Panel-grade documentation + peer-reviewed methodology suitable for boards',
          verdict: 'competitor',
        },
      ]}
      whenToUseVett={`Pre-launch iteration where you want to test 5-10 versions of a concept before committing to one. Naming and messaging exploration where the question is "which lands at all" not "which lands by 3.2 percentage points." Pricing range-finding before a Conjointly study locks in the curves. Early-stage companies pre-product-market-fit with no research budget. MENA-specific work where Conjointly's panel coverage is thinner.`}
      whenToUseCompetitor={`High-stakes decisions that go to a board / IPO prospectus / regulator filing. Pricing studies where the optimal-price-point claim needs to survive cross-examination. Annual brand-tracking with statistical significance requirements. Anything where stakeholders explicitly require panel-grade documentation and peer-reviewed methodology validation. Conjointly's panel quality + academic provenance is the right tool for these.`}
      faqs={[
        {
          q: 'Does VETT replace Conjointly?',
          a: `No. They are complementary. VETT iterates cheaply (${SELF_SERVE_FROM} a round, minutes); Conjointly delivers the panel-grade study you take to the board. Many teams use both: VETT for the cheap pre-test, Conjointly for the locked-in research.`,
        },
        {
          q: 'Conjointly has peer-reviewed methodology. Does VETT?',
          a: 'Conjointly\'s methodology validation comes through academic publications (UNSW Sydney research team). The frameworks VETT uses (Van Westendorp 1976, MaxDiff via Sawtooth, NPS via Reichheld 2003) are themselves peer-reviewed in the academic literature. The synthetic-respondent simulation pipeline is not.',
        },
        {
          q: 'Why is VETT so much cheaper?',
          a: `No panel recruitment cost. Synthetic respondents are AI-generated; the marginal cost is inference spend ($0.50-1.50 per mission). We pass that to customers as entry pricing ${SELF_SERVE_FROM}. Conjointly's real-panel pricing reflects panel acquisition + retention + screening costs that don't exist on our side.`,
        },
      ]}
    />
  );
}
export default VsConjointlyPage;
