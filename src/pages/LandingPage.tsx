import { useEffect, useMemo, useRef, useState } from 'react';
import { useTypewriterPlaceholder } from '../hooks/useTypewriterPlaceholder';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Paperclip,
  MessageSquare,
  Zap,
  Target,
  BarChart3,
  Check,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  X,
} from 'lucide-react';
import { FileUpload, type UploadedFile } from '../components/shared/FileUpload';

import { useAuth } from '../contexts/AuthContext';
import { trackFunnel, landingMetadata } from '../lib/funnelTrack';
import { Logo } from '../components/ui/Logo';
import { TopNav } from '../components/ui/TopNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Ticker } from '../components/landing/Ticker';
import { LeadCaptureForm } from '../components/marketing/LeadCaptureForm';

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

// Pass 23 Bug 23.63 — every research-type card now carries a goalId
// matching the canonical mission goal_type values (see
// src/data/missionGoals.ts). The card onClick wires through goWithGoal
// so the user lands on the right setup flow with the goal pre-selected.
const RESEARCH_TYPES: Array<{
  emoji: string;
  title: string;
  desc: string;
  tag: string;
  tagColor?: 'lime' | 'pur';
  featured?: boolean;
  goalId: string;  // canonical mission goal_type
}> = [
  { emoji: '🚀', title: 'Product Validation',           desc: 'Test if your idea has real demand before building. Find your PMF signal fast.',                       tag: 'From $9',                   goalId: 'validate' },
  { emoji: '💰', title: 'Pricing Research',             desc: 'Find the exact price point that maximises revenue. Van Westendorp + WTP analysis.',                  tag: 'From $99',                  goalId: 'pricing_research' },
  { emoji: '📣', title: 'Creative & Ad Testing',        desc: 'Test ad copy, visuals, and messaging before you spend a dollar on media.',                            tag: 'From $35',                  goalId: 'marketing' },
  { emoji: '⭐', title: 'Customer Satisfaction',        desc: 'Measure CSAT, NPS, and satisfaction across product dimensions at any scale.',                        tag: 'From $99',                  goalId: 'customer_satisfaction' },
  { emoji: '🗺️', title: 'Feature Roadmap',              desc: 'Let your users tell you what to build next. Kano model prioritisation.',                            tag: 'From $99',                  goalId: 'feature_roadmap' },
  { emoji: '🌍', title: 'Market Entry',                 desc: 'Validate demand in new geographies before expanding. Test any country, any city.',                    tag: 'From $99',                  goalId: 'market_entry' },
  { emoji: '📡', title: 'Brand Lift Study',             desc: 'Measure brand awareness, recall, sentiment and purchase intent before and after campaigns.',           tag: 'From $99',                  goalId: 'brand_lift' },
  { emoji: '🎬', title: 'Creative Attention Analysis',  desc: 'Measure emotional response, attention, and engagement on your video or image creatives with research-grade emotion mapping.', tag: 'NEW · From $19', tagColor: 'pur', featured: true, goalId: 'creative_attention' },
  { emoji: '🔄', title: 'Churn Research',               desc: 'Understand why customers leave and what would bring them back. Simulate your churned segment.',         tag: 'From $99',                  goalId: 'churn_research' },
  { emoji: '🔍', title: 'Competitor Analysis',          desc: 'Benchmark your brand against competitors on key dimensions. Brand association mapping.',               tag: 'From $99',                  goalId: 'competitor_analysis' },
  { emoji: '🎯', title: 'Audience Profiling',           desc: 'Build a deep psychographic and behavioural profile of your target customer segment.',                  tag: 'From $99',                  goalId: 'audience_profiling' },
  { emoji: '✍️', title: 'Naming & Messaging',           desc: 'Test product names, taglines, and positioning across your target audience.',                          tag: 'From $35',                  goalId: 'naming_messaging' },
];

