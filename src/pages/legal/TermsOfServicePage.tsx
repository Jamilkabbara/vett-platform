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
// Live-today contract table (flag OFF). Byte-for-byte what /terms shows now.
const PRICING_TABLE_V1 = [
  '| Mission Type | Price |',
  '|---|---|',
  '| Sniff Test (5 respondents) | $9 |',
  '| Validate (10 respondents) | $19 |',
  '| Confidence (50 respondents) | $99 |',
  '| Scale (1,000 respondents) | $899 |',
  '| Premium (5,000 respondents) | $1,990 |',
  '| Creative Attention (per asset) | $19 |',
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
