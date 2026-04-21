import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import type { AdaptiveClarifyQuestion } from '../../services/aiService';

/**
 * DynamicClarifySection — renders clarify questions returned by
 * POST /api/ai/clarify instead of the static Market / Stage / Price
 * trio in ClarifySection.tsx.
 *
 * Shape contract (also enforced by isAdaptiveClarifyQuestion in
 * aiService.ts):
 *   {
 *     id: string,                         // stable key for answer map
 *     question: string,                   // user-facing text
 *     chips: [{ id: string, label: string }],  // 2–4 options
 *     defaultChipId?: string              // preselect
 *   }
 *
 * Answers live in a flat `Record<questionId, chipId>` map — keeps the
 * parent wiring simple and avoids another typed union per question.
 *
 * Styling intentionally mirrors ClarifyCard so the two render paths are
 * visually indistinguishable; the only cue is what's rendered inside.
 */

interface DynamicClarifySectionProps {
  questions: AdaptiveClarifyQuestion[];
  answers: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  onSubmit: () => void;
  submitting: boolean;
  autoScroll?: boolean;
}

const cardMotion = (index: number) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.18,
    delay: 0.06 * index,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

export const DynamicClarifySection = ({
  questions,
  answers,
  onChange,
  onSubmit,
  submitting,
  autoScroll = true,
}: DynamicClarifySectionProps) => {
  const total = questions.length;

  return (
    <motion.div
      ref={(node) => {
        if (autoScroll && node) {
          node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.14 }}
      className="mt-3 flex flex-col gap-2"
      aria-live="polite"
      aria-label="Clarify your mission"
    >
      {questions.map((q, index) => {
        const selected = answers[q.id];
        return (
          <motion.div
            key={q.id}
            {...cardMotion(index)}
            className={[
              'bg-bg4 border border-b1 rounded-xl',
              'px-4 py-3.5',
            ].join(' ')}
          >
            {/* Tag row */}
            <div className="flex items-center gap-1.5 mb-2.5">
              <span
                aria-hidden
                className="inline-block w-[5px] h-[5px] rounded-full bg-lime animate-pulse"
              />
              <span className="font-display font-black text-[9px] text-lime uppercase tracking-[0.1em]">
                Quick question {index + 1} of {total}
              </span>
            </div>

            {/* Question */}
            <p className="font-body text-[13px] text-white mb-2.5 font-medium">
              {q.question}
            </p>

            {/* Chip row */}
            <div className="flex flex-wrap gap-[7px]">
              {q.chips.map((chip) => {
                const isSelected = chip.id === selected;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => onChange({ ...answers, [q.id]: chip.id })}
                    disabled={submitting}
                    aria-pressed={isSelected}
                    className={[
                      'font-body text-[12px] rounded-md border transition-colors',
                      'px-3.5 py-1.5',
                      'disabled:opacity-60 disabled:cursor-not-allowed',
                      isSelected
                        ? 'bg-lime text-black border-lime font-bold'
                        : 'bg-bg3 text-t2 border-b2 hover:border-t3',
                    ].join(' ')}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* CTA — appears a beat after the last card */}
      <motion.button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={[
          'mt-1 w-full h-12 rounded-xl',
          'inline-flex items-center justify-center gap-2',
          'font-display font-black text-[13px] uppercase tracking-widest',
          'transition-colors',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'bg-lime text-black hover:bg-lime/90 shadow-lime-soft',
        ].join(' ')}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            <span>AI is crafting your mission…</span>
          </>
        ) : (
          <>
            <span aria-hidden>✦</span>
            <span>Generate 5 Questions →</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
};

export default DynamicClarifySection;
