import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export interface Recommendation {
  title: string;
  body: string;
  confidence: 'high' | 'medium' | 'low';
  explanation?: string;
}

interface Props {
  rec: Recommendation;
  index: number;
}

/**
 * Pass 25 Phase 1E — single recommendation card. Confidence label,
 * "explain" toggle for the model's reasoning.
 */
export function AIRecommendationCard({ rec, index }: Props) {
  const [open, setOpen] = useState(false);
  const conf = rec.confidence;
  const confColor = conf === 'high' ? 'text-[var(--lime)]' : conf === 'medium' ? 'text-amber-400' : 'text-[var(--t3)]';
  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <span className="text-[var(--lime)] font-bold text-sm w-6">{String(index + 1).padStart(2, '0')}.</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-[var(--t1)]">{rec.title}</h4>
            <span className={`text-[10px] uppercase tracking-wider ${confColor} flex items-center gap-0.5`}>
              <Sparkles className="w-3 h-3" /> {conf} confidence
            </span>
          </div>
          <p className="text-xs text-[var(--t2)] mt-1.5 leading-relaxed">{rec.body}</p>
          {rec.explanation && (
            <>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="mt-2 text-[10px] text-[var(--t3)] hover:text-[var(--t1)] flex items-center gap-1"
              >
                {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {open ? 'Hide' : 'Show'} reasoning
              </button>
              {open && (
                <p className="mt-2 text-[11px] text-[var(--t3)] bg-[var(--bg3)] rounded p-2 leading-relaxed">
                  {rec.explanation}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIRecommendationCard;
