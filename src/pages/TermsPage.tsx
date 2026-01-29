import { OverlayPage } from '../components/layout/OverlayPage';

export const TermsPage = () => {
  return (
    <OverlayPage>
      <div className="max-w-4xl mx-auto">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-white/60 font-bold text-sm uppercase tracking-wider">
            Date Effective: Jan 2026
          </p>
        </div>

          <div className="glass-panel rounded-3xl p-12 border-white/10 bg-background-dark/50">
            <div className="space-y-10 text-white/70 text-base leading-relaxed">
              <section>
                <h2 className="text-2xl font-black text-white mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using VETT, you agree to be bound by these Terms. If you do not
                  agree, do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-white mb-4">2. Nature of Services</h2>
                <p className="mb-4">
                  VETT provides AI-driven market intelligence and survey tools.{' '}
                  <strong className="text-white">Disclaimer:</strong> Our insights are for
                  informational purposes only. VETT is not a financial advisor. We are not liable
                  for any business decisions, financial losses, or failures resulting from the use
                  of our data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-white mb-4">3. User Conduct</h2>
                <p className="mb-4">You agree not to use VETT to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Validate illegal products or services.</li>
                  <li>Engage in hate speech, harassment, or discrimination.</li>
                  <li>Attempt to reverse-engineer our AI models or scrape our data.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-black text-white mb-4">4. Intellectual Property</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong className="text-white">Your Data:</strong> You retain full ownership of
                    the business ideas and "Mission Data" you input.
                  </li>
                  <li>
                    <strong className="text-white">Our Platform:</strong> VETT retains all rights
                    to the underlying software, AI models, and design.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-black text-white mb-4">
                  5. Subscriptions & Refunds
                </h2>
                <p className="mb-4">
                  Pro subscriptions are billed monthly. You may cancel at any time.
                </p>
                <p>
                  <strong className="text-white">Refund Policy:</strong> All sales are final. Due
                  to the real-time cost of deploying human respondents, we do not offer refunds
                  once a mission has been launched.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-white mb-4">6. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of the State of Delaware, without regard to
                  its conflict of law principles.
                </p>
              </section>
            </div>
          </div>
        </div>
      </OverlayPage>
  );
};
