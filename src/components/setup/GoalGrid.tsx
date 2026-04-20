import { MISSION_GOALS } from '../../data/missionGoals';
import type { MissionGoal } from '../../data/missionGoals';

/**
 * 14-goal picker rendered as a 4×3 grid of regular cards + 2 full-width
 * special rows (Brand Lift, Creative Attention).
 *
 * Mirrors .design-reference/prototype.html lines 1220–1246 and the
 * .goal-grid / .g-btn / .g-bl / .g-att CSS at lines 193–220. On screens
 * ≤640px the grid collapses to 2 columns to match the mobile override
 * on prototype line 613.
 *
 * The component is a pure controlled input: hand it a `value` (goal
 * id) and an `onChange` — it carries no internal state and performs
 * no side effects. Mounted by MissionSetupPage in Commit 3.
 */

export interface GoalGridProps {
  value: string;
  onChange: (id: string) => void;
  className?: string;
  /** Disable the entire grid (used while the page is posting to /api). */
  disabled?: boolean;
}

export function GoalGrid({
  value,
  onChange,
  className = '',
  disabled = false,
}: GoalGridProps) {
  const regular = MISSION_GOALS.filter((g) => g.variant === 'regular');
  const special = MISSION_GOALS.filter((g) => g.variant === 'special');

  return (
    <div
      role="radiogroup"
      aria-label="Mission goal"
      className={[
        'grid gap-2 mb-2',
        // 2 cols on phones, 4 cols at md+ (matches prototype overrides).
        'grid-cols-2 md:grid-cols-4',
        className,
      ].join(' ')}
    >
      {regular.map((goal) => (
        <RegularCard
          key={goal.id}
          goal={goal}
          selected={value === goal.id}
          onSelect={() => onChange(goal.id)}
          disabled={disabled}
        />
      ))}

      {/* Special rows span the full grid width. */}
      {special.map((goal) => (
        <SpecialRow
          key={goal.id}
          goal={goal}
          selected={value === goal.id}
          onSelect={() => onChange(goal.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

/* ── Regular card ────────────────────────────────────────────────── */

function RegularCard({
  goal,
  selected,
  onSelect,
  disabled,
}: {
  goal: MissionGoal;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={[
        'relative flex flex-col items-center justify-start gap-1.5',
        'rounded-xl border px-2.5 pt-4 pb-3 text-center',
        'transition-colors',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        selected
          ? 'bg-lime border-lime'
          : 'bg-bg3 border-b2 hover:border-t3 focus-visible:border-lime',
      ].join(' ')}
    >
      <span
        className="text-[22px] leading-none"
        aria-hidden
      >
        {goal.emoji}
      </span>
      <span
        className={[
          'font-display font-bold text-[12px] leading-tight',
          selected ? 'text-black' : 'text-t1',
        ].join(' ')}
      >
        {goal.label}
      </span>
      <span
        className={[
          'font-body text-[10px] leading-tight',
          selected ? 'text-black/40' : 'text-t3',
        ].join(' ')}
      >
        {goal.hint}
      </span>

      {goal.isNew && (
        <span
          aria-hidden
          className={[
            'absolute top-1.5 right-1.5',
            'rounded-full px-1.5 py-[1px]',
            'font-display font-extrabold text-[8px] uppercase tracking-wider',
            selected ? 'bg-black/20 text-lime' : 'bg-lime text-black',
          ].join(' ')}
        >
          NEW
        </span>
      )}
    </button>
  );
}

/* ── Special row (Brand Lift / Creative Attention) ───────────────── */

function SpecialRow({
  goal,
  selected,
  onSelect,
  disabled,
}: {
  goal: MissionGoal;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  // Brand Lift uses lime-family accents; Creative Attention uses purple.
  const isPurple = goal.id === 'creative_attention';

  // Two explicit class-strings so Tailwind JIT picks them up literally.
  const palette = isPurple
    ? {
        base: 'bg-[rgba(17,15,42,0.8)] border-pur/25 hover:border-pur/50',
        selected: 'border-pur bg-[rgba(17,15,42,0.95)]',
        newPill: 'bg-pur text-white',
        tag: 'text-pur bg-pur/10 border-pur/20',
      }
    : {
        base: 'bg-[rgba(13,26,42,0.8)] border-lime/20 hover:border-lime/30',
        selected: 'border-lime bg-[rgba(13,26,42,0.95)]',
        newPill: 'bg-lime text-black',
        tag: 'text-lime bg-lime/10 border-lime/20',
      };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={[
        'col-span-2 md:col-span-4',
        'flex items-center gap-4',
        'rounded-xl border px-4 md:px-[18px] py-3.5 text-left',
        'transition-colors',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        selected ? palette.selected : palette.base,
      ].join(' ')}
    >
      <span className="text-[24px] shrink-0 leading-none" aria-hidden>
        {goal.emoji}
      </span>

      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="font-display font-extrabold text-white text-[13px] leading-tight">
            {goal.label}
          </span>
          {goal.isNew && (
            <span
              className={[
                'inline-flex items-center rounded-full',
                'px-1.5 py-[1px]',
                'font-display font-extrabold text-[8px] uppercase tracking-wider',
                palette.newPill,
              ].join(' ')}
              aria-hidden
            >
              NEW
            </span>
          )}
        </span>
        {goal.description && (
          <span className="block mt-0.5 font-body text-[10px] text-t3 leading-snug">
            {goal.description}
          </span>
        )}
      </span>

      {goal.tags && goal.tags.length > 0 && (
        <span className="hidden md:flex items-center gap-1.5 shrink-0">
          {goal.tags.map((t) => (
            <span
              key={t}
              className={[
                'rounded-full border px-[7px] py-[2px] whitespace-nowrap',
                'font-display font-semibold text-[9px]',
                palette.tag,
              ].join(' ')}
            >
              {t}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

export default GoalGrid;
