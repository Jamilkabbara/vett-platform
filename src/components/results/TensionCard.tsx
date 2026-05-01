import { AlertTriangle } from 'lucide-react';

/**
 * Pass 23 Bug 23.60 Chunk 5 — Tensions Flagged card.
 *
 * The tensions section flags contradictions surfaced by the AI insights
 * pipeline (`mission.insights.contradictions`). Each entry has an
 * optional severity (`high` | `medium` | `low`) and may reference two
 * specific question IDs — when both refs are present, render them as
 * clickable backlinks that smooth-scroll to the per-question card so
 * the reader can jump from "tension" to the underlying data.
 *
 * Visual upgrade vs the prior inline impl:
 *   - Severity is now a pill (filled background) instead of plain
 *     uppercase text. Easier to scan when there are 4+ tensions.
 *   - Question backreferences are buttons (focus ring, hover state)
 *     not plain spans.
 *
 * Severity color contract:
 *   high   → bg-amber-500/30 text-amber-100 border-amber-300/40
 *   medium → bg-amber-500/20 text-amber-200 border-amber-400/30
 *   low    → bg-amber-500/10 text-amber-300 border-amber-500/30
 *   note   → bg-white/10    text-white/70 border-white/20
 */

export interface Contradiction {
  tension_description?: string;
  severity?: string;
  question_a?: string;
  question_b?: string;
}

interface TensionCardProps {
  contradictions: Contradiction[];
}

const SEVERITY_PILL: Record<string, string> = {
  high:   'bg-amber-500/30 text-amber-100 border-amber-300/40',
  medium: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  low:    'bg-amber-500/10 text-amber-300 border-amber-500/30',
  note:   'bg-white/10 text-white/70 border-white/20',
};

function severityClass(severity?: string): string {
  if (!severity) return SEVERITY_PILL.note;
  return SEVERITY_PILL[severity] ?? SEVERITY_PILL.note;
}

function scrollToQuestion(questionId: string) {
  const target = document.getElementById(`q-${questionId}`);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Brief highlight pulse so the eye lands. Tailwind doesn't ship a
  // tween for this; we toggle a transient ring via inline style.
  const prevOutline = target.style.outline;
  target.style.transition = 'outline-color 800ms ease-out';
  target.style.outline = '2px solid rgba(251, 191, 36, 0.6)';
  target.style.outlineOffset = '4px';
  setTimeout(() => {
    target.style.outline = prevOutline;
    target.style.outlineOffset = '';
  }, 1400);
}

export function TensionCard({ contradictions }: TensionCardProps) {
  if (!contradictions || contradictions.length === 0) return null;

  return (
    <div
      id="tensions"
      className="mb-8 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 scroll-mt-20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15">
          <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white">Tensions Flagged</h2>
      </div>

      <div className="space-y-3">
        {contradictions.map((c, idx) => {
          const sevLabel = (c.severity || 'note').toLowerCase();
          const hasBackrefs = !!(c.question_a && c.question_b);
          return (
            <div key={idx} className="border-l-2 border-amber-500/40 pl-4 py-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={[
                    'inline-flex items-center rounded-full border px-2 py-[1px]',
                    'text-[10px] font-black uppercase tracking-widest',
                    severityClass(sevLabel),
                  ].join(' ')}
                >
                  {sevLabel}
                </span>
                {hasBackrefs ? (
                  <span className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => scrollToQuestion(c.question_a as string)}
                      className="text-white/50 hover:text-white underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded font-mono"
                      aria-label={`Scroll to question ${c.question_a}`}
                    >
                      {c.question_a}
                    </button>
                    <span className="text-white/30" aria-hidden>↔</span>
                    <button
                      type="button"
                      onClick={() => scrollToQuestion(c.question_b as string)}
                      className="text-white/50 hover:text-white underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded font-mono"
                      aria-label={`Scroll to question ${c.question_b}`}
                    >
                      {c.question_b}
                    </button>
                  </span>
                ) : null}
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {c.tension_description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TensionCard;
