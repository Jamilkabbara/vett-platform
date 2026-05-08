import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import {
  CreativeUploader,
  type CreativeMetadata,
  MarketPicker,
  ChannelPicker,
  type SelectedChannel,
  WaveStructureSelector,
  type WaveConfig,
  CompetitorPicker,
  KPITemplatePicker,
  type KPITemplateId,
} from '../brand-lift';
import {
  BRAND_LIFT_TIERS,
  calculateMarketUplift,
  calculateChannelUplift,
} from '../../utils/pricingEngine';

export interface BrandLiftSetupState {
  /**
   * Pass 34 B2 — focal brand name. Required field; the question
   * generator substitutes it into every funnel question (awareness,
   * consideration, intent, NPS, etc.). Production audit found
   * brand_name=null on every brand_lift draft because UniversalMissionInputs
   * is hidden for brand_lift and the field had no other capture path.
   */
  brand: string;
  creative: CreativeMetadata | null;
  markets: string[];
  channels: SelectedChannel[];
  wave: WaveConfig;
  competitors: string[];
  kpiTemplate: KPITemplateId;
  respondentCount: number;
}

interface BrandLiftSetupSectionProps {
  userId: string;
  state: BrandLiftSetupState;
  onChange: (next: BrandLiftSetupState) => void;
  onGenerate: () => void;
  submitting: boolean;
  briefValid: boolean;
}

const MIN_COMPETITORS = 2;
const DEFAULT_KPI: KPITemplateId = 'funnel_overview';

export const BRAND_LIFT_DEFAULT_STATE: BrandLiftSetupState = {
  brand: '',
  creative: null,
  markets: [],
  channels: [],
  wave: { mode: 'single_wave' },
  competitors: [],
  kpiTemplate: DEFAULT_KPI,
  respondentCount: BRAND_LIFT_TIERS[0].anchorCount,
};

function brandLiftMissingFields(
  state: BrandLiftSetupState,
  briefValid: boolean,
): string[] {
  const missing: string[] = [];
  if (!briefValid) missing.push('a 30+ char brief');
  if (!state.brand.trim()) missing.push('a brand name');
  if (!state.creative) missing.push('a creative');
  if (state.markets.length < 1) missing.push('1 market');
  if (state.channels.length < 1) missing.push('1 channel');
  const wavesNeedDates = state.wave.mode !== 'single_wave';
  const datesValid =
    !wavesNeedDates ||
    (state.wave.campaignStart &&
      state.wave.campaignEnd &&
      new Date(state.wave.campaignEnd) > new Date(state.wave.campaignStart));
  if (!datesValid) missing.push('campaign dates');
  if (state.competitors.length < MIN_COMPETITORS) {
    missing.push(`${MIN_COMPETITORS} competitors`);
  }
  if (!state.kpiTemplate) missing.push('a KPI template');
  return missing;
}

export function BrandLiftSetupSection({
  userId,
  state,
  onChange,
  onGenerate,
  submitting,
  briefValid,
}: BrandLiftSetupSectionProps) {
  const missing = brandLiftMissingFields(state, briefValid);
  const ready = missing.length === 0;

  const tier =
    BRAND_LIFT_TIERS.find((t) => state.respondentCount <= t.maxCount) ??
    BRAND_LIFT_TIERS[BRAND_LIFT_TIERS.length - 1];
  const base = tier.packagePrice;
  const marketUplift = calculateMarketUplift(state.markets.length);
  const channelUplift = calculateChannelUplift(state.channels.length);
  const total = base + marketUplift + channelUplift;

  const update = (patch: Partial<BrandLiftSetupState>) =>
    onChange({ ...state, ...patch });

  const channelsGate = state.markets.length === 0;

  return (
    <motion.div
      key="brand-lift-section"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      className="mt-6 space-y-4"
    >
      {/* Pass 34 B2 — Brand name capture. Required. The question
          generator substitutes this into every funnel question; without
          it the model falls back to "this concept" / "the brand". */}
      <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
        <label className="block">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Focal brand name *
          </span>
          <input
            type="text"
            value={state.brand}
            onChange={(e) => update({ brand: e.target.value.slice(0, 80) })}
            placeholder="e.g. Aurora Coffee Co"
            className="mt-2 w-full bg-[var(--bg3)] border border-[var(--b1)] focus:border-[var(--lime)]/60 rounded-lg px-3 py-2 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] outline-none"
            maxLength={80}
            required
          />
          <span className="text-[11px] text-[var(--t3)] mt-1.5 block">
            Substituted into awareness, consideration, intent, and NPS questions.
          </span>
        </label>
      </div>

      <CreativeUploader
        userId={userId}
        value={state.creative}
        onChange={(creative) => update({ creative })}
      />

      <MarketPicker
        selected={state.markets}
        onChange={(markets) =>
          update({
            markets,
            channels: markets.length === 0 ? [] : state.channels,
          })
        }
      />

      {channelsGate ? (
        <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--t1)]">
            Campaign Channels
          </h3>
          <p className="text-xs text-[var(--t3)] mt-2">
            Select at least one market above to load the channel inventory.
          </p>
        </div>
      ) : (
        <ChannelPicker
          selected={state.channels}
          onChange={(channels) => update({ channels })}
          selectedMarkets={state.markets}
        />
      )}

      <WaveStructureSelector
        value={state.wave}
        onChange={(wave) => update({ wave })}
      />

      <CompetitorPicker
        selected={state.competitors}
        onChange={(competitors) => update({ competitors })}
      />

      <KPITemplatePicker
        value={state.kpiTemplate}
        onChange={(kpiTemplate) => update({ kpiTemplate })}
      />

      <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
              Estimated price
            </p>
            <p className="text-2xl font-display font-black text-white mt-1">
              ${total}
            </p>
          </div>
          <div className="text-[11px] text-[var(--t3)] font-body text-right">
            <p>
              <span className="text-[var(--t1)] font-semibold">${base}</span>{' '}
              base ({tier.name}, {state.respondentCount} respondents)
            </p>
            <p>
              + <span className="text-[var(--t1)] font-semibold">${marketUplift}</span>{' '}
              market uplift ({state.markets.length || 0})
            </p>
            <p>
              + <span className="text-[var(--t1)] font-semibold">${channelUplift}</span>{' '}
              channel uplift ({state.channels.length || 0})
            </p>
          </div>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!ready || submitting}
          className={[
            'w-full h-12 rounded-xl',
            'inline-flex items-center justify-center gap-2',
            'font-display font-black text-[14px] uppercase tracking-widest',
            'transition-colors',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            ready
              ? 'bg-lime text-black hover:bg-lime/90 shadow-lime-soft'
              : 'bg-lime/20 text-lime/70',
          ].join(' ')}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              <span>Generating…</span>
            </>
          ) : (
            <>
              <span aria-hidden>✦</span>
              <span>Generate Survey</span>
            </>
          )}
        </button>
        {!ready && (
          <p className="mt-2.5 text-center font-body text-[11px] text-t4">
            Add {missing.join(', ')} to continue.
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default BrandLiftSetupSection;
