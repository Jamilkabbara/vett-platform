/**
 * CaseStudyPageTemplate - the shared shell for every /case-studies/<slug> page.
 *
 * Built to the /vs/* precedent (src/components/marketing/VsPageTemplate.tsx):
 * one props-driven template, one thin page per study, every route registered in
 * scripts/seo-routes.mjs so it is prerendered with its own title, canonical, h1
 * and sitemap entry. It deliberately does NOT go through the blog table:
 * /blog/:slug is not in PUBLIC_ROUTES, so a post gets no prerendering, no
 * sitemap row and no crawlable head, which is the exact defect the SEO manifest
 * exists to prevent.
 *
 * SEVEN BANDS, in order:
 *   1. Eyebrow pill + the FINDING as h1 + one line of method.
 *   2. Stat strip: three or four headline figures.
 *   3. "The situation": the only genuinely authored prose on the page, and the
 *      place anonymisation happens.
 *   4. The centerpiece chart for that methodology, with n and posture stated.
 *   5. "What respondents said": question cards plus labelled synthetic verbatims.
 *   6. "Who answered": the persona clusters.
 *   7. The honesty callout carrying the statistical gate note verbatim, then
 *      the CTA (cost, duration, a button into /setup).
 *
 * WHY THE CHARTS COME FROM results-v2
 * -----------------------------------
 * Bands 2, 4 and 5 render through the SAME primitives the customer's own
 * /results/:missionId page uses (src/components/results-v2/*). A published case
 * study and the results page it was taken from therefore paint the same figure
 * through the same code: there is no second chart library here that could round
 * differently, animate a value, or drop a numeral into a slot that cannot hold
 * it. The stat strip in particular goes through `toScalarSlot`, so a sentence
 * accidentally pasted into a headline metric is demoted to prose rather than
 * typeset at 46px.
 *
 * Copy rule for this file and everything it renders: hyphens or the word "to",
 * never an em or en dash.
 */
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

import { OverlayPage } from '../layout/OverlayPage';
import { useRouteSeo } from '../../seo/useRouteSeo';
import {
  Card,
  Lens,
  QHead,
  StatStrip,
  VettRead,
} from '../results-v2/primitives';
import type { StatCellProps } from '../results-v2/primitives';
import { DonutLegend, HBars, Histogram, Themes } from '../results-v2/charts';
import { toScalarSlot } from '../results-v2/valueSlot';
import '../../styles/results-v2.css';

/* ══════════════════════════════════════════════════════════════════════
   The props type

   Every field below names the canonical-report field it is transcribed
   from, so filling in a real study is copying, not redesigning. "Authored"
   means there is no report field: a human writes it.
════════════════════════════════════════════════════════════════════════ */

/** Tone vocabulary, same three accents the results page uses. */
export type CaseStudyTone = 'lime' | 'amber' | 'rose' | 'plain';

/**
 * One chart. Each variant is shaped exactly like the props of the results-v2
 * component that draws it, so transcription is a copy and never a conversion.
 *
 *   bars      <HBars>        centerpiece.data ladder / per_attribute rows,
 *                            or a multi_select question's distribution
 *   histogram <Histogram>    a scale_* question's `data.distribution`
 *   donut     <DonutLegend>  a single-choice question's `data.distribution`
 *   themes    <Themes>       an open_text_verbatims question's `data.themes`
 */
export type CaseStudyChart =
  | {
      kind: 'bars';
      rows: Array<{ label: string; count: number; pct: number }>;
      base: number;
      /** '%' for shares, '/5' for a mean on a 5 point scale, '' for a count. */
      unit?: string;
    }
  | { kind: 'histogram'; buckets: Array<{ label: string; count: number }>; total: number }
  | { kind: 'donut'; entries: Array<[string, number]> }
  | {
      kind: 'themes';
      themes: Array<{
        label: string;
        count: number;
        pct: number;
        sentiment: 'positive' | 'neutral' | 'negative';
        quotes?: string[];
      }>;
      n: number;
    };

