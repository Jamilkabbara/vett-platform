import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Paperclip,
  MessageSquare,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Check,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/ui/Logo';
import { TopNav } from '../components/ui/TopNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Ticker } from '../components/landing/Ticker';

/* ══════════════════════════════════════════════════════════════════
   Data — the prototype's content, extracted so the JSX stays readable
════════════════════════════════════════════════════════════════════ */

const TICKER_ITEMS = [
  'JUST VETTED IN DUBAI: Meal Kit Subscription',
  'JUST VETTED IN RIYADH: FinTech Super App',
  'JUST VETTED IN LONDON: AI Recruitment Tool',
  'JUST VETTED IN LAGOS: Mobile Payment Platform',
  'JUST VETTED IN SINGAPORE: B2B SaaS Dashboard',
  'JUST VETTED IN PARIS: Sustainable Fashion Brand',
  'JUST VETTED IN TORONTO: EdTech Platform',
  'JUST VETTED IN NAIROBI: AgriTech Marketplace',
  'JUST VETTED IN BERLIN: AI Legal Assistant',
  'JUST VETTED IN MUMBAI: D2C Wellness Brand',
  'JUST VETTED IN CAIRO: E-Commerce Marketplace',
  'JUST VETTED IN SÃO PAULO: Crypto Exchange',
  'JUST VETTED IN AMSTERDAM: Green Energy App',
  'JUST VETTED IN SEOUL: Beauty Subscription Box',
  'JUST VETTED IN AUSTIN: Vegan Energy Drink',
  'JUST VETTED IN ISTANBUL: Ride-Hailing App',
];

const COMPANY_LOGOS = ['Google', 'Uber', 'Stripe', 'Airbnb', 'Noon', 'Careem'];

const RESEARCH_TYPES: Array<{
  emoji: string;
  title: string;
  desc: string;
  tag: string;
  tagColor?: 'lime' | 'pur';
  featured?: boolean;
}> = [
  { emoji: '🚀', title: 'Product Validation', desc: 'Test if your idea has real demand before building. Find your PMF signal fast.', tag: 'From $9' },
  { emoji: '💰', title: 'Pricing Research', desc: 'Find the exact price point that maximises revenue. Van Westendorp + WTP analysis.', tag: 'From $45' },
  { emoji: '📣', title: 'Creative & Ad Testing', desc: 'Test ad copy, visuals, and messaging before you spend a dollar on media.', tag: 'From $9' },
  { emoji: '⭐', title: 'Customer Satisfaction', desc: 'Measure CSAT, NPS, and satisfaction across product dimensions at any scale.', tag: 'From $90' },
  { emoji: '🗺️', title: 'Feature Roadmap', desc: 'Let your users tell you what to build next. Kano model prioritisation.', tag: 'From $45' },
  { emoji: '🌍', title: 'Market Entry', desc: 'Validate demand in new geographies before expanding. Test any country, any city.', tag: 'From $90' },
  { emoji: '📡', title: 'Brand Lift Study', desc: 'Measure brand awareness, recall, sentiment and purchase intent before and after campaigns.', tag: 'From $180' },
  { emoji: '🎬', title: 'Creative Attention Analysis', desc: 'Measure emotional response, attention, and engagement on your video or image creatives. Daivid-style emotion mapping.', tag: 'NEW · From $90', tagColor: 'pur', featured: true },
  { emoji: '🔄', title: 'Churn Research', desc: 'Understand why customers leave and what would bring them back. Simulate your churned segment.', tag: 'From $45' },
  { emoji: '🔍', title: 'Competitor Analysis', desc: 'Benchmark your brand against competitors on key dimensions. Brand association mapping.', tag: 'From $45' },
  { emoji: '🎯', title: 'Audience Profiling', desc: 'Build a deep psychographic and behavioural profile of your target customer segment.', tag: 'From $45' },
  { emoji: '✍️', title: 'Naming & Messaging', desc: 'Test product names, taglines, and positioning across your target audience.', tag: 'From $9' },
];

const LOOP_STEPS = [
  { n: 1, title: 'Describe', body: 'Drop your research question in plain language. Upload an image or video for creative testing. No survey expertise needed.' },
  { n: 2, title: 'Strategy', body: "VETT's AI clarifies your brief with 3 quick questions, then builds a surgical survey with the right question types and targeting." },
  { n: 3, title: 'Simulate', body: 'AI generates your exact respondent count — distinct personas with unique demographics, behaviours, and opinions. 100% always delivered.' },
  { n: 4, title: 'Insights', body: 'Charts, AI insights per question, executive summary, and two recommended next studies. PDF, PPT, and XLS included free.' },
];

