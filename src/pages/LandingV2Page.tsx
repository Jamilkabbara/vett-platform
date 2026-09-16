/**
 * LandingV2Page - THE LIVE LANDING. Serves `/landing`, and `/` which
 * redirects there. `/landing-v2` (the old preview URL) redirects here too.
 *
 * September 2026 redesign, built from the owner's vett-landing.html prototype
 * as a design reference (none of its markup, CSS or script is used):
 *
 *   - Section order: nav, hero, speed, live mission, research explorer, how it
 *     works, creative attention, comparison, pricing, final CTA, footer.
 *   - Removed: the logo wall and the testimonials (not attributable), the
 *     personas, price-sensitivity and NPS/radar sections (their charts now
 *     live in the research explorer), and the payment promise that sat in
 *     the final call to action.
 *   - Kept from the old page: the hero brief input and its typewriter, goal
 *     routing, lead capture under the `landing_prefooter` tag, landing_view
 *     funnel tracking, and the Help Center link.
 *   - Colours, fonts, gradients and shadows are theme tokens (lp-*) defined in
 *     src/styles/landingTokens.mjs. scripts/verify-landing-tokens.mjs fails if
 *     a colour literal is written in a landing file.
 *   - Prices come from src/components/landing-v2/landingPrices.ts, which calls
 *     the app's pricing function.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { trackFunnel, landingMetadata } from '../lib/funnelTrack';
import { useTypewriterPlaceholder } from '../hooks/useTypewriterPlaceholder';
import { getGoalById } from '../data/missionGoals';
import { Logo } from '../components/ui/Logo';
import { LeadCaptureForm } from '../components/marketing/LeadCaptureForm';

import { Eyebrow, Note, Reveal, SectionHead, V2Button, Wrap } from '../components/landing-v2/primitives';
import { useCountUp, useInView } from '../components/landing-v2/hooks';
import { HeroStrip } from '../components/landing-v2/HeroStrip';
import { LiveMission } from '../components/landing-v2/LiveMission';
import { CreativeAttentionPanel } from '../components/landing-v2/panels';
import { PricingSection } from '../components/landing-v2/PricingSection';
import {
  getPricingForGoalType,
  respondentLadderBase,
  BRAND_LIFT_MIN_RESPONDENTS,
  CA_MIN_RESPONDENTS,
} from '../utils/pricingEngine';

import '../styles/landing-v2.css';
import { COUNTRY_COVERAGE, COUNTRY_COVERAGE_FLOOR } from '../utils/siteFacts';
import { SELF_SERVE_MIN_USD } from '../utils/priceCopy';

/* ══════════════════════════════════════════════════════════════════════
   Content
════════════════════════════════════════════════════════════════════════ */

const HERO_PHRASES = [
  'Will premium plant-based ready-meals sell in Saudi Arabia?',
  'Would people in Dubai pay more for an iced matcha?',
  'Which of these three names travels best in Riyadh?',
  'Does this ad hold attention on TikTok?',
];

// These count up from 0 in the browser, so the prerendered HTML holds "0" and
// a text search for the final figure finds nothing. That is how "150+ Markets
// worldwide" outlived the move to 190+ countries.
//
// The time stat is measured, not a target: on 2026-09-14, 40 completed
// missions had a median of 2.1 minutes from start to completion, but 36 of
// them were 5 to 25 respondents (median 1.7) and the mean across all 40 was
// 8.5 minutes, so it is labelled as a median for small studies, not an average.
const SPEED_STATS = [
  { value: SELF_SERVE_MIN_USD, decimals: 0, prefix: '$', suffix: '', label: 'Starting price per mission. No subscription, no seats.' },
  { value: 2.1, decimals: 1, prefix: '', suffix: 'min', label: 'Median time from launch to full results on studies of 5 to 25 respondents.' },
  { value: COUNTRY_COVERAGE_FLOOR, decimals: 0, prefix: '', suffix: '+', label: 'Countries you can target.' },
];

/**
 * The "FROM $x" chip on each research type, derived from the goal's own
 * ladder rather than typed in.
 */
