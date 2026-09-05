/**
 * ResultsV2Page - additive PREVIEW route at /results-v2/:missionId.
 *
 * A React + Tailwind port of vett-final-mocks/vett-results-redesign.html,
 * built to the same house rules as the /landing-v2 port: real JSX components,
 * one small namespaced CSS file for the things Tailwind cannot express, no new
 * dependencies, tokens extracted from the mock rather than guessed.
 *
 *   - This file does NOT touch /results/:missionId. ResultsRouter.tsx,
 *     PremiumResults.tsx, Centerpiece.tsx and premium-results.css are
 *     byte-identical to origin/main; the live results page is unaffected.
 *   - It reads the SAME canonical report the live page reads
 *     (GET /api/results/:id/report), so nothing here can drift from the
 *     exports or from Ask VETT.
 *
 * Design tokens extracted from the mock:
 *   bg #0B0C15 · bg-2 #0E1019
 *   surface rgba(255,255,255,.025) · surface-2 .045
 *   border rgba(255,255,255,.07) · border-strong .12 · border-lime rgba(190,242,100,.22)
 *   lime #BEF264 · lime-soft rgba(190,242,100,.14)
 *   indigo #6366F1 · indigo-soft rgba(99,102,241,.16)
 *   amber #F2B24A · amber-soft rgba(242,178,74,.14) · rose #F2748C
 *   text #F3F5EF · muted #8B919C · faint #5C6470 · track #1B1E2B
 *   radii 22 / 16 / 10px · container 1340px, 28px gutter (16px < 680)
 *   shell grid minmax(0,1fr) / 320px, 34px gap, rail sticky at 90px
 *   display Manrope 700/800, body Inter 400/500/600
 *   breakpoints 1080 (rail unstacks to a row, hero and donut go single column)
 *               680  (16px gutter, stat strip stacks, histogram 220px)
 *
 * WHAT THIS PORT DELIBERATELY DOES NOT CARRY OVER
 * -----------------------------------------------
 * The live page has known defects under separate diagnosis. This page does not
 * reproduce them and does not try to fix them upstream:
 *   1. Hero tiles that contradict the analysis below. Fixed structurally: every
 *      headline figure, the rail metrics and the section under them all come
 *      from ONE call to buildCenterpiece(report) - see centerpiece.ts.
 *   2. A narrative sentence rendered in a 46px numeral slot. Fixed by type:
 *      a numeral only accepts a ScalarSlot - see valueSlot.ts.
 *   3. Values that read "9" instead of "95" because a count-up animates off the
 *      leading digits of the string. No value animates here; bars do.
 *   4. Content sitting left of centre with a dead right third. Fixed by the
 *      mock's shell: one 1340px centred grid, main + a rail that has a job.
 *   5. Synthesis as an unbroken 25-line paragraph. Split into paragraphs at a
 *      readable measure.
 *   6. A duplicate stat tile floating top-right over the content. There is one
 *      stat strip and one rail card, both from the same array.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { api, ApiError } from '../lib/apiClient';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import type {
  CanonicalReport,
  CanonicalSurveyQuestion,
  CanonicalTheme,
} from '../components/results/report/useCanonicalReport';

import {
  Card,
  Eyebrow,
  Hint,
  JumpNav,
  Lens,
  QHead,
  RailStat,
  RailTitle,
  StatCell,
  VettRead,
} from '../components/results-v2/primitives';
import {
  DonutLegend,
  Empty,
  HBars,
  Histogram,
  ScreenerBase,
  Themes,
} from '../components/results-v2/charts';
import { useDrawIn, lensHandlers } from '../components/results-v2/hooks';
import { buildCenterpiece, railMetrics } from '../components/results-v2/centerpiece';
import type { SignalRow } from '../components/results-v2/centerpiece';

import '../styles/results-v2.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

/* ══════════════════════════════════════════════════════════════════════
   Copy helpers
════════════════════════════════════════════════════════════════════════ */

