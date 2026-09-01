/**
 * LandingV2Page - additive PREVIEW route at /landing-v2.
 *
 * A faithful React + Tailwind port of vett-final-mocks/vett-landing.html.
 *
 *   - This file does NOT touch `/` or `/landing`. LandingPage.tsx is
 *     byte-identical to origin/main; the live landing is unaffected.
 *   - Every behaviour the live landing has is preserved: the hero brief
 *     input with its typewriter placeholder, attachment handoff via
 *     sessionStorage, goal-card routing to /setup?goal=<id> (and
 *     creative_attention to /creative-attention/new), lead capture, and
 *     landing_view funnel tracking.
 *   - Pricing copy is the corrected LIVE ladder, not the mock's stale one.
 *     See src/components/landing-v2/PricingLadders.tsx.
 *
 * Design tokens extracted from the mock (both mocks share them):
 *   bg #0B0C15 · surface rgba(255,255,255,.025) · surface-2 .045
 *   border rgba(255,255,255,.07) · border-strong .13
 *   lime #BEF264 · lime-soft rgba(190,242,100,.13) · border-lime .22
 *   indigo #6366F1 · indigo-2 #7C7BF5 · indigo-soft .16 · border-indigo .32
 *   amber #F2B24A · rose #F2748C · mint #A6E0CF
 *   text #F3F5EF · muted #8B919C · faint #5C6470 · track #1B1E2B
 *   radii 22 / 18 / 15 / 11px · container 1200px, 28px gutter (16px < 600)
 *   display Manrope 700/800, body Inter 400/500/600
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Paperclip, X } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { trackFunnel, landingMetadata } from '../lib/funnelTrack';
import { useTypewriterPlaceholder } from '../hooks/useTypewriterPlaceholder';
import { getGoalById } from '../data/missionGoals';
import { Logo } from '../components/ui/Logo';
import { LeadCaptureForm } from '../components/marketing/LeadCaptureForm';
import { FileUpload, type UploadedFile } from '../components/shared/FileUpload';

import {
  Eyebrow,
  Reveal,
  SectionHead,
  V2Button,
  Wrap,
} from '../components/landing-v2/primitives';
import { useCountUp, useInView } from '../components/landing-v2/hooks';
import { LiveMission } from '../components/landing-v2/LiveMission';
import {
  BrandRadarPanel,
  CreativeAttentionPanel,
  NpsPanel,
  PriceSensitivityPanel,
} from '../components/landing-v2/panels';
import { PricingLadders } from '../components/landing-v2/PricingLadders';

import '../styles/landing-v2.css';

/* ══════════════════════════════════════════════════════════════════════
   Content - copy taken verbatim from vett-landing.html except where the
   mock is stale on pricing (flagged inline).
════════════════════════════════════════════════════════════════════════ */

const HERO_PHRASES = [
  'Will premium plant-based ready-meals sell in Saudi Arabia?',
  'What price maximises revenue for our chilled meal kit in the UAE?',
  'Which tagline lands best with Gulf gym-goers?',
  'Test this ad creative with women 25 to 40 in Cairo.',
];

const COMPANY_LOGOS = ['Google', 'Uber', 'Stripe', 'Airbnb', 'Noon', 'Careem'];

const SPEED_STATS = [
  { value: 9, prefix: '$', suffix: '', label: 'Starting price per mission. No subscriptions, ever.' },
  { value: 2, prefix: '', suffix: 'min', label: 'Average time from launch to full research insights.' },
  { value: 150, prefix: '', suffix: '+', label: 'Markets worldwide. Any country, any city.' },
];

/**
 * The mock's 12 research cards. `goalId` and `tag` come from the LIVE
 * landing (src/pages/LandingPage.tsx RESEARCH_TYPES) so the grid routes
 * correctly and quotes true prices - the mock has several cards tagged
 * "COMING SOON" that are live today, and tags Pricing Research at $99
 * without naming Creative Attention's $19 floor.
 */
const RESEARCH_TYPES: Array<{
  emoji: string;
  title: string;
  desc: string;
  tag: string;
  /** Indigo tag treatment. The mock uses it for its 'COMING SOON' cards;
   *  here it marks the newest flow, which is live and priced. */
  accent?: boolean;
  goalId: string;
}> = [
  { emoji: '🚀', title: 'Product Validation',          desc: 'Test if your idea has real demand before building. Find your PMF signal fast.',                    tag: 'FROM $9',  goalId: 'validate' },
  { emoji: '💰', title: 'Pricing Research',            desc: 'Find the exact price point that maximises revenue. Van Westendorp + WTP analysis.',                tag: 'FROM $99', goalId: 'pricing' },
  { emoji: '📣', title: 'Creative & Ad Testing',       desc: 'Test ad copy, visuals, and messaging before you spend a dollar on media.',                         tag: 'FROM $9',  goalId: 'marketing' },
  { emoji: '⭐', title: 'Customer Satisfaction',       desc: 'Measure CSAT, NPS, and satisfaction across product dimensions at any scale.',                      tag: 'FROM $99', goalId: 'satisfaction' },
  { emoji: '🗺️', title: 'Feature Roadmap',             desc: 'Let your users tell you what to build next. Kano model prioritisation.',                          tag: 'FROM $99', goalId: 'roadmap' },
  { emoji: '🌍', title: 'Market Entry',                desc: 'Validate demand in new geographies before expanding. Test any country, any city.',                 tag: 'FROM $9',  goalId: 'market_entry' },
  { emoji: '📡', title: 'Brand Lift Study',            desc: 'Measure brand awareness, recall, sentiment and purchase intent before and after campaigns.',        tag: 'FROM $99', goalId: 'brand_lift' },
  { emoji: '🎬', title: 'Creative Attention Analysis', desc: 'Measure emotional response, attention, and engagement on your video or image creatives with research-grade emotion mapping.', tag: 'FROM $19', accent: true, goalId: 'creative_attention' },
  { emoji: '🔄', title: 'Churn Research',              desc: 'Understand why customers leave and what would bring them back. Simulate your churned segment.',      tag: 'FROM $99', goalId: 'churn_research' },
  { emoji: '🔍', title: 'Competitor Analysis',         desc: 'Benchmark your brand against competitors on key dimensions. Brand association mapping.',            tag: 'FROM $99', goalId: 'competitor' },
  { emoji: '🎯', title: 'Audience Profiling',          desc: 'Build a deep psychographic and behavioural profile of your target customer segment.',               tag: 'FROM $9',  goalId: 'audience_profiling' },
  { emoji: '✍️', title: 'Naming & Messaging',          desc: 'Test product names, taglines, and positioning across your target audience.',                       tag: 'FROM $9',  goalId: 'naming_messaging' },
];

