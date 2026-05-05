import { useState, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface Market {
  code: string;
  display_name: string;
  region: string;
  is_meta_market: boolean;
  emoji_flag: string | null;
  population_millions: number | null;
  display_order: number;
}

interface Props {
  selected: string[];                        // market codes
  onChange: (next: string[]) => void;
  aiSuggestedCodes?: string[];
}

const REGION_LABELS: Record<string, string> = {
  NORTH_AMERICA: 'North America',
  EUROPE: 'Europe',
  NORDICS: 'Nordics (within Europe)',
  LATAM: 'LATAM',
  APAC: 'Asia-Pacific',
  AFRICA: 'Africa',
  CIS: 'CIS',
  MENA: 'MENA',
  GLOBAL: 'Global',
  GCC: 'GCC',
};

/**
 * Pass 27 — MarketPicker. Sits ABOVE the ChannelPicker on /setup for
 * brand_lift goal_type. Selecting a meta-market expands to its
 * constituent countries (single chip with ✕). Selecting a country
 * adds it as its own chip. AI suggestions render with a lime border
 * + Sparkles icon.
 */
export function MarketPicker({ selected, onChange, aiSuggestedCodes = [] }: Props) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({ NORTH_AMERICA: true, EUROPE: true });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('markets_master')
        .select('code, display_name, region, is_meta_market, emoji_flag, population_millions, display_order')
        .order('display_order');
      if (data) setMarkets(data as Market[]);
    })();
  }, []);

  const meta = useMemo(() => markets.filter(m => m.is_meta_market), [markets]);
  const countriesByRegion = useMemo(() => {
    const out: Record<string, Market[]> = {};
    for (const m of markets) {
      if (m.is_meta_market) continue;
      (out[m.region] = out[m.region] || []).push(m);
    }
    return out;
  }, [markets]);

  const q = search.trim().toLowerCase();
  const filterFn = (m: Market) => !q || m.display_name.toLowerCase().includes(q);

  const isSelected = (code: string) => selected.includes(code);

  const toggle = (code: string) => {
    if (isSelected(code)) {
      onChange(selected.filter(c => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--t1)]">Target Markets</h3>
          <p className="text-xs text-[var(--t3)] mt-0.5">Where will this campaign run? Min 1 market.</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--lime)]/10 text-[var(--lime)] font-semibold">
          {selected.length} selected
        </span>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search markets (e.g. United States, Brazil, MENA)"
          className="w-full bg-[var(--bg3)] text-[var(--t1)] text-sm rounded-lg pl-9 pr-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] focus:outline-none"
        />
      </div>

      {selected.length > 0 && (
        <div className="bg-[var(--bg3)] rounded-lg p-3 flex flex-wrap gap-1.5">
          {selected.map(code => {
            const m = markets.find(x => x.code === code);
            const label = m ? `${m.emoji_flag || ''} ${m.display_name}` : code;
            return (
              <span key={code} className="inline-flex items-center gap-1 text-xs bg-[var(--lime)]/10 text-[var(--lime)] px-2 py-1 rounded-full">
                {label}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter(c => c !== code))}
                  aria-label={`Remove ${m?.display_name || code}`}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {!q && meta.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--lime)] mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Meta-markets
          </div>
          <div className="flex flex-wrap gap-1.5">
            {meta.map(m => {
              const sel = isSelected(m.code);
              return (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => toggle(m.code)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    sel
                      ? 'bg-[var(--lime)] text-black border-[var(--lime)]'
                      : 'border-[var(--lime)] text-[var(--lime)] bg-[var(--lime)]/5 hover:bg-[var(--lime)]/15'
                  }`}
                >
                  {m.emoji_flag} {m.display_name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Object.entries(countriesByRegion).map(([region, list]) => {
          const filtered = list.filter(filterFn);
          if (filtered.length === 0 && q) return null;
          const isOpen = open[region] ?? !!q;
          return (
            <div key={region} className="border border-[var(--b1)] rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen({ ...open, [region]: !isOpen })}
                className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg3)] text-left text-xs font-semibold text-[var(--t1)] hover:bg-[var(--bg)]"
              >
                <span>{REGION_LABELS[region] || region} · {filtered.length}</span>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {isOpen && (
                <div className="p-3 flex flex-wrap gap-1.5">
                  {filtered.map(m => {
                    const sel = isSelected(m.code);
                    const ai = aiSuggestedCodes.includes(m.code);
                    return (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => toggle(m.code)}
                        title={m.population_millions ? `${m.population_millions}M people` : ''}
                        className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                          sel
                            ? 'bg-[var(--lime)] text-black border-[var(--lime)]'
                            : ai
                            ? 'border-[var(--lime)] text-[var(--lime)] bg-[var(--lime)]/5'
                            : 'border-[var(--b1)] text-[var(--t2)] hover:border-[var(--t1)]'
                        }`}
                      >
                        {!sel && ai && <Sparkles className="w-3 h-3" />}
                        {m.emoji_flag} {m.display_name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-amber-400">Select at least 1 target market.</p>
      )}
    </div>
  );
}

export default MarketPicker;