export function startsAtLabel(goalId: string): string {
  const ladder = getPricingForGoalType(goalId);
  const floor =
    goalId === 'brand_lift' ? BRAND_LIFT_MIN_RESPONDENTS
    : goalId === 'creative_attention' ? CA_MIN_RESPONDENTS
    : ladder[0].anchorCount;
  const tier = ladder.find((t) => floor <= t.maxCount) ?? ladder[ladder.length - 1];
  const base = goalId === 'creative_attention' || tier.ratePerResp == null
    ? tier.packagePrice
    : respondentLadderBase(ladder, tier, floor, tier.ratePerResp);
  return `FROM $${base.toLocaleString('en-US')}`;
}

/**
 * All fourteen live research types. scripts/verify-site-facts.mjs reads the
 * goalIds from this constant and fails if a live goal type is missing.
 */
const RESEARCH_TYPES: Array<{ title: string; desc: string; accent?: boolean; goalId: string }> = [
  { title: 'Product Validation',          desc: 'Test if your idea has real demand before you build it.',                               goalId: 'validate' },
  { title: 'Compare Concepts',            desc: 'Put concepts head to head and see which wins, and why the others lost.',               goalId: 'compare' },
  { title: 'Pricing Research',            desc: 'Find the price that maximises revenue, not just the one people accept.',               goalId: 'pricing' },
  { title: 'Creative & Ad Testing',       desc: 'Test ad copy, visuals and messaging before you spend on media.',                       goalId: 'marketing' },
  { title: 'Customer Satisfaction',       desc: 'Measure satisfaction at any scale, with the reasons behind every band.',               goalId: 'satisfaction' },
  { title: 'Feature Roadmap',             desc: 'Rank the backlog by what actually moves choice.',                                      goalId: 'roadmap' },
  { title: 'Market Entry',                desc: 'Validate demand in a new country before you spend anything entering it.',              goalId: 'market_entry' },
  { title: 'Brand Lift Study',            desc: 'Show whether the campaign moved awareness, consideration and preference.',            goalId: 'brand_lift' },
  { title: 'Creative Attention Analysis', desc: 'Score emotion, attention and clarity on video or image creative.', accent: true,       goalId: 'creative_attention' },
  { title: 'Churn Research',              desc: 'Understand what pushed customers out and what would bring them back.',                 goalId: 'churn_research' },
  { title: 'Competitor Analysis',         desc: 'See where you stand against the category leader, attribute by attribute.',             goalId: 'competitor' },
  { title: 'Audience Profiling',          desc: 'Build a behavioural profile of who is actually buying.',                               goalId: 'audience_profiling' },
  { title: 'Naming & Messaging',          desc: 'See how a name or line lands with your audience before you commit to it.',            goalId: 'naming_messaging' },
  { title: 'General Research',            desc: 'Ask anything. VETT designs the survey and reads the answers.',                         goalId: 'research' },
];

const LOOP_STEPS = [
  { n: 1, title: 'Describe', body: 'Drop your question in plain language. Upload an image or video for creative testing.' },
  { n: 2, title: 'Strategy', body: 'VETT clarifies your brief with three quick questions, then builds the survey and targeting.' },
  { n: 3, title: 'Simulate', body: 'Distinct personas, each matched to your audience, answer the full survey independently.' },
  { n: 4, title: 'Insights', body: 'Charts, an executive summary, and two recommended next studies. PDF, PPT and XLS free.' },
];

