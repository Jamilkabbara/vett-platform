import { Info } from 'lucide-react';

/**
 * Pass 31 B5 — Churn Research input collector. Backs the Driver
 * Tree + Win-Back backend question generator.
 */

export type ChurnDefinition =
  | 'cancelled_30d' | 'cancelled_90d' | 'cancelled_12m'
  | 'inactive_30d' | 'inactive_90d' | 'custom';
export type ChurnCustomerType = 'subscription' | 'one_time' | 'recurring' | 'b2b';

export interface ChurnInputsState {
  definition: ChurnDefinition;
  customDefinition: string;
  customerType: ChurnCustomerType;
  winbackPossible: boolean;
}

export const CHURN_DEFAULT_STATE: ChurnInputsState = {
  definition: 'cancelled_90d',
  customDefinition: '',
  customerType: 'subscription',
  winbackPossible: true,
};

const DEFINITIONS: Array<{ id: ChurnDefinition; label: string }> = [
  { id: 'cancelled_30d', label: 'Cancelled in last 30 days' },
  { id: 'cancelled_90d', label: 'Cancelled in last 90 days' },
  { id: 'cancelled_12m', label: 'Cancelled in last 12 months' },
  { id: 'inactive_30d',  label: 'Inactive 30+ days' },
  { id: 'inactive_90d',  label: 'Inactive 90+ days' },
  { id: 'custom',        label: 'Custom definition' },
];

const CUSTOMER_TYPES: Array<{ id: ChurnCustomerType; label: string }> = [
  { id: 'subscription', label: 'Subscription (recurring)' },
  { id: 'one_time',     label: 'One-time purchase' },
  { id: 'recurring',    label: 'Recurring purchase (non-subscription)' },
  { id: 'b2b',          label: 'B2B contract' },
];

interface Props {
  state: ChurnInputsState;
  onChange: (next: ChurnInputsState) => void;
}

export function ChurnInputs({ state, onChange }: Props) {
  const update = (patch: Partial<ChurnInputsState>) =>
    onChange({ ...state, ...patch });

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Churn Research</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          We&apos;ll run an 11-question Driver Tree + Win-Back survey on
          churned respondents matching your definition: reason categories,
          satisfaction at churn, NPS at churn, win-back probability +
          triggers, competitive switch, CES at exit, warning signs.
        </p>
      </div>

      {/* Churn definition */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Churn definition *
        </span>
        <select
          value={state.definition}
          onChange={(e) => update({ definition: e.target.value as ChurnDefinition })}
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[14px] text-[var(--t1)] focus:outline-none focus:border-[var(--lime)]/60"
        >
          {DEFINITIONS.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
      </label>

      {state.definition === 'custom' && (
        <label className="block">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Custom definition *
          </span>
          <input
            type="text"
            value={state.customDefinition}
            onChange={(e) => update({ customDefinition: e.target.value.slice(0, 120) })}
            placeholder='e.g. "stopped opening emails in 60+ days"'
            className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3.5 py-2.5 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
          />
        </label>
      )}

      {/* Customer type */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Customer type *
        </span>
        <select
          value={state.customerType}
          onChange={(e) => update({ customerType: e.target.value as ChurnCustomerType })}
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[14px] text-[var(--t1)] focus:outline-none focus:border-[var(--lime)]/60"
        >
          {CUSTOMER_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </label>

      {/* Win-back possible */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={state.winbackPossible}
          onChange={(e) => update({ winbackPossible: e.target.checked })}
          className="mt-1 accent-[var(--lime)]"
        />
        <span className="text-xs text-[var(--t1)]">
          We run win-back campaigns
          <p className="text-[11px] text-[var(--t3)] mt-0.5">
            When checked, the results page surfaces an estimated win-back
            addressable market (% reconsider × churned base).
          </p>
        </span>
      </label>

      <div className="flex items-start gap-2 text-[11px] text-[var(--t3)] bg-[var(--bg3)] rounded-xl px-3 py-2.5">
        <Info className="w-3.5 h-3.5 mt-px shrink-0" />
        <span>
          Sample size floor 100; for confident win-back trigger heatmaps
          consider 200+. Driver tree builds on the multi-select reason
          categories from q2.
        </span>
      </div>
    </div>
  );
}

export function validateChurn(state: ChurnInputsState): string[] {
  const missing: string[] = [];
  if (!state.definition) missing.push('a churn definition');
  if (state.definition === 'custom' && !state.customDefinition.trim()) {
    missing.push('the custom churn definition text');
  }
  if (!state.customerType) missing.push('a customer type');
  return missing;
}

export default ChurnInputs;
