import { useState } from 'react';
import { X, Plus, Lightbulb, AlertCircle } from 'lucide-react';

/**
 * Pass 30 B3 — multi-concept input collector for Compare Concepts
 * (sequential monadic) missions. 2-5 concepts, each with name +
 * description + optional price. Image / video upload deferred —
 * descriptions cover most use cases for the synthetic-respondent
 * round trip.
 */

export interface CompareConcept {
  id: string;
  name: string;
  description: string;
  priceUsd: string;
}

const MIN_CONCEPTS = 2;
const MAX_CONCEPTS = 5;
const NAME_MAX = 60;
const DESC_MAX = 280;

interface Props {
  concepts: CompareConcept[];
  onChange: (next: CompareConcept[]) => void;
}

function nextId(concepts: CompareConcept[]): string {
  let i = concepts.length + 1;
  while (concepts.some((c) => c.id === `c${i}`)) i++;
  return `c${i}`;
}

export function ConceptListCollector({ concepts, onChange }: Props) {
  const [draftName, setDraftName] = useState('');

  const add = () => {
    const name = draftName.trim();
    if (!name || concepts.length >= MAX_CONCEPTS) return;
    if (concepts.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    onChange([
      ...concepts,
      { id: nextId(concepts), name, description: '', priceUsd: '' },
    ]);
    setDraftName('');
  };

  const update = (id: string, patch: Partial<CompareConcept>) =>
    onChange(concepts.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const remove = (id: string) =>
    onChange(concepts.filter((c) => c.id !== id));

  const belowMin = concepts.length < MIN_CONCEPTS;

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Concepts to Compare</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          We&apos;ll run sequential monadic — each respondent sees all
          concepts in randomized order, evaluates each on appeal /
          relevance / uniqueness / intent, then makes a forced choice.
        </p>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-[var(--t3)] bg-[var(--bg3)] rounded-xl px-3 py-2.5">
        <Lightbulb className="w-3.5 h-3.5 mt-px shrink-0 text-[var(--lime)]" />
        <span>
          Min {MIN_CONCEPTS}, max {MAX_CONCEPTS} concepts. Sample size
          floor scales per-concept (80 × N for the sequential monadic
          methodology).
        </span>
      </div>

      {concepts.map((c, i) => (
        <div
          key={c.id}
          className="rounded-xl bg-[var(--bg3)] border border-[var(--b1)] p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
              Concept #{i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(c.id)}
              className="text-[var(--t3)] hover:text-red-400"
              aria-label={`Remove ${c.name}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={c.name}
            onChange={(e) => update(c.id, { name: e.target.value.slice(0, NAME_MAX) })}
            placeholder="Concept name (e.g. Premium Variant, Bundle Tier 1)"
            className="w-full rounded-lg bg-[var(--bg2)] border border-[var(--b1)] px-3 py-2 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
          />
          <textarea
            value={c.description}
            onChange={(e) => update(c.id, { description: e.target.value.slice(0, DESC_MAX) })}
            placeholder="Description: features, value prop, use case. Min 30 characters."
            rows={2}
            className="w-full rounded-lg bg-[var(--bg2)] border border-[var(--b1)] px-3 py-2 text-[12px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60 resize-y"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--t3)] tabular-nums shrink-0">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={c.priceUsd}
              onChange={(e) => update(c.id, { priceUsd: e.target.value })}
              placeholder="Price (optional)"
              className="w-32 rounded-lg bg-[var(--bg2)] border border-[var(--b1)] px-2.5 py-1.5 text-[12px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
            />
          </div>
        </div>
      ))}

      {concepts.length < MAX_CONCEPTS && (
        <div className="rounded-xl border border-dashed border-[var(--b1)] p-3 space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Add concept
          </span>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value.slice(0, NAME_MAX))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Concept name + Enter (description on the next card)"
            className="w-full rounded-lg bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draftName.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg3)] border border-[var(--b1)] hover:border-[var(--lime)]/60 px-3 py-1.5 text-[12px] text-[var(--t2)] disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add concept
          </button>
        </div>
      )}

      <p className="text-[11px] text-[var(--t3)] text-right">
        {concepts.length} / {MAX_CONCEPTS} concepts
      </p>

      {belowMin && (
        <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Add {MIN_CONCEPTS - concepts.length} more concept
          {MIN_CONCEPTS - concepts.length === 1 ? '' : 's'} — sequential monadic needs ≥{MIN_CONCEPTS}.
        </p>
      )}
    </div>
  );
}

export function validateConceptList(concepts: CompareConcept[]): string[] {
  const missing: string[] = [];
  if (concepts.length < MIN_CONCEPTS) {
    missing.push(`${MIN_CONCEPTS - concepts.length} more concept${MIN_CONCEPTS - concepts.length === 1 ? '' : 's'}`);
  }
  if (concepts.some((c) => !c.name.trim())) missing.push('a name on every concept');
  if (concepts.some((c) => c.description.trim().length < 30)) {
    missing.push('a 30+ char description on every concept');
  }
  return missing;
}

export default ConceptListCollector;
