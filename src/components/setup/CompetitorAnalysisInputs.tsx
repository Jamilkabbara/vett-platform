import { useState } from 'react';
import { Plus, X, Info, AlertCircle } from 'lucide-react';

/**
 * Pass 31 B1 — Competitor Analysis input collector. Backs the
 * Brand Health Tracker backend question generator
 * (YouGov BrandIndex / Hanover / Kantar tradition).
 *
 * Required: focal brand (from UniversalMissionInputs), 3-8
 * competitors (from UniversalMissionInputs.competitors with min=3
 * enforced here), attribute battery (default 10 standard).
 */

const DEFAULT_ATTRIBUTES = [
  'trustworthy', 'innovative', 'premium', 'affordable', 'high_quality',
  'modern', 'traditional', 'reliable', 'easy_to_use', 'customer_friendly',
] as const;

const ATTRIBUTE_LABELS: Record<string, string> = {
  trustworthy: 'Trustworthy',
  innovative: 'Innovative',
  premium: 'Premium',
  affordable: 'Affordable',
  high_quality: 'High quality',
  modern: 'Modern',
  traditional: 'Traditional',
  reliable: 'Reliable',
  easy_to_use: 'Easy to use',
  customer_friendly: 'Customer-friendly',
};

const MIN_COMPETITORS = 3;

export interface CompetitorAnalysisState {
  attributes: string[];      // selected attribute slugs
  customAttributes: string[];
}

export const COMPETITOR_DEFAULT_STATE: CompetitorAnalysisState = {
  attributes: [...DEFAULT_ATTRIBUTES],
  customAttributes: [],
};

interface Props {
  focalBrand: string;
  competitorCount: number;
  state: CompetitorAnalysisState;
  onChange: (next: CompetitorAnalysisState) => void;
}

export function CompetitorAnalysisInputs({
  focalBrand,
  competitorCount,
  state,
  onChange,
}: Props) {
  const [draftCustom, setDraftCustom] = useState('');

  const update = (patch: Partial<CompetitorAnalysisState>) =>
    onChange({ ...state, ...patch });

  const toggleAttribute = (slug: string) => {
    const next = state.attributes.includes(slug)
      ? state.attributes.filter((a) => a !== slug)
      : [...state.attributes, slug];
    update({ attributes: next });
  };

  const addCustom = () => {
    const v = draftCustom.trim();
    if (!v) return;
    if (state.customAttributes.includes(v)) return;
    if (state.customAttributes.length >= 5) return;
    update({ customAttributes: [...state.customAttributes, v] });
    setDraftCustom('');
  };

  const removeCustom = (a: string) =>
    update({ customAttributes: state.customAttributes.filter((c) => c !== a) });

  const totalAttrs = state.attributes.length + state.customAttributes.length;
  const competitorBelowMin = competitorCount < MIN_COMPETITORS;

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Competitor Analysis</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          We&apos;ll run an 11-question Brand Health Tracker funnel
          (Awareness → Consideration → Preference → Use → Recommendation)
          comparing {focalBrand || 'your brand'} against the competitors
          you list, plus an attribute matrix and switching intent.
        </p>
      </div>

      {/* Focal brand display + competitor count */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-[var(--bg3)] rounded-xl px-4 py-3">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Focal brand
          </span>
          <p className="text-[var(--lime)] font-display font-bold text-sm mt-0.5">
            {focalBrand || <span className="text-[var(--t4)] italic">Set in Mission Context above</span>}
          </p>
        </div>
        <div className="ml-auto text-right">
          <span className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Competitors
          </span>
          <p className={`font-display font-bold text-sm mt-0.5 ${
            competitorBelowMin ? 'text-amber-400' : 'text-[var(--t1)]'
          }`}>
            {competitorCount} / 8
          </p>
        </div>
      </div>

      {competitorBelowMin && (
        <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Add {MIN_COMPETITORS - competitorCount} more competitor
          {MIN_COMPETITORS - competitorCount === 1 ? '' : 's'} in the Mission Context section above.
          Brand Health Tracker needs ≥{MIN_COMPETITORS} for the funnel to be meaningful.
        </p>
      )}

      {/* Attribute battery */}
      <div>
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Attribute battery * ({totalAttrs} selected)
        </span>
        <p className="text-[10px] text-[var(--t4)] mt-1 mb-2">
          Each respondent rates which of these attributes apply to each
          aware brand. Click to toggle. Default 10; deselect any that
          don&apos;t fit your category.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_ATTRIBUTES.map((slug) => {
            const on = state.attributes.includes(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleAttribute(slug)}
                className={[
                  'px-2.5 py-1 rounded-pill text-[11px] font-display font-bold transition-colors',
                  on
                    ? 'bg-[var(--lime)]/15 border border-[var(--lime)] text-[var(--lime)]'
                    : 'bg-[var(--bg3)] border border-[var(--b1)] text-[var(--t3)] hover:border-[var(--t2)]',
                ].join(' ')}
              >
                {ATTRIBUTE_LABELS[slug]}
              </button>
            );
          })}
          {state.customAttributes.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-[var(--pur)]/15 border border-[var(--pur)] text-[11px] font-display font-bold text-[var(--pur)]"
            >
              {a}
              <button
                type="button"
                onClick={() => removeCustom(a)}
                className="opacity-70 hover:opacity-100"
                aria-label={`Remove ${a}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        {/* Custom attribute add */}
        {state.customAttributes.length < 5 && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={draftCustom}
              onChange={(e) => setDraftCustom(e.target.value.slice(0, 30))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Add custom attribute (e.g. eco-friendly, status-symbol)"
              className="flex-1 rounded-lg bg-[var(--bg3)] border border-[var(--b1)] px-3 py-1.5 text-[12px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!draftCustom.trim()}
              className="px-3 rounded-lg bg-[var(--bg3)] border border-[var(--b1)] hover:border-[var(--lime)]/60 text-[var(--t2)] disabled:opacity-50"
              aria-label="Add"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 text-[11px] text-[var(--t3)] bg-[var(--bg3)] rounded-xl px-3 py-2.5">
        <Info className="w-3.5 h-3.5 mt-px shrink-0" />
        <span>
          Sample size floor for Brand Health Tracker is 200 respondents
          (per-brand cells get unstable below). For confident comparisons
          with statistical significance on each brand&apos;s NPS,
          consider 400+. SampleSizeGuidance below the slider tracks this.
        </span>
      </div>
    </div>
  );
}

export function validateCompetitorAnalysis(
  state: CompetitorAnalysisState,
  competitorCount: number,
): string[] {
  const missing: string[] = [];
  if (competitorCount < MIN_COMPETITORS) {
    missing.push(`${MIN_COMPETITORS - competitorCount} more competitor${MIN_COMPETITORS - competitorCount === 1 ? '' : 's'}`);
  }
  if (state.attributes.length + state.customAttributes.length < 3) {
    missing.push('at least 3 attributes');
  }
  return missing;
}

export default CompetitorAnalysisInputs;
