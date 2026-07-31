import { useMemo } from 'react';
import { LegalPage } from '../../components/legal/LegalPage';
import termsMarkdown from '../../content/legal/terms-of-service.md?raw';
import { usePricingTiers, type PricingTiersData } from '../../hooks/usePricingTiers';

/**
 * /terms route.
 *
 * Reads the canonical Terms markdown and renders it through LegalPage. PR B —
 * the price table is injected from the SINGLE flag-aware source
 * (usePricingTiers -> GET /api/pricing/tiers), replacing the `[[PRICING_TABLE]]`
 * token, so the contract shows V1 today and V2 after the owner flips PRICING_V2,
 * always matching what Stripe charges. No hardcoded prices in the markdown.
 */
function pricingTableMarkdown(data: PricingTiersData | null): string {
  if (!data) return '_Current pricing is published at vettit.ai._';
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