const PERSONAS = [
  { av: '👩', name: 'Fatima A., 31', meta: 'Marketing Director · Dubai, UAE', badge: '#001' },
  { av: '👨', name: 'Kwame O., 28', meta: 'Software Engineer · Lagos, Nigeria', badge: '#002' },
  { av: '👩', name: 'Ana L., 35', meta: 'Brand Manager · São Paulo, Brazil', badge: '#003' },
  { av: '👨', name: 'Khalid M., 42', meta: 'Finance Director · Riyadh, KSA', badge: '#004' },
  { av: '👩', name: 'Mei X., 26', meta: 'Product Manager · Singapore', badge: '#005' },
];

const AI_FEATS = [
  { ico: '🎯', title: 'Distinct, realistic personas', body: 'Every respondent is unique — different background, opinion, and voice. No uniform answers, no synthetic patterns.' },
  { ico: '📊', title: 'Statistically valid variance', body: 'Rating scales follow bell curves. NPS includes detractors, passives, and promoters in realistic market splits.' },
  { ico: '⚡', title: '100% always delivered', body: 'You set the number — we deliver it. No drop-offs, no partial studies, no panel recruitment delays.' },
];

const ATTENTION_FEATS = [
  { ico: '😮', title: 'Emotion timeline', body: 'Joy, surprise, trust, anticipation, fear — mapped frame by frame across your video.' },
  { ico: '👁️', title: 'Attention heatmap', body: 'Visual heatmap shows where attention peaks and drops across your image or video frames.' },
  { ico: '📈', title: 'Engagement score', body: 'Overall creative effectiveness score vs category benchmarks. Know if it works before it runs.' },
];

const EMOTION_BARS = [
  { label: 'Joy', pct: 74, color: 'bg-lime', text: 'text-lime' },
  { label: 'Anticipation', pct: 61, color: 'bg-[#86efac]', text: 'text-[#86efac]' },
  { label: 'Trust', pct: 55, color: 'bg-blu', text: 'text-blu' },
  { label: 'Surprise', pct: 38, color: 'bg-pur', text: 'text-pur' },
  { label: 'Fear', pct: 8, color: 'bg-red', text: 'text-red' },
];

const HEATMAP_CELLS = [
  'bg-red/20', 'bg-lime/[0.35]', 'bg-lime/70', 'bg-lime/90',
  'bg-lime/60', 'bg-lime/[0.45]', 'bg-org/30', 'bg-red/[0.15]',
];

const COMPARISON_ROWS: Array<[string, string, string, string]> = [
  ['Time to results', 'Minutes', '4–8 weeks', 'Days (if lucky)'],
  ['Survey design', 'AI-built instantly', 'Human researcher', 'You do it all'],
  ['Respondents', 'AI consumer panel', 'Recruited panel', 'Your own network'],
  ['Starting price', 'From $9', '$10,000+ per study', 'Free but limited'],
  ['AI insights', 'Per data point', 'Manual deck, weeks later', 'None included'],
  ['Reports', 'PDF + PPT + XLS free', 'PDF, weeks later', 'CSV only'],
  ['Creative testing', 'Video + image + emotions', 'Separate study, months', 'Not available'],
];

const TESTIMONIALS = [
  {
    quote: 'Saved us 4 weeks and $20k on a pricing study. The recommended price point matched our actual launch data within $2.',
    name: 'Sara K.',
    role: 'CMO, fintech startup · Dubai',
  },
  {
    quote: "I've never had research turn around this fast. The AI personas feel startlingly real — opinions, hesitations, caveats and all.",
    name: 'Ahmed M.',
    role: 'Founder · Riyadh',
  },
  {
    quote: 'Replaced our entire custom research budget for early-stage discovery. This is category-defining work.',
    name: 'Omar S.',
    role: 'Head of Insights · Cairo',
  },
];

const PRICING_TIERS = [
  { range: '10–200', price: '$0.90', label: 'Starter tier' },
  { range: '201–500', price: '$0.75', label: 'Growth tier' },
  { range: '501–1,000', price: '$0.62', label: 'Scale tier' },
  { range: '1,001–2,000', price: '$0.50', label: 'Volume tier' },
  { range: '2,001–5,000', price: '$0.40', label: 'Enterprise tier' },
];