const LOOP_STEPS = [
  { n: 1, title: 'Describe', body: 'Drop your research question in plain language. Upload an image or video for creative testing. No survey expertise needed.' },
  { n: 2, title: 'Strategy', body: "VETT's AI clarifies your brief with 3 quick questions, then builds a surgical survey with the right question types and targeting." },
  { n: 3, title: 'Simulate', body: 'AI generates your exact respondent count: distinct personas with unique demographics, behaviours, and opinions. Every respondent matches your audience. We recruit until your target is met or your screener proves too strict.' },
  { n: 4, title: 'Insights', body: 'Charts, AI insights per question, executive summary, and two recommended next studies. PDF, PPT, and XLS included free.' },
];

const PERSONA_FEATS = [
  { ico: '🎯', title: 'Distinct, realistic personas',            body: 'Every respondent is unique, with a different background, opinion, and voice. No uniform answers, no synthetic patterns.' },
  { ico: '📊', title: 'Statistically valid variance',            body: 'Rating scales follow bell curves. NPS includes detractors, passives, and promoters in realistic market splits.' },
  { ico: '⚡', title: 'Every respondent matches your audience',  body: 'You set the number; every persona is generated to match your screener spec, not filtered against it. We recruit until your target is met; a very strict screener may deliver fewer, with insights honest about the sample.' },
];

const PERSONAS = [
  { name: 'Fatima A., 31', meta: 'Marketing Director · Dubai, UAE',      id: '#001', color: '#BEF264' },
  { name: 'Kwame O., 28',  meta: 'Software Engineer · Lagos, Nigeria',   id: '#002', color: '#7C7BF5' },
  { name: 'Ana L., 35',    meta: 'Brand Manager · São Paulo, Brazil',    id: '#003', color: '#F2B24A' },
  { name: 'Khalid M., 42', meta: 'Finance Director · Riyadh, KSA',       id: '#004', color: '#A6E0CF' },
  { name: 'Mei X., 26',    meta: 'Product Manager · Singapore',          id: '#005', color: '#F2748C' },
];

const PRICING_FEATS = [
  { ico: '💸', title: 'Optimal price point',          body: 'The price where the fewest people call it too cheap or too expensive.' },
  { ico: '📐', title: 'Range of acceptable pricing',  body: 'The floor and ceiling your audience tolerates before they walk away.' },
  { ico: '📈', title: 'Revenue-maximising read',      body: 'Van Westendorp plus willingness to pay, mapped to your segment.' },
];

const ATTENTION_FEATS = [
  { ico: '😮', title: 'Emotion timeline',   body: 'Joy, surprise, trust, anticipation, fear, all mapped frame by frame across your video.' },
  { ico: '👁️', title: 'Attention heatmap',  body: 'Visual heatmap shows where attention peaks and drops across your image or video frames.' },
  { ico: '📈', title: 'Engagement score',   body: 'Overall creative effectiveness score. Know if it works before it runs.' },
];

const COMPARISON: Array<[string, string, string, string]> = [
  ['Time to results',  'Minutes',                   '4 to 8 weeks',             'Days (if lucky)'],
  ['Survey design',    'AI-built instantly',        'Human researcher',         'You do it all'],
  ['Respondents',      'AI consumer panel',         'Recruited panel',          'Your own network'],
  ['Starting price',   'From $9',                   '$10,000+ per study',       'Free but limited'],
  ['AI insights',      'Per data point',            'Manual deck, weeks later', 'None included'],
  ['Reports',          'PDF + PPT + XLS free',      'PDF, weeks later',         'CSV only'],
  ['Creative testing', 'Video + image + emotions',  'Separate study, months',   'Not available'],
];

const TESTIMONIALS = [
  { quote: 'Saved us 4 weeks and $20k on a pricing study. The recommended price point matched our actual launch data within $2.', name: 'Sara K.',  role: 'CMO, fintech startup · Dubai' },
  { quote: "I've never had research turn around this fast. The AI personas feel startlingly real, with opinions, hesitations, caveats and all.", name: 'Ahmed M.', role: 'Founder · Riyadh' },
  { quote: 'Replaced our entire custom research budget for early-stage discovery. This is category-defining work.', name: 'Omar S.', role: 'Head of Insights · Cairo' },
];

