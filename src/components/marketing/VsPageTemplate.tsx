/**
 * Pass 35 C3 — Shared template for /vs/* competitive pages.
 *
 * Honest framing throughout: competitor strengths acknowledged
 * (e.g. Conjointly's peer-reviewed validation is real, write it that
 * way), VETT positioning kept truthful (faster + cheaper + MENA-
 * rooted, NOT "more accurate" or "panel replacement").
 *
 * Each consuming page passes:
 *   - competitor name + 1-line positioning
 *   - 5-7 honest comparison rows (each row reads "VETT" or "tie" or
 *     "competitor" — no false-equivalence "VETT wins everywhere")
 *   - 1-3 paragraphs on "When to use VETT vs [competitor]"
 *   - Reference link to competitor's public methodology / pricing
 *     page (we do not link directly to sales pages of competitors)
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OverlayPage } from '../layout/OverlayPage';
import { Check, X, Minus, ArrowRight, Sparkles } from 'lucide-react';

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
  competitorRefUrl: string;
  rows: ComparisonRow[];
  /** Honest "when to use VETT" + "when to use [competitor]" paragraphs. */
  whenToUseVett: string;
  whenToUseCompetitor: string;
  /** Optional FAQ items. */
  faqs?: Array<{ q: string; a: string }>;
}

const VerdictIcon = ({ v }: { v: Verdict }) => {
  if (v === 'vett') return <Check className="w-4 h-4 text-lime" aria-hidden />;
  if (v === 'competitor') return <X className="w-4 h-4 text-amber-300" aria-hidden />;
  return <Minus className="w-4 h-4 text-white/40" aria-hidden />;
};

export function VsPageTemplate({
  competitorName,
  competitorTagline,
  vettTagline,
  slug,
  competitorRefUrl,
  rows,
  whenToUseVett,
  whenToUseCompetitor,
  faqs = [],
}: VsPageProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `VETT vs ${competitorName}: honest comparison`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    setMeta('description', `VETT vs ${competitorName} — honest side-by-side. Synthetic respondents vs ${competitorTagline.toLowerCase()}. Pricing, methodology, geographic reach, when to choose each.`);
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.getAttribute('href') ?? '';
    canonical.setAttribute('href', `https://www.vettit.ai${slug}`);
    return () => {
      document.title = prevTitle;
      setMeta('description', prevDesc);
      if (canonical) canonical.setAttribute('href', prevCanonical);
    };
  }, [competitorName, competitorTagline, slug]);

  return (
    <OverlayPage>
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

        {/* Comparison table */}
        <div className="mb-12">
          <h2 className="text-xs font-black text-primary uppercase tracking-widest mb-4">
            Side by side
          </h2>
          <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto">
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
            <X className="inline w-3 h-3 text-amber-300" /> {competitorName} advantage.
            One column being "VETT" doesn&apos;t mean VETT is better overall — different jobs, different tools.
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
          <h3 className="text-2xl font-black text-white mb-3">Try VETT for $9</h3>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Sniff Test tier — 5 personas, ~10 minutes, full results page. Promo
            code <span className="font-mono text-lime">VETT100</span> at checkout.
          </p>
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest bg-[#DFFF00] hover:bg-[#E5FF40] text-black shadow-lg shadow-[#DFFF00]/30 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            Start a mission <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-center text-white/40 text-xs">
          {competitorName} reference:{' '}
          <a
            href={competitorRefUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline hover:text-white/70"
          >
            {competitorRefUrl}
          </a>
        </p>
      </div>
    </OverlayPage>
  );
}

export default VsPageTemplate;
