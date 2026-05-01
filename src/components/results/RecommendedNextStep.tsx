import { Rocket, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Pass 23 Bug 23.60 Chunk 7 — Recommended Next Step.
 *
 * The previous CTA was visually equal-weight to the secondary
 * "Back to Dashboard" button. Spec calls for the primary action
 * to read as the obvious next move — bigger button, stronger
 * shadow, larger icon, more confident copy.
 *
 * Section is rendered after per-question analysis but BEFORE the
 * AI disclaimer footer in the new order (Chunk 7 also moves the
 * disclaimer to its proper footer position so the CTA is the
 * last thing the reader sees in the main content flow).
 *
 * Two CTAs in a stacked-on-mobile / inline-on-desktop pair:
 *   primary   — Launch Follow-Up Mission (green/emerald gradient)
 *   secondary — Back to My Missions (ghost outline)
 */

interface RecommendedNextStepProps {
  /** Optional override copy for the body. Falls back to a sensible default. */
  body?: string;
}

const DEFAULT_BODY =
  'Review the patterns in your results and consider launching a follow-up mission to dig deeper into any question that surfaced unexpected findings, or to test a specific hypothesis with a more targeted audience segment.';

export function RecommendedNextStep({ body }: RecommendedNextStepProps) {
  const navigate = useNavigate();

  return (
    <div
      id="next-step"
      className="mb-8 scroll-mt-20"
    >
      <div className="relative bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/30 rounded-2xl p-8 md:p-10 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <Rocket className="w-6 h-6 text-green-400" aria-hidden />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Recommended Next Step
            </h2>
          </div>

          <p className="text-white/80 text-base md:text-lg leading-relaxed mb-7 max-w-2xl">
            {body ?? DEFAULT_BODY}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate('/setup')}
              className={[
                'flex items-center justify-center gap-2.5',
                'px-7 py-4 rounded-xl',
                'bg-gradient-to-r from-green-500 to-emerald-500',
                'text-white font-black text-base uppercase tracking-wider',
                'shadow-lg shadow-green-500/25',
                'hover:shadow-xl hover:shadow-green-500/40',
                'hover:scale-[1.02] active:scale-[0.99]',
                'transition-all duration-300',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 focus-visible:outline-offset-2',
              ].join(' ')}
            >
              <Rocket className="w-5 h-5" aria-hidden />
              Launch Follow-Up Mission
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={[
                'flex items-center justify-center gap-2',
                'px-6 py-4 rounded-xl',
                'bg-white/5 border border-white/20 text-white font-bold text-sm',
                'hover:bg-white/10 hover:border-white/30',
                'transition-all duration-300',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 focus-visible:outline-offset-2',
              ].join(' ')}
            >
              <ArrowLeft className="w-5 h-5" aria-hidden />
              Back to My Missions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecommendedNextStep;
