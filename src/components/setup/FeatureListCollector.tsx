import { useState } from 'react';
import { X, Plus, Lightbulb, AlertCircle } from 'lucide-react';

/**
 * Pass 29 B6 — Feature Roadmap input collector. Backs the MaxDiff +
 * Kano backend question generator.
 *
 * Each feature has an auto-generated id (f1..fN), a short name
 * (required), and an optional 1-2 sentence description that the AI
 * can use to expand the feature label inside MaxDiff sets and Kano
 * questions.
 *
 * Min 6 features required (MaxDiff with fewer than 6 features can't
 * produce 12 balanced 4-feature sets); max 30 (above that the survey
 * exhausts respondent attention).
 */

export interface RoadmapFeature {
  id: string;
  name: string;
  description: string;
}

const MIN_FEATURES = 6;
const MAX_FEATURES = 30;
const NAME_MAX = 60;
const DESC_MAX = 160;

interface Props {
  features: RoadmapFeature[];
  onChange: (next: RoadmapFeature[]) => void;
}

function nextId(features: RoadmapFeature[]): string {
  let i = features.length + 1;
  while (features.some((f) => f.id === `f${i}`)) i++;
  return `f${i}`;
}

export function FeatureListCollector({ features, onChange }: Props) {
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');

  const add = () => {
    const name = draftName.trim();
    if (!name || features.length >= MAX_FEATURES) return;
    if (features.some((f) => f.name.toLowerCase() === name.toLowerCase())) return;
    onChange([
      ...features,
      { id: nextId(features), name, description: draftDesc.trim() },
    ]);
    setDraftName('');
    setDraftDesc('');
  };

  const update = (id: string, patch: Partial<RoadmapFeature>) =>
    onChange(features.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const remove = (id: string) =>
    onChange(features.filter((f) => f.id !== id));

  const belowMin = features.length < MIN_FEATURES;

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Feature List</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          We&apos;ll run MaxDiff (best-worst on rotated 4-feature sets) plus Kano
          (functional / dysfunctional pair) on the top 5.
        </p>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-[var(--t3)] bg-[var(--bg3)] rounded-xl px-3 py-2.5">
        <Lightbulb className="w-3.5 h-3.5 mt-px shrink-0 text-[var(--lime)]" />
        <span>
          We need at least {MIN_FEATURES} features to run MaxDiff. For best
          results, list 12-20 features at a similar level of detail (don&apos;t
          mix high-level themes with tiny tweaks).
        </span>
      </div>

      {/* Existing features */}
      <div className="space-y-2">
        {features.map((f, i) => (
          <div
            key={f.id}
            className="rounded-xl bg-[var(--bg3)] border border-[var(--b1)] p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
                Feature #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="text-[var(--t3)] hover:text-red-400"
                aria-label={`Remove feature ${f.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={f.name}
              onChange={(e) =>
                update(f.id, { name: e.target.value.slice(0, NAME_MAX) })
              }
              placeholder="Short feature name (e.g. social sharing, dark mode, AI summary)"
              className="w-full rounded-lg bg-[var(--bg2)] border border-[var(--b1)] px-3 py-2 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
            />
            <textarea
              value={f.description}
              onChange={(e) =>
                update(f.id, { description: e.target.value.slice(0, DESC_MAX) })
              }
              placeholder="Optional 1-2 sentence description"
              rows={2}
              className="w-full rounded-lg bg-[var(--bg2)] border border-[var(--b1)] px-3 py-2 text-[12px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60 resize-y"
            />
          </div>
        ))}
      </div>

      {/* Add new feature */}
      {features.length < MAX_FEATURES && (
        <div className="rounded-xl border border-dashed border-[var(--b1)] p-3 space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Add feature
          </span>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value.slice(0, NAME_MAX))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Feature name + Enter"
            className="w-full rounded-lg bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
          />
          <textarea
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value.slice(0, DESC_MAX))}
            placeholder="Optional 1-2 sentence description"
            rows={2}
            className="w-full rounded-lg bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2 text-[12px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60 resize-y"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draftName.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg3)] border border-[var(--b1)] hover:border-[var(--lime)]/60 px-3 py-1.5 text-[12px] text-[var(--t2)] disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add feature
          </button>
        </div>
      )}

      {/* Counter */}
      <p className="text-[11px] text-[var(--t3)] text-right">
        {features.length} / {MAX_FEATURES} features
        {features.length >= MAX_FEATURES && ' (cap reached)'}
      </p>

      {belowMin && (
        <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Add {MIN_FEATURES - features.length} more feature
          {MIN_FEATURES - features.length === 1 ? '' : 's'} — MaxDiff needs ≥{MIN_FEATURES} to run reliably.
        </p>
      )}
    </div>
  );
}

export function validateFeatureList(features: RoadmapFeature[]): string[] {
  const missing: string[] = [];
  if (features.length < MIN_FEATURES) {
    missing.push(`${MIN_FEATURES - features.length} more feature${MIN_FEATURES - features.length === 1 ? '' : 's'}`);
  }
  if (features.some((f) => !f.name.trim())) {
    missing.push('a name for every feature');
  }
  return missing;
}

export default FeatureListCollector;
