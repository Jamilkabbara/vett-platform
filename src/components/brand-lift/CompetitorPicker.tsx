import { useState } from 'react';
import { X, Plus, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
  aiSuggestions?: string[];
}

const MIN_COMPETITORS = 2;
const MAX_COMPETITORS = 5;

/**
 * Pass 25 Phase 1C — competitor brand picker. Min 2, max 5. Free text +
 * optional AI suggestions for one-click add.
 */
export function CompetitorPicker({ selected, onChange, aiSuggestions = [] }: Props) {
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const name = raw.trim();
    if (!name || selected.length >= MAX_COMPETITORS) return;
    if (selected.some(s => s.toLowerCase() === name.toLowerCase())) return;
    onChange([...selected, name]);
    setInput('');
  };

  const remove = (name: string) => onChange(selected.filter(s => s !== name));

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Competitor Brands</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          Min 2 · max 5 · used in awareness and consideration questions
        </p>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(s => (
            <span key={s} className="inline-flex items-center gap-1 text-xs bg-[var(--lime)]/10 text-[var(--lime)] px-2.5 py-1 rounded-full">
              {s}
              <button type="button" onClick={() => remove(s)} aria-label={`Remove ${s}`} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add(input))}
          placeholder="Type a competitor brand…"
          disabled={selected.length >= MAX_COMPETITORS}
          className="flex-1 bg-[var(--bg3)] text-[var(--t1)] text-sm rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => add(input)}
          disabled={!input.trim() || selected.length >= MAX_COMPETITORS}
          className="px-3 py-2 bg-[var(--lime)] text-black text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {aiSuggestions.length > 0 && (
        <div>
          <div className="text-xs text-[var(--t3)] mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--lime)]" /> AI suggestions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {aiSuggestions
              .filter(s => !selected.some(c => c.toLowerCase() === s.toLowerCase()))
              .slice(0, 8)
              .map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => add(s)}
                  disabled={selected.length >= MAX_COMPETITORS}
                  className="text-xs px-2.5 py-1 rounded-full border border-[var(--lime)] text-[var(--lime)] bg-[var(--lime)]/5 hover:bg-[var(--lime)]/10 disabled:opacity-30"
                >
                  + {s}
                </button>
              ))}
          </div>
        </div>
      )}

      {selected.length < MIN_COMPETITORS && (
        <div className="flex items-start gap-2 text-xs text-amber-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Add at least {MIN_COMPETITORS} competitor brands. We need them to make awareness and consideration questions meaningful.
          </span>
        </div>
      )}
    </div>
  );
}

export default CompetitorPicker;
