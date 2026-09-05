import { lazy, Suspense, useState } from 'react';
import { ChevronDown, ChevronRight, MessageCircleQuestion, Mail, BookOpen } from 'lucide-react';
import { OverlayPage } from '../components/layout/OverlayPage';
import { useAuth } from '../contexts/AuthContext';

/**
 * Pass 32 X10 — /help page rewrite + Ask VETT mount.
 *
 * Content rewritten to match Pass 31 Z1 / Z2 honest claims:
 *   - No "verified humans" / "ID-verified via government databases"
 *   - No "100% accuracy"
 *   - VETT is methodology-first: synthetic respondents, deterministic
 *     analysis, directional output. Copy leads with what the tool IS;
 *     every factual limit is kept, stated as a design choice.
 *
 * Ask VETT chatbot mounts inline at the bottom for authenticated users
 * (uses the existing dashboard-scope copilot, 30 messages / month).
 * Anonymous visitors see a sign-in CTA where the chat would render.
 */

const ChatWidget = lazy(() =>
  import('../components/chat/ChatWidget').then(m => ({ default: m.ChatWidget })),
);

interface FAQ {
  category: string;
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    category: 'How VETT works',
    question: 'How does VETT generate answers?',
    answer:
      'Every mission runs a multi-stage pipeline. VETT generates a population of synthetic respondents calibrated to your audience spec, simulates each one answering your questions in their own voice, then computes the analysis deterministically from those responses using the established instrument for your research type. The figures come from that computation rather than from a model writing numbers, and they describe a simulated population - read them as decision-support signal at the sample size you ran.',
  },
  {
    category: 'How VETT works',
    question: 'Are these answers from real people?',
    answer:
      'They are simulated. VETT builds AI personas to your audience spec and has each one answer your survey in its own voice, then computes the analysis deterministically from those answers. That design is the point: a mission takes minutes and tens of dollars where fieldwork takes weeks and thousands. It also fixes the boundary - because the respondents are simulated, there is no respondent PII to collect and no panel-level statistical validity to claim, and the output is a directional read on how a defined audience would likely respond. Use it to pick a direction fast, and confirm high-stakes decisions with fieldwork.',
  },
  {
    category: 'How VETT works',
    question: 'Which research methodologies do you support?',
    answer:
      'Brand Lift (incrementality, exposed vs control), Creative Attention (frame-by-frame video / static analysis with attention prediction + emotion taxonomy), Pricing (Van Westendorp + Gabor-Granger), Feature Roadmap (MaxDiff + Kano), Customer Satisfaction (NPS + CSAT + CES), Concept Test, Sequential Monadic Comparison, Ad Effectiveness, Brand Health Tracker, Naming & Messaging (Monadic + Paired + TURF), Churn (Driver Tree + Win-Back), Audience Profiling (segmentation), Market Entry (multi-market routing), and open-ended General Research. Each runs an industry-standard research framework, with the prompt, simulation and synthesis layers tuned per type. The frameworks are peer-reviewed in the academic literature; VETT runs them on synthetic respondents with deterministic analysis.',
  },
  {
    category: 'Pricing',
    question: 'How is a mission priced?',
    answer:
      'Most mission types price off the standard ladder: $9 for 5 respondents, $99 for 50, $300 for 250, $900 for 1,000. Two types have their own ladder and their own minimum. Brand Lift splits the sample across exposed and control cells, so it starts at 100 respondents ($150) and runs $300 at 200, $600 at 500. Creative Attention starts at 10 respondents ($19) and runs $69 at 50, $129 at 100. Self-serve studies go up to 1,250 respondents; above that we scope the study with you rather than sell it on the site. Targeting depth adds a per-respondent surcharge, capped per category (professional $1.50, technographic $1.00, financial $1.00, city targeting $1.00) - demographics are free, and screening adds $0.50 per respondent. Every mission includes 5 questions; each extra question is $20. Promo codes apply at checkout. The full breakdown shows on the launch screen before any payment.',
  },
  {
    category: 'Pricing',
    question: 'Do you charge per-message for the AI copilot?',
    answer:
      'Each mission ships with 30 chat messages on the results page (per-mission quota). The dashboard copilot has 30 messages per calendar month. The setup advisor has 20 messages per draft mission. If you need more, you can purchase 50 additional messages for $5 from the chat widget itself.',
  },
  {
    category: 'Pricing',
    // Pass 43 T4a — no-refund-consistent answer (was promising partial +
    // full refunds, contradicting the NO REFUNDS policy / Terms §5.3).
    question: 'What if a mission fails to deliver?',
    answer:
      'VETT missions are final and non-refundable. If your screener criteria are too strict for the audience we can reach, you receive a partial delivery of however many respondents qualified, and the synthesized insights are honest about the smaller sample. If the analysis pipeline errors out entirely, contact support and we will prioritize a re-run of your mission at no extra cost.',
  },
  {
    category: 'Targeting',
    question: 'Can I target by country, age, or job title?',
    answer:
      'Yes — geography (160+ countries), age ranges, gender, education, marital + parental status, employment, industry, seniority, company size, and behavioral attributes. The targeting picker lets you stack any number of criteria. Narrow combinations (e.g. CMOs at SaaS companies in Germany) cost more because the persona generator has to honor every constraint when synthesizing the population.',
  },
  {
    category: 'Targeting',
    question: 'How accurate is the targeting?',
    answer:
      'Personas are generated from your target spec - the model writes population members that fit the criteria. Targeting fidelity depends on how clearly the criteria are specified and how much real-world signal the model has on that segment. We surface a targeting summary on every mission so you can sanity-check before launch.',
  },
  {
    category: 'Outputs',
    question: 'What do I get when a mission completes?',
    answer:
      'A results page with executive summary, per-question aggregations (single/multi/rating distributions, sentiment for free-text), persona profiles, screening funnel, and methodology-specific cards (e.g. price elasticity curves for pricing missions, attention decay curves for creative missions). All exportable as PDF, PowerPoint, Excel, or raw JSON. Creative Attention missions also export CSV.',
  },
  {
    category: 'Outputs',
    question: 'Can I share results with my team?',
    answer:
      'You can export the results to PDF / PowerPoint / Excel and share those files directly. We do not currently offer multi-user workspace sharing — each account owns its missions. If you need team access, contact us and we will work out a workspace setup for your team.',
  },
  {
    category: 'Data & privacy',
    question: 'What data do you collect?',
    answer:
      'Account data (email, name, company), mission inputs (briefs, questions, targeting, uploaded creative assets), and usage telemetry. Respondent answers are synthetic, so the only personal data in the system is yours - there is no respondent PII to collect in the first place. Mission data is private to your account by default.',
  },
  {
    category: 'Data & privacy',
    question: 'Can I delete my data?',
    answer:
      'Yes. Individual missions can be deleted from your missions list; your whole account can be deleted from your profile page. Account deletion runs immediately and removes the associated missions, responses, chat sessions and notifications. Stripe payment records are retained per finance regulations.',
  },
];

