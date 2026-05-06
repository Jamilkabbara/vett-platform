import { DollarSign, Info } from 'lucide-react';

/**
 * Pass 29 B4 — Pricing Research input collector. Backs the Van
 * Westendorp + Gabor-Granger backend question generator.
 *
 * Required:
 *   productDescription (>= 50 chars), currency, pricingModel
 * Optional:
 *   pricingContext (free text), expectedMin / expectedMax (numeric)
 *
 * Renders below UniversalMissionInputs on MissionSetupPage when
 * goal_type === 'pricing'. State is lifted to the parent so the
 * mission-insert payload can populate the pricing_* schema columns.
 */

export type PricingModel =
  | 'one_time'
  | 'monthly_subscription'
  | 'annual_subscription'
  | 'usage_based';

export interface PricingInputsState {
  productDescription: string;
  currency: string;
  pricingModel: PricingModel;
  pricingContext: string;
  expectedMin: string;
  expectedMax: string;
}

export const PRICING_DEFAULT_STATE: PricingInputsState = {
  productDescription: '',
  currency: 'USD',
  pricingModel: 'one_time',
  pricingContext: '',
  expectedMin: '',
  expectedMax: '',
};

const CURRENCIES: Array<{ code: string; symbol: string; label: string }> = [
  { code: 'USD', symbol: '$',   label: 'USD — US Dollar' },
  { code: 'EUR', symbol: '€',   label: 'EUR — Euro' },
  { code: 'GBP', symbol: '£',   label: 'GBP — British Pound' },
  { code: 'AED', symbol: 'AED', label: 'AED — UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR — Saudi Riyal' },
  { code: 'INR', symbol: '₹',   label: 'INR — Indian Rupee' },
  { code: 'BRL', symbol: 'R$',  label: 'BRL — Brazilian Real' },
  { code: 'JPY', symbol: '¥',   label: 'JPY — Japanese Yen' },
];

const MODELS: Array<{ id: PricingModel; label: string; hint: string }> = [
  { id: 'one_time',             label: 'One-time purchase',  hint: 'Single payment, no recurring' },
  { id: 'monthly_subscription', label: 'Monthly subscription', hint: 'Per-month recurring' },
  { id: 'annual_subscription',  label: 'Annual subscription',  hint: 'Per-year recurring' },
  { id: 'usage_based',          label: 'Usage-based',          hint: 'Per-unit / metered pricing' },
];

interface Props {
  state: PricingInputsState;
  onChange: (next: PricingInputsState) => void;
}

export function PricingInputs({ state, onChange }: Props) {
  const update = (patch: Partial<PricingInputsState>) =>
    onChange({ ...state, ...patch });

  const symbol =
    CURRENCIES.find((c) => c.code === state.currency)?.symbol || state.currency;

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Pricing Research</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          We&apos;ll run Van Westendorp (Price Sensitivity Meter) plus
          Gabor-Granger (revenue-maximizing curve).
        </p>
      </div>

      {/* Product description */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Product description *
        </span>
        <textarea
          value={state.productDescription}
          onChange={(e) => update({ productDescription: e.target.value.slice(0, 600) })}
          placeholder="Describe what's being priced — features, use case, target buyer. Min 50 characters."
          rows={3}
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60 resize-y"
        />
        <p className="text-[10px] text-[var(--t4)] mt-1">
          {state.productDescription.length} / 600 chars · Minimum 50.
        </p>
      </label>

      {/* Currency + pricing model side-by-side */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Currency *
          </span>
          <select
            value={state.currency}
            onChange={(e) => update({ currency: e.target.value })}
            className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[14px] text-[var(--t1)] focus:outline-none focus:border-[var(--lime)]/60"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Pricing model *
          </span>
          <select
            value={state.pricingModel}
            onChange={(e) => update({ pricingModel: e.target.value as PricingModel })}
            className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[14px] text-[var(--t1)] focus:outline-none focus:border-[var(--lime)]/60"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-[var(--t4)] mt-1">
            {MODELS.find((m) => m.id === state.pricingModel)?.hint}
          </p>
        </label>
      </div>

      {/* Pricing context */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Pricing context (optional)
        </span>
        <textarea
          value={state.pricingContext}
          onChange={(e) => update({ pricingContext: e.target.value.slice(0, 400) })}
          placeholder="Competitor prices, current price, anything else that helps anchor the price ladder. Or 'no idea' if you're starting from scratch."
          rows={2}
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60 resize-y"
        />
      </label>

      {/* Expected price range */}
      <div>
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Expected price range (optional)
        </span>
        <p className="text-[10px] text-[var(--t4)] mt-1 mb-2">
          We use this to anchor the Gabor-Granger price ladder. If left blank, we&apos;ll infer from the description.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--t3)] tabular-nums shrink-0">{symbol}</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={state.expectedMin}
            onChange={(e) => update({ expectedMin: e.target.value })}
            placeholder="min"
            className="w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
          />
          <span className="text-xs text-[var(--t3)] shrink-0">to</span>
          <span className="text-xs text-[var(--t3)] tabular-nums shrink-0">{symbol}</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={state.expectedMax}
            onChange={(e) => update({ expectedMax: e.target.value })}
            placeholder="max"
            className="w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
          />
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-[var(--t3)] bg-[var(--bg3)] rounded-xl px-3 py-2.5">
        <Info className="w-3.5 h-3.5 mt-px shrink-0" />
        <span>
          The survey asks 4 Van Westendorp price-sensitivity questions
          (too expensive / expensive / bargain / too cheap) plus 5
          Gabor-Granger price-acceptance anchors. Results page renders
          the 4-curve VW plot with the 4 intersection points (PMC, PME,
          IPP, OPP) plus the GG demand curve with the revenue-maximizing
          price highlighted.
        </span>
      </div>
    </div>
  );
}

export function validatePricingInputs(state: PricingInputsState): string[] {
  const missing: string[] = [];
  if (state.productDescription.trim().length < 50) {
    missing.push('a 50+ char product description');
  }
  if (!state.currency) missing.push('a currency');
  if (!state.pricingModel) missing.push('a pricing model');
  if (state.expectedMin && state.expectedMax) {
    const min = Number(state.expectedMin);
    const max = Number(state.expectedMax);
    if (Number.isFinite(min) && Number.isFinite(max) && max <= min) {
      missing.push('a valid price range (max > min)');
    }
  }
  return missing;
}

export default PricingInputs;
// Suppress unused-import warning when DollarSign isn't directly used
// in the JSX above — it's available for future affordances and we
// keep the icon import path consistent with sibling components.
void DollarSign;
