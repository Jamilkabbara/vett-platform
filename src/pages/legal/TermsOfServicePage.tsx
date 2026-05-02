import { LegalPage } from '../../components/legal/LegalPage';
import termsMarkdown from '../../content/legal/terms-of-service.md?raw';

/**
 * Pass 24 Bug 24.03 — /terms route.
 *
 * Reads the canonical Terms of Service markdown from
 * src/content/legal/terms-of-service.md (Vite raw import) and renders
 * it through the shared LegalPage layout.
 */
export function TermsOfServicePage() {
  return <LegalPage markdown={termsMarkdown} documentTitle="Terms of Service" />;
}

export default TermsOfServicePage;