const CATEGORIES = Array.from(new Set(FAQS.map(f => f.category)));

const GUIDES = [
  {
    title: 'Writing better questions',
    description: 'How to phrase questions to surface honest, decision-grade signal — and which leading-question patterns to avoid.',
  },
  {
    title: 'Choosing a methodology',
    description: 'Brand Lift vs Concept Test vs Pricing — when each one fits, and how to combine them on the same product.',
  },
  {
    title: 'Reading creative attention scores',
    description: 'Active vs passive attention, distinctive brand asset score, and how to interpret the per-frame emotion arc.',
  },
  {
    title: 'Targeting depth, explained',
    description: 'When to use Gen Pop, when to narrow to a niche, and how the targeting surcharge maps to persona accuracy.',
  },
];

export const HelpPage = () => {
  const { user } = useAuth();
  const [openId, setOpenId] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(false);

  return (
    <OverlayPage>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
          Help Center
        </h1>
        <p className="text-white/60 text-xl mb-16 max-w-2xl">
          What VETT is, how missions work, and what the outputs actually mean.
          Methodology-first, synthetic respondents — read the FAQ before launching.
        </p>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tight">
            Frequently Asked Questions
          </h2>

          {CATEGORIES.map((cat) => (
            <div key={cat} className="mb-8">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4">
                {cat}
              </h3>
              <div className="space-y-3">
                {FAQS.filter(f => f.category === cat).map((faq, idx) => {
                  const id = `${cat}-${idx}`;
                  const open = openId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOpenId(open ? null : id)}
                      className="w-full text-left glass-panel rounded-2xl border border-white/5 hover:border-white/15 transition-all overflow-hidden"
                      aria-expanded={open}
                    >
                      <div className="flex items-center justify-between gap-4 p-6">
                        <h4 className="text-lg font-black text-white pr-4">
                          {faq.question}
                        </h4>
                        <ChevronDown
                          className={`w-5 h-5 text-white/40 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
                          aria-hidden
                        />
                      </div>
                      {open && (
                        <div className="px-6 pb-6 -mt-1">
                          <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Guides */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tight flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-primary" />
            Guides &amp; Tutorials
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {GUIDES.map((guide) => (
              <div
                key={guide.title}
                className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/40 transition-all group"
              >
                <h3 className="text-white font-bold group-hover:text-primary transition-colors mb-2">
                  {guide.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {guide.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Ask VETT — inline copilot for authed users, sign-in CTA otherwise */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight flex items-center gap-3">
            <MessageCircleQuestion className="w-7 h-7 text-primary" />
            Ask VETT
          </h2>
          <p className="text-white/60 mb-6">
            Couldn&apos;t find what you&apos;re looking for? Ask the dashboard copilot
            anything about your missions, methodologies, or how to interpret a result.
          </p>
          {user ? (
            <>
              <button
                type="button"
                onClick={() => setAskOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-black text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                <MessageCircleQuestion className="w-4 h-4" />
                Open Ask VETT
              </button>
              <Suspense fallback={null}>
                <ChatWidget
                  scope="dashboard"
                  anchor="inline"
                  isOpen={askOpen}
                  onClose={() => setAskOpen(false)}
                  title="Ask VETT"
                />
              </Suspense>
            </>
          ) : (
            <a
              href="/signin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/15 text-white font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-colors"
            >
              <MessageCircleQuestion className="w-4 h-4" />
              Sign in to use Ask VETT
            </a>
          )}
        </div>

        {/* Contact */}
        <div className="text-center glass-panel p-12 rounded-3xl border border-white/5">
          <h3 className="text-2xl font-black text-white mb-4">Still stuck?</h3>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Email support directly. We aim for a response within two business days.
          </p>
          <a
            href="mailto:support@vettit.ai"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest bg-[#DFFF00] hover:bg-[#E5FF40] text-black shadow-lg shadow-[#DFFF00]/30 hover:shadow-[#DFFF00]/40 transition-all duration-300 hover:scale-105"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>

        {/* Footer link to category index */}
        <div className="mt-12 flex items-center justify-center gap-2 text-white/40 text-sm">
          {CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`#${cat.replace(/\s+/g, '-').toLowerCase()}`}
              className="hover:text-white/70 transition-colors flex items-center gap-1"
            >
              {cat} <ChevronRight className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
    </OverlayPage>
  );
};

export default HelpPage;