const DEFAULT_HERO_PROMPT =
  'Will UAE consumers pay for a meal kit subscription targeting working professionals?';

/* ══════════════════════════════════════════════════════════════════
   LandingPage
════════════════════════════════════════════════════════════════════ */

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hero input prefill via ?q=... — falls back to the prototype example.
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') return DEFAULT_HERO_PROMPT;
    const p = new URLSearchParams(window.location.search);
    return p.get('q') || DEFAULT_HERO_PROMPT;
  }, []);
  const [idea, setIdea] = useState(initialQuery);

  // Keep the input in sync if the URL changes (e.g. back/forward navigation)
  useEffect(() => {
    const handler = () => {
      const p = new URLSearchParams(window.location.search);
      setIdea(p.get('q') || DEFAULT_HERO_PROMPT);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const heroInputRef = useRef<HTMLInputElement>(null);

  const launchMission = () => {
    const trimmed = idea.trim();
    const qs = trimmed && trimmed !== DEFAULT_HERO_PROMPT ? `?q=${encodeURIComponent(trimmed)}` : '';
    if (user) {
      navigate(`/setup${qs}`);
    } else {
      const redirect = `/setup${qs}`;
      navigate(`/signin?redirect=${encodeURIComponent(redirect)}`);
    }
  };

  const handleHeroSubmit = (e: FormEvent) => {
    e.preventDefault();
    launchMission();
  };

  const handleHeroKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      launchMission();
    }
  };

  const goSignIn = () => navigate('/signin');
  const goVettIt = () => {
    if (user) {
      navigate('/setup');
    } else {
      navigate('/signin?redirect=/setup');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg text-t1">
      <TopNav
        left={
          <Link to="/" aria-label="VETT home">
            <Logo responsive />
          </Link>
        }
        right={
          <>
            <Button variant="ghost" size="md" onClick={goSignIn}>
              Sign In
            </Button>
            <Button variant="gradient" size="md" onClick={goVettIt}>
              VETT IT
            </Button>
          </>
        }
        mobileMenu={
          <>
            <Button variant="ghost" size="md" fullWidth onClick={goSignIn}>
              Sign In
            </Button>
            <Button variant="gradient" size="md" fullWidth onClick={goVettIt}>
              VETT IT
            </Button>
          </>
        }
      />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-5 md:px-10 py-16 md:py-24 flex flex-col items-center text-center"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% -5%, rgba(109,40,217,.45) 0%, transparent 65%), var(--bg)',
        }}
      >
        <div className="inline-flex items-center gap-2 border border-lime/30 rounded-pill px-3.5 py-1 mb-7">
          <span className="w-1.5 h-1.5 bg-lime rounded-full animate-pulse" aria-hidden />
          <span className="font-display font-bold text-[10px] text-lime uppercase tracking-[0.1em]">
            ✦ AI Consumer Research Platform
          </span>
        </div>

        <h1 className="font-display font-black text-white text-[clamp(40px,7vw,72px)] leading-[1.02] tracking-[-1.2px] max-w-[820px]">
          Stop guessing.
          <br />
          <span className="text-lime">VETT it.</span>
        </h1>

        <p className="mt-5 font-body text-t2 text-[clamp(15px,2vw,17px)] leading-[1.65] max-w-[560px]">
          Describe your research question in plain language. VETT&apos;s AI builds the
          survey, simulates your exact audience, and delivers insights in minutes —
          not weeks.
        </p>

        {/* Hero input shell */}
        <form
          onSubmit={handleHeroSubmit}
          className="w-full max-w-[720px] mt-9"
        >
          <div className="bg-bg2/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm focus-within:border-lime/40 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3.5 md:px-5 md:py-4">
              <span className="hidden md:inline-block font-mono font-bold text-lime text-[16px] shrink-0">
                &gt;_
              </span>
              <input
                ref={heroInputRef}
                type="text"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={handleHeroKeydown}
                placeholder="Describe what you want to research..."
                aria-label="Research question"
                className="flex-1 bg-transparent border-0 outline-none font-body text-[14px] md:text-[15px] text-t1 placeholder:text-t3 w-full"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  aria-label="Attach file"
                  className="hidden md:inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-t3 hover:text-t1 hover:bg-white/10 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  rounded="lg"
                  className="shrink-0"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  VETT IT
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Trust row */}
        <div className="mt-5 flex flex-col md:flex-row flex-wrap items-center justify-center gap-1.5 md:gap-3.5 font-body text-[12px] text-t3">
          <span>
            Surveys from <span className="text-lime font-bold">$9</span>
          </span>
          <Sep />
          <span>Results in minutes</span>
          <Sep />
          <span>150+ markets worldwide</span>
          <Sep />
          <span>100% delivered</span>
        </div>
      </section>

      {/* ── Live ticker ─────────────────────────────────────── */}
      <Ticker items={TICKER_ITEMS} />

      {/* ── Logos strip ─────────────────────────────────────── */}
      <section className="bg-bg border-b border-b1 px-6 py-6">
        <div className="max-w-[1100px] mx-auto flex flex-col items-center gap-4">
          <span className="font-display font-bold text-[10px] text-t4 uppercase tracking-[0.12em]">
            Powering decisions for builders at:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {COMPANY_LOGOS.map((name) => (
              <span
                key={name}
                className="font-display font-extrabold text-[14px] md:text-[18px] text-white/[0.18] tracking-tight-2"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats section (3-stat trust grid) ──────────────── */}
      <Section bg="bg">
        <SectionCenter>
          <SecTag>✦ Built for speed</SecTag>
          <SecH2>
            Research in <span className="text-lime">minutes.</span>
            <br />
            Not 4 weeks.
          </SecH2>
          <SecSub>
            Agencies take a month and $10k. VETT takes minutes and $9. Get the
            signal you need to move fast.
          </SecSub>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[900px] mx-auto">
            <StatCard n="$9" tail="" body="Starting price per mission — no subscriptions, ever." />
            <StatCard n="2" tail="min" body="Average time from launch to full research insights." />
            <StatCard n="150" tail="+" body="Markets worldwide. Any country, any city." />
          </div>
        </SectionCenter>
      </Section>

      {/* ── Research Types ──────────────────────────────────── */}
      <Section bg="bg2">
        <SectionCenter>
          <SecTag>✦ Run any research</SecTag>
          <SecH2>
            Every type of research.
            <br />
            <span className="text-lime">One platform.</span>
          </SecH2>
          <SecSub>
            From product validation to brand lift studies — if you can ask the
            question, VETT can research it. No methodology expertise required.
          </SecSub>
        </SectionCenter>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-w-[1100px] mx-auto">
          {RESEARCH_TYPES.map((rt) => (
            <button
              key={rt.title}
              type="button"
              onClick={goVettIt}
              className={[
                'text-left bg-bg3 border rounded-xl p-4 transition-colors',
                rt.featured
                  ? 'border-pur/30 hover:border-pur'
                  : 'border-b2 hover:border-lime',
              ].join(' ')}
            >
              <div className="text-[24px] mb-2.5" aria-hidden>
                {rt.emoji}
              </div>
              <div className="font-display font-bold text-[13px] text-white mb-1.5">
                {rt.title}
              </div>
              <div className="font-body text-[11px] text-t3 leading-[1.55]">
                {rt.desc}
              </div>
              <div
                className={[
                  'mt-2 font-display font-bold text-[9px] uppercase tracking-[0.08em]',
                  rt.tagColor === 'pur' ? 'text-pur' : 'text-lime',
                ].join(' ')}
              >
                {rt.tag}
              </div>
            </button>
          ))}
        </div>
        <p className="mt-6 text-center font-body text-[13px] text-t3">
          Not seeing your use case?{' '}
          <button
            type="button"
            onClick={goVettIt}
            className="text-lime hover:underline"
          >
            Just describe it →
          </button>{' '}
          VETT&apos;s AI will figure out the right approach.
        </p>
      </Section>

      {/* ── Intelligence Loop ───────────────────────────────── */}
      <Section bg="bg">
        <SectionCenter>
          <SecTag>✦ How it works</SecTag>
          <SecH2 className="text-center">The Intelligence Loop</SecH2>
          <SecSub className="text-center">Zero friction. Total clarity.</SecSub>
        </SectionCenter>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-[1100px] mx-auto">
          {LOOP_STEPS.map((s) => (
            <Card key={s.n} className="!p-6">
              <div className="w-7 h-7 rounded-full bg-lime text-black font-display font-black text-[12px] flex items-center justify-center mb-3.5">
                {s.n}
              </div>
              <div className="font-display font-extrabold text-white text-[15px] mb-2">
                {s.title}
              </div>
              <div className="font-body text-[12px] text-t2 leading-[1.6]">
                {s.body}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── AI Consumer Research (split) ────────────────────── */}
      <Section bg="bg2">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px] items-center">
          <div>
            <SecTag>✦ AI Consumer Research</SecTag>
            <SecH2>
              Consumer signals at scale.
              <br />
              <span className="text-lime">Simulated for your brief.</span>
            </SecH2>
            <SecSub>
              VETT generates distinct, realistic consumer personas calibrated to
              your exact target audience. Each responds independently with
              authentic variance — the same statistical patterns found in real
              market research.
            </SecSub>
            <div className="mt-6 flex flex-col gap-3.5">
              {AI_FEATS.map((f) => (
                <div key={f.title} className="flex gap-3">
                  <div className="text-[20px] shrink-0 pt-0.5" aria-hidden>
                    {f.ico}
                  </div>
                  <div>
                    <div className="font-display font-bold text-[14px] text-white mb-0.5">
                      {f.title}
                    </div>
                    <div className="font-body text-[12px] text-t2 leading-[1.55]">
                      {f.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-bg border border-b1 rounded-2xl p-6">
            <div className="font-display font-bold text-[11px] text-t2 uppercase tracking-[0.08em] mb-4">
              Live persona generation
            </div>
            <div className="space-y-2">
              {PERSONAS.map((p) => (
                <div
                  key={p.badge}
                  className="flex items-center gap-2.5 bg-bg3 border border-b2 rounded-[10px] p-3"
                >
                  <div className="w-8 h-8 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center text-[14px] shrink-0">
                    {p.av}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-[11px] text-white truncate">
                      {p.name}
                    </div>
                    <div className="font-body text-[10px] text-t3 truncate">
                      {p.meta}
                    </div>
                  </div>
                  <span className="shrink-0 font-display font-bold text-[9px] text-lime bg-lime/10 border border-lime/20 rounded px-1.5 py-0.5">
                    Persona {p.badge}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center font-body text-[10px] text-t4">
              + 95 more personas generated for this mission
            </p>
          </div>
        </div>
      </Section>

      {/* ── Creative Attention Analysis ─────────────────────── */}
      <Section bg="bg">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px] items-start">
          <div>
            <div className="font-display font-bold text-[10px] text-pur uppercase tracking-[0.12em] mb-3">
              ✦ New — Creative Attention Analysis
            </div>
            <SecH2>
              Know how your creative
              <br />
              <span className="text-lime">makes people feel.</span>
            </SecH2>
            <SecSub>
              Upload a video or image creative. VETT&apos;s AI simulates how your
              target audience emotionally responds — second by second. Attention,
              emotion, and engagement mapped before you spend on media.
            </SecSub>
            <div className="mt-6 flex flex-col gap-3.5">
              {ATTENTION_FEATS.map((f) => (
                <div key={f.title} className="flex gap-3">
                  <div className="text-[20px] shrink-0 pt-0.5" aria-hidden>
                    {f.ico}
                  </div>
                  <div>
                    <div className="font-display font-bold text-[14px] text-white mb-0.5">
                      {f.title}
                    </div>
                    <div className="font-body text-[12px] text-t2 leading-[1.55]">
                      {f.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button variant="primary" size="md" rounded="lg" onClick={goVettIt}>
                Analyse a creative →
              </Button>
            </div>
          </div>
          <Card className="!p-6 space-y-4">
            <div className="font-display font-bold text-[11px] text-t2 uppercase tracking-[0.08em]">
              Emotion response — Meal Kit ad (30s)
            </div>
            <div className="space-y-2.5">
              {EMOTION_BARS.map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <span className="font-body text-[11px] text-t2 w-20 shrink-0">
                    {b.label}
                  </span>
                  <div className="flex-1 h-2.5 bg-bg3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${b.color}`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                  <span className={`font-display font-bold text-[10px] w-9 text-right ${b.text}`}>
                    {b.pct}%
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="font-display font-bold text-[11px] text-t2 uppercase tracking-[0.08em] mb-2">
                Attention heatmap
              </div>
              <div className="grid grid-cols-8 gap-[3px]">
                {HEATMAP_CELLS.map((cls, i) => (
                  <div key={i} className={`h-6 rounded-[3px] ${cls}`} />
                ))}
              </div>
              <p className="mt-2 font-body text-[10px] text-t3">
                Frame-by-frame attention score — green = high attention · red = low
              </p>
            </div>

            <div className="bg-lime/[0.06] border border-lime/20 rounded-lg px-3.5 py-3">
              <div className="font-display font-extrabold text-[12px] text-lime">
                Engagement score: 78/100
              </div>
              <div className="font-body text-[11px] text-t2 mt-0.5">
                Above category average of 61 · Strong opening, slight drop at 22s
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* ── Comparison table ───────────────────────────────── */}
      <Section bg="bg2">
        <SectionCenter>
          <SecH2>
            Research that moves
            <br />
            at the speed of <span className="text-lime">your ideas.</span>
          </SecH2>
        </SectionCenter>
        <div className="mt-10 max-w-[900px] mx-auto overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="font-display font-extrabold text-[13px] text-t2 border-b border-b1 px-3 md:px-5 py-3.5">—</th>
                <th className="font-display font-extrabold text-[13px] text-lime bg-lime/[0.04] border-b border-b1 px-3 md:px-5 py-3.5">VETT</th>
                <th className="font-display font-extrabold text-[13px] text-t2 border-b border-b1 px-3 md:px-5 py-3.5">Research Agency</th>
                <th className="font-display font-extrabold text-[13px] text-t2 border-b border-b1 px-3 md:px-5 py-3.5">DIY Survey Tool</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(([label, vett, agency, diy]) => (
                <tr key={label}>
                  <td className="font-body font-semibold text-[12px] md:text-[13px] text-white border-b border-t5 px-3 md:px-5 py-3">
                    {label}
                  </td>
                  <td className="font-body font-semibold text-[12px] md:text-[13px] text-lime bg-lime/[0.03] border-b border-t5 px-3 md:px-5 py-3">
                    {vett}
                  </td>
                  <td className="font-body text-[12px] md:text-[13px] text-t2 border-b border-t5 px-3 md:px-5 py-3">
                    {agency}
                  </td>
                  <td className="font-body text-[12px] md:text-[13px] text-t2 border-b border-t5 px-3 md:px-5 py-3">
                    {diy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Testimonials ────────────────────────────────────── */}
      <Section bg="bg">
        <SectionCenter>
          <SecTag>✦ Trusted by builders</SecTag>
          <SecH2>
            Research this fast feels
            <br />
            <span className="text-lime">unfair — in the best way.</span>
          </SecH2>
        </SectionCenter>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3.5 max-w-[1100px] mx-auto">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="!p-6 flex flex-col gap-4">
              <p className="font-body italic text-[14px] text-t1 leading-[1.6]">
                “{t.quote}”
              </p>
              <div className="mt-auto">
                <div className="font-display font-bold text-[13px] text-white">
                  {t.name}
                </div>
                <div className="font-body text-[12px] text-t3">{t.role}</div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── Pricing teaser (5 tiers) ───────────────────────── */}
      <Section bg="bg2">
        <SectionCenter>
          <SecTag>✦ Pricing</SecTag>
          <SecH2>
            Pay per mission.
            <br />
            <span className="text-lime">No subscriptions.</span>
          </SecH2>
          <SecSub>
            Per-respondent pricing. The more you run, the less each respondent
            costs — no seats, no retainers, no hidden fees.
          </SecSub>
        </SectionCenter>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-[1100px] mx-auto">
          {PRICING_TIERS.map((t) => (
            <KpiCard
              key={t.range}
              label={t.label}
              value={t.price}
              sub={`${t.range} respondents`}
              valueColor="lime"
            />
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            variant="gradient"
            size="lg"
            rounded="lg"
            onClick={goVettIt}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Launch your first mission
          </Button>
          <p className="font-body text-[12px] text-t3 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-lime" aria-hidden />
            No credit card required to start
          </p>
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section
        className="px-6 py-20 text-center border-b border-b1"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(109,40,217,.3) 0%, transparent 70%), var(--bg)',
        }}
      >
        <h2 className="mx-auto font-display font-black text-white text-[clamp(32px,5.5vw,52px)] leading-[1.05] tracking-[-1.2px] max-w-[620px]">
          Your next business decision shouldn&apos;t be a guess.
        </h2>
        <p className="mt-4 font-body text-t2 text-[16px]">
          Get research-grade insights from AI-simulated audiences. In minutes.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            variant="gradient"
            size="lg"
            rounded="lg"
            onClick={goVettIt}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            VETT IT
          </Button>
        </div>
        <p className="mt-4 font-body text-[12px] text-t3">
          No subscription · Pay per mission · From $9 · 150+ markets · 100% delivered
        </p>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-bg4 border-t border-b1 px-6 md:px-10 pt-12 pb-7">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-md bg-lime flex items-center justify-center shadow-lime-soft">
                  <Zap className="w-4 h-4 text-black" fill="currentColor" strokeWidth={0} />
                </div>
                <span className="font-display font-black text-white text-[16px]">VETT</span>
              </div>
              <p className="font-body text-[12px] text-t3 leading-[1.5]">
                The operating system
                <br />
                for market intelligence.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="VETT on Twitter"
                  className="text-t3 hover:text-lime transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="VETT on LinkedIn"
                  className="text-t3 hover:text-lime transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div>
              <FcTitle>Company</FcTitle>
              <FcLink to="/about">About Us</FcLink>
              <FcLink to="/careers">Careers</FcLink>
              <FcLink to="/contact">Contact</FcLink>
            </div>
            <div>
              <FcTitle>Resources</FcTitle>
              <FcLink to="/blog">Blog</FcLink>
              <FcLink to="/api">API</FcLink>
              <FcLink to="/help">Help Center</FcLink>
            </div>
            <div>
              <FcTitle>Connect</FcTitle>
              <div className="flex items-center gap-1.5 font-body text-[12px] text-t3 mb-2">
                <MapPin className="w-3.5 h-3.5" /> Dubai, UAE
              </div>
              <div className="flex items-center gap-1.5 font-body text-[12px] text-t3">
                <Mail className="w-3.5 h-3.5" /> hello@vettit.ai
              </div>
            </div>
          </div>
          <div className="border-t border-b1 pt-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="font-body text-[12px] text-t4">© 2026 VETT Inc. All rights reserved.</div>
            <div className="flex gap-5">
              <Link to="/privacy" className="font-body text-[12px] text-t3 hover:text-lime transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="font-body text-[12px] text-t3 hover:text-lime transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── tiny local helpers ─────────────────────────────────────────── */

function Section({
  bg,
  children,
  className = '',
}: {
  bg: 'bg' | 'bg2';
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        bg === 'bg2' ? 'bg-bg2' : 'bg-bg',
        'border-b border-b1',
        'px-5 md:px-10 py-14 md:py-16',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  );
}

function SectionCenter({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[1100px] mx-auto text-center">{children}</div>;
}

function SecTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-display font-bold text-[10px] text-lime uppercase tracking-[0.12em] mb-3">
      {children}
    </div>
  );
}

function SecH2({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={[
        'font-display font-black text-white',
        'text-[clamp(28px,5vw,52px)] leading-[1.05] tracking-[-1.2px]',
        'mb-3',
        className,
      ].join(' ')}
    >
      {children}
    </h2>
  );
}

function SecSub({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={[
        'font-body text-t2 text-[14px] md:text-[16px] leading-[1.65]',
        'max-w-[640px] mx-auto',
        className,
      ].join(' ')}
    >
      {children}
    </p>
  );
}

function StatCard({
  n,
  tail,
  body,
}: {
  n: string;
  tail?: string;
  body: string;
}) {
  return (
    <div className="bg-bg2 border border-b1 rounded-2xl p-7 text-center">
      <div className="font-display font-black text-lime text-[clamp(36px,5vw,52px)] tracking-display-l leading-none mb-2">
        {n}
        {tail && <span className="text-[28px] ml-0.5">{tail}</span>}
      </div>
      <div className="font-body text-[12px] md:text-[13px] text-t2 leading-[1.5]">
        {body}
      </div>
    </div>
  );
}

function Sep() {
  return <span className="hidden md:inline text-t5">·</span>;
}

function FcTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-display font-extrabold text-[11px] text-t2 uppercase tracking-[0.1em] mb-3.5">
      {children}
    </div>
  );
}

function FcLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block font-body text-[13px] text-t3 mb-2 hover:text-t1 transition-colors"
    >
      {children}
    </Link>
  );
}

/* Stub references so TS doesn't complain about unused lucide imports
   that I kept for future section work. */
void Target;
void BarChart3;
void MessageSquare;

export default LandingPage;
