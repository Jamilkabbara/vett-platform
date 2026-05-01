import { Sparkles } from 'lucide-react';

/**
 * Pass 23 Bug 23.60 Chunk 4 — Per-question AI insight renderer.
 *
 * Spec: "lead-sentence bold + supporting paragraph; no repeated
 * 'AI INSIGHT' label across questions."
 *
 * The label was visual noise — the Sparkles icon + the purple
 * accent already mark this as AI-generated content. Repeating
 * "AI INSIGHT" once per question (8-10 times on a typical mission)
 * created the void-gap symptom Bug 23.60 calls out.
 *
 * Typography:
 *   - Lead sentence:  text-white text-base font-semibold
 *   - Supporting:     text-white/80 text-sm
 *   - Empty state:    text-white/40 italic
 *
 * Lead-extraction rule (kept from the prior inline impl): split
 * on the first ". " up to char 200. Beyond that, treat the whole
 * string as a single paragraph (avoids accidentally bolding 200+
 * chars when the model writes one long sentence).
 */

interface AIInsightProps {
  /** Per-question AI insight text. Empty/undefined renders the empty state. */
  text?: string;
}

export function AIInsight({ text }: AIInsightProps) {
  if (!text) {
    return (
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <IconBadge />
          <p className="text-white/40 text-sm italic">
            AI insight not yet available for this question.
          </p>
        </div>
      </div>
    );
  }

  const idx = text.indexOf('. ');
  const useLead = idx !== -1 && idx <= 200;
  const lead = useLead ? text.slice(0, idx + 1) : text;
  const body = useLead ? text.slice(idx + 2) : '';

  return (
    <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <IconBadge />
        <div className="flex-1 min-w-0">
          <p className="text-white text-base font-semibold leading-relaxed">{lead}</p>
          {body ? (
            <p className="text-white/80 text-sm leading-relaxed mt-2">{body}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function IconBadge() {
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20 flex-shrink-0 mt-0.5">
      <Sparkles className="w-4 h-4 text-purple-400" aria-hidden />
    </div>
  );
}

export default AIInsight;
