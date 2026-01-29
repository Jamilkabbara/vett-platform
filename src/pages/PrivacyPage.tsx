import { OverlayPage } from '../components/layout/OverlayPage';

export const PrivacyPage = () => {
  return (
    <OverlayPage>
      <div className="max-w-4xl mx-auto">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-white/60 font-bold text-sm uppercase tracking-wider">
            Date Effective: Jan 2026
          </p>
        </div>

          <div className="glass-panel rounded-3xl p-12 border-white/10 bg-background-dark/50">
            <div className="space-y-10 text-white/70 text-base leading-relaxed">
              <section>
                <h2 className="text-2xl font-black text-white mb-4">1. Introduction</h2>
                <p>
                  VETT Inc. ("we," "us," or "our") respects your privacy. This Privacy Policy
                  explains how we collect, use, and protect your personal information when you use
                  our market intelligence platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-white mb-4">2. Data We Collect</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong className="text-white">Account Information:</strong> Email address,
                    name, and billing details (processed by Stripe).
                  </li>
                  <li>
                    <strong className="text-white">Mission Data:</strong> The business ideas and
                    questions you input into VETT.
                  </li>
                  <li>
                    <strong className="text-white">Usage Data:</strong> Device information, IP
                    address, and interaction logs.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-black text-white mb-4">3. How We Use Your Data</h2>
                <p>
                  We use your data to provide AI-generated market insights. Crucially, we do{' '}
                  <strong className="text-white">NOT</strong> sell, share, or expose your
                  proprietary Mission Data to third parties or other users. Your business ideas
                  remain confidential.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-white mb-4">4. Respondent Anonymity</h2>
                <p>
                  Data collected from survey respondents is aggregated and anonymized. While we
                  verify respondent identities to ensure quality, we do not share their Personally
                  Identifiable Information (PII) with you.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-white mb-4">5. Data Security</h2>
                <p>
                  We employ enterprise-grade security measures, including AES-256 encryption at rest
                  and TLS 1.3 encryption in transit. However, no method of transmission over the
                  Internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-white mb-4">
                  6. Your Rights (GDPR & CCPA)
                </h2>
                <p>
                  You have the right to access, correct, or delete your personal data. To exercise
                  these rights ("Right to be Forgotten"), please contact{' '}
                  <a
                    href="mailto:privacy@vettit.ai"
                    className="text-primary hover:underline font-bold"
                  >
                    privacy@vettit.ai
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </div>
      </OverlayPage>
  );
};