const LOOP_STEPS = [
  { n: 1, title: 'Describe', body: 'Drop your research question in plain language. Upload an image or video for creative testing. No survey expertise needed.' },
  { n: 2, title: 'Strategy', body: "VETT's AI clarifies your brief with 3 quick questions, then builds a surgical survey with the right question types and targeting." },
  { n: 3, title: 'Simulate', body: 'AI generates your exact respondent count: distinct personas with unique demographics, behaviours, and opinions. Every respondent matches your audience, generated to your spec. Partial deliveries trigger automatic Stripe refunds — you only pay for what completes.' },
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
  { ico: '🎯', title: 'Distinct, realistic personas', body: 'Every respondent is unique, with a different background, opinion, and voice. No uniform answers, no synthetic patterns.' },
  { ico: '📊', title: 'Statistically valid variance', body: 'Rating scales follow bell curves. NPS includes detractors, passives, and promoters in realistic market splits.' },
  { ico: '⚡', title: 'Every respondent matches your audience', body: 'You set the number; every persona is generated to match your screener spec, not filtered against it. Auto-refund handles the rare partial-delivery case so you only pay for what ships.' },
];

const ATTENTION_FEATS = [
  { ico: '😮', title: 'Emotion timeline', body: 'Joy, surprise, trust, anticipation, fear, all mapped frame by frame across your video.' },
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
  ['Starting price', 'From $35', '$10,000+ per study', 'Free but limited'],
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
    quote: "I've never had research turn around this fast. The AI personas feel startlingly real, with opinions, hesitations, caveats and all.",
    name: 'Ahmed M.',
    role: 'Founder · Riyadh',
  },
  {
    quote: 'Replaced our entire custom research budget for early-stage discovery. This is category-defining work.',
    name: 'Omar S.',
    role: 'Head of Insights · Cairo',
  },
];

// Pass 23 Bug 23.PRICING + 23.51 — goal-keyed tier ladders for the
// landing pricing teaser. Three tabs: Validate / Brand Lift / Creative
// Attention. Mirrors src/utils/pricingEngine.ts.
const PRICING_TABS: ReadonlyArray<{
  id: string;
  label: string;
  tagline: string;
  tiers: ReadonlyArray<{ range: string; price: string; label: string; perResp?: string }>;
}> = [
  {
    id: 'validate',
    label: 'Validate',
    tagline: 'Product, naming, and message validation. Pay per respondent.',
    tiers: [
      { range: '5 personas',    price: '$9',    label: 'Sniff Test', perResp: '$1.80/resp' },
      { range: '10 personas',   price: '$35',   label: 'Validate',   perResp: '$3.50/resp' },
      { range: '50 personas',   price: '$99',   label: 'Confidence', perResp: '$1.98/resp' },
      { range: '250 personas',  price: '$299',  label: 'Deep Dive',  perResp: '$1.20/resp' },
      { range: '1,000 personas', price: '$899',  label: 'Scale',      perResp: '$0.90/resp' },
      { range: '5,000 personas', price: '$1,990', label: 'Enterprise', perResp: '$0.40/resp' },
    ],
  },
  {
    id: 'brand_lift',
    label: 'Brand Lift',
    tagline: 'Awareness, recall, sentiment, and intent. Statistical sample sizes only.',
    tiers: [
      { range: '50 personas',   price: '$99',   label: 'Pulse',      perResp: '$1.98/resp' },
      { range: '200 personas',  price: '$299',  label: 'Tracker',    perResp: '$1.50/resp' },
      { range: '500 personas',  price: '$599',  label: 'Wave',       perResp: '$1.20/resp' },
      { range: '2,000 personas', price: '$1,499', label: 'Enterprise', perResp: '$0.75/resp' },
    ],
  },
  {
    id: 'creative_attention',
    label: 'Creative Attention',
    tagline: 'Frame-by-frame attention, emotion, and message clarity. Per-asset.',
    tiers: [
      { range: '1 image',  price: '$19',  label: 'Image' },
      { range: '1 video',  price: '$39',  label: 'Video' },
      { range: '5 assets', price: '$79',  label: 'Bundle' },
      { range: '20 assets', price: '$249', label: 'Series' },
    ],
  },
];

