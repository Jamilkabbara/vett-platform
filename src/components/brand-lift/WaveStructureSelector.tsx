import { Flag, Repeat, Zap } from 'lucide-react';

export type WaveMode = 'single_wave' | 'pre_post' | 'continuous';

export interface WaveConfig {
  mode: WaveMode;
}

interface Props {
  value: WaveConfig;
  onChange: (next: WaveConfig) => void;
}

const MODES: Array<{ id: WaveMode; title: string; desc: string; icon: typeof Zap }> = [
  {
    id: 'single_wave',
    title: 'Post-Campaign Read',
    desc: 'Questions are worded to measure recall, awareness and intent after the campaign has run.',
    icon: Zap,
  },
  {
    id: 'pre_post',
    title: 'Baseline Framing',
    desc: 'Questions are worded to establish a pre-campaign benchmark you can re-run as a separate mission later.',
    icon: Flag,
  },
  {
    id: 'continuous',
    title: 'Tracking Framing',
    desc: 'Questions are worded for repeat use, so the wording stays constant across any missions you commission later.',
    icon: Repeat,
  },
];

/**
 * Pass 25 Phase 1C — originally a "wave structure" selector.
 *
 * Honesty fix: the pipeline has no wave capability. `wave_mode` is the only
 * field here that reaches anything — MissionSetupPage forwards it in
 * clarify_answers and the backend appends a single `Wave Mode: <mode>` line to
 * the brand-lift question-generation prompt. There is no scheduler, no second
 * fieldwork round, and no cross-mission comparison. So this control is now
 * presented for what it actually is: a questionnaire-framing hint.
 *
 * The former campaignStart / campaignEnd / durationWeeks inputs were removed:
 * they were never forwarded to the generator and were never persisted by the
 * backend (no such columns in ALLOWED_COLUMNS), so their only effects were to
 * gate the launch button and to imply VETT would schedule fieldwork.
 */
export function WaveStructureSelector({ value, onChange }: Props) {
  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Questionnaire Framing</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          How should the questions be worded? This changes the wording only.
        </p>
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

      <p className="text-[11px] text-[var(--t3)] leading-relaxed border-t border-[var(--b1)] pt-3">
        Every brand-lift mission delivers <span className="text-[var(--t1)]">one round of fieldwork</span>.
        Lift is measured inside that round from campaign-exposed vs unexposed respondents. VETT does not
        schedule, run, or compare a second round — measuring change over time means commissioning another
        mission yourself.
      </p>
    </div>
  );
}

export default WaveStructureSelector;
