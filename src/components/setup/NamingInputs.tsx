import { useState } from 'react';
import { X, Plus, AlertCircle, Info } from 'lucide-react';

/**
 * Pass 31 B3 — Naming & Messaging input collector. Backs the
 * Monadic + Paired + TURF backend question generator.
 *
 * Required: test_type, ≥3 candidates, ≥3 criteria selected.
 * Optional: brand personality (free text), custom criteria.
 */

export type NamingTestType = 'names' | 'taglines' | 'both';

export interface NamingCandidate {
  id: string;
  text: string;
  description?: string;
}

export interface NamingInputsState {
  testType: NamingTestType;
  candidates: NamingCandidate[];
  brandPersonality: string;
  criteria: string[];
  customCriteria: string[];
}

const DEFAULT_CRITERIA = [
  'memorable', 'distinctive', 'relevant', 'positive', 'easy_to_pronounce',
] as const;
const ALL_CRITERIA = [...DEFAULT_CRITERIA, 'modern'] as const;
const CRITERION_LABEL: Record<string, string> = {
  memorable: 'Memorable',
  distinctive: 'Distinctive',
  relevant: 'Relevant',
  positive: 'Positive',
  easy_to_pronounce: 'Easy to pronounce',
  modern: 'Modern',
};

export const NAMING_DEFAULT_STATE: NamingInputsState = {
  testType: 'names',
  candidates: [],
  brandPersonality: '',
  criteria: [...DEFAULT_CRITERIA],
  customCriteria: [],
};

const MIN_CANDIDATES = 3;
const MAX_CANDIDATES = 10;

function nextId(candidates: NamingCandidate[]): string {
  let i = candidates.length + 1;
  while (candidates.some((c) => c.id === `n${i}`)) i++;
  return `n${i}`;
}

interface Props {
  state: NamingInputsState;
  onChange: (next: NamingInputsState) => void;
}