/** Band 5: one question card. */
export interface CaseStudyQuestion {
  /** report.survey[i].text */
  question: string;
  /** report.survey[i].renderer_label, e.g. "Rating scale, 1 to 10". */
  rendererLabel: string;
  /** The base line under the question, e.g. "n = 60". Authored from the data. */
  meta: string;
  /** report.survey[i].insight. Optional; rendered as the VETT READ strip. */
  insight?: string;
  chart: CaseStudyChart;
}

/** Band 7: the statistical gate, copied out of the report, not paraphrased. */
export interface CaseStudyGate {
  /** report.centerpiece.gate.posture */
  posture: 'authoritative' | 'directional';
  /**
   * report.centerpiece.gate.note, VERBATIM. This is the sentence that tells a
   * reader how much weight the headline can carry. Rewriting it to sound more
   * confident than the gate actually was is the one edit nobody may make.
   */
  note: string;
  /** report.centerpiece.gate.n */
  n: number;
  /** report.centerpiece.gate.threshold */
  threshold: number;
}

export interface CaseStudy {
  /** Route path, e.g. '/case-studies/placeholder-pricing-example'. Must be in PUBLIC_ROUTES. */
  slug: string;

  /* ── Band 1 ──────────────────────────────────────────────────────── */
  /** Eyebrow pill text, e.g. 'Case study - Pricing'. From header.methodology_label. */
  eyebrow: string;
  /**
   * The h1. It is the FINDING, not the client name, and it is
   * report.finding (the backend headline sentence) lightly anonymised.
   *
   * Keep this a single-line quoted literal in the study's data file.
   * scripts/verify-seo-routes.mjs reads it from the source and compares it to
   * the manifest h1, because the template renders it as an expression and a
   * literal-text comparison against the JSX would be vacuous.
   */
  finding: string;
  /** One line of method under the h1. */
  method: {
    /** report.header.methodology_label */
    methodology: string;
    /** report.header.sample.n */
    n: number;
    /** Authored from the mission brief and the audience spec. */
    markets: string;
    /** report.header.sample.completed_at, as a month. */
    month: string;
  };

  /* ── Band 2 ──────────────────────────────────────────────────────── */
  /**
   * Three or four headline figures. These are `buildCenterpiece(report).view.cells`
   * (centerpiece.ts), which is the same array the results page prints in its own
   * stat strip and its rail. Values are raw here and go through the same
   * `toScalarSlot` guard, so a sentence lands as prose rather than as a numeral.
   */
  stats: Array<{ label: string; value: string | number | null; tone?: CaseStudyTone }>;

  /* ── Band 3 ──────────────────────────────────────────────────────── */
  /**
   * AUTHORED. Two short paragraphs about the decision that needed making.
   * No report field maps here, and this is where the client is anonymised.
   */
  situation: string[];

  /* ── Band 4 ──────────────────────────────────────────────────────── */
  centerpiece: {
    /** buildCenterpiece(report).view.title, e.g. 'What the market will pay'. */
    title: string;
    /** buildCenterpiece(report).view.eyebrow, e.g. 'Price sensitivity'. */
    eyebrow: string;
    /** buildCenterpiece(report).view.chip, e.g. 'Van Westendorp'. */
    chip?: string;
    /** Caption stating n and posture. Rendered under the chart. */
    caption: string;
    chart: CaseStudyChart;
  };

  /* ── Band 5 ──────────────────────────────────────────────────────── */
  /** Two or three of report.survey, chosen for the story. */
  questions: CaseStudyQuestion[];
  /**
   * Verbatims. Every VETT respondent is synthetic, so every quote is
   * synthetic. The template labels them inline, on the quote itself, not in a
   * footnote a reader can scroll past.
   */
  verbatims: string[];

  /* ── Band 6 ──────────────────────────────────────────────────────── */
  /** report.personas: name, share, description. */
  personas: Array<{ name: string; share: string; description: string }>;

  /* ── Band 7 ──────────────────────────────────────────────────────── */
  gate: CaseStudyGate;
  /** What the mission cost, e.g. '$99'. From the mission record. */
  cost: string;
  /** How long it took end to end, e.g. 'about 12 minutes'. From the mission record. */
  duration: string;

