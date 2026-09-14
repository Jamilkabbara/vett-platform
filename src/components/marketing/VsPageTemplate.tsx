/**
 * Pass 35 C3 — Shared template for /vs/* competitive pages.
 *
 * Honest framing throughout: competitor strengths acknowledged, VETT
 * positioning kept truthful (faster and cheaper, NOT "more accurate" or
 * "panel replacement"). Every competitor statement comes from the
 * competitor's own site, listed in `sources` with the date it was checked;
 * anything that cannot be sourced there is left out rather than estimated.
 *
 * Each consuming page passes:
 *   - competitor name + 1-line positioning
 *   - 5-7 honest comparison rows (each row reads "VETT" or "tie" or
 *     "competitor" — no false-equivalence "VETT wins everywhere")
 *   - 1-3 paragraphs on "When to use VETT vs [competitor]"
 *   - the pages on the competitor's own site the claims were taken from
 */


import { Link } from 'react-router-dom';
import { OverlayPage } from '../layout/OverlayPage';
import { Check, X, Minus, ArrowRight, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { useRouteSeo } from '../../seo/useRouteSeo';
import { FaqJsonLd } from './FaqJsonLd';
import { VS_COMPARISONS } from './vsComparisons';
import { SELF_SERVE_MIN_RESPONDENTS, SELF_SERVE_MIN_USD } from '../../utils/priceCopy';

export type Verdict = 'vett' | 'competitor' | 'tie';

export interface ComparisonRow {
  dimension: string;
  vett: string;
  competitor: string;
  verdict: Verdict;
}

export interface VsPageProps {
  competitorName: string;
  competitorTagline: string;
  vettTagline: string;
  /** Path relative to root, e.g. '/vs/conjointly' for canonical URL. */
  slug: string;
  /** Public reference URL on the competitor site (methodology / pricing). */
  competitorRefUrl?: string;
  /**
   * Every page on the competitor's own site a claim was taken from. Shown at
   * the foot of the page with `checkedOn`. Use instead of competitorRefUrl
   * when the claims come from more than one page.
   */
  sources?: string[];
  /** Human-readable date the sources were read, e.g. "14 September 2026". */
  checkedOn?: string;
  /**
   * Optional note shown with the sources, for a page that has no single
   * competitor site (traditional research) or a source that could not be read.
   */
  sourceNote?: string;
  rows: ComparisonRow[];
  /** Honest "when to use VETT" + "when to use [competitor]" paragraphs. */
  whenToUseVett: string;
  whenToUseCompetitor: string;
  /** Optional FAQ items. Any number; also emitted as FAQPage JSON-LD. */
  faqs?: Array<{ q: string; a: string }>;
  /**
   * Optional 90-second TL;DR, shown above the comparison table. Six or seven
   * short bullets, modelled on the block on /vs/typeform.
   */
  tldr?: string[];
  /**
   * Optional one-sentence statement of where VETT loses to this competitor,
   * shown on its own outside the table. On /vs/typeform the equivalent line,
   * "Form UX: Typeform wins", is the most credible sentence on the page; it
   * should not be buried in a table row.
   */
  whereWeLose?: string;
}

const VerdictIcon = ({ v }: { v: Verdict }) => {
  if (v === 'vett') return <Check className="w-4 h-4 text-lime" aria-hidden />;
  if (v === 'competitor') return <X className="w-4 h-4 text-amber" aria-hidden />;
  return <Minus className="w-4 h-4 text-white/40" aria-hidden />;
};

export function VsPageTemplate({
  competitorName,
  competitorTagline,
  vettTagline,
  slug,
  competitorRefUrl,
  sources,
  checkedOn,
  sourceNote,
  rows,
  whenToUseVett,
  whenToUseCompetitor,
  faqs = [],
  tldr = [],
  whereWeLose,
}: VsPageProps) {
  // Title, description and canonical all come from the SEO manifest, which is
  // also what scripts/prerender.mjs bakes into the static HTML for this route.
  // This used to be a hand-rolled effect writing its own title string and its
  // own description, so the tab and the prerendered head said different things.
  useRouteSeo(slug);

  return (
    <OverlayPage>
      <FaqJsonLd faqs={faqs} />
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="mb-12">
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">
            Honest comparison
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
            VETT vs {competitorName}
          </h1>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-lime/30">
              <p className="text-xs font-black text-lime uppercase tracking-widest mb-2">VETT</p>
              <p className="text-white/80 text-sm leading-relaxed">{vettTagline}</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-white/10">
              <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">
                {competitorName}
              </p>
              <p className="text-white/70 text-sm leading-relaxed">{competitorTagline}</p>
            </div>
          </div>
        </div>

        {/* 90-second TL;DR */}
        {tldr.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary" aria-hidden />
              <h2 className="text-primary text-xs font-black uppercase tracking-widest">90-second TL;DR</h2>
            </div>
            <ul className="space-y-3 text-white/80 text-base leading-relaxed">
              {tldr.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2.5" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Where VETT loses - stated on its own, not inside a table row */}
        {whereWeLose && (
          <section className="rounded-2xl border border-amber/40 bg-amber/[0.07] p-6 mb-12 flex gap-4 items-start">
            <AlertTriangle className="w-5 h-5 text-amber shrink-0 mt-0.5" aria-hidden />
            <div>
              <h2 className="text-amber text-xs font-black uppercase tracking-widest mb-2">Where VETT loses</h2>
              <p className="text-white text-base md:text-lg font-bold leading-relaxed">{whereWeLose}</p>
            </div>
          </section>
        )}

        {/* Comparison table */}
        <div className="mb-12">
          <h2 className="text-xs font-black text-primary uppercase tracking-widest mb-4">
            Side by side
          </h2>
          {/* Phones (<640px): one card per row. At 375 the four-column table
              gave each text column about 100px, stretched a row to 287px and
              pushed the verdict icons past the right edge. Same pattern as the
              bespoke /vs pages. */}
          <div className="sm:hidden space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="glass-panel rounded-2xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-white font-bold text-sm">{r.dimension}</p>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/50">
                    <VerdictIcon v={r.verdict} />
                    {r.verdict === 'vett' ? 'VETT' : r.verdict === 'competitor' ? competitorName : 'Tie'}
                  </span>
                </div>
                <p className="text-lime text-[10px] font-black uppercase tracking-widest mb-1">VETT</p>
                <p className="text-white/80 text-sm leading-relaxed mb-3">{r.vett}</p>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">{competitorName}</p>
                <p className="text-white/60 text-sm leading-relaxed">{r.competitor}</p>
              </div>
            ))}
          </div>

          {/* Tablet and up: the table. */}
          <div className="hidden sm:block glass-panel rounded-2xl border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-black text-white/40 uppercase tracking-widest">
                    Dimension
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-black text-lime uppercase tracking-widest">
                    VETT
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-black text-white/60 uppercase tracking-widest">
                    {competitorName}
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-4 text-white/70 font-bold align-top">{r.dimension}</td>
                    <td className="px-4 py-4 text-white/80 align-top text-xs leading-relaxed">{r.vett}</td>
                    <td className="px-4 py-4 text-white/60 align-top text-xs leading-relaxed">{r.competitor}</td>
                    <td className="px-4 py-4 text-center w-8"><VerdictIcon v={r.verdict} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-white/40 text-xs mt-3 italic">
            Verdict legend: <Check className="inline w-3 h-3 text-lime" /> VETT advantage ·
            <Minus className="inline w-3 h-3 text-white/40" /> tie ·
            <X className="inline w-3 h-3 text-amber" /> {competitorName} advantage.
            One column being "VETT" doesn&apos;t mean VETT is better overall - different jobs, different tools.
          </p>
        </div>

        {/* When to use which */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="glass-panel p-6 rounded-2xl border border-lime/20">
            <h3 className="text-lg font-black text-lime mb-3">When to use VETT</h3>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{whenToUseVett}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-black text-white/80 mb-3">When to use {competitorName}</h3>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{whenToUseCompetitor}</p>
          </div>
        </div>

        {/* FAQ */}
        {faqs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest mb-4">
              FAQ
            </h2>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <details key={i} className="glass-panel p-5 rounded-2xl border border-white/5">
                  <summary className="font-black text-white text-sm cursor-pointer">{f.q}</summary>
                  <p className="text-white/60 text-sm mt-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Reference + CTA */}
        <div className="text-center glass-panel p-12 rounded-3xl border border-white/5 mb-8">
          <h3 className="text-2xl font-black text-white mb-3">Try VETT for ${SELF_SERVE_MIN_USD}</h3>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Sniff Test: {SELF_SERVE_MIN_RESPONDENTS} personas, results in minutes, full results page.
          </p>
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest bg-[#DFFF00] hover:bg-[#E5FF40] text-black shadow-lg shadow-[#DFFF00]/30 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            Start a mission <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Other comparisons */}
        <nav aria-label="Other comparisons" className="border-t border-white/10 pt-8 mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Other comparisons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {VS_COMPARISONS.filter((c) => `/vs/${c.slug}` !== slug).map((c) => (
              <Link
                key={c.slug}
                to={`/vs/${c.slug}`}
                className="rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors px-4 py-3 text-white/70 hover:text-white text-sm font-semibold flex items-center justify-between"
              >
                VETT vs {c.name}
                <ArrowRight className="w-4 h-4 text-primary opacity-60" aria-hidden />
              </Link>
            ))}
          </div>
        </nav>

        {/* Sources */}
        {(sources?.length || competitorRefUrl || sourceNote) && (
          <div className="text-center text-white/40 text-xs space-y-1">
            {sourceNote && <p className="max-w-2xl mx-auto">{sourceNote}</p>}
            {(sources?.length || competitorRefUrl) && (
              <p>
                {competitorName} sources{checkedOn ? `, checked ${checkedOn}` : ''}:
              </p>
            )}
            {(sources ?? (competitorRefUrl ? [competitorRefUrl] : [])).map((url) => (
              <p key={url} className="break-all">
                <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-white/70">
                  {url}
                </a>
              </p>
            ))}
          </div>
        )}
      </div>
    </OverlayPage>
  );
}

export default VsPageTemplate;