/* ══════════════════════════════════════════════════════════════════════
   Page
════════════════════════════════════════════════════════════════════════ */

export function LandingV2Page() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ---- funnel tracking (same event + metadata as the live landing) ---- */
  useEffect(() => {
    trackFunnel('landing_view', landingMetadata());
  }, []);

  /* ---- hero brief input ------------------------------------------------ */
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('q') || '';
  }, []);
  const [idea, setIdea] = useState(initialQuery);
  const [heroFocused, setHeroFocused] = useState(false);
  const heroPaused = heroFocused || idea.trim().length > 0;
  const typewriterPlaceholder = useTypewriterPlaceholder({
    phrases: HERO_PHRASES,
    paused: heroPaused,
  });

  const [attachment, setAttachment] = useState<UploadedFile | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const launchMission = useCallback(() => {
    const trimmed = idea.trim();
    const qs = trimmed ? `?q=${encodeURIComponent(trimmed)}` : '';
    try {
      if (attachment) {
        sessionStorage.setItem('vett_landing_attachment', JSON.stringify(attachment));
      } else {
        sessionStorage.removeItem('vett_landing_attachment');
      }
    } catch {
      /* private mode - the attachment simply does not carry over */
    }
    if (user) navigate(`/setup${qs}`);
    else navigate(`/signin?redirect=${encodeURIComponent(`/setup${qs}`)}`);
  }, [idea, attachment, user, navigate]);

  const handleHeroSubmit = (e: FormEvent) => {
    e.preventDefault();
    launchMission();
  };

  const goSignIn = () => navigate('/signin');
  const goVettIt = () => {
    if (user) navigate('/setup');
    else navigate('/signin?redirect=/setup');
  };

  /**
   * Goal-aware routing, identical to the live landing:
   *   comingSoon goal  -> /methodologies
   *   creative_attention -> /creative-attention/new (dedicated upload flow)
   *   anything else    -> /setup?goal=<id>
   * Unauthed users get wrapped in /signin?redirect=...
   */
  const goWithGoal = useCallback(
    (goalId: string | null) => {
      if (goalId && getGoalById(goalId)?.comingSoon) {
        navigate('/methodologies');
        return;
      }
      try {
        if (goalId) sessionStorage.setItem('vett_landing_goal', goalId);
        else sessionStorage.removeItem('vett_landing_goal');
      } catch {
        /* private mode - fall through to the URL param */
      }
      if (goalId === 'creative_attention') {
        const dest = '/creative-attention/new';
        if (user) navigate(dest);
        else navigate(`/signin?redirect=${encodeURIComponent(dest)}`);
        return;
      }
      const qs = goalId ? `?goal=${encodeURIComponent(goalId)}` : '';
      if (user) navigate(`/setup${qs}`);
      else navigate(`/signin?redirect=${encodeURIComponent(`/setup${qs}`)}`);
    },
    [user, navigate],
  );

  /* ---- cursor-follow glow (mock: #glow) -------------------------------- */
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.opacity = '1';
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="lv2-root relative min-h-[100dvh] bg-[#0B0C15] text-[#F3F5EF] font-['Inter',system-ui,sans-serif] leading-[1.55] antialiased overflow-x-hidden">
      {/* ── layered aurora + grain + cursor glow ─────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="lv2-aurora-1 absolute rounded-full blur-[90px] opacity-50 w-[780px] h-[620px] -top-[260px] left-1/2 -translate-x-1/2 bg-[radial-gradient(circle,rgba(99,102,241,0.4),transparent_62%)]" />
        <div className="lv2-aurora-2 absolute rounded-full blur-[90px] opacity-50 w-[620px] h-[520px] -top-[120px] -right-[160px] bg-[radial-gradient(circle,rgba(190,242,100,0.22),transparent_65%)]" />
      </div>
      <div className="lv2-grain fixed inset-0 z-[1] pointer-events-none opacity-[0.035] mix-blend-overlay" aria-hidden />
      <div
        ref={glowRef}
        aria-hidden
        className="fixed w-[560px] h-[560px] rounded-full pointer-events-none z-[1] opacity-0 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-[400ms] bg-[radial-gradient(circle,rgba(124,123,245,0.07),transparent_60%)]"
      />

      {/* ══ NAV ═══════════════════════════════════════════════════════
          The mock's nav diverges from the shared ui/TopNav (translucent
          #0B0C15 at 72%, bottom hairline, 1200px inner, and no mobile
          drawer - it hides the ghost CTA under 600px instead). Built here
          rather than mutating TopNav, which other pages render. The brand
          MARK is the shared ui/Logo. */}
      <nav className="sticky top-0 z-50 bg-[rgba(11,12,21,0.72)] backdrop-blur-[18px] backdrop-saturate-[1.4] border-b border-white/[0.07]">
        <div className="max-w-[1200px] mx-auto px-4 min-[600px]:px-7 py-[13px] flex items-center justify-between gap-5">
          <Link to="/landing-v2" aria-label="VETT home" className="flex items-center gap-[11px]">
            <Logo size="sm" iconOnly />
            <span className="font-['Manrope',system-ui,sans-serif] font-extrabold tracking-[0.06em] text-[19px]">
              VETT
            </span>
          </Link>
          <div className="flex gap-2.5 items-center">
            <V2Button variant="ghost" onClick={goSignIn} className="hidden min-[600px]:inline-flex">
              Sign In
            </V2Button>
            <V2Button variant="indigo" onClick={goVettIt}>
              VETT IT
            </V2Button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <Wrap as="header" className="text-center pt-[66px] pb-9 flex flex-col items-center">
        <span className="lv2-heroup delay-[20ms]">
          <Eyebrow pill>AI Consumer Research Platform</Eyebrow>
        </span>

        <h1 className="font-['Manrope',system-ui,sans-serif] font-extrabold tracking-[-0.028em] leading-[1.04] text-[clamp(46px,7.6vw,100px)] mt-[22px] text-balance">
          <span className="lv2-heroup delay-[120ms] inline-block">Stop guessing.</span>
          <br />
          <span className="lv2-heroup delay-[260ms] relative inline-block text-[#BEF264] [text-shadow:0_10px_40px_rgba(190,242,100,0.26)]">
            VETT it.
            <i className="lv2-uline absolute left-[1%] right-[1%] bottom-1.5 h-[5px] rounded-[5px] bg-[linear-gradient(90deg,transparent,#BEF264_18%,#E6FFA8_50%,#BEF264_82%,transparent)] shadow-[0_6px_22px_rgba(190,242,100,0.45)]" />
          </span>
        </h1>

        <p className="lv2-heroup delay-[400ms] text-[#8B919C] text-[18px] max-w-[52ch] mx-auto mt-6">
          Describe your research question in plain language. VETT&apos;s AI builds the survey,
          simulates your exact audience, and delivers insights in minutes, not weeks.
        </p>

        {/* Mock's `.terminal`, wired to the real brief input. */}
        <form
          onSubmit={handleHeroSubmit}
          className="lv2-heroup delay-[520ms] relative overflow-hidden mt-9 w-full max-w-[730px] flex items-center gap-3.5 rounded-[18px] border border-white/[0.13] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] pl-5 pr-[13px] py-[13px] shadow-[0_30px_80px_-30px_rgba(99,102,241,0.5)] after:content-[''] after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(124,123,245,0.6),transparent)]"
        >
          <span className="font-['Manrope',system-ui,sans-serif] font-extrabold text-[18px] text-[#BEF264] shrink-0" aria-hidden>
            &gt;_
          </span>
          {/* The mock renders the typed question as page text with a lime block
              cursor. We keep a REAL <input> underneath (so the brief is
              typeable and submittable) and paint the typewriter line over it
              only while the field is empty and unfocused. */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onFocus={() => setHeroFocused(true)}
              onBlur={() => setHeroFocused(false)}
              placeholder={heroPaused ? 'Describe your research question' : ''}
              aria-label="Describe your research question"
              className="w-full bg-transparent border-0 p-0 text-left text-[16px] text-[#F3F5EF] placeholder:text-[#5C6470] focus:outline-none focus:ring-0 min-h-[24px]"
            />
            {!heroPaused && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center text-[16px] text-[#F3F5EF] whitespace-nowrap overflow-hidden"
              >
                {typewriterPlaceholder}
                <i className="lv2-cursor inline-block w-[9px] h-5 bg-[#BEF264] ml-[3px] shrink-0" />
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            aria-label="Attach a file to your brief"
            className={[
              'w-10 h-10 rounded-[11px] grid place-items-center shrink-0 border transition-colors',
              attachment
                ? 'bg-[rgba(190,242,100,0.13)] border-[rgba(190,242,100,0.22)] text-[#BEF264]'
                : 'bg-white/[0.045] border-white/[0.07] text-[#8B919C] hover:text-[#F3F5EF]',
            ].join(' ')}
          >
            <Paperclip className="w-[18px] h-[18px]" />
          </button>
          <V2Button variant="indigo" type="submit" className="shrink-0">
            VETT IT
            <ArrowRight className="w-[15px] h-[15px]" strokeWidth={2.4} />
          </V2Button>
        </form>

        <div className="lv2-heroup delay-[640ms] flex flex-wrap justify-center gap-x-[22px] gap-y-2 mt-[22px] text-[13.5px] text-[#8B919C]">
          <span>
            Surveys from <b className="text-[#BEF264] font-bold">$9</b>
          </span>
          <span className="text-[#5C6470]">&middot;</span>
          <span>Results in minutes</span>
          <span className="text-[#5C6470]">&middot;</span>
          <span>150+ markets worldwide</span>
          <span className="text-[#5C6470]">&middot;</span>
          <span>Every respondent matches your audience</span>
        </div>

        <Link
          to="/methodology"
          className="lv2-heroup delay-[700ms] mt-[18px] inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#BEF264] hover:underline underline-offset-4"
        >
          See the methodology behind every mission <ArrowRight className="w-4 h-4" />
        </Link>
      </Wrap>

      {/* ══ LOGO WALL ═════════════════════════════════════════════════ */}
      <Wrap className="pt-[26px] pb-1.5 text-center">
        <div className="text-[11px] tracking-[0.2em] uppercase text-[#5C6470] font-semibold mb-[22px]">
          Powering decisions for builders at
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-[54px] gap-y-[18px]">
          {COMPANY_LOGOS.map((name) => (
            <span
              key={name}
              className="font-['Manrope',system-ui,sans-serif] font-bold text-2xl text-[#4A5160] tracking-[-0.01em] transition-colors duration-200 hover:text-[#9aa1ad]"
            >
              {name}
            </span>
          ))}
        </div>
      </Wrap>

      {/* ══ BUILT FOR SPEED ═══════════════════════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <Reveal>
          <SectionHead
            eyebrow="Built for speed"
            title={
              <>
                Research in minutes.
                <br />
                Not 4 weeks.
              </>
            }
            body="Agencies take a month and $10k. VETT takes minutes and from $9. Get the signal you need to move fast."
          />
        </Reveal>
        <div className="grid grid-cols-1 min-[980px]:grid-cols-3 gap-5 mt-2">
          {SPEED_STATS.map((s, i) => (
            <Reveal key={s.label} delay={(i + 1) as 1 | 2 | 3}>
              <SpeedStat {...s} />
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* ══ SEE IT RUN ════════════════════════════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <Reveal>
          <SectionHead
            center
            eyebrow="See it run"
            title="Watch a mission simulate live."
            body="Pick a question. VETT generates your panel, every respondent matched to your audience, and reads the signal in seconds."
          />
        </Reveal>
        <Reveal delay={1}>
          <LiveMission />
        </Reveal>
      </Wrap>

      {/* ══ RESEARCH TYPES ════════════════════════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <Reveal>
          <SectionHead
            eyebrow="Run any research"
            title={
              <>
                Every type of research.
                <br />
                One platform.
              </>
            }
            body="From product validation to brand lift studies. If you can ask the question, VETT can research it. No methodology expertise required."
          />
        </Reveal>
        <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[980px]:grid-cols-3 gap-4">
          {RESEARCH_TYPES.map((r, i) => (
            <Reveal key={r.title} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <button
                type="button"
                onClick={() => goWithGoal(r.goalId)}
                className="h-full w-full text-left bg-white/[0.025] border border-white/[0.07] rounded-[18px] p-6 transition-all duration-200 hover:border-[rgba(190,242,100,0.22)] hover:-translate-y-1 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BEF264]/60"
              >
                <span className="text-[26px] block mb-3.5" aria-hidden>
                  {r.emoji}
                </span>
                <h3 className="font-['Manrope',system-ui,sans-serif] font-bold text-[16.5px] mb-2">
                  {r.title}
                </h3>
                <p className="text-[#8B919C] text-[13.5px] min-h-[38px]">{r.desc}</p>
                <span
                  className={[
                    'inline-block mt-3.5 text-[10.5px] font-bold tracking-[0.1em] px-[11px] py-[5px] rounded-[7px] border',
                    r.accent
                      ? 'bg-[rgba(99,102,241,0.12)] text-[#A9AAFB] border-[rgba(99,102,241,0.32)]'
                      : 'bg-[rgba(190,242,100,0.13)] text-[#BEF264] border-[rgba(190,242,100,0.22)]',
                  ].join(' ')}
                >
                  {r.tag}
                </span>
              </button>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-7 text-[#8B919C] text-[15px]">
            Not seeing your use case? Just describe it{' '}
            <button
              type="button"
              onClick={() => goWithGoal(null)}
              className="text-[#BEF264] font-semibold hover:underline"
            >
              &rarr; VETT&apos;s AI will figure out the right approach.
            </button>
            <br />
            <Link
              to="/methodologies"
              className="inline-block mt-2 text-[#BEF264] font-semibold hover:underline"
            >
              Or browse the methodology library &rarr;
            </Link>
          </div>
        </Reveal>
      </Wrap>

      {/* ══ THE INTELLIGENCE LOOP ═════════════════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <Reveal>
          <SectionHead eyebrow="How it works" title="The Intelligence Loop" body="Zero friction. Total clarity." />
        </Reveal>
        <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[980px]:grid-cols-4 gap-[18px]">
          {LOOP_STEPS.map((s, i) => (
            <Reveal key={s.n} delay={(i + 1) as 1 | 2 | 3 | 4}>
              <div className="h-full bg-white/[0.025] border border-white/[0.07] rounded-[22px] p-[26px] transition-all duration-200 hover:border-white/[0.13] hover:-translate-y-[3px]">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[rgba(190,242,100,0.13)] border border-[rgba(190,242,100,0.22)] text-[#BEF264] font-['Manrope',system-ui,sans-serif] font-extrabold grid place-items-center text-[16px] mb-4">
                  {s.n}
                </div>
                <h3 className="font-['Manrope',system-ui,sans-serif] font-bold text-[18px] mb-[9px]">
                  {s.title}
                </h3>
                <p className="text-[#8B919C] text-[13.5px]">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* ══ PERSONAS ══════════════════════════════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <div className="grid grid-cols-1 min-[980px]:grid-cols-2 gap-11 items-center">
          <Reveal>
            <Eyebrow>AI consumer research</Eyebrow>
            <SplitHeading>
              Consumer signals at scale.{' '}
              <span className="text-[#BEF264]">Simulated for your brief.</span>
            </SplitHeading>
            <p className="text-[#8B919C] text-[16px] mt-[18px]">
              VETT generates distinct, realistic consumer personas calibrated to your exact target
              audience. Each responds independently with its own perspective and reasoning &mdash;
              authentic variance, not uniform answers.
            </p>
            <FeatureList items={PERSONA_FEATS} tone="lime" />
          </Reveal>

          <Reveal delay={1}>
            <div className="relative overflow-hidden rounded-[24px] border border-white/[0.13] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012))] shadow-[0_30px_80px_-50px_rgba(99,102,241,0.5)] after:content-[''] after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(124,123,245,0.6),transparent)]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] tracking-[0.18em] uppercase text-[#5C6470] font-semibold">
                    Live persona generation
                  </span>
                  <span className="flex items-center gap-[7px] text-[11.5px] text-[#BEF264]">
                    <i className="lv2-livedot w-[7px] h-[7px] rounded-full bg-[#BEF264]" />
                    generating
                  </span>
                </div>
                {PERSONAS.map((p, i) => (
                  <PersonaRow key={p.id} persona={p} index={i} />
                ))}
                <div className="text-center text-[#8B919C] text-[13px] mt-3.5">
                  + <b className="text-[#BEF264]">95 more</b> personas generated for this mission
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Wrap>

      {/* ══ PRICING RESEARCH (Van Westendorp) ═════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <div className="grid grid-cols-1 min-[980px]:grid-cols-2 gap-11 items-center">
          <Reveal>
            <Eyebrow>Pricing research</Eyebrow>
            <SplitHeading>
              Find the price the market
              <br />
              <span className="text-[#BEF264]">will actually pay.</span>
            </SplitHeading>
            <p className="text-[#8B919C] text-[16px] mt-[18px]">
              VETT runs a Van Westendorp price sensitivity analysis on your exact audience. See the
              optimal price point and the range your customers will accept, before you commit to a
              number.
            </p>
            <FeatureList items={PRICING_FEATS} tone="indigo" />
            <V2Button variant="outline" size="lg" className="mt-6" onClick={() => goWithGoal('pricing')}>
              Run a pricing study &rarr;
            </V2Button>
          </Reveal>
          <Reveal delay={1}>
            <PriceSensitivityPanel />
          </Reveal>
        </div>
      </Wrap>

      {/* ══ CREATIVE ATTENTION ════════════════════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <div className="grid grid-cols-1 min-[980px]:grid-cols-2 gap-11 items-center">
          <Reveal>
            <Eyebrow>New: Creative Attention Analysis</Eyebrow>
            <SplitHeading>
              Know how your creative
              <br />
              makes people feel.
            </SplitHeading>
            <p className="text-[#8B919C] text-[16px] mt-[18px]">
              Upload a video or image creative. VETT&apos;s AI simulates how your target audience
              emotionally responds, second by second. Attention, emotion, and engagement mapped
              before you spend on media.
            </p>
            <FeatureList items={ATTENTION_FEATS} tone="indigo" />
            <V2Button
              variant="outline"
              size="lg"
              className="mt-6"
              onClick={() => goWithGoal('creative_attention')}
            >
              Analyse a creative &rarr;
            </V2Button>
          </Reveal>
          <Reveal delay={1}>
            <CreativeAttentionPanel />
          </Reveal>
        </div>
      </Wrap>

      {/* ══ MORE RESEARCH TYPES (NPS + radar) ═════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <Reveal>
          <SectionHead
            center
            eyebrow="More research types"
            title="Every question, answered visually."
            body="Satisfaction tracking, competitive positioning, and beyond. Same loop every time: ask in plain language, simulate your audience, read the signal."
          />
        </Reveal>
        <div className="grid grid-cols-1 min-[980px]:grid-cols-2 gap-[18px]">
          <Reveal delay={1}>
            <NpsPanel />
          </Reveal>
          <Reveal delay={2}>
            <BrandRadarPanel />
          </Reveal>
        </div>
      </Wrap>

      {/* ══ COMPARISON TABLE ══════════════════════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <Reveal>
          <SectionHead
            center
            title={
              <>
                Research that moves
                <br />
                at the speed of your ideas.
              </>
            }
          />
        </Reveal>
        <Reveal delay={1}>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 border border-white/[0.07] rounded-[22px] overflow-hidden min-w-[640px]">
              <thead>
                <tr>
                  <th className="px-5 py-[18px] text-left border-b border-white/[0.07]" />
                  <th className="px-5 py-[18px] text-left text-[13px] tracking-[0.04em] font-['Manrope',system-ui,sans-serif] font-bold border-b border-white/[0.07] text-[#BEF264] bg-[rgba(190,242,100,0.05)]">
                    VETT
                  </th>
                  <th className="px-5 py-[18px] text-left text-[13px] tracking-[0.04em] font-['Manrope',system-ui,sans-serif] font-bold border-b border-white/[0.07] bg-white/[0.045]">
                    Research Agency
                  </th>
                  <th className="px-5 py-[18px] text-left text-[13px] tracking-[0.04em] font-['Manrope',system-ui,sans-serif] font-bold border-b border-white/[0.07] bg-white/[0.045]">
                    DIY Survey Tool
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([row, vett, agency, diy], i) => {
                  const last = i === COMPARISON.length - 1;
                  const cell = `px-5 py-[18px] text-[14.5px] ${last ? '' : 'border-b border-white/[0.07]'}`;
                  return (
                    <tr key={row}>
                      <td className={`${cell} text-[#8B919C] font-medium`}>{row}</td>
                      <td className={`${cell} text-[#F3F5EF] font-semibold bg-[rgba(190,242,100,0.05)]`}>
                        <span className="text-[#BEF264] mr-[7px]">&#10003;</span>
                        {vett}
                      </td>
                      <td className={cell}>{agency}</td>
                      <td className={cell}>{diy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Wrap>

      {/* ══ TESTIMONIALS ══════════════════════════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <Reveal>
          <SectionHead
            center
            eyebrow="Trusted by builders"
            title={
              <>
                Research this fast feels
                <br />
                unfair, in the best way.
              </>
            }
          />
        </Reveal>
        <div className="grid grid-cols-1 min-[980px]:grid-cols-3 gap-[18px]">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={(i + 1) as 1 | 2 | 3}>
              <figure className="h-full bg-white/[0.025] border border-white/[0.07] rounded-[22px] p-7 transition-all duration-200 hover:border-[rgba(190,242,100,0.22)] hover:-translate-y-[3px]">
                <blockquote className="text-[15.5px] leading-[1.6] text-[#E2E5DF]">
                  &quot;{t.quote}&quot;
                </blockquote>
                <figcaption className="mt-5 flex flex-col gap-0.5">
                  <span className="font-['Manrope',system-ui,sans-serif] font-bold text-[14.5px]">
                    {t.name}
                  </span>
                  <span className="text-[#8B919C] text-[13px]">{t.role}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* ══ PRICING ═══════════════════════════════════════════════════ */}
      <Wrap as="section" className="py-[92px]">
        <Reveal>
          <SectionHead
            center
            eyebrow="Pricing"
            title={
              <>
                Pay per mission.
                <br />
                No subscriptions.
              </>
            }
            body="Three flows, three ladders. Validate scales by respondents, Brand Lift starts at statistical sample sizes, Creative Attention is charged flat per respondent bracket."
          />
        </Reveal>
        <Reveal delay={1}>
          {/* Ladder ids are canonical goal_type values, so the CTA routes
              through the same goal-aware navigator as the research grid. */}
          <PricingLadders onCta={goWithGoal} />
        </Reveal>
      </Wrap>

      {/* ══ FINAL CTA + LEAD CAPTURE ══════════════════════════════════ */}
      <Wrap as="section" className="py-[100px] text-center">
        <Reveal>
          <div className="relative overflow-hidden rounded-[30px] border border-white/[0.13] bg-[linear-gradient(160deg,rgba(99,102,241,0.14),rgba(190,242,100,0.04))] px-[22px] py-9 min-[600px]:px-10 min-[600px]:py-16 after:content-[''] after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(124,123,245,0.6),transparent)]">
            <h2 className="font-['Manrope',system-ui,sans-serif] font-extrabold text-[clamp(34px,4.6vw,58px)] tracking-[-0.025em] leading-[1.04]">
              Launch your first mission
            </h2>
            <p className="text-[#5C6470] text-[13.5px] mt-4 mb-2">No credit card required to start</p>
            <p className="text-[#8B919C] text-[17px] max-w-[48ch] mx-auto mb-7">
              Your next business decision shouldn&apos;t be a guess. Get research-grade insights from
              AI-simulated audiences. In minutes.
            </p>
            <V2Button variant="indigo" size="lg" onClick={goVettIt}>
              VETT IT
            </V2Button>

            <div className="flex flex-wrap justify-center gap-x-[18px] gap-y-2 mt-[26px] text-[13px] text-[#5C6470]">
              <span>No subscription</span>
              <span>&middot;</span>
              <span>Pay per mission</span>
              <span>&middot;</span>
              <span>From $9</span>
              <span>&middot;</span>
              <span>150+ markets</span>
              <span>&middot;</span>
              <span>Every respondent matches your audience</span>
            </div>

            <div className="mt-10 pt-[34px] border-t border-white/[0.07] max-w-[520px] mx-auto">
              <h3 className="font-['Manrope',system-ui,sans-serif] font-bold text-[18px]">
                Be first to know when new features ship
              </h3>
              <p className="text-[#8B919C] text-[13.5px] mt-2 mb-[18px]">
                No spam. Research drops, product updates, and the occasional MENA market insight.
              </p>
              <LeadCaptureForm
                cta="Notify me"
                page="landing-v2"
                placeholder="you@company.com"
                variant="inline"
                className="justify-center"
              />
            </div>
          </div>
        </Reveal>
      </Wrap>

      {/* ══ FOOTER ════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.07] pt-[54px] pb-[38px] relative z-[2]">
        <Wrap flush={false}>
          <div className="flex justify-between gap-[30px] flex-wrap items-start">
            <div className="max-w-[280px]">
              <div className="flex items-center gap-[11px]">
                <Logo size="sm" iconOnly />
                <span className="font-['Manrope',system-ui,sans-serif] font-extrabold tracking-[0.06em] text-[19px]">
                  VETT
                </span>
              </div>
              <p className="text-[#5C6470] text-[14px] mt-3.5 font-['Manrope',system-ui,sans-serif] font-semibold">
                The operating system
                <br />
                for market intelligence.
              </p>
            </div>
            <div className="flex gap-[54px] flex-wrap">
              <FooterCol
                title="Company"
                links={[
                  ['About Us', '/about'],
                  ['Careers', '/careers'],
                  ['Contact', '/contact'],
                ]}
              />
              <FooterCol
                title="Resources"
                links={[
                  ['Methodology', '/methodology'],
                  ['Blog', '/blog'],
                  ['API', '/api'],
                  ['Help Center', '/help'],
                ]}
              />
              <div>
                <h4 className="text-[11px] tracking-[0.16em] uppercase text-[#5C6470] mb-3.5">
                  Connect
                </h4>
                <span className="block text-[#8B919C] text-[14px] mb-2.5">Dubai, UAE</span>
                <a
                  href="mailto:hello@vettit.ai"
                  className="block text-[14px] text-[#8B919C] mb-2.5 hover:text-[#F3F5EF] transition-colors"
                >
                  hello@vettit.ai
                </a>
              </div>
            </div>
          </div>
          <div className="mt-[42px] pt-6 border-t border-white/[0.07] text-[12.5px] text-[#5C6470] flex justify-between flex-wrap gap-3.5">
            <span>&copy; {new Date().getFullYear()} VETT Inc. All rights reserved.</span>
            <span>
              <Link to="/privacy" className="ml-[18px] hover:text-[#8B919C] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="ml-[18px] hover:text-[#8B919C] transition-colors">
                Terms of Service
              </Link>
              <Link to="/refunds" className="ml-[18px] hover:text-[#8B919C] transition-colors">
                Refunds
              </Link>
            </span>
          </div>
        </Wrap>
      </footer>

      {/* ── attachment modal (same flow as the live landing) ─────────── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-[#0E1019] border border-white/[0.13] rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-['Manrope',system-ui,sans-serif] font-bold text-lg">
                  Attach a file to your brief
                </h3>
                <p className="text-xs text-[#5C6470] mt-0.5">Images, PDFs, and CSVs up to 20 MB</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-[#8B919C] hover:text-[#F3F5EF] transition-colors"
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
              }}
              onRemove={() => setAttachment(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Local pieces
════════════════════════════════════════════════════════════════════════ */

/** `.speed .s` - count-up stat card. */
function SpeedStat({
  value,
  prefix,
  suffix,
  label,
}: {
  value: number;
  prefix: string;
  suffix: string;
  label: string;
}) {
  // Threshold intentionally low: a stat card can be up to 200px tall and never
  // hit 60% visible on some viewports — that used to leave the counter at 0
  // (or freeze at ~7 mid-frame if the observer barely triggered).
  const { ref, inView } = useInView<HTMLDivElement>(0.14);
  const n = useCountUp(value, inView);
  return (
    <div
      ref={ref}
      className="h-full relative overflow-hidden bg-white/[0.025] border border-white/[0.07] rounded-[22px] p-8 transition-all duration-200 hover:border-[rgba(190,242,100,0.22)] hover:-translate-y-[3px]"
    >
      <div className="font-['Manrope',system-ui,sans-serif] font-extrabold text-[54px] text-[#BEF264] leading-none">
        {prefix}
        {n}
        {suffix}
      </div>
      <div className="text-[#8B919C] text-[14.5px] mt-3">{label}</div>
    </div>
  );
}

/** The mock's smaller split-section h2 - clamp(30px, 3.8vw, 46px). */
function SplitHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-['Manrope',system-ui,sans-serif] font-extrabold tracking-[-0.025em] text-[clamp(30px,3.8vw,46px)] leading-[1.06] mt-4">
      {children}
    </h2>
  );
}

/** `.pfeat` / `.ca-cards` - icon tile + title + body. */
function FeatureList({
  items,
  tone,
}: {
  items: Array<{ ico: string; title: string; body: string }>;
  tone: 'lime' | 'indigo';
}) {
  const tile =
    tone === 'lime'
      ? 'bg-[rgba(190,242,100,0.13)] border-[rgba(190,242,100,0.22)]'
      : 'bg-[rgba(99,102,241,0.16)] border-[rgba(99,102,241,0.32)]';
  return (
    <div className={`flex flex-col mt-6 ${tone === 'lime' ? 'gap-[18px]' : 'gap-4'}`}>
      {items.map((f) => (
        <div key={f.title} className="flex gap-3.5">
          <div className={`text-[22px] shrink-0 w-11 h-11 rounded-xl grid place-items-center border ${tile}`} aria-hidden>
            {f.ico}
          </div>
          <div>
            <h4 className="font-['Manrope',system-ui,sans-serif] font-bold text-[16px] mb-1">
              {f.title}
            </h4>
            <p className="text-[#8B919C] text-[13.5px]">{f.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** One row in the "Live persona generation" panel - staggered 500 + 200i ms. */
function PersonaRow({
  persona,
  index,
}: {
  persona: { name: string; meta: string; id: string; color: string };
  index: number;
}) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 500 + index * 200);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <div className={`lv2-prow ${entered ? 'lv2-in' : ''} flex items-center gap-[11px] px-2.5 py-[11px] rounded-[10px]`}>
      <div
        className="w-9 h-9 rounded-[10px] shrink-0 grid place-items-center font-['Manrope',system-ui,sans-serif] font-bold text-sm text-[#0B0C15]"
        style={{ background: persona.color }}
      >
        {persona.name.charAt(0)}
      </div>
      <div className="min-w-0">
        <div className="font-['Manrope',system-ui,sans-serif] font-bold text-[13.5px]">
          {persona.name}
        </div>
        <div className="text-[#8B919C] text-[11px] truncate">{persona.meta}</div>
      </div>
      <div className="ml-auto text-[11px] text-[#5C6470] font-['Manrope',system-ui,sans-serif] font-semibold shrink-0">
        Persona {persona.id}
      </div>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h4 className="text-[11px] tracking-[0.16em] uppercase text-[#5C6470] mb-3.5">{title}</h4>
      {links.map(([label, href]) => (
        <Link
          key={label}
          to={href}
          className="block text-[14px] text-[#8B919C] mb-2.5 hover:text-[#F3F5EF] transition-colors"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export default LandingV2Page;