export function NamingInputs({ state, onChange }: Props) {
  const [draftText, setDraftText] = useState('');
  const [draftCustom, setDraftCustom] = useState('');

  const update = (patch: Partial<NamingInputsState>) =>
    onChange({ ...state, ...patch });

  const addCandidate = () => {
    const text = draftText.trim();
    if (!text || state.candidates.length >= MAX_CANDIDATES) return;
    if (state.candidates.some((c) => c.text.toLowerCase() === text.toLowerCase())) return;
    update({
      candidates: [
        ...state.candidates,
        { id: nextId(state.candidates), text, description: '' },
      ],
    });
    setDraftText('');
  };

  const updateCandidate = (id: string, patch: Partial<NamingCandidate>) =>
    update({
      candidates: state.candidates.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });

  const removeCandidate = (id: string) =>
    update({ candidates: state.candidates.filter((c) => c.id !== id) });

  const toggleCriterion = (slug: string) => {
    const next = state.criteria.includes(slug)
      ? state.criteria.filter((c) => c !== slug)
      : [...state.criteria, slug];
    update({ criteria: next });
  };

  const addCustomCriterion = () => {
    const v = draftCustom.trim();
    if (!v || state.customCriteria.length >= 3) return;
    if (state.customCriteria.includes(v)) return;
    update({ customCriteria: [...state.customCriteria, v] });
    setDraftCustom('');
  };

  const totalCriteria = state.criteria.length + state.customCriteria.length;
  const belowMin = state.candidates.length < MIN_CANDIDATES;

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Naming & Messaging</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          We&apos;ll run monadic evaluation per candidate (rate each on
          {' '}{totalCriteria || 5} criteria), forced choice + paired comparisons,
          {state.testType !== 'names' ? ' and a TURF analysis on the taglines' : ''}.
        </p>
      </div>

      {/* Test type */}
      <div>
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Test type *
        </span>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {([
            { id: 'names',    label: 'Names' },
            { id: 'taglines', label: 'Taglines' },
            { id: 'both',     label: 'Both' },
          ] as Array<{ id: NamingTestType; label: string }>).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ testType: t.id })}
              className={[
                'rounded-lg border px-3 py-2 text-[12px] font-display font-bold transition-colors',
                state.testType === t.id
                  ? 'bg-[var(--lime)]/10 border-[var(--lime)] text-[var(--lime)]'
                  : 'bg-[var(--bg3)] border-[var(--b1)] text-[var(--t1)] hover:border-[var(--t3)]',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates */}
      <div>
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Candidates * ({state.candidates.length} / {MAX_CANDIDATES})
        </span>
        <p className="text-[10px] text-[var(--t4)] mt-1 mb-2">
          Min {MIN_CANDIDATES}. Each respondent rates every candidate on the selected criteria, then makes a forced choice.
        </p>
        <div className="space-y-2 mb-2">
          {state.candidates.map((c, i) => (
            <div key={c.id} className="rounded-lg bg-[var(--bg3)] border border-[var(--b1)] p-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
                  {state.testType === 'taglines' ? 'Tagline' : 'Name'} #{i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeCandidate(c.id)}
                  className="text-[var(--t3)] hover:text-red-400"
                  aria-label="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={c.text}
                onChange={(e) => updateCandidate(c.id, { text: e.target.value.slice(0, 80) })}
                placeholder={state.testType === 'taglines' ? 'Tagline copy' : 'Name'}
                className="w-full rounded bg-[var(--bg2)] border border-[var(--b1)] px-2.5 py-1.5 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
              />
              <input
                type="text"
                value={c.description || ''}
                onChange={(e) => updateCandidate(c.id, { description: e.target.value.slice(0, 100) })}
                placeholder="Optional 1-line context"
                className="w-full rounded bg-[var(--bg2)] border border-[var(--b1)] px-2.5 py-1.5 text-[12px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
              />
            </div>
          ))}
        </div>
        {state.candidates.length < MAX_CANDIDATES && (
          <div className="flex gap-2">
            <input
              type="text"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value.slice(0, 80))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCandidate();
                }
              }}
              placeholder={`Add ${state.testType === 'taglines' ? 'tagline' : 'name'} + Enter`}
              className="flex-1 rounded-lg bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
            />
            <button
              type="button"
              onClick={addCandidate}
              disabled={!draftText.trim()}
              className="px-3 rounded-lg bg-[var(--bg3)] border border-[var(--b1)] hover:border-[var(--lime)]/60 text-[var(--t2)] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
        {belowMin && (
          <p className="text-[11px] text-amber-400 flex items-center gap-1.5 mt-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Add {MIN_CANDIDATES - state.candidates.length} more — needs ≥{MIN_CANDIDATES} for the methodology to run.
          </p>
        )}
      </div>

      {/* Criteria */}
      <div>
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Evaluation criteria ({totalCriteria} selected)
        </span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {ALL_CRITERIA.map((slug) => {
            const on = state.criteria.includes(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleCriterion(slug)}
                className={[
                  'px-2.5 py-1 rounded-pill text-[11px] font-display font-bold transition-colors',
                  on
                    ? 'bg-[var(--lime)]/15 border border-[var(--lime)] text-[var(--lime)]'
                    : 'bg-[var(--bg3)] border border-[var(--b1)] text-[var(--t3)] hover:border-[var(--t2)]',
                ].join(' ')}
              >
                {CRITERION_LABEL[slug]}
              </button>
            );
          })}
          {state.customCriteria.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-[var(--pur)]/15 border border-[var(--pur)] text-[11px] font-display font-bold text-[var(--pur)]"
            >
              {c}
              <button
                type="button"
                onClick={() => update({ customCriteria: state.customCriteria.filter((x) => x !== c) })}
                aria-label={`Remove ${c}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        {state.customCriteria.length < 3 && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={draftCustom}
              onChange={(e) => setDraftCustom(e.target.value.slice(0, 30))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomCriterion();
                }
              }}
              placeholder="Add custom criterion + Enter"
              className="flex-1 rounded-lg bg-[var(--bg3)] border border-[var(--b1)] px-3 py-1.5 text-[12px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
            />
          </div>
        )}
      </div>

      {/* Brand personality */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Brand personality (optional)
        </span>
        <textarea
          value={state.brandPersonality}
          onChange={(e) => update({ brandPersonality: e.target.value.slice(0, 200) })}
          placeholder="e.g. Modern, premium, MENA-rooted, slightly playful"
          rows={2}
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3.5 py-2.5 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60 resize-y"
        />
      </label>

      <div className="flex items-start gap-2 text-[11px] text-[var(--t3)] bg-[var(--bg3)] rounded-xl px-3 py-2.5">
        <Info className="w-3.5 h-3.5 mt-px shrink-0" />
        <span>
          Sample size scales per-candidate (80 per candidate floor).
          For 5 candidates that&apos;s 400 respondents min.
          SampleSizeGuidance below the slider tracks this.
        </span>
      </div>
    </div>
  );
}

export function validateNaming(state: NamingInputsState): string[] {
  const missing: string[] = [];
  if (state.candidates.length < MIN_CANDIDATES) {
    missing.push(`${MIN_CANDIDATES - state.candidates.length} more candidate${MIN_CANDIDATES - state.candidates.length === 1 ? '' : 's'}`);
  }
  if (state.candidates.some((c) => !c.text.trim())) {
    missing.push('text on every candidate');
  }
  if (state.criteria.length + state.customCriteria.length < 3) {
    missing.push('at least 3 criteria');
  }
  if (!state.testType) missing.push('a test type');
  return missing;
}

export default NamingInputs;
