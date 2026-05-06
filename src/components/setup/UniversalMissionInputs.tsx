import { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';

/**
 * Pass 29 B2 — universal inputs that power methodology-correct AI
 * question generation. Brand and category are required on every
 * methodology-bound mission type (everything except `research`,
 * `brand_lift`, `creative_attention`). Audience description is
 * optional (used to seed screener Qs). Competitors are optional
 * for most types; sub-component pickers may enforce a min later.
 *
 * State is lifted to the parent (MissionSetupPage) so values can
 * flow into the per-methodology collector below it (PricingInputs,
 * RoadmapInputs, CSATInputs, etc.) and into the mission-insert
 * payload.
 *
 * Hidden when goal_type === 'brand_lift' or 'creative_attention'
 * (those flows already collect equivalent data through their deep
 * pickers). Optional for `research` — render with the `optional`
 * prop set so the required-field markers go away.
 */

export interface UniversalInputsState {
  brand: string;
  category: string;
  audienceDescription: string;
  competitors: string[];
}

export const UNIVERSAL_INPUTS_DEFAULT: UniversalInputsState = {
  brand: '',
  category: '',
  audienceDescription: '',
  competitors: [],
};

interface Props {
  state: UniversalInputsState;
  onChange: (next: UniversalInputsState) => void;
  /** When true, every field is optional. Used for `research` and
   *  test surfaces; defaults to false (brand + category required). */
  optional?: boolean;
  /** Show / hide the competitors chip input. Some methodologies
   *  (CSAT, Audience Profiling) don't need competitors; others
   *  (Competitor Analysis) require ≥3 and surface their own
   *  picker. Default true. */
  showCompetitors?: boolean;
  /** Minimum competitors required when shown. Default 0. */
  minCompetitors?: number;
}

const MAX_COMPETITORS = 5;

export function UniversalMissionInputs({
  state,
  onChange,
  optional = false,
  showCompetitors = true,
  minCompetitors = 0,
}: Props) {
  const [competitorInput, setCompetitorInput] = useState('');

  const update = (patch: Partial<UniversalInputsState>) =>
    onChange({ ...state, ...patch });

  const addCompetitor = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    if (state.competitors.length >= MAX_COMPETITORS) return;
    if (state.competitors.some((c) => c.toLowerCase() === name.toLowerCase())) return;
    update({ competitors: [...state.competitors, name] });
    setCompetitorInput('');
  };

  const removeCompetitor = (name: string) =>
    update({ competitors: state.competitors.filter((c) => c !== name) });

  const requiredMark = optional ? '' : ' *';
  const competitorsBelowMin =
    showCompetitors && minCompetitors > 0 && state.competitors.length < minCompetitors;

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Mission Context</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          The AI uses these to write methodology-correct questions
          {optional ? ' (all optional for this mission type)' : ''}.
        </p>
      </div>

      {/* Brand / product name */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Brand or product name{requiredMark}
        </span>
        <input
          type="text"
          value={state.brand}
          onChange={(e) => update({ brand: e.target.value.slice(0, 100) })}
          placeholder="e.g. Aurora Cold Brew, AcmeCRM, Nimbus EV"
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
        />
      </label>

      {/* Category */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Category{requiredMark}
        </span>
        <input
          type="text"
          value={state.category}
          onChange={(e) => update({ category: e.target.value.slice(0, 80) })}
          placeholder="e.g. ready-to-drink coffee, B2B SaaS analytics, premium D2C skincare"
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
        />
      </label>

      {/* Audience description */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Audience description (optional)
        </span>
        <textarea
          value={state.audienceDescription}
          onChange={(e) => update({ audienceDescription: e.target.value.slice(0, 300) })}
          placeholder="e.g. men 25-44 in MENA who exercise weekly; women 30-50 in the US who have used a meal-kit subscription"
          rows={2}
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60 resize-y"
        />
        <p className="text-[10px] text-[var(--t4)] mt-1">
          Used to seed screening questions. Leave blank to let the AI infer from the brief.
        </p>
      </label>

      {/* Competitors */}
      {showCompetitors && (
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Competitors {minCompetitors > 0 ? `(min ${minCompetitors})` : '(optional, up to 5)'}
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5 mb-2">
            {state.competitors.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-[var(--pur)]/15 border border-[var(--pur)]/30 text-[11px] font-display font-bold text-[var(--pur)]"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeCompetitor(c)}
                  className="opacity-70 hover:opacity-100"
                  aria-label={`Remove ${c}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          {state.competitors.length < MAX_COMPETITORS && (
            <div className="flex gap-2">
              <input
                type="text"
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value.slice(0, 50))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCompetitor(competitorInput);
                  }
                }}
                placeholder="Add competitor name + Enter"
                className="flex-1 rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
              />
              <button
                type="button"
                onClick={() => addCompetitor(competitorInput)}
                disabled={!competitorInput.trim()}
                className="px-3 rounded-xl bg-[var(--bg3)] border border-[var(--b1)] hover:border-[var(--lime)]/60 text-[var(--t2)] disabled:opacity-50"
                aria-label="Add competitor"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
          {competitorsBelowMin && (
            <p className="mt-1.5 text-[11px] text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Add at least {minCompetitors - state.competitors.length} more for the methodology to run reliably.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Validates a UniversalInputsState against the optional / minCompetitors
 *  flags the parent passes. Returns null on success, or a list of
 *  human-readable missing-field strings the parent renders under its
 *  Generate Survey button.
 */
export function validateUniversalInputs(
  state: UniversalInputsState,
  opts: { optional?: boolean; minCompetitors?: number } = {},
): string[] {
  const missing: string[] = [];
  if (!opts.optional) {
    if (!state.brand.trim()) missing.push('brand or product name');
    if (!state.category.trim()) missing.push('category');
  }
  if (opts.minCompetitors && state.competitors.length < opts.minCompetitors) {
    missing.push(`${opts.minCompetitors} competitors`);
  }
  return missing;
}

export default UniversalMissionInputs;
