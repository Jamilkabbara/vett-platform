import { LegalPage } from '../../components/legal/LegalPage';
import privacyMarkdown from '../../content/legal/privacy-policy.md?raw';

/**
 * Pass 24 Bug 24.03 — /privacy route.
 *
 * Reads the canonical Privacy Policy markdown from
 * src/content/legal/privacy-policy.md (Vite raw import) and renders
 * it through the shared LegalPage layout. Editing the markdown
 * automatically updates the page.
 */
export function PrivacyPolicyPage() {
  return <LegalPage markdown={privacyMarkdown} documentTitle="Privacy Policy" />;
}

export default PrivacyPolicyPage;