  /**
   * Set on illustrative studies that carry invented numbers. Renders a banner
   * that says so above the h1. Delete the flag when real data goes in; nothing
   * else about the page changes.
   */
  placeholder?: boolean;
}

/* ══════════════════════════════════════════════════════════════════════
   Chart renderer - one switch, four results-v2 components
════════════════════════════════════════════════════════════════════════ */

function Chart({ chart }: { chart: CaseStudyChart }) {
  switch (chart.kind) {
    case 'bars':
      return <HBars rows={chart.rows} base={chart.base} unit={chart.unit ?? '%'} />;
    case 'histogram':
      return <Histogram buckets={chart.buckets} total={chart.total} />;
    case 'donut':
      return <DonutLegend entries={chart.entries} />;
    case 'themes':
      return <Themes themes={chart.themes} n={chart.n} />;
  }
}

/* ══════════════════════════════════════════════════════════════════════
   Small local pieces
════════════════════════════════════════════════════════════════════════ */

function BandHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 mt-16 text-2xl font-black tracking-tight text-white sm:text-3xl">
      {children}
    </h2>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   The template
════════════════════════════════════════════════════════════════════════ */

export function CaseStudyPageTemplate({ study }: { study: CaseStudy }) {
  // Title, description and canonical come from the SEO manifest, which is also
  // what scripts/prerender.mjs bakes into the static HTML for this route. Same
  // single source the /vs pages use.
  useRouteSeo(study.slug);

  const cells: StatCellProps[] = study.stats.map((s) => ({
    label: s.label,
    value: toScalarSlot(s.value),
    tone: s.tone ?? 'plain',
  }));

  return (
    <OverlayPage>
      {/* rv2-root scopes the reduced-motion reset in results-v2.css; the text
          colour is set here because the results-v2 charts are drawn against
          the results page's own palette and inherit their body colour. */}
      <div className="rv2-root mx-auto max-w-4xl text-[#F3F5EF]">
        {study.placeholder && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber/40 bg-amber/[0.08] p-5">
            <AlertTriangle className="mt-[2px] h-5 w-5 flex-none text-amber" aria-hidden />
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber">
                Placeholder study
              </p>
              <p className="text-sm leading-relaxed text-white/70">
                Every name, figure and quote on this page is invented to show the
                shape of a VETT case study. No mission was run, no customer is
                described, and none of these numbers means anything. It will be
                replaced by a real study.
              </p>
            </div>
          </div>
        )}

        {/* ── Band 1: eyebrow, the finding, the method line ─────────────── */}
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.06] px-3 py-[6px] text-[11px] font-black uppercase tracking-[0.16em] text-primary">
          {study.eyebrow}
        </span>

        <h1 className="mb-5 mt-5 text-3xl font-black leading-[1.08] tracking-tight text-white [overflow-wrap:break-word] sm:text-5xl md:text-6xl md:tracking-tighter">
          {study.finding}
        </h1>

        <p className="mb-2 text-base text-white/60 sm:text-lg">
          {study.method.methodology}. n = {study.method.n}. {study.method.markets}.{' '}
          {study.method.month}.
        </p>

        {/* ── Band 2: the stat strip ────────────────────────────────────── */}
        <StatStrip cells={cells} />

        {/* ── Band 3: the situation, the only authored prose ────────────── */}
        <BandHeading>The situation</BandHeading>
        {study.situation.map((para, i) => (
          <p key={i} className="mb-4 max-w-[68ch] text-base leading-relaxed text-white/70">
            {para}
          </p>
        ))}

        {/* ── Band 4: the centerpiece chart ───────────────────────────────
            No BandHeading here on purpose: QHead already renders the
            centerpiece title as an h2, and printing it twice reads as a
            layout bug rather than as emphasis. The card carries the band's
            top margin instead. */}
        <Card className="mt-16">
          <QHead
            eyebrow={study.centerpiece.eyebrow}
            title={study.centerpiece.title}
            chip={study.centerpiece.chip}
          />
          <Chart chart={study.centerpiece.chart} />
          <p className="mt-5 border-t border-white/[0.07] pt-4 text-[12.5px] leading-relaxed text-[#8B919C]">
            {study.centerpiece.caption}
          </p>
        </Card>

        {/* ── Band 5: what respondents said ─────────────────────────────── */}
        <BandHeading>What respondents said</BandHeading>
        <div className="flex flex-col gap-5">
          {study.questions.map((q, i) => (
            <Card key={i}>
              <QHead
                eyebrow={`Q${i + 1} - ${q.rendererLabel}`}
                title={q.question}
                meta={q.meta}
              />
              {q.insight && <VettRead>{q.insight}</VettRead>}
              <Chart chart={q.chart} />
            </Card>
          ))}
        </div>

        {study.verbatims.length > 0 && (
          <div className="mt-5 flex flex-col gap-4">
            {study.verbatims.map((v, i) => (
              <figure
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
              >
                <blockquote className="text-[15px] italic leading-relaxed text-white/75 [overflow-wrap:break-word]">
                  &ldquo;{v}&rdquo;
                </blockquote>
                {/* Inline, on the quote, not in a footnote. A reader who sees
                    the quote sees the label in the same glance. */}
                <figcaption className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#8B919C]">
                  Synthetic respondent. Generated, not collected from a person.
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {/* ── Band 6: who answered ──────────────────────────────────────── */}
        <BandHeading>Who answered</BandHeading>
        {/* A band on a wide screen, a stack at 320. Nothing is hidden and
            nothing scrolls sideways: the cards reflow. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {study.personas.map((p) => (
            <div
              key={p.name}
              className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-5"
            >
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="min-w-0 font-black text-white [overflow-wrap:break-word]">
                  {p.name}
                </span>
                <span className="shrink-0 whitespace-nowrap font-['Manrope',system-ui,sans-serif] text-sm font-bold tabular-nums text-lime">
                  {p.share}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-white/60">{p.description}</p>
            </div>
          ))}
        </div>

        {/* ── Band 7: the honesty callout, then the CTA ─────────────────── */}
        <BandHeading>What this number can carry</BandHeading>
        <div
          className={[
            'rounded-2xl border p-5',
            study.gate.posture === 'authoritative'
              ? 'border-primary/25 bg-primary/[0.04]'
              : 'border-amber/40 bg-amber/[0.08]',
          ].join(' ')}
        >
          <p
            className={[
              'mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em]',
              study.gate.posture === 'authoritative' ? 'text-primary' : 'text-amber',
            ].join(' ')}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {study.gate.posture === 'authoritative'
              ? 'Above the statistical gate'
              : 'Directional read'}
          </p>
          {/* The gate note, verbatim from report.centerpiece.gate.note. */}
          <p className="text-sm leading-relaxed text-white/75">{study.gate.note}</p>
          <p className="mt-3 text-[12.5px] text-white/50">
            VETT respondents are simulated, not recruited. Read this as evidence
            about direction and ranking, and see{' '}
            <Link to="/methodology" className="underline hover:text-white/80">
              how VETT produces a number
            </Link>{' '}
            for where each figure stops being reliable.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-white/5 bg-white/[0.025] p-8 text-center sm:p-12">
          <h3 className="mb-3 text-2xl font-black text-white">
            {study.cost}. {study.duration}.
          </h3>
          <p className="mx-auto mb-6 max-w-md text-white/60">
            That is what this study cost and how long it took, start to finish.
            Yours runs the same way.
          </p>
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 rounded-full bg-[#DFFF00] px-6 py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-[#DFFF00]/30 transition-all hover:scale-105 hover:bg-[#E5FF40] sm:px-8"
          >
            <Sparkles className="h-4 w-4" />
            Start a mission <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          <Link to="/case-studies" className="underline hover:text-white/70">
            All case studies
          </Link>
        </p>

        {/* One lens instance for the whole page; the charts feed it. */}
        <Lens />
      </div>
    </OverlayPage>
  );
}

export default CaseStudyPageTemplate;