const HERO_PLACEHOLDERS = [
  'Will UAE consumers pay for a meal kit subscription?',
  'Which pricing tier would SaaS users choose in Saudi Arabia?',
  'What features do remote workers in Singapore value most?',
  'Is there demand for premium EVs in Egypt?',
  'Would UK millennials subscribe to a mental wellness app?',
  'What messaging resonates with B2B buyers in the Gulf?',
  'How do Indian Gen-Z shoppers discover new brands?',
  'What stops US consumers from adopting fintech apps?',
];

/* ══════════════════════════════════════════════════════════════════
   LandingPage
════════════════════════════════════════════════════════════════════ */

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hero input — empty unless a ?q= URL param is present.
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('q') || '';
  }, []);
  const [idea, setIdea] = useState(initialQuery);

  // Track landing page view (once per mount). Pass 22 Bug 22.4 — capture
  // referrer + UTM + viewport so the admin micro-funnel can segment by source.
  useEffect(() => { trackFunnel('landing_view', landingMetadata()); }, []);

  // Keep the input in sync if the URL changes (e.g. back/forward navigation)
  useEffect(() => {
    const handler = () => {
      const p = new URLSearchParams(window.location.search);
      setIdea(p.get('q') || '');
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Typewriter placeholder — pauses when the input is focused so the user
  // isn't distracted by animation while they're composing their question.
  const [heroFocused, setHeroFocused] = useState(false);
  const heroPaused = heroFocused || idea.trim().length > 0;
  const typewriterPlaceholder = useTypewriterPlaceholder({
    phrases: HERO_PLACEHOLDERS,
    paused: heroPaused,
  });

  const heroInputRef = useRef<HTMLInputElement>(null);

  // Attachment state — file uploaded via the 📎 icon
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const launchMission = () => {
    const trimmed = idea.trim();
    const qs = trimmed ? `?q=${encodeURIComponent(trimmed)}` : '';
    // Pass attachment through sessionStorage so MissionSetupPage can read it
    if (attachment) {
      sessionStorage.setItem('vett_landing_attachment', JSON.stringify(attachment));
    } else {
      sessionStorage.removeItem('vett_landing_attachment');
    }
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

  /**
   * Pass 23 Bug 23.54 + 23.63 — preserve a goal_type through sign-in.
   *
   * Routes goal-aware:
   *   creative_attention → /creative-attention/new (dedicated upload flow,
   *                        per-asset pricing, no Mission Setup AI survey-gen)
   *   anything else      → /setup?goal=<goalId>  (Mission Setup with
   *                        the goal preselected)
   *
   * For unauthed users, we wrap the destination in /signin?redirect=...
   * so the post-auth round-trip lands on the right setup flow.
   *
   * Persistence:
   *   sessionStorage('vett_landing_goal') is set as a fallback for
   *   browsers that drop URL params during OAuth (some embedded webviews,
   *   Safari private mode). MissionSetupPage + CreativeAttentionPage both
   *   read URL first, then sessionStorage.
   *
   * Pass `goalId=null` for generic CTAs that should clear any stale goal.
   */
  const goWithGoal = (goalId: string | null) => {
    try {
      if (goalId) sessionStorage.setItem('vett_landing_goal', goalId);
      else sessionStorage.removeItem('vett_landing_goal');
    } catch { /* private mode — fall through to URL param */ }
    // Creative Attention has its own dedicated upload flow with per-asset
    // pricing — must NOT route through /setup (would create an orphan
    // mission with no media_type, blocked by the Bug 23.61 validator).
    if (goalId === 'creative_attention') {
      const dest = '/creative-attention/new';
      if (user) navigate(dest);
      else navigate(`/signin?redirect=${encodeURIComponent(dest)}`);
      return;
    }
    const qs = goalId ? `?goal=${encodeURIComponent(goalId)}` : '';
    if (user) {
      navigate(`/setup${qs}`);
    } else {
      navigate(`/signin?redirect=${encodeURIComponent(`/setup${qs}`)}`);
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
          survey, simulates your exact audience, and delivers insights in minutes,
          not weeks.
        </p>

        {/* Hero input shell */}
        <form
          onSubmit={handleHeroSubmit}
          className="w-full max-w-[720px] mt-9"
        >
          <div className="bg-bg2/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm focus-within:border-lime/40 transition-colors">
            {/* Pass 21 Bug 14: hero input prompt overlap.
                Two issues fixed:
                1. The flex-1 input had no `min-w-0`. Flex items default to
                   `min-width: auto` (= intrinsic content size). When the
                   typewriter rendered a long phrase, the input's intrinsic
                   width pushed siblings off — on desktop the >_ prompt and
                   on mobile the wrapped/extended placeholder could collide
                   with adjacent elements. `min-w-0` lets the input shrink
                   below its content's natural width and respect flex-1.
                2. `w-full` on the input fights flex-basis arithmetic — at
                   certain widths the browser computes 100% of parent + the
                   prompt's width, overflowing the row. Removed.
                Also added `truncate` semantics so a placeholder longer than
                the visible field clips with ellipsis instead of bleeding. */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3.5 md:px-5 md:py-4">
              {/* Pass 23 Bug 23.13 — restore the `>_` prompt on mobile.
                  Was hidden via `hidden md:inline-block` since Pass 21 to dodge
                  the input-overlap regression Bug 14 fixed; with `min-w-0`
                  + `truncate` on the input below, it now coexists fine on
                  narrow screens. Sits on its own row above the input on
                  mobile (column flex), inline on desktop. */}
              <span className="font-mono font-bold text-lime text-[16px] shrink-0 leading-none">
                &gt;_
              </span>
              <input
                ref={heroInputRef}
                type="text"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={handleHeroKeydown}
                onFocus={() => setHeroFocused(true)}
                onBlur={() => { if (!idea.trim()) setHeroFocused(false); }}
                placeholder={typewriterPlaceholder}
                aria-label="Research question"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none font-body text-[14px] md:text-[15px] text-t1 placeholder:text-t3 truncate"
              />
              <div className="flex items-center gap-2 md:shrink-0">
                <button
                  type="button"
                  aria-label="Attach file"
                  onClick={() => setShowUploadModal(true)}
                  className="hidden md:inline-flex relative w-9 h-9 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-t3 hover:text-t1 hover:bg-white/10 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                  {attachment && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-lime border-2 border-bg2" />
                  )}
                </button>
                {/* Pass 6C: w-full on mobile so the button fills the row (matching
                    the stacked LeadCaptureForm pattern). md:w-auto restores the
                    natural width on desktop when the form row is horizontal. */}
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  rounded="lg"
                  className="w-full md:w-auto shrink-0"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  VETT IT
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Attachment pill — shown when a file is attached */}
        {attachment && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.07] border border-white/10 text-[11px] text-t2">
            <Paperclip className="w-3 h-3 text-lime shrink-0" />
            <span className="truncate max-w-[200px]">{attachment.originalName}</span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              aria-label="Remove attachment"
              className="hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Upload modal */}
        {showUploadModal && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <div
              className="bg-bg2 border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-t1">
                    Attach a file to your brief
                  </h3>
                  <p className="text-xs text-t3 mt-0.5">
                    Images, PDFs, and CSVs up to 20 MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-t2 hover:text-t1 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <FileUpload
                bucket="vett-uploads"
                folder="landing-attachments"
                accept="image/jpeg,image/png,image/webp,application/pdf,text/csv"
                maxSizeMB={20}
                label="Upload image, PDF, or CSV"
                hint="PNG, JPG, PDF, CSV up to 20 MB"
                current={attachment}
                onUpload={(f) => {
                  setAttachment(f);
                  setShowUploadModal(false);
                  // Toast handled inside FileUpload; just close modal
                }}
                onRemove={() => setAttachment(null)}
              />

              <p className="text-xs text-t3 mt-3">
                Your file gives the AI more context when generating your research brief.
              </p>
            </div>
          </div>
        )}

        {/* Trust row */}
        <div className="mt-5 flex flex-col md:flex-row flex-wrap items-center justify-center gap-1.5 md:gap-3.5 font-body text-[12px] text-t3">
          <span>
            Surveys from <span className="text-lime font-bold">$35</span>
          </span>
          <Sep />
          <span>Results in minutes</span>
          <Sep />
          <span>150+ markets worldwide</span>
          <Sep />
          <span>Every respondent matches your audience</span>
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
            Agencies take a month and $10k. VETT takes minutes and from $35. Get the
            signal you need to move fast.
          </SecSub>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[900px] mx-auto">
            <StatCard n="$35" tail="" body="Starting price per mission. No subscriptions, ever." />
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
            From product validation to brand lift studies. If you can ask the
            question, VETT can research it. No methodology expertise required.
          </SecSub>
        </SectionCenter>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-w-[1100px] mx-auto">
          {RESEARCH_TYPES.map((rt) => (
            <button
              key={rt.title}
              type="button"
              onClick={() => goWithGoal(rt.goalId)}
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
          {/* Pass 6C: text-center on mobile, left-align restored at lg (2-col) */}
          <div className="text-center lg:text-left">
            <SecTag>✦ AI Consumer Research</SecTag>
            <SecH2>
              Consumer signals at scale.
              <br />
              <span className="text-lime">Simulated for your brief.</span>
            </SecH2>
            <SecSub>
              VETT generates distinct, realistic consumer personas calibrated to
              your exact target audience. Each responds independently with
              authentic variance, the same statistical patterns found in real
              market research.
            </SecSub>
            {/* mx-auto centers the feature block on mobile; lg:mx-0 removes on desktop */}
            <div className="mt-6 flex flex-col gap-3.5 max-w-fit mx-auto lg:mx-0">
              {AI_FEATS.map((f) => (
                <div key={f.title} className="flex gap-3 text-left">
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
          {/* Pass 6C: text-center on mobile, left-align restored at lg (2-col) */}
          <div className="text-center lg:text-left">
            <div className="font-display font-bold text-[10px] text-pur uppercase tracking-[0.12em] mb-3">
              ✦ New: Creative Attention Analysis
            </div>
            <SecH2>
              Know how your creative
              <br />
              <span className="text-lime">makes people feel.</span>
            </SecH2>
            <SecSub>
              Upload a video or image creative. VETT&apos;s AI simulates how your
              target audience emotionally responds, second by second. Attention,
              emotion, and engagement mapped before you spend on media.
            </SecSub>
            {/* mx-auto centers the feature block on mobile; lg:mx-0 removes on desktop */}
            <div className="mt-6 flex flex-col gap-3.5 max-w-fit mx-auto lg:mx-0">
              {ATTENTION_FEATS.map((f) => (
                <div key={f.title} className="flex gap-3 text-left">
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
              Emotion response, Meal Kit ad (30s)
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
                Frame-by-frame attention score (green = high attention · red = low)
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
                <th className="font-display font-extrabold text-[13px] text-t2 border-b border-b1 px-3 md:px-5 py-3.5"></th>
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
            <span className="text-lime">unfair, in the best way.</span>
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

      {/* ── Pricing teaser (4 named tiers — Pass 23 Bug 23.PRICING) ─────── */}
      <Section bg="bg2">
        <SectionCenter>
          <SecTag>✦ Pricing</SecTag>
          <SecH2>
            Pay per mission.
            <br />
            <span className="text-lime">No subscriptions.</span>
          </SecH2>
          <SecSub>
            Three flows, three ladders. Validate scales by respondents,
            Brand Lift starts at statistical sample sizes, Creative Attention
            is flat per-asset.
          </SecSub>
        </SectionCenter>
        {/* Pass 23 Bug 23.51 — tabbed pricing (Validate / Brand Lift /
            Creative Attention). Default tab: Validate (most common).
            Pass 23 Bug 23.63 — `goWithGoal` threaded through so the per-
            tab CTA sets the goal_type before routing to /setup or
            /creative-attention/new. */}
        <PricingTabbed goWithGoal={goWithGoal} />

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
          No subscription · Pay per mission · From $9 · 150+ markets · Every respondent matches your audience
        </p>
      </section>

      {/* ── Lead capture pre-footer ───────────────────────── */}
      <section className="px-6 md:px-10 py-16 bg-bg2 border-t border-b1">
        <div className="max-w-xl mx-auto text-center">
          <p className="font-display font-black text-white text-[clamp(22px,3vw,32px)] tracking-tight mb-2">
            Be first to know when new features ship
          </p>
          <p className="font-body text-[14px] text-t3 mb-6">
            No spam. Research drops, product updates, and the occasional MENA market insight.
          </p>
          <LeadCaptureForm
            cta="Notify me"
            page="landing_prefooter"
            placeholder="your@email.com"
            variant="inline"
            className="justify-center"
          />
        </div>
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
              {/* Pass 24 Bug 24.03 — Refund Policy link */}
              <Link to="/refunds" className="font-body text-[12px] text-t3 hover:text-lime transition-colors">
                Refunds
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── tiny local helpers ─────────────────────────────────────────── */

/**
 * Pass 23 Bug 23.51 + 23.63 — tabbed pricing teaser with goal-keyed
 * CTA. Three ladders (Validate / Brand Lift / Creative Attention) in a
 * tab switcher above the per-tab tier cards. Per-tab CTA below the
 * grid so the user can jump into the right setup flow without scrolling
 * back up to the goal-card grid.
 */
function PricingTabbed({ goWithGoal }: { goWithGoal: (goalId: string | null) => void }) {
  const [activeId, setActiveId] = useState<string>('validate');
  const active = PRICING_TABS.find((t) => t.id === activeId) ?? PRICING_TABS[0];
  const ctaCopy = active.id === 'creative_attention'
    ? 'Start a Creative Attention analysis'
    : active.id === 'brand_lift'
      ? 'Start a Brand Lift study'
      : 'Start a Validate mission';
  return (
    <div className="mt-10 max-w-[1100px] mx-auto">
      <div
        role="tablist"
        aria-label="Pricing by goal"
        className="flex flex-wrap items-center justify-center gap-2 mb-4"
      >
        {PRICING_TABS.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className={[
                'px-4 py-2 rounded-lg font-display font-bold text-[12px] uppercase tracking-widest transition-colors',
                isActive
                  ? 'bg-lime text-black border border-lime'
                  : 'bg-bg3 text-t2 border border-b2 hover:border-t3',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <p className="text-center font-body text-[13px] text-t3 max-w-[640px] mx-auto mb-6">
        {active.tagline}
      </p>
      <div
        className={[
          'grid gap-3',
          active.tiers.length <= 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
        ].join(' ')}
      >
        {active.tiers.map((t) => (
          <KpiCard
            key={t.label}
            label={t.label}
            value={t.price}
            sub={t.perResp ? `${t.range} · ${t.perResp}` : t.range}
            valueColor="lime"
          />
        ))}
      </div>
      {/* Pass 23 Bug 23.63 — per-tab CTA. Wires through goWithGoal so the
          right goal_type is preserved through any sign-in round-trip. */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => goWithGoal(active.id)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-lime/10 border border-lime/30 text-lime hover:bg-lime hover:text-black font-display font-bold text-[12px] uppercase tracking-widest transition-colors"
        >
          {ctaCopy} →
        </button>
      </div>
    </div>
  );
}

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
