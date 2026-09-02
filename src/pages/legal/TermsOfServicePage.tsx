import { useMemo } from 'react';
import { LegalPage } from '../../components/legal/LegalPage';
import termsMarkdown from '../../content/legal/terms-of-service.md?raw';
import { usePricingTiers, type PricingTiersData } from '../../hooks/usePricingTiers';

/**
 * /terms route.
 *
 * Reads the canonical Terms markdown and renders it through LegalPage. The
 * price table replaces the `[[PRICING_TABLE]]` token and is FLAG-AWARE:
 *   - PRICING_V2 OFF (default, or endpoint unavailable): the live-today contract
 *     table renders verbatim, so the Terms page is a no-op until the cutover.
 *   - PRICING_V2 ON: the table is injected from the SINGLE source
 *     (usePricingTiers -> GET /api/pricing/tiers), always matching what Stripe
 *     charges. The flip needs no frontend deploy.
 */
// Live-today contract copy (flag OFF). Every price below is the amount the
// billing engine (backend src/utils/pricingEngine.js) actually charges at that
// respondent count, re-derived by executing calculateMissionPrice.
//
// Rendered as CommonMark lists, NOT a GFM pipe table: this app mounts
// react-markdown without remark-gfm, so a `| a | b |` table renders as literal
// pipe characters in a paragraph. Lists render correctly with no new dependency.
const PRICING_TABLE_V1 = [
  '**Respondent-based missions.** Most research types (Validate Product, Compare',
  'Concepts, Test Marketing/Ads, Customer Satisfaction, Pricing Research, Feature',
  'Roadmap, General Research, Competitor Analysis, Audience Profiling, Naming and',
  'Messaging, Market Entry, Churn Research) are priced by respondent count:',
  '',
  '- Sniff Test, 5 respondents: $9',
  '- Validate, 10 respondents: $35',
  '- Confidence, 50 respondents: $99',
  '- Deep Dive, 250 respondents: $300',
  '- Scale, 1,000 respondents: $900',
  '- Beyond 1,250 respondents: not sold self-serve; contact us for a custom quote',
  '',
  '**Brand Lift Study missions** use a separate ladder and require a minimum of',
  '50 respondents:',
  '',
  '- Pulse, 50 respondents: $99',
  '- Tracker, 200 respondents: $300',
  '- Wave, 500 respondents: $600',
  '- Enterprise, 2,000 respondents: $1,500',
  '',
  '**Creative Attention Analysis missions** are charged a flat price for the',
  'respondent bracket the mission falls into:',
  '',
  '- Up to 10 respondents: $19',
  '- 11 to 25 respondents: $39',
  '- 26 to 50 respondents: $69',
  '- 51 to 100 respondents: $129',
  '- 101 or more respondents: $299',
  '',
  'Respondent counts other than the ones listed above are priced from the same',
  'ladders. Optional add-ons are charged on top of the mission price: each',
  'research question beyond the first 5 costs $20, and city targeting,',
  'professional targeting, technographic targeting, financial targeting and',
  'screener questions each add a per-respondent surcharge. The exact total for',
  'your mission is always shown at checkout before you pay.',
].join('\n');

function pricingTableMarkdown(data: PricingTiersData | null): string {
  // Flag off / not yet deployed / fetch failed => the live-today table.
  if (!data || data.flagActive !== true) return PRICING_TABLE_V1;
  const rows = data.tiers.map((t) => {
    const resp = t.custom ? `${t.respondents.toLocaleString()}+` : t.respondents.toLocaleString();
    return `| ${t.name} | ${resp} | ${t.fromLabel} |`;
  }).join('\n');
  return `| Tier | Respondents | Price |\n|---|---|---|\n${rows}`;
}

export function TermsOfServicePage() {
  const pricing = usePricingTiers();
  const markdown = useMemo(
    () => termsMarkdown.replace('[[PRICING_TABLE]]', pricingTableMarkdown(pricing.data)),
    [pricing.data],
  );
  return <LegalPage markdown={markdown} documentTitle="Terms of Service" />;
}

export default TermsOfServicePage;
