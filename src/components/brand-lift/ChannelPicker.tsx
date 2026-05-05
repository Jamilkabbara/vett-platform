import { useState, useEffect, useMemo } from 'react';
import { Search, X, Check, ChevronDown, ChevronUp, Sparkles, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface ChannelMaster {
  id: string;
  display_name: string;
  category: string;
  is_mena_specific: boolean;
  display_order: number;
}

export interface SelectedChannel {
  id: string;
  display_name: string;
  category: string;
  custom?: boolean;
}

interface Props {
  selected: SelectedChannel[];
  onChange: (next: SelectedChannel[]) => void;
  aiSuggestedIds?: string[];
  /**
   * Pass 27 — only show channels whose markets[] intersects with
   * `selectedMarkets` (or where is_global = TRUE). Empty array
   * blocks rendering and shows the "select markets first" empty
   * state.
   */
  selectedMarkets?: string[];
}

const CHANNEL_UPLIFT_TIERS = [
  { min: 1, max: 10, name: 'Starter', upliftUSD: 0 },
  { min: 11, max: 25, name: 'Standard', upliftUSD: 10 },
  { min: 26, max: 50, name: 'Plus', upliftUSD: 20 },
  { min: 51, max: 100, name: 'Pro', upliftUSD: 35 },
  { min: 101, max: Infinity, name: 'Enterprise', upliftUSD: 50 },
];

const CATEGORY_LABELS: Record<string, string> = {
  tv: 'TV (Linear)',
  ctv: 'CTV / Streaming',
  cinema: 'Cinema',
  digital_video: 'Digital Video',
  social: 'Social Ads',
  display: 'Display',
  audio: 'Digital Audio',
  radio: 'Radio',
  ooh: 'OOH',
  dooh: 'DOOH',
  influencer: 'Influencer',
  press: 'Press',
  retail_media: 'Retail Media',
  in_game: 'In-Game',
};

/**
 * Pass 25 Phase 1C — granular channel picker for Brand Lift Studies.
 * Loads channels_master, groups by category, supports search, AI-suggested
 * highlight, custom-channel input. Min 1 required.
 */
export function ChannelPicker({ selected, onChange, aiSuggestedIds = [], selectedMarkets = [] }: Props) {
  const [channels, setChannels] = useState<ChannelMaster[]>([]);
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ tv: true, ctv: true });
  const [customInput, setCustomInput] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedMarkets.length === 0) {
      setChannels([]);
      return;
    }
    (async () => {
      // Pass 27 — filter by markets[] && selected OR is_global = TRUE.
      // PostgREST `or` filter syntax: column.op.value
      const { data } = await supabase
        .from('channels_master')
        .select('id, display_name, category, is_mena_specific, display_order, markets, is_global')
        .or(`markets.ov.{${selectedMarkets.join(',')}},is_global.eq.true`)
        .order('display_order');
      if (data) setChannels(data as ChannelMaster[]);
    })();
  }, [selectedMarkets.join(',')]);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filter = (c: ChannelMaster) => !q || c.display_name.toLowerCase().includes(q);
    const out: Record<string, ChannelMaster[]> = {};
    for (const c of channels) {
      if (!filter(c)) continue;
      (out[c.category] = out[c.category] || []).push(c);
    }
    return out;
  }, [channels, search]);

  const isSelected = (id: string) => selected.some(s => s.id === id);
  const selectedCount = selected.length;

  const toggle = (c: ChannelMaster) => {
    if (isSelected(c.id)) {
      onChange(selected.filter(s => s.id !== c.id));
    } else {
      onChange([...selected, { id: c.id, display_name: c.display_name, category: c.category }]);
    }
  };

  const addCustom = (category: string) => {
    const name = (customInput[category] || '').trim();
    if (!name) return;
    const id = `custom_${category}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
    onChange([...selected, { id, display_name: name, category, custom: true }]);
    setCustomInput({ ...customInput, [category]: '' });
  };

  // Pass 27 — uplift tier indicator.
  const tier = CHANNEL_UPLIFT_TIERS.find(t => selectedCount >= t.min && selectedCount <= t.max);
  const tierColor = (tier?.upliftUSD || 0) === 0
    ? 'bg-[var(--lime)]/10 text-[var(--lime)]'
    : (tier?.upliftUSD || 0) <= 20
    ? 'bg-[var(--lime)]/10 text-[var(--lime)]'
    : 'bg-amber-500/10 text-amber-400';

  if (selectedMarkets.length === 0) {
    return (
      <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--t1)]">Campaign Channels</h3>
        <p className="text-xs text-[var(--t3)] mt-2">
          Select at least 1 market above to see relevant channels.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--t1)]">Campaign Channels</h3>
          <p className="text-xs text-[var(--t3)] mt-0.5">
            Showing {channels.length} channels for {selectedMarkets.length} market{selectedMarkets.length === 1 ? '' : 's'} · min 1
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--lime)]/10 text-[var(--lime)] font-semibold">
          {selectedCount} selected
        </span>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search 220+ channels…"
          className="w-full bg-[var(--bg3)] text-[var(--t1)] text-sm rounded-lg pl-9 pr-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] focus:outline-none"
        />
      </div>

      {selected.length > 0 && (
        <div className="bg-[var(--bg3)] rounded-lg p-3 flex flex-wrap gap-1.5">
          {selected.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-[var(--lime)]/10 text-[var(--lime)] px-2 py-1 rounded-full">
              {s.display_name}
              <button
                type="button"
                onClick={() => onChange(selected.filter(x => x.id !== s.id))}
                aria-label={`Remove ${s.display_name}`}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="border border-[var(--b1)] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenCategories({ ...openCategories, [cat]: !openCategories[cat] })}
              className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg3)] text-left text-xs font-semibold text-[var(--t1)] hover:bg-[var(--bg)]"
            >
              <span>{CATEGORY_LABELS[cat] || cat} · {list.length}</span>
              {openCategories[cat] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openCategories[cat] && (
              <div className="p-3 flex flex-wrap gap-1.5">
                {list.map(c => {
                  const sel = isSelected(c.id);
                  const ai = aiSuggestedIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c)}
                      className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                        sel
                          ? 'bg-[var(--lime)] text-black border-[var(--lime)]'
                          : ai
                          ? 'border-[var(--lime)] text-[var(--lime)] bg-[var(--lime)]/5'
                          : 'border-[var(--b1)] text-[var(--t2)] hover:border-[var(--t1)]'
                      }`}
                    >
                      {sel && <Check className="w-3 h-3" />}
                      {!sel && ai && <Sparkles className="w-3 h-3" />}
                      {c.display_name}
                      {ai && !sel && <span className="text-[9px] uppercase ml-0.5">AI</span>}
                    </button>
                  );
                })}
                <div className="basis-full mt-2 flex gap-2">
                  <input
                    value={customInput[cat] || ''}
                    onChange={(e) => setCustomInput({ ...customInput, [cat]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom(cat))}
                    placeholder="Add custom channel…"
                    className="flex-1 bg-[var(--bg3)] text-[var(--t1)] text-xs rounded-md px-2.5 py-1.5 border border-[var(--b1)] focus:border-[var(--lime)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addCustom(cat)}
                    className="text-xs text-[var(--lime)] hover:opacity-70 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {tier && (
        <div className="border-t border-[var(--b1)]/60 pt-3 flex items-center justify-between">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${tierColor}`} title="Tier pricing applies on top of respondent cost. Helps cover the AI compute for sophisticated multi-channel attribution.">
            {tier.name} channel uplift · {tier.upliftUSD === 0 ? '$0.00' : `+$${tier.upliftUSD}.00`}
          </span>
          <span className="text-[10px] text-[var(--t3)] cursor-help" title="Tier brackets: 1-10 free / 11-25 +$10 / 26-50 +$20 / 51-100 +$35 / 101+ +$50">
            ⓘ Tier pricing
          </span>
        </div>
      )}
    </div>
  );
}

export default ChannelPicker;
