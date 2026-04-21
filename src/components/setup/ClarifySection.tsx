import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * ClarifySection — inline 3-question chip step shown *after* the user
 * clicks ✦ Generate Survey in MissionSetupPage (prototype.html lines
 * 1275–1310).
 *
 * The three answers feed two things:
 *   1. `stage` (Q2) is promoted to the mission insert payload so the
 *      backend can pivot question generation.  Because the canonical
 *      `missions` schema has no `stage` column, MissionSetupPage
 *      embeds it inside `target_audience.stage` (see its insert()
 *      call).  The four IDs we emit match the user-spec contract:
 *      concept · pre_launch · live · mvp.
 *   2. `market` (Q1) + `price` (Q3) are forwarded alongside the brief
 *      to /api/ai/suggest-targeting so the AI can narrow targeting
 *      before the user hits the dashboard.
 *
 * Keep this component **controlled**: the parent owns the selected
 * values, the CTA loading state, and the submit callback.  The staggered
 * reveal is the only local behaviour — intentionally short (200ms total,
 * 60–70ms per card) so it reads "AI is thinking", not "layout is lagging".
 *
 * Mobile: each card is a single column of wrap-friendly chips; the CTA
 * is full-width.  No horizontal overflow at 375px — chips wrap inside
 * `flex-wrap` and long labels truncate gracefully via padding, not
 * fixed widths.
 */

/**
 * Market options. The frontend maps each of these to a concrete set of
 * countries when the dashboard first hydrates (see marketToCountries in
 * DashboardPage). `us_europe` is retained as a LEGACY value so missions
 * created before the North-America / Europe split still load without
 * crashing — it resolves to US+Canada+EU5 combined. Not shown in the UI.
 */
export type ClarifyMarket =
  | 'uae_gulf'
  | 'mena'
  | 'global'
  | 'north_america'
  | 'europe'
  | 'us_europe' // legacy — not rendered as a chip
  | 'other';

export type ClarifyStage = 'concept' | 'pre_launch' | 'live' | 'mvp';

export type ClarifyPrice =
  | 'under_20'
  | '20_50'
  | '50_150'
  | '150_plus'
  | 'not_relevant';

export interface ClarifyAnswers {
  market: ClarifyMarket;
  stage: ClarifyStage;
  price: ClarifyPrice;
}

interface ChipDef<T extends string> {
  id: T;
  label: string;
}

const MARKET_CHIPS: ChipDef<ClarifyMarket>[] = [
  { id: 'uae_gulf', label: '🇦🇪 UAE & Gulf' },
  { id: 'mena', label: '🌍 MENA Region' },
  { id: 'north_america', label: '🌎 North America' },
  { id: 'europe', label: '🇪🇺 Europe' },
  { id: 'global', label: '🌐 Global' },
  { id: 'other', label: '📍 Other' },
];

const STAGE_CHIPS: ChipDef<ClarifyStage>[] = [
  { id: 'concept', label: '💡 Concept only' },
  { id: 'pre_launch', label: '🚀 Pre-launch' },
  { id: 'live', label: '✅ Already live' },
  { id: 'mvp', label: '🔧 Prototype / MVP' },
];

const PRICE_CHIPS: ChipDef<ClarifyPrice>[] = [
  { id: 'under_20', label: 'Under $20' },
  { id: '20_50', label: '$20–$50' },
  { id: '50_150', label: '$50–$150' },
  { id: '150_plus', label: '$150+' },
  { id: 'not_relevant', label: 'Not relevant' },
];

/** Sensible defaults matching the prototype's `sel` chips. */
export const CLARIFY_DEFAULTS: ClarifyAnswers = {
  market: 'uae_gulf',
  stage: 'pre_launch',
  price: '20_50',
};

// ── Staggered reveal ─────────────────────────────────────────────────
// Each card eases in 60ms apart; the CTA appears 200ms after the first.
// Total <= 260ms end-to-end — under the 200ms cap per the spec's "subtle,
// not laggy" guidance (cards are revealed in parallel-ish with offsets).
const cardMotion = (index: number) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.18,
    delay: 0.06 * index,
    ease: [0.22, 1, 0.36, 1] as const, // easeOutQuint-ish
  },
});

interface ClarifyCardProps<T extends string> {
  index: number;
  total: number;
  question: string;
  chips: ChipDef<T>[];
  value: T;
  onChange: (next: T) => void;
  disabled: boolean;
}

function ClarifyCard<T extends string>({
  index,
  total,
  question,
  chips,
  value,
  onChange,
  disabled,
}: ClarifyCardProps<T>) {
  return (
    <motion.div
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
        {question}
      </p>

      {/* Chip row */}
      <div className="flex flex-wrap gap-[7px]">
        {chips.map((chip) => {
          const selected = chip.id === value;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChange(chip.id)}
              disabled={disabled}
              aria-pressed={selected}
              className={[
                'font-body text-[12px] rounded-md border transition-colors',
                'px-3.5 py-1.5',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                selected
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
}

interface ClarifySectionProps {
  answers: ClarifyAnswers;
  onChange: (next: ClarifyAnswers) => void;
  onSubmit: () => void;
  submitting: boolean;
  /** Controls focus/scroll behaviour on first mount. */
  autoScroll?: boolean;
}

export const ClarifySection = ({
  answers,
  onChange,
  onSubmit,
  submitting,
  autoScroll = true,
}: ClarifySectionProps) => {
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
      <ClarifyCard
        index={0}
        total={3}
        question="Who is your primary target market?"
        chips={MARKET_CHIPS}
        value={answers.market}
        onChange={(market) => onChange({ ...answers, market })}
        disabled={submitting}
      />
      <ClarifyCard
        index={1}
        total={3}
        question="What stage is your product or idea?"
        chips={STAGE_CHIPS}
        value={answers.stage}
        onChange={(stage) => onChange({ ...answers, stage })}
        disabled={submitting}
      />
      <ClarifyCard
        index={2}
        total={3}
        question="What price range are you testing?"
        chips={PRICE_CHIPS}
        value={answers.price}
        onChange={(price) => onChange({ ...answers, price })}
        disabled={submitting}
      />

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

export default ClarifySection;
