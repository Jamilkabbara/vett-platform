import { LegalPage } from '../../components/legal/LegalPage';
import refundMarkdown from '../../content/legal/refund-policy.md?raw';

/**
 * Pass 24 Bug 24.03 — /refunds route.
 *
 * Reads the canonical Refund Policy markdown from
 * src/content/legal/refund-policy.md (Vite raw import) and renders
 * it through the shared LegalPage layout.
 */
export function RefundPolicyPage() {
  return <LegalPage markdown={refundMarkdown} documentTitle="Refund Policy" />;
}

export default RefundPolicyPage;
