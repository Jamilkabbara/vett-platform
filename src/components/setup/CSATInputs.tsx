import { Info } from 'lucide-react';

/**
 * Pass 29 B8 — Customer Satisfaction input collector. Backs the
 * NPS + CSAT + CES backend question generator.
 *
 * Renders three selects + one conditional text input:
 *   - touchpoint   (product / support / purchase / onboarding /
 *                   overall / custom)
 *   - customer type (all / new / returning / churned)
 *   - recency window (30 days / 90 days / 12 months / all time)
 *   - custom touchpoint text (only when touchpoint=custom)
 *
 * Defaults are sensible (overall, all, 90 days) so a user who
 * leaves the form alone still gets a runnable survey.
 */

export type CSATTouchpoint =
  | 'product' | 'support' | 'purchase' | 'onboarding' | 'overall' | 'custom';
export type CSATCustomerType =
  | 'all' | 'new_customers' | 'returning' | 'churned';
export type CSATRecency =
  | '30_days' | '90_days' | '12_months' | 'all_time';

export interface CSATInputsState {
  touchpoint: CSATTouchpoint;
  customTouchpoint: string;
  customerType: CSATCustomerType;
  recencyWindow: CSATRecency;
}

export const CSAT_DEFAULT_STATE: CSATInputsState = {
  touchpoint: 'overall',
  customTouchpoint: '',
  customerType: 'all',
  recencyWindow: '90_days',
};

const TOUCHPOINTS: Array<{ id: CSATTouchpoint; label: string }> = [
  { id: 'overall',    label: 'Overall brand experience' },
  { id: 'product',    label: 'Product' },
  { id: 'support',    label: 'Customer support' },
  { id: 'purchase',   label: 'Purchase / checkout flow' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'custom',     label: 'Custom (specify below)' },
];
const CUSTOMER_TYPES: Array<{ id: CSATCustomerType; label: string }> = [
  { id: 'all',           label: 'All customers' },
  { id: 'new_customers', label: 'New customers (first 30 days)' },
  { id: 'returning',     label: 'Returning customers' },
  { id: 'churned',       label: 'Churned / cancelled' },
];
const RECENCY: Array<{ id: CSATRecency; label: string; phrase: string }> = [
  { id: '30_days',   label: 'Past 30 days',  phrase: '30 days' },
  { id: '90_days',   label: 'Past 90 days',  phrase: '90 days' },
  { id: '12_months', label: 'Past 12 months', phrase: '12 months' },
  { id: 'all_time',  label: 'All time',       phrase: 'all time' },
];

export function recencyPhrase(id: CSATRecency): string {
  return RECENCY.find((r) => r.id === id)?.phrase || id;
}

interface Props {
  state: CSATInputsState;
  onChange: (next: CSATInputsState) => void;
}

export function CSATInputs({ state, onChange }: Props) {
  const update = (patch: Partial<CSATInputsState>) =>
    onChange({ ...state, ...patch });

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Customer Satisfaction</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          We&apos;ll run NPS (recommendation) + CSAT (satisfaction) +
          CES (effort) with industry benchmark bands and a driver
          follow-up after each scoring question.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Touchpoint *
          </span>
          <select
            value={state.touchpoint}
            onChange={(e) => update({ touchpoint: e.target.value as CSATTouchpoint })}
            className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[14px] text-[var(--t1)] focus:outline-none focus:border-[var(--lime)]/60"
          >
            {TOUCHPOINTS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Customer type *
          </span>
          <select
            value={state.customerType}
            onChange={(e) => update({ customerType: e.target.value as CSATCustomerType })}
            className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[14px] text-[var(--t1)] focus:outline-none focus:border-[var(--lime)]/60"
          >
            {CUSTOMER_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Recency window *
          </span>
          <select
            value={state.recencyWindow}
            onChange={(e) => update({ recencyWindow: e.target.value as CSATRecency })}
            className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[14px] text-[var(--t1)] focus:outline-none focus:border-[var(--lime)]/60"
          >
            {RECENCY.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-[var(--t4)] mt-1">
            Used to qualify the screener: &quot;Have you used &lt;brand&gt;
            in the past {recencyPhrase(state.recencyWindow)}?&quot;
          </p>
        </label>

        {state.touchpoint === 'custom' && (
          <label className="block md:col-span-2">
            <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
              Custom touchpoint *
            </span>
            <input
              type="text"
              value={state.customTouchpoint}
              onChange={(e) => update({ customTouchpoint: e.target.value.slice(0, 80) })}
              placeholder='e.g. "the new dashboard redesign", "the post-purchase email flow"'
              className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
            />
          </label>
        )}
      </div>

      <div className="flex items-start gap-2 text-[11px] text-[var(--t3)] bg-[var(--bg3)] rounded-xl px-3 py-2.5">
        <Info className="w-3.5 h-3.5 mt-px shrink-0" />
        <span>
          Survey: screener, NPS (0-10), NPS driver, CSAT (5-pt), CSAT
          driver, CES (7-pt), CES driver, attribute matrix
          (Quality / Value / Reliability / Service / Ease of use),
          retention intent, specific-issues multi-select. Results page
          shows scores against industry bands (NPS &ge; 70 excellent,
          CSAT top-2-box &ge; 80 great, CES top-2-box &ge; 75 great).
        </span>
      </div>
    </div>
  );
}

export function validateCSATInputs(state: CSATInputsState): string[] {
  const missing: string[] = [];
  if (!state.touchpoint) missing.push('a touchpoint');
  if (state.touchpoint === 'custom' && !state.customTouchpoint.trim()) {
    missing.push('a custom touchpoint description');
  }
  if (!state.customerType) missing.push('a customer type');
  if (!state.recencyWindow) missing.push('a recency window');
  return missing;
}

export default CSATInputs;
