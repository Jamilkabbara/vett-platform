// Pass 27 F19 — 6 filter dropdown primitives for BrandLiftResultsPage.
// Folded into one file because each is tiny and they share identical
// shape (chip + select). Lifting them out into individual files would
// add noise without gaining testability.

import { ChevronDown, X } from 'lucide-react';

interface MultiProps<T extends string = string> {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T[];
  onChange: (next: T[]) => void;
  disabled?: boolean;
  disabledHint?: string;
}

interface SingleProps<T extends string = string> {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T | null;
  onChange: (next: T | null) => void;
  disabled?: boolean;
  disabledHint?: string;
}

function MultiPill<T extends string = string>({ label, options, value, onChange, disabled, disabledHint }: MultiProps<T>) {
  const summary = value.length === 0 ? 'All' : value.length === 1 ? options.find(o => o.value === value[0])?.label || value[0] : `${value.length} selected`;
  return (
    <div className="relative inline-flex items-center gap-1">
      <label className="text-[10px] uppercase tracking-wider text-[var(--t3)]">{label}</label>
      <select
        multiple={false}
        disabled={disabled}
        value=""
        onChange={(e) => {
          const v = e.target.value as T;
          if (!v) return;
          if (value.includes(v)) onChange(value.filter(x => x !== v));
          else onChange([...value, v]);
        }}
        className={`appearance-none bg-[var(--bg3)] text-[var(--t1)] text-xs rounded-lg pl-2.5 pr-7 py-1.5 border border-[var(--b1)] focus:border-[var(--lime)] focus:outline-none cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={disabled ? disabledHint : undefined}
      >
        <option value="">{summary}{disabled && disabledHint ? ` (${disabledHint})` : ''}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{value.includes(o.value) ? '✓ ' : ''}{o.label}</option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--t3)]" />
      {value.length > 0 && !disabled && (
        <button type="button" onClick={() => onChange([])} aria-label={`Clear ${label}`} className="ml-1 text-[var(--t3)] hover:text-[var(--t1)]">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function SinglePill<T extends string = string>({ label, options, value, onChange, disabled, disabledHint }: SingleProps<T>) {
  return (
    <div className="relative inline-flex items-center gap-1">
      <label className="text-[10px] uppercase tracking-wider text-[var(--t3)]">{label}</label>
      <select
        disabled={disabled}
        value={value || ''}
        onChange={(e) => onChange((e.target.value || null) as T | null)}
        className={`appearance-none bg-[var(--bg3)] text-[var(--t1)] text-xs rounded-lg pl-2.5 pr-7 py-1.5 border border-[var(--b1)] focus:border-[var(--lime)] focus:outline-none cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={disabled ? disabledHint : undefined}
      >
        <option value="">All{disabled && disabledHint ? ` (${disabledHint})` : ''}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--t3)]" />
    </div>
  );
}

export const MarketFilterDropdown = MultiPill<string>;
export const ChannelCategoryFilterDropdown = MultiPill<string>;
export const AgeFilterDropdown = MultiPill<string>;
export const ChannelMultiFilterDropdown = MultiPill<string>;
export const GenderFilterDropdown = SinglePill<string>;
export const WaveFilterDropdown = SinglePill<string>;

// Incrementality is its own component because it has 4 fixed modes,
// not a free-form options list, and its 'lift' mode triggers a
// different render path on the page.
type ExposureMode = 'all' | 'exposed' | 'control' | 'lift';

interface IncrProps {
  value: ExposureMode;
  onChange: (next: ExposureMode) => void;
  disabled?: boolean;
}

export function IncrementalityFilterDropdown({ value, onChange, disabled }: IncrProps) {
  return (
    <div className="relative inline-flex items-center gap-1">
      <label className="text-[10px] uppercase tracking-wider text-[var(--t3)]">Incrementality</label>
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value as ExposureMode)}
        className={`appearance-none bg-[var(--bg3)] text-[var(--t1)] text-xs rounded-lg pl-2.5 pr-7 py-1.5 border border-[var(--b1)] focus:border-[var(--lime)] focus:outline-none cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <option value="all">All respondents</option>
        <option value="exposed">Exposed only</option>
        <option value="control">Control only</option>
        <option value="lift">Show lift (Exposed − Control)</option>
      </select>
      <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--t3)]" />
    </div>
  );
}

export type { ExposureMode };