/**
 * The live page renders the synthesis as one <p>, which on a long summary is a
 * 25-line wall. Group sentences into paragraphs of at most three so the block
 * has somewhere for the eye to rest. Splitting is done on sentence ends that
 * are followed by a capital, so decimals and "e.g." survive.
 */
function toParagraphs(text: string, perPara = 3): string[] {
  const sentences = splitSentences(text);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += perPara) {
    out.push(sentences.slice(i, i + perPara).join(' '));
  }
  return out.filter(Boolean);
}

/**
 * Split prose into sentences.
 *
 * Deliberately lookahead-only: a lookbehind (`(?<=[.!?])`) is a parse-time
 * SyntaxError on Safari below 16.4, which would take the whole page chunk down
 * rather than degrade. A sentence ends at .!? followed by whitespace and a
 * capital or an open bracket, so "82.5%" and "e.g." stay intact.
 */
function splitSentences(text: string): string[] {
  const normalised = text.replace(/\s+/g, ' ').trim();
  if (!normalised) return [];
  return normalised
    .replace(/([.!?])\s+(?=[A-Z(])/g, '$1\u0000')
    .split('\u0000')
    .filter(Boolean);
}

/**
 * Pick the sentence that goes in the H1.
 *
 * `report.finding` is the backend's headline sentence and is preferred. On some
 * live missions it arrives cut off mid-sentence (a separate, server-side defect
 * that is being diagnosed elsewhere). Rather than reproduce a truncated
 * headline, this falls through to the first sentence of the synthesis, which
 * comes from the SAME report object, and only then to the raw mission title.
 * Nothing is rewritten or invented; the choice is between strings the report
 * already contains.
 */
function headlineOf(report: CanonicalReport): string {
  const finding = (report.finding || '').trim();
  const looksComplete = finding.length > 0 && /[.!?]$/.test(finding);
  if (looksComplete) return finding;

  // When the statistical gate has withheld the point estimate, do NOT borrow
  // the synthesis's opening sentence: it is the sentence that quotes the very
  // figure the gate is suppressing, and leading with it would undo the
  // suppression in the largest type on the page.
  if (report.centerpiece?.gate?.suppress_headline) {
    return finding || report.header.title;
  }

  const synthesis = report.synthesis || report.exec_summary || '';
  const first = splitSentences(synthesis)[0];
  if (first && first.length >= 24) return first;

  return finding || report.header.title;
}

/**
 * The mock's H1 clamp, clamp(34px, 4.1vw, 58px), is drawn for a headline of
 * roughly 75 characters. Real `finding` strings vary a lot, and a 150-character
 * sentence at 58px is a wall. Step the scale down instead of truncating, which
 * is what produces the cut-off headline on the live page.
 */
function headlineScale(text: string): string {
  if (text.length <= 90) return 'text-[clamp(34px,4.1vw,58px)]';
  if (text.length <= 150) return 'text-[clamp(28px,3.0vw,40px)]';
  return 'text-[clamp(24px,2.3vw,32px)]';
}

/**
 * Highlight the headline figure inside the headline sentence, but only when
 * that exact token is already in the sentence. Nothing is invented: if the
 * number is not in the words, no word turns lime.
 */
function highlight(headline: string, token: string | null) {
  if (!token || token.length < 2) return headline;
  const at = headline.indexOf(token);
  if (at < 0) return headline;
  return (
    <>
      {headline.slice(0, at)}
      <span className="text-[#BEF264]">{token}</span>
      {headline.slice(at + token.length)}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Question card
════════════════════════════════════════════════════════════════════════ */

const TAG_FOR = (q: CanonicalSurveyQuestion) => {
  if (q.isScreening || q.renderer === 'screener') return 'Screener';
  if (q.renderer.startsWith('scale')) return 'Numeric';
  if (q.renderer === 'multi_select' || q.renderer === 'attribute_battery') return 'Multi';
  if (q.renderer === 'open_text_verbatims') return 'Open';
  return 'Single';
};

function sortedDist(data: Record<string, unknown>): Array<[string, number]> {
  const dist = (data.distribution ?? {}) as Record<string, number>;
  return Object.entries(dist)
    .map(([k, v]) => [k, Number(v) || 0] as [string, number])
    .sort((a, b) => b[1] - a[1]);
}

function QuestionCard({
  q,
  report,
  index,
}: {
  q: CanonicalSurveyQuestion;
  report: CanonicalReport;
  index: number;
}) {
  const data = q.data as Record<string, unknown>;
  const n = Number(data.n) || Number(data.n_respondents) || report.header.sample.n || 0;
  const tag = TAG_FOR(q);
  const lowN = n > 0 && n < 5;

  let viz: JSX.Element;
  let meta = q.renderer_label;

  if (tag === 'Screener') {
    const dist = (data.distribution ?? {}) as Record<string, number>;
    viz = (
      <ScreenerBase
        qualified={report.screening?.qualified ?? Object.values(dist).reduce((s, v) => s + Number(v), 0)}
        conditions={Object.keys(dist)}
      />
    );
    meta = `${q.renderer_label} · sets the base for every figure below`;
  } else if (q.renderer.startsWith('scale')) {
    const dist = (data.distribution ?? {}) as Record<string, number>;
    const min = Number(data.scale_min);
    const max = Number(data.scale_max);
    const keys =
      Number.isFinite(min) && Number.isFinite(max) && max >= min
        ? Array.from({ length: max - min + 1 }, (_, i) => min + i)
        : Object.keys(dist).map(Number).sort((a, b) => a - b);
    const buckets = keys.map((k) => ({
      label: String(k),
      count: Number(dist[k] ?? dist[String(k)] ?? 0),
    }));
    const answered = buckets.reduce((s, b) => s + b.count, 0);
    viz = <Histogram buckets={buckets} total={answered || n} />;
    meta = `${q.renderer_label} · n = ${answered || n}`;
  } else if (q.renderer === 'open_text_verbatims') {
    const themes = (Array.isArray(data.themes) ? data.themes : []) as CanonicalTheme[];
    const verbatims = (Array.isArray(data.verbatims) ? data.verbatims : []) as string[];
    viz = <Themes themes={themes} n={Number(data.n) || verbatims.length || n} verbatims={verbatims} />;
    meta = `${q.renderer_label} · themes across ${Number(data.n) || verbatims.length || n} responses · hover for a verbatim`;
  } else if (q.renderer === 'multi_select' || q.renderer === 'attribute_battery') {
    const attrs = (Array.isArray(data.per_attribute) ? data.per_attribute : []) as Array<
      Record<string, unknown>
    >;
    if (data.shape === 'matrix' && attrs.length) {
      const max = Number(data.scale_max) || 5;
      viz = (
        <HBars
          base={n}
          unit={`/${max}`}
          rows={attrs.map((a) => ({
            label: String(a.attribute),
            count: Math.round((Number(a.average) || 0) * 10) / 10,
            pct: Math.min(100, Math.round(((Number(a.average) || 0) / max) * 100)),
          }))}
        />
      );
      meta = `${q.renderer_label} · mean per attribute, 1 to ${max}`;
    } else {
      const rows = sortedDist(data).map(([label, count]) => ({
        label,
        count,
        pct: n > 0 ? Math.round((count / n) * 100) : 0,
      }));
      viz = <HBars rows={rows} base={n} />;
      meta = `${q.renderer_label} · % of ${n} respondents`;
    }
  } else {
    viz = <DonutLegend entries={sortedDist(data)} />;
    meta = `${q.renderer_label} · n = ${n}`;
  }

  return (
    <Card id={`q-${q.id}`}>
      <QHead
        eyebrow={`Q${q.number ?? index + 1} · ${q.renderer_label}`}
        title={q.text}
        meta={meta}
        chip={tag}
      />
      {q.insight && <VettRead>{q.insight}</VettRead>}
      {viz}
      {lowN && (
        <p className="mt-4 text-[12.5px] text-[#F2B24A]">
          n = {n}. Directional. Read the ranking and the consensus, not the point magnitudes.
        </p>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Signal row - the mock's .market-row + .submeta
════════════════════════════════════════════════════════════════════════ */

const ROW_BAR: Record<SignalRow['tone'], string> = {
  lime: 'bg-[linear-gradient(90deg,rgba(190,242,100,0.55),#BEF264)]',
  amber: 'bg-[linear-gradient(90deg,rgba(242,178,74,0.5),#F2B24A)]',
  rose: 'bg-[linear-gradient(90deg,rgba(242,116,140,0.5),#F2748C)]',
};
const ROW_PILL: Record<SignalRow['tone'], string> = {
  lime: 'text-[#BEF264] bg-[rgba(190,242,100,0.14)] border-[rgba(190,242,100,0.22)]',
  amber: 'text-[#F2B24A] bg-[rgba(242,178,74,0.14)] border-[rgba(242,178,74,0.3)]',
  rose: 'text-[#F2748C] bg-[rgba(242,116,140,0.12)] border-[rgba(242,116,140,0.3)]',
};

function SignalRows({ rows }: { rows: SignalRow[] }) {
  const drawn = useDrawIn();
  return (
    <div>
      {rows.map((r) => (
        <div key={r.key}>
          <div className="grid grid-cols-[minmax(64px,auto)_1fr_auto] items-center gap-[18px] px-1 pb-[6px] pt-5 max-[680px]:grid-cols-1 max-[680px]:gap-2">
            <div className="flex items-center gap-[9px] font-['Manrope',system-ui,sans-serif] text-[17px] font-bold">
              <span className="truncate">{r.label}</span>
              {r.signal && (
                <span
                  className={[
                    'flex-none rounded-[6px] border px-2 py-1 text-[10px] font-bold tracking-[0.1em]',
                    ROW_PILL[r.tone],
                  ].join(' ')}
                >
                  {r.signal}
                </span>
              )}
            </div>
            <div
              className="relative h-[30px] cursor-pointer overflow-hidden rounded-[8px] bg-[#1B1E2B] hover:brightness-[1.12] max-[680px]:order-3"
              {...lensHandlers(() => ({ title: r.label, rows: r.lens, tone: r.tone }))}
            >
              <i
                className={['rv2-mbar-fill absolute inset-y-0 left-0 block rounded-[8px]', ROW_BAR[r.tone]].join(' ')}
                style={{ width: drawn ? `${r.pct}%` : '0%' }}
              />
            </div>
            <div className="min-w-[62px] text-right font-['Manrope',system-ui,sans-serif] text-[16px] font-bold tabular-nums">
              {r.value}
            </div>
          </div>
          {r.sub.length > 0 && (
            <div className="flex flex-wrap gap-x-[22px] gap-y-[5px] pb-[10px] pl-[82px] pr-1 pt-[2px] text-[12.5px] text-[#8B919C] max-[680px]:pl-1">
              {r.sub.map((s) => (
                <span key={s.k}>
                  {s.k} <b className="font-semibold text-[#F3F5EF]">{s.v}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Dev fixture loader
════════════════════════════════════════════════════════════════════════ */

/**
 * In a production build `import.meta.env.DEV` folds to `false`, so this
 * returns on the first line and Rollup drops the dynamic import together with
 * the whole fixture module. Nothing under __fixtures__ is ever shipped.
 */
async function loadFixture(
  missionId: string,
): Promise<{ report: CanonicalReport } | { error: string }> {
  if (!import.meta.env.DEV) {
    return { error: 'Fixture previews are only available in a dev build.' };
  }
  const mod = await import('../components/results-v2/__fixtures__/reports');
  const fx = mod.FIXTURES[missionId];
  if (!fx) {
    return { error: `No fixture for ${missionId}. Available: ${mod.FIXTURE_IDS.join(', ')}` };
  }
  return { report: fx };
}

/* ══════════════════════════════════════════════════════════════════════
   Page
════════════════════════════════════════════════════════════════════════ */

export function ResultsV2Page() {
  const { missionId } = useParams<{ missionId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [report, setReport] = useState<CanonicalReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // DEV ONLY: ?fixture=1 loads a canonical report rebuilt from real production
  // mission rows, so the page can be rendered and screenshotted on a checkout
  // with no Supabase session. `loadFixture` returns before the dynamic import
  // in any non-dev build, so Rollup folds the branch away and the fixture
  // chunk is never emitted for production.
  const useFixture = params.get('fixture') != null;

  useEffect(() => {
    if (!missionId) return;
    let cancelled = false;
    (async () => {
      try {
        if (useFixture) {
          const fx = await loadFixture(missionId);
          if (cancelled) return;
          if ('error' in fx) {
            setError(fx.error);
            return;
          }
          setReport(fx.report);
          return;
        }
        const res = await api.get(`/api/results/${missionId}/report`);
        if (!cancelled) setReport(res.report || null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load report');
        setErrorStatus(e instanceof ApiError ? e.status : null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [missionId, useFixture]);

  const cp = useMemo(() => (report ? buildCenterpiece(report) : null), [report]);

  const downloadExport = async (format: 'pdf' | 'pptx' | 'xlsx') => {
    setBusy(format);
    const id = toast.loading(`Generating ${format.toUpperCase()}...`);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch(`${API_URL}/api/results/${missionId}/export/${format}`, { headers });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(report?.header.title || 'vett-report').replace(/[^a-z0-9]+/gi, '-').slice(0, 50)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.update(id, { type: 'success', message: `${format.toUpperCase()} downloaded` });
    } catch {
      toast.update(id, { type: 'error', message: `${format.toUpperCase()} failed. Try again.` });
    } finally {
      setBusy(null);
    }
  };

  if (error) {
    // A signed-out visitor used to get the raw backend string
    // ("Missing or invalid authorization header") as the entire page: no
    // branding, no explanation, no way forward. Every shared results link
    // lands here, so it is the first thing a recipient sees.
    const signedOut = errorStatus === 401;
    const notYours = errorStatus === 403 || errorStatus === 404;
    const returnTo = `/results-v2/${missionId ?? ''}`;
    return (
      <div className="rv2-root grid min-h-[100dvh] place-items-center bg-[#0B0C15] px-6">
        <div className="w-full max-w-[46ch] text-center">
          <div className="mb-6 font-['Manrope',system-ui,sans-serif] text-2xl font-black tracking-tight text-white">
            VETT
          </div>
          {signedOut ? (
            <>
              <h1 className="mb-3 text-xl font-bold text-white">Sign in to view this report</h1>
              <p className="mb-7 text-[15px] leading-relaxed text-[#8B919C]">
                Mission results are private to the account that ran them. Sign in
                and we will bring you straight back to this report.
              </p>
              <Link
                to={`/signin?redirect=${encodeURIComponent(returnTo)}`}
                className="inline-block rounded-full bg-[#BEF264] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-[#0B0C15] transition-opacity hover:opacity-90"
              >
                Sign in
              </Link>
            </>
          ) : notYours ? (
            <>
              <h1 className="mb-3 text-xl font-bold text-white">This report is not in your account</h1>
              <p className="mb-7 text-[15px] leading-relaxed text-[#8B919C]">
                You are signed in, but this mission belongs to a different
                account. Ask whoever ran it to share the export, or open your own
                missions.
              </p>
              <Link
                to="/missions"
                className="inline-block rounded-full bg-[#BEF264] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-[#0B0C15] transition-opacity hover:opacity-90"
              >
                Your missions
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-3 text-xl font-bold text-white">This report could not be loaded</h1>
              <p className="mb-7 text-[15px] leading-relaxed text-[#8B919C]">{error}</p>
              <Link
                to="/missions"
                className="inline-block rounded-full border border-white/15 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white transition-colors hover:border-white/30"
              >
                Your missions
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }
  if (!report || !cp) {
    return (
      <div className="rv2-root grid min-h-[100dvh] place-items-center bg-[#0B0C15]">
        <p className="text-[#8B919C]">Building your report...</p>
      </div>
    );
  }

  const h = report.header;
  const sample = h.sample;
  const directional = sample.posture === 'directional';
  const headline = headlineOf(report);
  const cells = cp.view?.cells ?? [];
  const rail = railMetrics(cp.view);
  const recs = report.recommendations || [];
  const synthesis = report.synthesis || report.exec_summary || '';

  const jump = [
    cp.view || cp.withheld ? { href: '#centerpiece', label: cp.view?.eyebrow ?? 'Headline read' } : null,
    synthesis ? { href: '#synthesis', label: 'The read' } : null,
    ...report.survey.map((q) => ({ href: `#q-${q.id}`, label: `Q${q.number} · ${TAG_FOR(q)}` })),
    recs.length ? { href: '#recs', label: 'Recommendations' } : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  return (
    <div className="rv2-root relative min-h-[100dvh] bg-[#0B0C15] font-['Inter',system-ui,sans-serif] text-[#F3F5EF] antialiased [line-height:1.55]">
      <div className="rv2-glow pointer-events-none fixed inset-0 z-0" aria-hidden />

      {/* ── top bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[rgba(11,12,21,0.72)] backdrop-blur-[18px] backdrop-saturate-[140%]">
        <div className="mx-auto flex max-w-[1340px] items-center justify-between gap-4 px-7 py-[14px] max-[680px]:px-4">
          <div className="flex items-center gap-[11px]">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mr-1 flex items-center gap-[7px] border-r border-white/[0.07] pr-[14px] text-[13px] text-[#8B919C] transition-colors hover:text-[#F3F5EF]"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </button>
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-[linear-gradient(150deg,#C9F875,#A6E03F)] shadow-[0_6px_18px_rgba(190,242,100,0.28)]">
              <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
                <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8Z" fill="#0B0C15" />
              </svg>
            </span>
            <span className="font-['Manrope',system-ui,sans-serif] text-[18px] font-extrabold tracking-[0.04em]">
              VETT
            </span>
          </div>
          <div className="flex gap-2">
            {(['pdf', 'pptx', 'xlsx'] as const).map((f, i) => (
              <button
                key={f}
                type="button"
                disabled={busy === f}
                onClick={() => downloadExport(f)}
                className={[
                  'rounded-[9px] border border-white/[0.07] bg-white/[0.025] px-[14px] py-2',
                  'text-[12.5px] font-semibold tracking-[0.04em] text-[#8B919C] transition-all duration-150',
                  'hover:border-white/[0.12] hover:bg-white/[0.045] hover:text-[#F3F5EF] disabled:opacity-50',
                  i > 0 ? 'max-[680px]:hidden' : '',
                ].join(' ')}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── shell: ONE centred width, main + sticky rail ── */}
      <div className="relative z-[1] mx-auto grid max-w-[1340px] items-start gap-[34px] px-7 pb-[90px] pt-[42px] max-[1080px]:grid-cols-1 max-[680px]:px-4 min-[1081px]:grid-cols-[minmax(0,1fr)_320px]">
        <main className="flex min-w-0 flex-col gap-[26px]">
          {/* HERO */}
          <section className="grid items-stretch gap-[30px] max-[1080px]:grid-cols-1 min-[1081px]:grid-cols-[1.45fr_1fr]">
            <div className="py-[30px] pr-[30px] max-[1080px]:px-0 max-[1080px]:py-[6px]">
              <Eyebrow>
                {h.methodology_label}
                {sample.n != null ? ` · n = ${sample.n}` : ''}
              </Eyebrow>
              <h1
                className={[
                  "mt-[18px] font-['Manrope',system-ui,sans-serif] font-extrabold leading-[1.06] tracking-[-0.02em]",
                  headlineScale(headline),
                ].join(' ')}
              >
                {highlight(headline, cells[0]?.value.scalar ?? null)}
              </h1>
              {h.brief && (
                <p className="mt-5 max-w-[46ch] text-[15.5px] text-[#8B919C]">{h.brief}</p>
              )}
            </div>

            <div className="flex flex-col rounded-[22px] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
              <div className="mb-[14px] text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5C6470]">
                At a glance
              </div>
              <div className="flex flex-col">
                {[
                  ['Respondents', sample.n != null ? String(sample.n) : '—'],
                  ['Qualified', sample.qualified != null ? String(sample.qualified) : '—'],
                  ['Questions', `${report.survey.length}, all visual`],
                  ['Methodology', h.methodology_label],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between border-b border-white/[0.07] py-[13px] text-[14px] last:border-b-0"
                  >
                    <span className="text-[#8B919C]">{k}</span>
                    <span className="font-['Manrope',system-ui,sans-serif] font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-[14px]">
                <div className="mb-[7px] flex justify-between text-[12.5px]">
                  <span className="text-[#8B919C]">Confidence</span>
                  <span
                    className={[
                      'font-semibold tracking-[0.08em]',
                      directional ? 'text-[#F2B24A]' : 'text-[#BEF264]',
                    ].join(' ')}
                  >
                    {directional ? 'DIRECTIONAL' : 'INDICATIVE'}
                  </span>
                </div>
                <div className="h-[6px] overflow-hidden rounded-[5px] bg-[#1B1E2B]">
                  <i
                    className="block h-full rounded-[5px] bg-[linear-gradient(90deg,#BEF264,#F2B24A)]"
                    style={{ width: directional ? '48%' : '85%' }}
                  />
                </div>
                <div className="mt-2 text-[12px] text-[#5C6470]">
                  {directional
                    ? 'Small base. Strong on direction and consensus, indicative on magnitude.'
                    : 'Sufficient base for an indicative reading.'}
                </div>
              </div>
            </div>
          </section>

          {/* CENTERPIECE */}
          {cp.withheld && (
            <Card id="centerpiece">
              <QHead
                eyebrow="Headline read"
                title="Headline figure withheld"
                meta={`n = ${cp.withheld.n} · this method needs at least ${cp.withheld.threshold}`}
                chip="Directional"
              />
              <p className="mt-4 max-w-[70ch] text-[14px] leading-[1.65] text-[#8B919C]">
                Rather than show a number the sample cannot support, VETT is not showing one. The
                response data and the breakdowns below are unaffected.
              </p>
            </Card>
          )}

          {cp.view && (
            <Card id="centerpiece">
              <QHead
                eyebrow={cp.view.eyebrow}
                title={cp.view.title}
                chip={cp.view.chip}
              />
              {cp.directionalNote && (
                <p className="mt-3 text-[12.5px] text-[#F2B24A]">{cp.directionalNote}</p>
              )}
              {cells.length > 0 && (
                <div className="mt-[18px] grid overflow-hidden rounded-[16px] border border-white/[0.07] max-[680px]:grid-cols-1 min-[681px]:grid-cols-[1fr_1fr_1.5fr]">
                  {cells.map((c) => (
                    <StatCell key={c.label} label={c.label} value={c.value} tone={c.tone} />
                  ))}
                </div>
              )}
              {cp.view.rowsMeta && (
                <div className="mt-5 text-[12.5px] tracking-[0.04em] text-[#5C6470]">
                  {cp.view.rowsMeta}
                </div>
              )}
              {cp.view.rows.length > 0 ? (
                <SignalRows rows={cp.view.rows} />
              ) : (
                !cells.length && <Empty>No headline read for this methodology.</Empty>
              )}
            </Card>
          )}

          {/* SYNTHESIS */}
          {synthesis && (
            <Card id="synthesis">
              <QHead eyebrow="VETT synthesis" title="The read" chip="Summary" />
              <div className="mt-[18px] flex max-w-[74ch] flex-col gap-4 text-[15px] leading-[1.7] text-[#CBD0CB]">
                {toParagraphs(synthesis).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Card>
          )}

          {/* QUESTIONS */}
          {report.survey.map((q, i) => (
            <QuestionCard key={q.id} q={q} report={report} index={i} />
          ))}

          {/* RECOMMENDATIONS */}
          {recs.length > 0 && (
            <Card id="recs">
              <QHead eyebrow="Recommendations" title="What to do next" />
              <div className="mt-2 flex flex-col">
                {recs.map((r, i) => {
                  const [head, ...rest] = r.split(/[:—–]\s+/);
                  const body = rest.join(' ');
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-[54px_1fr] gap-2 border-b border-white/[0.07] py-[22px] last:border-b-0"
                    >
                      <div className="font-['Manrope',system-ui,sans-serif] text-[34px] font-extrabold leading-none text-[#BEF264]">
                        {i + 1}
                      </div>
                      <div>
                        <div className="mb-[6px] font-['Manrope',system-ui,sans-serif] text-[17px] font-bold">
                          {body ? head : r}
                        </div>
                        {body && <div className="max-w-[70ch] text-[14px] text-[#8B919C]">{body}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* METHODOLOGY */}
          <Card>
            <QHead eyebrow="Methodology & honesty" title="How this number was produced" />
            <p className="mt-[18px] max-w-[74ch] text-[14px] leading-[1.7] text-[#8B919C]">
              {report.methodology_disclaimer}
            </p>
            <div className="mt-6 grid gap-6 text-[13px] text-[#8B919C] max-[680px]:grid-cols-1 min-[681px]:grid-cols-3">
              <div>
                <b className="text-[#F3F5EF]">Sample</b>
                <br />n = {sample.n ?? '—'}
                {sample.qualified != null ? ' qualified' : ''}
              </div>
              <div>
                <b className="text-[#F3F5EF]">Confidence</b>
                <br />
                {directional ? 'Directional' : 'Indicative'}
              </div>
              <div>
                <b className="text-[#F3F5EF]">Completed</b>
                <br />
                {sample.completed_at
                  ? new Date(sample.completed_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </div>
            </div>
          </Card>
        </main>

        {/* ── STICKY RAIL: what turns the dead right third into purpose ── */}
        <aside className="flex flex-col gap-4 max-[1080px]:flex-row max-[1080px]:flex-wrap min-[1081px]:sticky min-[1081px]:top-[90px]">
          {rail.length > 0 && (
            <Card pad="p-5" className="max-[1080px]:min-w-[220px] max-[1080px]:flex-1">
              <RailTitle>Key metrics</RailTitle>
              {rail.map((c, i) => (
                <RailStat
                  key={c.label}
                  label={c.label}
                  value={c.value}
                  tone={c.tone && c.tone !== 'plain' ? c.tone : i === 1 ? 'amber' : 'lime'}
                />
              ))}
            </Card>
          )}
          <Card pad="p-4" className="max-[1080px]:min-w-[220px] max-[1080px]:flex-1">
            <Hint>Hover any chart for the detail behind it.</Hint>
          </Card>
          <Card pad="p-5" className="max-[1080px]:min-w-[220px] max-[1080px]:flex-1">
            <RailTitle>Jump to</RailTitle>
            <JumpNav items={jump} />
          </Card>
        </aside>
      </div>

      <Lens />
    </div>
  );
}

export default ResultsV2Page;
