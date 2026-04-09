import { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { AuthModal } from '../components/layout/AuthModal';
import { WhiteLabelModal } from '../components/layout/WhiteLabelModal';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/landing/Hero';
import { LiveTicker } from '../components/landing/LiveTicker';
import { FeatureRows } from '../components/landing/FeatureRows';
import { Timeline } from '../components/landing/Timeline';
import { TargetingSection } from '../components/landing/TargetingSection';
import { MissionSection } from '../components/landing/MissionSection';
import { Comparison } from '../components/landing/Comparison';
import { PreFooterCTA } from '../components/landing/PreFooterCTA';
import { Target, Users, Zap, X } from 'lucide-react';
import { CustomSelect } from '../components/shared/CustomSelect';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface LandingPageProps {
  idea: string;
  setIdea: (value: string) => void;
}

type ModalType = 'about' | 'contact' | 'terms' | 'careers' | 'blog' | 'api' | 'help' | 'privacy' | null;

export const LandingPage = ({ idea, setIdea }: LandingPageProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWhiteLabelModal, setShowWhiteLabelModal] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Sales',
    message: '',
  });

  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeModal]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    toast.success('Message sent! We will get back to you soon.');
    setActiveModal(null);
  };

  const subjectOptions = ['Sales', 'Support', 'Press'];

  return (
    <div className="relative min-h-[100dvh] flex flex-col font-display bg-black overflow-x-hidden">
      <div className="aurora-blob blob-1"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-[800px] h-[90vw] max-h-[800px] bg-primary/20 rounded-full blur-[200px] opacity-30 pointer-events-none"></div>

      <Navbar onSignInClick={() => setShowAuthModal(true)} />
      <Hero idea={idea} setIdea={setIdea} onAuthModalOpen={() => setShowAuthModal(true)} />
      <LiveTicker />
      <FeatureRows />
      <Timeline />
      <TargetingSection />
      <MissionSection />
      <Comparison />
      <PreFooterCTA onAuthModalOpen={() => setShowAuthModal(true)} />
      <Footer
        onAboutClick={() => setActiveModal('about')}
        onContactClick={() => setActiveModal('contact')}
        onTermsClick={() => setActiveModal('terms')}
        onCareersClick={() => setActiveModal('careers')}
        onBlogClick={() => setActiveModal('blog')}
        onApiClick={() => setActiveModal('api')}
        onHelpClick={() => setActiveModal('help')}
        onPrivacyClick={() => setActiveModal('privacy')}
        onWhiteLabelClick={() => setShowWhiteLabelModal(true)}
      />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <WhiteLabelModal isOpen={showWhiteLabelModal} onClose={() => setShowWhiteLabelModal(false)} />

      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
              onClick={() => setActiveModal(null)}
            />

            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden pointer-events-auto"
              >
                <div className="glass-panel rounded-3xl p-8 md:p-12 border-white/10 bg-background-dark/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all z-10"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-white/70" />
                  </button>

                  {activeModal === 'about' && (
                    <div>
                      <div className="mb-12">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-tight">
                          We are killing the{' '}
                          <span className="text-primary">'Gut Feeling'.</span>
                        </h1>
                        <p className="text-white/60 text-xl">
                          Because your business deserves better than hunches.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8 mb-12 items-stretch">
                        <div className="flex flex-col">
                          <div className="glass-panel rounded-2xl p-8 border-white/10 bg-white/5 flex-1 flex flex-col justify-between h-full">
                            <div className="space-y-6 text-white/70 text-base leading-relaxed">
                              <p>
                                Business history is littered with brilliant ideas that failed because they solved a
                                problem nobody had. We built VETT to ensure that never happens to you.
                              </p>

                              <p>
                                For decades, 'Market Research' was a luxury asset guarded by expensive agencies. It
                                cost $20,000 and took 4 weeks. We believe the kid in the dorm room deserves the
                                same truth as the CEO in the boardroom.
                              </p>

                              <p>
                                We don't sell validation. We sell brutal honesty. We use AI to formulate the
                                strategy, but we use real, verified humans to give the answers.
                              </p>

                              <div className="pt-6 border-t border-white/10">
                                <p className="text-primary font-black text-xl italic">
                                  "Stop betting on luck. Start betting on data."
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between h-full space-y-6">
                          <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col bg-white/5">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Target className="w-6 h-6 text-primary" />
                              </div>
                              <h3 className="text-white font-black text-lg">Our Mission</h3>
                            </div>
                            <p className="text-white/60 leading-relaxed text-sm">
                              Democratize market intelligence. Make world-class research accessible to every builder,
                              not just Fortune 500 companies.
                            </p>
                          </div>

                          <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col bg-white/5">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                              </div>
                              <h3 className="text-white font-black text-lg">Real Humans</h3>
                            </div>
                            <p className="text-white/60 leading-relaxed text-sm">
                              Every response comes from verified humans, not bots. We combine AI strategy with human
                              insight for unbeatable accuracy.
                            </p>
                          </div>

                          <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col bg-white/5">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-primary" />
                              </div>
                              <h3 className="text-white font-black text-lg">Speed Matters</h3>
                            </div>
                            <p className="text-white/60 leading-relaxed text-sm">
                              Get actionable insights in hours, not weeks. Speed without sacrificing quality or accuracy.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === 'contact' && (
                    <div>
                      <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4 break-words">
                        Let's Talk Truth.
                      </h1>
                      <p className="text-white/60 text-lg mb-10 break-words">
                        Have a question? Want to partner? Let's connect.
                      </p>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="glass-panel p-6 sm:p-8 rounded-2xl bg-white/5">
                          <form onSubmit={handleContactSubmit} className="space-y-6">
                            <div>
                              <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wider">
                                Name
                              </label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wider">
                                Email
                              </label>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wider">
                                Subject
                              </label>
                              <CustomSelect
                                options={subjectOptions}
                                value={formData.subject}
                                onChange={(value) => setFormData({ ...formData, subject: value })}
                              />
                            </div>

                            <div>
                              <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wider">
                                Message
                              </label>
                              <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={5}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                                required
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest bg-[#DFFF00] hover:bg-[#E5FF40] text-black shadow-lg shadow-[#DFFF00]/30 hover:shadow-[#DFFF00]/40 transition-all duration-300 hover:scale-105"
                            >
                              Send Message
                            </button>
                          </form>
                        </div>

                        <div className="space-y-6">
                          <div className="glass-panel p-6 rounded-2xl bg-white/5">
                            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-3">
                              Headquarters
                            </h3>
                            <p className="text-white/60 text-base">Dubai, UAE</p>
                          </div>

                          <div className="glass-panel p-6 rounded-2xl bg-white/5">
                            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-3">
                              Email
                            </h3>
                            <a
                              href="mailto:hello@vettit.ai"
                              className="text-primary text-base hover:underline"
                            >
                              hello@vettit.ai
                            </a>
                          </div>

                          <div className="glass-panel p-6 rounded-2xl bg-white/5">
                            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-3">
                              Response Time
                            </h3>
                            <p className="text-white/60 text-base">Usually within 24 hours</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === 'terms' && (
                    <div>
                      <div className="mb-10">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">
                          Terms of Service
                        </h1>
                        <p className="text-white/60 font-bold text-sm uppercase tracking-wider">
                          Date Effective: Jan 2026
                        </p>
                      </div>

                      <div className="space-y-8 text-white/70 text-base leading-relaxed">
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
                  )}

                  {activeModal === 'careers' && (
                    <div className="text-center max-w-3xl mx-auto">
                      <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
                        Join the Mission
                      </h1>
                      <div className="glass-panel rounded-3xl p-8 md:p-12 border-white/10 bg-white/5 mt-12">
                        <div className="space-y-8 text-white/70 text-lg leading-relaxed text-center">
                          <p className="text-xl">
                            We are currently looking for founding engineers and growth hackers. If you are obsessed with data, email us.
                          </p>
                          <div className="pt-6 flex justify-center">
                            <a
                              href="mailto:careers@vettit.ai"
                              className="inline-flex items-center gap-3 px-10 py-5 bg-[#DFFF00] hover:bg-[#E5FF40] text-black rounded-full font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#DFFF00]/30 hover:shadow-[#DFFF00]/40"
                            >
                              careers@vettit.ai
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === 'blog' && (
                    <div className="text-center max-w-3xl mx-auto">
                      <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
                        Coming Soon
                      </h1>
                      <div className="glass-panel rounded-3xl p-12 border-white/10 bg-white/5 mt-12">
                        <div className="space-y-6 text-white/70 text-lg leading-relaxed">
                          <p className="text-xl">
                            Our engineering blog and case studies are being written. Stay tuned for insights on Validation & Market Research.
                          </p>
                          <div className="pt-4">
                            <p className="text-primary font-black text-2xl">
                              Launching Q1 2026
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === 'api' && (
                    <div className="max-w-3xl mx-auto">
                      <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
                        VETT API Access
                      </h1>
                      <p className="text-white/60 text-lg mb-10">
                        Programmatic access to market intelligence data.
                      </p>
                      <div className="glass-panel rounded-3xl p-12 border-white/10 bg-white/5">
                        <div className="space-y-8 text-white/70 text-base leading-relaxed">
                          <p className="text-lg">
                            VETT API Access is currently available for Enterprise Partners only.
                          </p>
                          <p>
                            Our API enables you to programmatically launch missions, retrieve results, and integrate market intelligence directly into your applications.
                          </p>
                          <div className="pt-6">
                            <button
                              onClick={() => setActiveModal('contact')}
                              className="inline-flex items-center gap-3 px-10 py-5 bg-[#DFFF00] hover:bg-[#E5FF40] text-black rounded-full font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#DFFF00]/30 hover:shadow-[#DFFF00]/40"
                            >
                              Request Documentation
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === 'help' && (
                    <div className="max-w-3xl mx-auto">
                      <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
                        Help Center
                      </h1>
                      <p className="text-white/60 text-lg mb-10">
                        We're here to support your mission.
                      </p>
                      <div className="glass-panel rounded-3xl p-12 border-white/10 bg-white/5">
                        <div className="space-y-8 text-white/70 text-lg leading-relaxed">
                          <p>
                            Need assistance? Our team is available 24/7 for urgent mission support.
                          </p>
                          <div className="grid md:grid-cols-2 gap-6 pt-6">
                            <div className="glass-panel p-6 rounded-2xl bg-white/5">
                              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-3">
                                Email Support
                              </h3>
                              <a
                                href="mailto:support@vettit.ai"
                                className="text-primary text-base hover:underline"
                              >
                                support@vettit.ai
                              </a>
                            </div>
                            <div className="glass-panel p-6 rounded-2xl bg-white/5">
                              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-3">
                                Response Time
                              </h3>
                              <p className="text-white/60 text-base">Within 2 hours</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === 'privacy' && (
                    <div>
                      <div className="mb-10">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">
                          Privacy Policy
                        </h1>
                        <p className="text-white/60 font-bold text-sm uppercase tracking-wider">
                          Date Effective: Jan 2026
                        </p>
                      </div>

                      <div className="space-y-8 text-white/70 text-base leading-relaxed">
                        <section>
                          <h2 className="text-2xl font-black text-white mb-4">1. Our Commitment</h2>
                          <p className="mb-4">
                            <strong className="text-white">We do not sell your data.</strong> Your research IP is owned 100% by you.
                          </p>
                          <p>
                            VETT is built on trust. We treat your business ideas, mission data, and survey results with the highest level of confidentiality.
                          </p>
                        </section>

                        <section>
                          <h2 className="text-2xl font-black text-white mb-4">2. Data We Collect</h2>
                          <p className="mb-4">When you use VETT, we collect:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Account information (name, email, billing details)</li>
                            <li>Mission data (business ideas, questions, targeting parameters)</li>
                            <li>Survey responses from verified human respondents</li>
                            <li>Usage analytics (pages visited, features used)</li>
                          </ul>
                        </section>

                        <section>
                          <h2 className="text-2xl font-black text-white mb-4">3. How We Use Your Data</h2>
                          <p className="mb-4">We use your data exclusively to:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Deliver market intelligence services</li>
                            <li>Process payments and manage your subscription</li>
                            <li>Improve our AI models (aggregated, anonymized data only)</li>
                            <li>Send service updates and mission notifications</li>
                          </ul>
                        </section>

                        <section>
                          <h2 className="text-2xl font-black text-white mb-4">4. Data Sharing</h2>
                          <p className="mb-4">
                            <strong className="text-white">We never sell your data to third parties.</strong>
                          </p>
                          <p className="mb-4">We only share data with:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Survey respondents (only the questions you approve)</li>
                            <li>Payment processors (Stripe) for billing</li>
                            <li>Cloud infrastructure providers (AWS, Supabase) for hosting</li>
                            <li>Law enforcement (only when legally required)</li>
                          </ul>
                        </section>

                        <section>
                          <h2 className="text-2xl font-black text-white mb-4">5. Data Retention</h2>
                          <p className="mb-4">
                            Mission data and survey results are stored for as long as your account is active.
                          </p>
                          <p>
                            You may request full deletion of your data at any time by emailing{' '}
                            <a href="mailto:privacy@vettit.ai" className="text-primary hover:underline">
                              privacy@vettit.ai
                            </a>
                            .
                          </p>
                        </section>

                        <section>
                          <h2 className="text-2xl font-black text-white mb-4">6. Security</h2>
                          <p>
                            We use industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. All payment information is processed through PCI-compliant providers.
                          </p>
                        </section>

                        <section>
                          <h2 className="text-2xl font-black text-white mb-4">7. Your Rights</h2>
                          <p className="mb-4">You have the right to:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Access all data we have about you</li>
                            <li>Request corrections to inaccurate data</li>
                            <li>Delete your account and all associated data</li>
                            <li>Export your mission results in CSV or JSON format</li>
                            <li>Opt out of marketing communications</li>
                          </ul>
                        </section>

                        <section>
                          <h2 className="text-2xl font-black text-white mb-4">8. Contact Us</h2>
                          <p>
                            For any privacy concerns or data requests, contact us at{' '}
                            <a href="mailto:privacy@vettit.ai" className="text-primary hover:underline">
                              privacy@vettit.ai
                            </a>
                            .
                          </p>
                        </section>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
