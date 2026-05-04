import { Calendar, Repeat, Zap } from 'lucide-react';

export type WaveMode = 'single_wave' | 'pre_post' | 'continuous';

export interface WaveConfig {
  mode: WaveMode;
  campaignStart?: string;
  campaignEnd?: string;
  durationWeeks?: number;
}

interface Props {
  value: WaveConfig;
  onChange: (next: WaveConfig) => void;
}

const MODES: Array<{ id: WaveMode; title: string; desc: string; icon: typeof Zap }> = [
  { id: 'single_wave', title: 'Single Wave', desc: 'One snapshot of your audience post-campaign.', icon: Zap },
  { id: 'pre_post',    title: 'Pre + Post',   desc: 'Two waves: baseline before launch + post-campaign.', icon: Repeat },
  { id: 'continuous',  title: 'Continuous',   desc: 'Multiple waves at fixed intervals during the campaign.', icon: Calendar },
];

const DURATION_OPTIONS = [2, 4, 6, 8, 12];

/**
 * Pass 25 Phase 1C — wave structure selector. Validates end > start.
 */
export function WaveStructureSelector({ value, onChange }: Props) {
  const needsDates = value.mode !== 'single_wave';
  const datesValid = !needsDates || (
    value.campaignStart && value.campaignEnd &&
    new Date(value.campaignEnd) > new Date(value.campaignStart)
  );

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Measurement Structure</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">How do you want to measure brand lift?</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {MODES.map(({ id, title, desc, icon: Icon }) => {
          const selected = value.mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ ...value, mode: id })}
              className={`text-left rounded-xl p-4 border transition ${
                selected
                  ? 'border-[var(--lime)] bg-[var(--lime)]/5'
                  : 'border-[var(--b1)] bg-[var(--bg3)] hover:border-[var(--t1)]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${selected ? 'text-[var(--lime)]' : 'text-[var(--t2)]'}`} />
              <div className="text-sm font-semibold text-[var(--t1)]">{title}</div>
              <div className="text-[11px] text-[var(--t3)] mt-1">{desc}</div>
            </button>
          );
        })}
      </div>

      {needsDates && (
        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <label className="text-xs text-[var(--t3)] block">
            Campaign start
            <input
              type="date"
              value={value.campaignStart || ''}
              onChange={(e) => onChange({ ...value, campaignStart: e.target.value })}
              className="mt-1 w-full bg-[var(--bg3)] text-[var(--t1)] text-sm rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] focus:outline-none"
            />
          </label>
          <label className="text-xs text-[var(--t3)] block">
            Campaign end
            <input
              type="date"
              value={value.campaignEnd || ''}
              onChange={(e) => onChange({ ...value, campaignEnd: e.target.value })}
              className="mt-1 w-full bg-[var(--bg3)] text-[var(--t1)] text-sm rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] focus:outline-none"
            />
          </label>
        </div>
      )}

      {value.mode === 'continuous' && (
        <div className="pt-2">
          <p className="text-xs text-[var(--t3)] mb-2">Duration</p>
          <div className="flex gap-2 flex-wrap">
            {DURATION_OPTIONS.map(weeks => {
              const selected = value.durationWeeks === weeks;
              return (
                <button
                  key={weeks}
                  type="button"
                  onClick={() => onChange({ ...value, durationWeeks: weeks })}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    selected
                      ? 'bg-[var(--lime)] text-black border-[var(--lime)]'
                      : 'border-[var(--b1)] text-[var(--t2)] hover:border-[var(--t1)]'
                  }`}
                >
                  {weeks} weeks
                </button>
              );
            })}
          </div>
        </div>
      )}

      {needsDates && !datesValid && (
        <p className="text-xs text-amber-400">Campaign end must be after campaign start.</p>
      )}
    </div>
  );
}

export default WaveStructureSelector;
