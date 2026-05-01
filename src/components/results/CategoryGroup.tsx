import type { ReactNode } from 'react';

/**
 * Pass 23 Bug 23.60 Chunk 9 — Brand Lift category group header.
 *
 * Brand Lift missions tag each question with a `category` field
 * (Bug 23.56 storage: `mission.questions[i].category`). The flat
 * per-question scroll on a 12-question Brand Lift mission was
 * hard to scan — readers couldn't tell at a glance which questions
 * measured Awareness vs Recall vs Purchase Intent.
 *
 * This component renders a section header above each group with
 * the category label. The flat questions list is replaced with a
 * stack of CategoryGroup blocks, each containing the questions
 * for that category.
 *
 * Visual: light section divider + uppercase category label + small
 * count pill ("3 questions"). Quiet enough not to compete with
 * the per-question card headings.
 */

interface CategoryGroupProps {
  label: string;
  /** Number of questions in this group (rendered as a small pill). */
  count: number;
  /** Per-question cards rendered inside the group. */
  children: ReactNode;
}

export function CategoryGroup({ label, count, children }: CategoryGroupProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 pt-2">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-300/90">
          {label}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200/60 px-2 py-[1px] rounded-full bg-purple-500/10 border border-purple-500/20">
          {count} {count === 1 ? 'question' : 'questions'}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent" />
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export default CategoryGroup;
