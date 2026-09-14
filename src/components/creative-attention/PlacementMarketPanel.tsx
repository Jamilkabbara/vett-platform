import { Globe2, Target } from 'lucide-react';
import type { CreativeAnalysis } from '../../types/creativeAnalysis';
import { caTargetingView } from '../../lib/caTargetingView.mjs';

/**
 * What this Creative Attention run was measured against: the placement the
 * customer chose, with the comparison against its published attention norm,
 * and the market, with qualitative notes.
 *
 * Renders nothing for analyses that predate placement and market, so older
 * results pages are unchanged. The wording comes from caTargetingView, the
 * same sentences the PDF, PPTX and XLSX print.
 */
export function PlacementMarketPanel({ analysis }: { analysis: CreativeAnalysis }) {
  const view = caTargetingView(analysis);
  if (!view) return null;

  return (
    <section
      aria-label="Placement and market"
      className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-6"
    >
      {view.placement && (
        <div className="space-y-4">
          <header className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime/10 shrink-0">
              <Target className="w-5 h-5 text-lime" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Placement</p>
              <h2 className="text-lg font-bold text-white">{view.placement.label}</h2>
            </div>
          </header>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { k: 'Published norm', v: view.placement.normLabel },
              { k: 'Predicted', v: view.placement.predictedLabel },
              { k: 'Versus norm', v: view.placement.deltaLabel },
            ].map(({ k, v }) => (
              <div key={k} className="rounded-xl border border-[var(--b1)] bg-black/20 px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">{k}</dt>
                <dd className="mt-1 text-xl font-bold text-lime whitespace-nowrap">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="text-sm text-[var(--t1)] leading-relaxed">{view.placement.sentence}</p>
        </div>
      )}

      {view.market && (
        <div className={view.placement ? 'space-y-3 pt-6 border-t border-[var(--b1)]' : 'space-y-3'}>
          <header className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 shrink-0">
              <Globe2 className="w-5 h-5 text-purple-300" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Market</p>
              <h2 className="text-lg font-bold text-white">{view.market.name}</h2>
            </div>
          </header>
          <p className="text-xs italic text-[var(--t3)]">
            Qualitative only. The market does not change any score, prediction or benchmark on this page.
          </p>

          {view.marketNotesUnavailable ? (
            <p className="text-sm text-[var(--t2)]">Market notes are not available for this run.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {view.marketNoteSections.map((sec) => (
                <div key={sec.key}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--t2)] mb-2">{sec.heading}</h3>
                  <ul className="space-y-2 list-disc pl-4 marker:text-purple-300">
                    {sec.items.map((item, i) => (
                      <li key={i} className="text-sm text-[var(--t1)] leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
