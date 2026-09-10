import { useMemo } from 'react';
import { LegalPage } from '../../components/legal/LegalPage';
import termsMarkdown from '../../content/legal/terms-of-service.md?raw';
import { usePricingTiers, type PricingTiersData } from '../../hooks/usePricingTiers';

/**
 * /terms route.
 *
 * Reads the canonical Terms markdown and renders it through LegalPage. The
 * price table replaces the `[[PRICING_TABLE]]` token and is injected from the
 * SINGLE source: usePricingTiers -> GET /api/pricing/tiers, which the backend
 * projects from the same module Stripe charges from. A reprice therefore moves
 * the legal price table with no frontend deploy.
 *
 * This used to carry a PRICING_V2 branch. The flag was deleted in the 2026-09
 * reprice, and with it the branch that would have emitted the table as a GFM
 * pipe table — which this app cannot render, because it mounts react-markdown
 * without remark-gfm. Everything below renders as CommonMark lists.
 */
//
// The respondent-ladder rows are DERIVED from GET /api/pricing/tiers, which is
// projected from the same module Stripe charges from. The constant below is
// the offline fallback for when that fetch fails, and it is the ONLY place in
// this file where a default-ladder price is written by hand.
const RESPONDENT_LADDER_FALLBACK = [
  '- Sniff Test, 5 respondents: $9',
  '- Validate, 25 respondents: $39',
  '- Confidence, 100 respondents: $149',
  '- Deep Dive, 250 respondents: $299',
  '- Scale, 500 respondents: $499',
  '- Growth, 1,000 respondents: $899',
  '- Enterprise, 1,250 respondents: $1,099',
].join('\n');

const PRICING_TABLE_HEAD = [
  '**Respondent-based missions.** Most research types (Validate Product, Compare',
  'Concepts, Test Marketing/Ads, Customer Satisfaction, Pricing Research, Feature',
  'Roadmap, General Research, Competitor Analysis, Audience Profiling, Naming and',
  'Messaging, Market Entry, Churn Research) are priced by respondent count:',
  '',
].join('\n');

const PRICING_TABLE_TAIL = [
  '',
  '- Beyond 1,250 respondents: not sold self-serve; contact us for a custom quote',
  '',
  '**Brand Lift Study missions** use a separate ladder and require a minimum of',
  '100 respondents, the point at which the exposed and control cells can carry a',
  'comparison:',
  '',
  '- Tracker, 200 respondents: $300',
  '- Wave, 500 respondents: $600',
  '- Beyond 1,250 respondents: not sold self-serve; contact us for a custom quote',
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
  'research question beyond the first 10 costs $5, and city targeting,',
  'professional targeting, technographic targeting, financial targeting and',
  'screener questions each add a per-respondent surcharge. The exact total for',
  'your mission is always shown at checkout before you pay.',
].join('\n');

/**
 * The respondent ladder as a CommonMark list.
 *
 * NOT a GFM pipe table: this app mounts react-markdown without remark-gfm, so
 * `| a | b |` renders as literal pipe characters in a paragraph. A previous
 * version of this function emitted a pipe table on one branch, which would have
 * published the legal price table as visible pipes had that branch ever run.
 */
function pricingTableMarkdown(data: PricingTiersData | null): string {
  const rows = data?.tiers?.length
    ? data.tiers
        .map((t) => (t.custom
          ? `- ${t.name}, ${t.respondents.toLocaleString()}+ respondents: custom quote`
          : `- ${t.name}, ${t.respondents.toLocaleString()} respondents: ${t.fromLabel}`))
        .join('\n')
    : RESPONDENT_LADDER_FALLBACK;
  return `${PRICING_TABLE_HEAD}${rows}${PRICING_TABLE_TAIL}`;
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