const ATTENTION_FEATS = [
  { title: 'Emotion timeline',  body: 'Joy, surprise, trust, anticipation and fear, mapped frame by frame.', icon: 'M3 12h4l3-7 4 14 3-7h4' },
  { title: 'Attention heatmap', body: 'Where attention peaks and where it falls away.',                     icon: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6' },
  { title: 'Engagement score',  body: 'One number for the asset, before any media budget goes near it.',    icon: 'M3 17l6-6 4 4 8-8 M21 3v6h-6' },
];

const COMPARISON: Array<[string, string, string, string]> = [
  ['Time to a result',      'Minutes',                                    '4 to 8 weeks',        'Days, if you recruit'],
  ['Who writes the survey', 'VETT does',                                  'A researcher',        'You do'],
  ['Who answers',           'Synthetic respondents matched to your spec', 'Recruited panel',     'Your own network'],
  ['Starting price',        `$${SELF_SERVE_MIN_USD} per mission`,         'Thousands per study', 'Free, then limited'],
  ['Reports',               'PDF, PPT, XLS included',                     'A deck, weeks later', 'CSV'],
  ['Creative testing',      'Image and video',                            'A separate study',    'Not available'],
];

/* ══════════════════════════════════════════════════════════════════════
   Page
════════════════════════════════════════════════════════════════════════ */

export function LandingV2Page() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const typewriterPlaceholder = useTypewriterPlaceholder({ phrases: HERO_PHRASES, paused: heroPaused });

  const launchMission = useCallback(() => {
    const trimmed = idea.trim();
    const qs = trimmed ? `?q=${encodeURIComponent(trimmed)}` : '';
    if (user) navigate(`/setup${qs}`);
    else navigate(`/signin?redirect=${encodeURIComponent(`/setup${qs}`)}`);
  }, [idea, user, navigate]);

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
   * Goal-aware routing:
   *   comingSoon goal    -> /methodologies
   *   creative_attention -> /creative-attention/new (dedicated upload flow)
   *   anything else      -> /setup?goal=<id>
   * Unauthed users are wrapped in /signin?redirect=...
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

  /* ---- cursor-follow glow ---------------------------------------------- */
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = glowRef.current;
    if (!el) return undefined;
    const onMove = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.opacity = '1';
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="lv2-root relative min-h-[100dvh] bg-lp-ink text-lp-text font-lp-text leading-[1.55] antialiased overflow-x-hidden">
      {/* ── ambient: aurora, grain, cursor glow ───────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="lv2-aurora-1 absolute rounded-full blur-[90px] opacity-50 w-[780px] h-[620px] -top-[260px] left-1/2 -translate-x-1/2 bg-lp-aurora-indigo" />
        <div className="lv2-aurora-2 absolute rounded-full blur-[90px] opacity-50 w-[620px] h-[520px] -top-[120px] -right-[160px] bg-lp-aurora-lime" />
      </div>
      <div className="lv2-grain fixed inset-0 z-[1] pointer-events-none opacity-[0.035] mix-blend-overlay" aria-hidden />
      <div
        ref={glowRef}
        aria-hidden
        className="fixed w-[560px] h-[560px] rounded-full pointer-events-none z-[1] opacity-0 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-[400ms] bg-lp-cursor-glow"
      />

      {/* ══ NAV ══ */}
      <nav className="sticky top-0 z-50 bg-lp-ink/[0.72] backdrop-blur-[18px] backdrop-saturate-[1.4] border-b border-white/[0.07]">
        <div className="max-w-[1200px] mx-auto px-4 min-[600px]:px-7 py-[13px] flex items-center justify-between gap-5">
          <Link to="/landing" aria-label="VETT home" className="flex items-center gap-[11px]">
            <Logo size="sm" iconOnly />
            <span className="font-lp-head font-extrabold tracking-[0.06em] text-[19px]">VETT</span>
          </Link>
          <div className="flex gap-2.5 items-center">
            {[
              ['See it run', '#run'],
              ['Research', '#research'],
              ['How it works', '#how'],
              ['Pricing', '#pricing'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="hidden min-[900px]:inline-block text-[14px] text-lp-body hover:text-lp-text px-3.5 py-2 transition-colors"
              >
                {label}
              </a>
            ))}
            <V2Button variant="ghost" onClick={goSignIn} className="hidden min-[600px]:inline-flex">
              Sign In
            </V2Button>
            <V2Button variant="indigo" onClick={goVettIt}>VETT IT</V2Button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <Wrap as="header" className="text-center pt-[66px] pb-[70px] flex flex-col items-center">
        <span className="lv2-heroup delay-[20ms]">
          <Eyebrow pill>AI Consumer Research Platform</Eyebrow>
        </span>

        <h1 className="font-lp-head font-extrabold tracking-[-0.028em] leading-[1.04] text-[clamp(46px,7.6vw,100px)] mt-[22px] text-balance">
          <span className="lv2-heroup delay-[120ms] inline-block">Stop guessing.</span>
          <br />
          <span className="lv2-heroup delay-[260ms] inline-block text-lp-lime">VETT it.</span>
        </h1>

        <p className="lv2-heroup delay-[400ms] text-lp-body text-[18px] leading-[1.55] max-w-[640px] mx-auto mt-6">
          Describe your research question in plain language. VETT builds the survey, simulates your
          exact audience, and delivers insights in minutes, not weeks.
        </p>

        <form
          onSubmit={handleHeroSubmit}
          className="lv2-heroup delay-[520ms] relative overflow-hidden mt-9 w-full max-w-[730px] flex flex-wrap items-center gap-x-3.5 gap-y-3 rounded-[18px] border border-white/[0.13] bg-lp-terminal pl-5 pr-[13px] py-[13px] shadow-lp-terminal after:content-[''] after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-lp-hairline"
        >
          <span className="font-lp-head font-extrabold text-[18px] text-lp-lime shrink-0" aria-hidden>&gt;_</span>
          {/* A real input underneath; the typewriter line is painted over it
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
              className="w-full bg-transparent border-0 p-0 text-left text-[16px] text-lp-text placeholder:text-lp-muted focus:outline-none focus:ring-0 min-h-[44px]"
            />
            {!heroPaused && (
              <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center text-[16px] text-lp-text whitespace-nowrap overflow-hidden">
                {typewriterPlaceholder}
                <i className="lv2-cursor inline-block w-[9px] h-5 bg-lp-lime ml-[3px] shrink-0" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-3.5 shrink-0 basis-full sm:basis-auto sm:ml-auto justify-end">
            <V2Button variant="indigo" type="submit" className="shrink-0">
              VETT IT
              <ArrowRight className="w-[15px] h-[15px]" strokeWidth={2.4} />
            </V2Button>
          </div>
        </form>

        <div className="lv2-heroup delay-[640ms] flex flex-wrap justify-center gap-x-[22px] gap-y-2 mt-[22px] text-[13.5px] text-lp-body">
          <span>Surveys from <b className="text-lp-lime font-bold">${SELF_SERVE_MIN_USD}</b></span>
          <span className="text-lp-muted">&middot;</span>
          <span>Results in minutes</span>
          <span className="text-lp-muted">&middot;</span>
          <span>{COUNTRY_COVERAGE}</span>
          <span className="text-lp-muted">&middot;</span>
          <span>Every respondent matches your audience</span>
        </div>

        <Link
          to="/methodology"
          className="lv2-heroup delay-[700ms] mt-[18px] inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-lp-lime hover:underline underline-offset-4"
        >
          See the methodology behind every mission <ArrowRight className="w-4 h-4" />
        </Link>

        <HeroStrip />
      </Wrap>

      {/* ══ SPEED ══ */}
      <Section id="speed">
        <Reveal>
          <SectionHead
            eyebrow="Built for speed"
            title={<>Research in minutes.<br />Not four weeks.</>}
            body="An agency takes weeks and quotes thousands. VETT reads the signal today, for the price of lunch."
          />
        </Reveal>
        <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[980px]:grid-cols-3 gap-[18px]">
          {SPEED_STATS.map((s, i) => (
            <Reveal key={s.label} delay={(i + 1) as 1 | 2 | 3}>
              <SpeedStat {...s} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ══ LIVE MISSION ══ */}
      <Section id="run">
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
        <Reveal>
          <Note>
            Synthetic respondents give a directional read. They model likely response and do not
            replace a recruited panel where statistical representativeness is required.
          </Note>
        </Reveal>
      </Section>

      {/* ══ RESEARCH TYPES ══ */}
      <Section id="research">
        <Reveal>
          <SectionHead
            eyebrow="Run any research"
            title={<>Every type of research.<br />One platform.</>}
            body="Pick a method and see what lands in your report. No methodology expertise required."
          />
        </Reveal>
        <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[980px]:grid-cols-3 gap-4">
          {RESEARCH_TYPES.map((r, i) => (
            <Reveal key={r.title} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <button
                type="button"
                onClick={() => goWithGoal(r.goalId)}
                className="h-full w-full text-left bg-white/[0.025] border border-white/[0.07] rounded-[18px] p-6 transition-all duration-200 hover:border-lp-lime/[0.22] hover:-translate-y-1 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-lime/60"
              >
                <h3 className="font-lp-head font-bold text-[16.5px] mb-2">{r.title}</h3>
                <p className="text-lp-body text-[13.5px] min-h-[38px]">{r.desc}</p>
                <Tag indigo={r.accent}>{startsAtLabel(r.goalId)}</Tag>
              </button>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-[22px] text-lp-body text-[15px]">
            Not seeing your use case? Just describe it.{' '}
            <button type="button" onClick={() => goWithGoal(null)} className="text-lp-lime font-semibold hover:underline">
              VETT&apos;s AI will figure out the right approach &rarr;
            </button>
            <br />
            <Link to="/methodologies" className="inline-block mt-2 text-lp-lime font-semibold hover:underline">
              Or browse the methodology library &rarr;
            </Link>
          </p>
        </Reveal>
      </Section>

      {/* ══ HOW IT WORKS ══ */}
      <Section id="how">
        <Reveal>
          <SectionHead eyebrow="How it works" title="Four steps from question to answer." body="Zero friction. Total clarity." />
        </Reveal>
        <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[980px]:grid-cols-4 gap-[18px]">
          {LOOP_STEPS.map((s, i) => (
            <Reveal key={s.n} delay={(i + 1) as 1 | 2 | 3 | 4} className="h-full">
              <div className="h-full bg-white/[0.025] border border-white/[0.07] rounded-[18px] p-6 transition-all duration-200 hover:border-lp-lime/[0.22] hover:-translate-y-1">
                <div className="w-9 h-9 rounded-[10px] bg-lp-lime/[0.13] border border-lp-lime/[0.22] text-lp-lime font-lp-head font-extrabold grid place-items-center text-[16px]">
                  {s.n}
                </div>
                <h3 className="font-lp-head font-bold text-[19px] tracking-[-0.01em] mt-[18px]">{s.title}</h3>
                <p className="text-lp-body text-[14.5px] leading-[1.6] mt-2.5">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ══ CREATIVE ATTENTION ══ */}
      <Section id="creative">
        <div className="grid grid-cols-1 min-[980px]:grid-cols-2 gap-[34px] min-[980px]:gap-14 items-center">
          <Reveal>
            <Eyebrow>New: creative attention analysis</Eyebrow>
            <h2 className="font-lp-head font-extrabold tracking-[-0.025em] text-[clamp(32px,4.4vw,52px)] leading-[1.04] mt-4">
              Know how your creative makes people feel.
            </h2>
            <p className="text-lp-body text-[16.5px] leading-[1.6] mt-[18px]">
              Upload a video or image. VETT simulates how your target audience responds second by
              second, and scores predicted attention against the published norm for the placement
              you are buying.
            </p>
            <div className="flex flex-col gap-[18px] mt-[22px]">
              {ATTENTION_FEATS.map((f) => (
                <div key={f.title} className="flex gap-3.5">
                  <span className="w-[38px] h-[38px] shrink-0 rounded-[11px] bg-lp-indigo/[0.12] border border-lp-indigo/[0.32] grid place-items-center" aria-hidden>
                    <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] stroke-lp-indigo-tag" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d={f.icon} />
                    </svg>
                  </span>
                  <div>
                    <h4 className="font-lp-head font-bold text-[16px]">{f.title}</h4>
                    <p className="text-lp-body text-[14.5px] leading-[1.6] mt-1">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <V2Button variant="outline" className="mt-[26px]" onClick={() => goWithGoal('creative_attention')}>
              Analyse a creative &rarr;
            </V2Button>
          </Reveal>
          <Reveal delay={1}>
            <CreativeAttentionPanel />
          </Reveal>
        </div>
      </Section>

      {/* ══ COMPARISON ══ */}
      <Section id="vs">
        <Reveal>
          <SectionHead center eyebrow="The alternative" title="Research that moves at the speed of your ideas." />
        </Reveal>
        <Reveal delay={1}>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 border border-white/[0.07] rounded-[18px] overflow-hidden min-w-[640px]">
              <thead>
                <tr>
                  <th className="px-[18px] py-[15px] border-b border-white/[0.07] bg-black/25" />
                  <th className="px-[18px] py-[15px] text-left text-[11px] font-bold tracking-[0.14em] uppercase border-b border-white/[0.07] text-lp-lime bg-lp-lime/[0.13]">VETT</th>
                  <th className="px-[18px] py-[15px] text-left text-[11px] font-bold tracking-[0.14em] uppercase border-b border-white/[0.07] text-lp-muted bg-black/25">Research agency</th>
                  <th className="px-[18px] py-[15px] text-left text-[11px] font-bold tracking-[0.14em] uppercase border-b border-white/[0.07] text-lp-muted bg-black/25">DIY survey tool</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([row, vett, agency, diy], i) => {
                  const line = i === COMPARISON.length - 1 ? '' : 'border-b border-white/[0.07]';
                  return (
                    <tr key={row}>
                      <td className={`px-[18px] py-[15px] text-[14px] font-lp-head font-bold text-lp-text ${line}`}>{row}</td>
                      <td className={`px-[18px] py-[15px] text-[14.5px] font-lp-head font-bold text-lp-lime bg-lp-lime/[0.13] ${line}`}>{vett}</td>
                      <td className={`px-[18px] py-[15px] text-[14.5px] text-lp-body ${line}`}>{agency}</td>
                      <td className={`px-[18px] py-[15px] text-[14.5px] text-lp-body ${line}`}>{diy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
        <Reveal>
          <Note>Agency and DIY figures are indicative market ranges, not quotes from any named provider.</Note>
        </Reveal>
      </Section>

      {/* ══ PRICING ══ */}
      <Section id="pricing">
        <Reveal>
          <SectionHead
            center
            eyebrow="Pricing"
            title={<>Pay per mission.<br />No subscriptions.</>}
            body="Drag to size your study. The rate per respondent falls as it grows."
          />
        </Reveal>
        <Reveal delay={1}>
          <PricingSection onCta={goWithGoal} />
        </Reveal>
      </Section>

      {/* ══ FINAL CTA + LEAD CAPTURE ══ */}
      <Section id="start" className="pb-[100px]">
        <Reveal>
          <div className="relative overflow-hidden rounded-[30px] border border-white/[0.13] bg-lp-cta px-[22px] py-12 min-[600px]:px-[34px] min-[600px]:py-[70px] text-center after:content-[''] after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-lp-hairline">
            <h2 className="font-lp-head font-extrabold tracking-[-0.025em] text-[clamp(32px,4.4vw,52px)] leading-[1.04] max-w-[16ch] mx-auto">
              Your next decision shouldn&apos;t be a guess.
            </h2>
            <p className="text-lp-body text-[16.5px] leading-[1.6] max-w-[46ch] mx-auto mt-5">
              Write the question. See the study before you commit to anything.
            </p>
            <div className="flex gap-3 justify-center flex-wrap mt-[30px]">
              <V2Button variant="indigo" size="lg" onClick={goVettIt}>VETT IT &rarr;</V2Button>
              <a
                href="#run"
                className="font-lp-text font-bold tracking-[0.02em] inline-flex items-center justify-center text-[15px] rounded-[13px] px-[26px] py-[15px] border border-white/[0.13] text-lp-text bg-white/[0.025] hover:border-lp-lime hover:text-lp-lime transition-all duration-[180ms]"
              >
                See it run &rarr;
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-x-[18px] gap-y-2 mt-[26px] text-[14px] text-lp-muted">
              <span>Pay per mission</span>
              <span>&middot;</span>
              <span>From <b className="text-lp-lime font-bold">${SELF_SERVE_MIN_USD}</b></span>
              <span>&middot;</span>
              <span>No subscription</span>
            </div>

            <div className="mt-10 pt-[34px] border-t border-white/[0.07] max-w-[520px] mx-auto">
              <h3 className="font-lp-head font-bold text-[18px]">Be first to know when new features ship</h3>
              <p className="text-lp-body text-[13.5px] mt-2 mb-[18px]">
                No spam. Research drops, product updates, and the occasional market insight.
              </p>
              <LeadCaptureForm
                cta="Notify me"
                page="landing_prefooter"
                placeholder="you@company.com"
                variant="inline"
                className="justify-center"
              />
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-white/[0.07] pt-11 pb-[38px] relative z-[2]">
        <Wrap flush={false}>
          <div className="flex justify-between gap-7 flex-wrap items-start">
            <div className="max-w-[26ch]">
              <div className="flex items-center gap-[11px]">
                <Logo size="sm" iconOnly />
                <span className="font-lp-head font-extrabold tracking-[0.06em] text-[19px]">VETT</span>
              </div>
              <p className="text-lp-body text-[14px] mt-3.5">The operating system for market intelligence. Dubai, UAE.</p>
            </div>
            <div className="flex gap-[54px] flex-wrap">
              <FooterCol title="Product" links={[['How it works', '#how'], ['Research types', '#research'], ['Pricing', '#pricing']]} />
              <FooterCol title="Company" links={[['About', '/about'], ['Contact', '/contact'], ['Help Center', '/help'], ['Blog', '/blog']]} />
              <FooterCol title="Legal" links={[['Privacy', '/privacy'], ['Terms', '/terms'], ['Refunds', '/refunds']]} />
            </div>
          </div>
          <div className="mt-[42px] pt-6 border-t border-white/[0.07] text-[12.5px] text-lp-muted flex justify-between flex-wrap gap-3.5">
            <span>&copy; {new Date().getFullYear()} VETT Inc. All rights reserved.</span>
            <a href="mailto:hello@vettit.ai" className="inline-flex items-center min-h-[44px] hover:text-lp-body transition-colors">
              hello@vettit.ai
            </a>
          </div>
        </Wrap>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Local pieces
════════════════════════════════════════════════════════════════════════ */

function Section({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  return (
    <Wrap as="section" id={id} className={`py-[92px] scroll-mt-16 ${className}`}>
      {children}
    </Wrap>
  );
}

export function Tag({ children, indigo = false }: { children: ReactNode; indigo?: boolean }) {
  return (
    <span
      className={[
        'inline-block mt-3.5 text-[10.5px] font-bold tracking-[0.1em] px-[11px] py-[5px] rounded-[7px] border whitespace-nowrap',
        indigo
          ? 'bg-lp-indigo/[0.12] text-lp-indigo-tag border-lp-indigo/[0.32]'
          : 'bg-lp-lime/[0.13] text-lp-lime border-lp-lime/[0.22]',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function SpeedStat({ value, decimals, prefix, suffix, label }: {
  value: number; decimals: number; prefix: string; suffix: string; label: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.6);
  const n = useCountUp(value, inView, 1100, decimals);
  return (
    <div
      ref={ref}
      className="h-full bg-white/[0.025] border border-white/[0.07] rounded-[18px] p-6 transition-all duration-200 hover:border-lp-lime/[0.22] hover:-translate-y-1 hover:bg-white/[0.045]"
    >
      <div className="font-lp-head font-extrabold text-[54px] tracking-[-0.03em] text-lp-lime leading-none">
        {prefix}{n.toFixed(decimals)}{suffix}
      </div>
      <p className="text-lp-body text-[14px] leading-[1.6] mt-3">{label}</p>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h4 className="text-[10.5px] font-bold tracking-[0.15em] uppercase text-lp-text mb-3.5">{title}</h4>
      {links.map(([label, href]) => (
        href.startsWith('#')
          ? <a key={label} href={href} className="block text-[14px] text-lp-muted mb-2.5 hover:text-lp-text transition-colors">{label}</a>
          : <Link key={label} to={href} className="block text-[14px] text-lp-muted mb-2.5 hover:text-lp-text transition-colors">{label}</Link>
      ))}
    </div>
  );
}

export default LandingV2Page;
