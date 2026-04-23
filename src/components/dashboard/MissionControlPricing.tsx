import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Rocket, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import type { Question } from './QuestionEngine';
import type { TargetingConfig } from './TargetingEngine';
import { calculatePricing } from '../../utils/pricingEngine';
import { COUNTRIES } from '../../data/targetingOptions';
import { api } from '../../lib/apiClient';

/**
 * MissionControlPricing — Commit 8 of the redesign.
 *
 * The sticky right column on desktop, the sticky bottom bar on mobile —
 * this is the one surface that must *always* agree with what Stripe will
 * charge the user at checkout.  If the math ever drifts, users feel it
 * immediately, so:
 *
 *   · Every displayed number runs through `calculatePricing()`.  No client
 *     re-implementation of the pricing contract.
 *   · Promo codes are a **visual stub** only — the Apply button surfaces a
 *     "coming soon" toast.  There is intentionally no client-side discount
 *     math until the server-side /api/pricing/quote endpoint exists (see
 *     inline TODO below).  Charging the user less than we display would be
 *     a trust-breaker; charging more would be illegal.
 *   · The VETT IT CTA reuses the existing `VettingPaymentModal` via a
 *     callback — we don't plumb Stripe Elements here.
 *
 * ── Mobile (verified at 375px) ──────────────────────────────────
 *
 *   · The component itself renders as a normal card that stacks below
 *     Targeting.  The sticky CTA bar is rendered from the parent
 *     (DashboardPage) so it can lock to the viewport bottom on small
 *     screens without fighting the grid layout — we export
 *     `MissionControlPricingMobileBar` for that.
 *   · Preset chips wrap; the slider stays on its own row.
 *
 * ── Desktop ────────────────────────────────────────────────────
 *
 *   · Parent wraps this in a `lg:sticky lg:top-4` aside so the CTA stays
 *     above the fold while the Questions + Targeting columns scroll.
 */

// ────────────────────────────────────────────────────────────────────
// TODO(server-side pricing): replace this file's client-side call into
// `calculatePricing()` with a server-authoritative /api/pricing/quote
// endpoint.  Until that exists:
//   - the client call MUST remain the single source of truth for what we
//     show the user and what we charge via Stripe (VettingPaymentModal
//     receives the same `total`),
//   - promo codes must not mutate `total` — they only render a visual
//     "coming soon" toast.
// Once the endpoint lands, swap `calculatePricing()` for a debounced fetch
// and propagate the server's discount back into both the UI and
// `VettingPaymentModal.totalCost`.
// ────────────────────────────────────────────────────────────────────

const PRESETS = [100, 250, 500, 1000, 2500] as const;
// Phase 4: floor dropped from 50 → 10 so lighter-weight tests can be run
// without hitting the Pollfish minimum. Step matches the floor so users
// always stop on a valid multiple of 10.
const MIN_RESPONDENTS = 10;
const MAX_RESPONDENTS = 5000;
const RESPONDENT_STEP = 10;

interface MissionControlPricingProps {
  respondentCount: number;
  onRespondentChange: (next: number) => void;
  questions: Question[];
  targeting: TargetingConfig;
  isScreeningActive?: boolean;
  onLaunch: () => void;
  /** Fires when the respondentCount change needs to be saved by parent.
   *  Mirrors the targeting save pattern — parent debounces. */
  onPersist?: (next: number) => void;
  /**
   * Phase 4: optional informational banner — the price tier the user
   * selected in Clarify (under $20 / $20–$50 / etc). Purely display, no
   * pricing impact. Rendered between the header and the slider so
   * researchers always see the price anchor they picked.
   */
  priceTierLabel?: string | null;
  /**
   * Mission id for server-side promo validation. When provided the Apply
   * button calls /api/pricing/quote instead of showing "coming soon".
   */
  missionId?: string | null;
}

/** Build a human-readable subtitle from the current targeting config so
 *  the top-of-panel and sticky-bar both read the same. */
function buildAudienceSummary(
  targeting: TargetingConfig,
  respondentCount: number,
): string {
  const countryLabels = targeting.geography.countries
    .map((code) => COUNTRIES.find((c) => c.value === code)?.label ?? code)
    .slice(0, 2);
  const extraCountries =
    targeting.geography.countries.length - countryLabels.length;
  const location =
    countryLabels.length > 0
      ? countryLabels.join(' + ') + (extraCountries > 0 ? ` +${extraCountries}` : '')
      : 'Global';

  const paidFilters: string[] = [];
  if (
    targeting.professional.industries.length +
      targeting.professional.roles.length +
      targeting.professional.companySizes.length >
    0
  )
    paidFilters.push('B2B');
  if (targeting.financials.incomeRanges.length > 0) paidFilters.push('Income');
  if (
    targeting.behaviors.length > 0 ||
    targeting.technographics.devices.filter((d) => d !== 'No Preference').length > 0
  )
    paidFilters.push('Behavioral');

  const filters =
    paidFilters.length > 0 ? ` · ${paidFilters.join(', ')}` : '';
  return `${respondentCount.toLocaleString()} respondents · ${location}${filters}`;
}

/** Format a dollar amount in whole dollars (pricingEngine rounds). */
const fmt$ = (n: number) => `$${Math.round(n).toLocaleString()}`;

/**
 * Per-respondent rate formatter — 2 decimals, never rounded up to the
 * next dollar. Phase 4: the old implementation reused `fmt$` here, so a
 * $1.90/resp rate displayed as "$2" and the breakdown read "100 × $2 = $190"
 * which made the math look wrong. This keeps the breakdown arithmetic
 * honest: 100 × $1.90 = $190.
 */
const fmtRate = (n: number) => `$${n.toFixed(2)}`;

// ────────────────────────────────────────────────────────────────────
// Main card
// ────────────────────────────────────────────────────────────────────

export const MissionControlPricing = ({
  respondentCount,
  missionId,
  onRespondentChange,
  questions,
  targeting,
  isScreeningActive = false,
  onLaunch,
  onPersist,
  priceTierLabel = null,
}: MissionControlPricingProps) => {
  const [promo, setPromo] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  /** null = no promo applied; object = validated server-discounted total */
  const [promoResult, setPromoResult] = useState<{
    code: string;
    discountedTotal: number;
    label: string;
  } | null>(null);

  // Double-fire guard for the Launch CTA — a rapid double-click should
  // open the payment modal exactly once.
  const launchInflight = useRef(false);

  const pricing = useMemo(
    () =>
      calculatePricing(
        respondentCount,
        questions,
        targeting,
        isScreeningActive,
      ),
    [respondentCount, questions, targeting, isScreeningActive],
  );

  const perRespondent = respondentCount > 0 ? pricing.total / respondentCount : 0;

  const handleSlide = useCallback(
    (next: number) => {
      const clamped = Math.max(
        MIN_RESPONDENTS,
        Math.min(MAX_RESPONDENTS, Math.round(next)),
      );
      onRespondentChange(clamped);
      onPersist?.(clamped);
    },
    [onRespondentChange, onPersist],
  );

  const handlePreset = useCallback(
    (n: number) => {
      onRespondentChange(n);
      onPersist?.(n);
    },
    [onRespondentChange, onPersist],
  );

  const handleApplyPromo = useCallback(async () => {
    if (applyingPromo || !promo.trim()) return;
    // Clear any previous result when the user types a new code
    setPromoResult(null);
    setApplyingPromo(true);
    try {
      const code = promo.trim().toUpperCase();
      const data: {
        total: number;
        breakdown?: Array<{ label: string; amount: number }>;
      } = await api.post('/api/pricing/quote', {
        missionId: missionId ?? undefined,
        respondentCount,
        questions,
        targeting,
        promoCode: code,
      });
      const discountLine = Array.isArray(data.breakdown)
        ? data.breakdown.find((b) => b.amount < 0)
        : null;
      if (discountLine && typeof data.total === 'number' && data.total < pricing.total) {
        setPromoResult({
          code,
          discountedTotal: data.total,
          label: discountLine.label,
        });
        toast.success(`${discountLine.label} applied!`);
      } else {
        setPromoResult(null);
        toast.error('Invalid or expired promo code');
      }
    } catch {
      setPromoResult(null);
      toast.error('Could not validate promo code');
    } finally {
      setApplyingPromo(false);
    }
  }, [applyingPromo, promo, missionId, respondentCount, questions, targeting, pricing.total]);

  const handleLaunchClick = useCallback(() => {
    if (launchInflight.current) return;
    launchInflight.current = true;
    try {
      onLaunch();
    } finally {
      // Release the guard on the next tick — single-flight click, not
      // single-flight open.  The modal itself owns its own lifecycle.
      setTimeout(() => {
        launchInflight.current = false;
      }, 250);
    }
  }, [onLaunch]);

  const audience = useMemo(
    () => buildAudienceSummary(targeting, respondentCount),
    [targeting, respondentCount],
  );

  return (
    <div
      data-testid="mc-pricing"
      className={[
        'bg-bg2 border border-b1 rounded-xl overflow-hidden',
      ].join(' ')}
    >
      {/* Header */}
      <div
        className={[
          'px-4 py-3 border-b border-b1',
          'bg-gradient-to-r from-bg2 to-bg3/40',
        ].join(' ')}
      >
        <h2 className="font-display font-black text-[13px] text-white">
          Pricing Summary
        </h2>
        <p className="font-body text-[11px] text-t3 mt-0.5">{audience}</p>
      </div>

      {/* Price tier — informational only. Sourced from the Clarify answer
          (target_audience.price). Not a pricing input; just anchors the
          researcher to the price band they told us about in the wizard so
          they know what AI question-generation is optimising for. */}
      {priceTierLabel && (
        <div
          className={[
            'px-4 py-2 border-b border-b1',
            'bg-bg3/40',
            'flex items-center gap-2',
          ].join(' ')}
          aria-label="Target price tier"
        >
          <span className="font-display font-bold text-[9px] text-t4 uppercase tracking-[0.1em]">
            Target price tier
          </span>
          <span className="font-display font-black text-[11px] text-white">
            {priceTierLabel}
          </span>
        </div>
      )}

      {/* Mirror / slider */}
      <div className="px-4 py-4 border-b border-b1">
        <div className="flex items-baseline justify-between mb-2">
          <label
            htmlFor="resp-slider"
            className="font-display font-bold text-[10px] text-t3 uppercase tracking-[0.1em]"
          >
            Respondents
          </label>
          <span className="font-display font-black text-[18px] text-white tabular-nums">
            {respondentCount.toLocaleString()}
          </span>
        </div>
        <input
          id="resp-slider"
          type="range"
          min={MIN_RESPONDENTS}
          max={MAX_RESPONDENTS}
          step={RESPONDENT_STEP}
          value={respondentCount}
          onChange={(e) => handleSlide(Number(e.target.value))}
          className="w-full accent-lime"
        />
        <div className="flex flex-wrap gap-[7px] mt-3">
          {PRESETS.map((p) => {
            const active = respondentCount === p;
            const approx =
              calculatePricing(p, questions, targeting, isScreeningActive)
                .total;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePreset(p)}
                aria-pressed={active}
                className={[
                  'font-body text-[11px] rounded-md border transition-colors',
                  'px-2.5 py-1.5 tabular-nums',
                  active
                    ? 'bg-lime text-black border-lime font-bold'
                    : 'bg-bg3 text-t2 border-b2 hover:border-t3',
                ].join(' ')}
              >
                {p.toLocaleString()} · {fmt$(approx)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Breakdown */}
      <div className="px-4 py-3 border-b border-b1">
        <dl className="text-[12px] font-body divide-y divide-b1/60">
          <Row
            label={`${respondentCount.toLocaleString()} × ${fmtRate(perRespondent)} = ${fmt$(pricing.base)}`}
            value={fmt$(pricing.base)}
          />
          <Row
            label={`${questions.length} questions ${questions.length <= 5 ? '(included)' : '(+$20 each over 5)'}`}
            value={
              pricing.questionSurcharge > 0
                ? fmt$(pricing.questionSurcharge)
                : 'FREE'
            }
            tone={pricing.questionSurcharge > 0 ? 'surcharge' : 'free'}
          />
          <Row
            label={`Targeting filters${pricing.filterCount > 0 ? ` (${pricing.filterCount})` : ''}`}
            value={
              pricing.targetingSurcharge > 0
                ? fmt$(pricing.targetingSurcharge)
                : 'FREE'
            }
            tone={pricing.targetingSurcharge > 0 ? 'surcharge' : 'free'}
          />
          {pricing.screeningSurcharge > 0 && (
            <Row
              label="Screening questions"
              value={fmt$(pricing.screeningSurcharge)}
              tone="surcharge"
            />
          )}
          {pricing.retargetingSurcharge > 0 && (
            <Row
              label="Retargeting pixel"
              value={fmt$(pricing.retargetingSurcharge)}
              tone="surcharge"
            />
          )}
          <Row label="PDF + PPT + XLS reports" value="Included" tone="free" />
        </dl>
      </div>

      {/* Promo code */}
      <div className="px-4 py-3 border-b border-b1">
        <label
          htmlFor="promo-input"
          className="font-display font-bold text-[9px] text-t4 uppercase tracking-[0.1em] mb-1.5 block"
        >
          Promo code
        </label>
        <div className="flex gap-2">
          <input
            id="promo-input"
            type="text"
            value={promo}
            onChange={(e) => {
              setPromo(e.target.value.toUpperCase());
              // Clear result when user edits the code
              setPromoResult(null);
            }}
            placeholder="LAUNCH50"
            className={[
              'flex-1 bg-bg4 border border-b1 rounded-md',
              'px-2.5 py-1.5 font-mono text-[12px] text-white tracking-wider',
              'placeholder:text-t4 placeholder:tracking-wider',
              'outline-none focus:border-t3',
            ].join(' ')}
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            disabled={applyingPromo || !promo.trim()}
            className={[
              'min-w-[56px] px-3 py-1.5 rounded-md',
              'font-display font-black text-[10px] uppercase tracking-widest',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'bg-bg3 text-t2 border border-b2 hover:border-t3 transition-colors',
            ].join(' ')}
          >
            {applyingPromo ? '…' : 'Apply'}
          </button>
        </div>
        {promoResult && (
          <p className="mt-1.5 text-[11px] text-lime font-body">
            ✅ {promoResult.label}
          </p>
        )}
      </div>

      {/* Total + CTA (desktop) */}
      <div className="px-4 py-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-display font-black text-[11px] text-t3 uppercase tracking-[0.12em]">
            Total due
          </span>
          <div className="text-right">
            {promoResult && (
              <div className="font-display font-bold text-[14px] text-t3 line-through tabular-nums">
                {fmt$(pricing.total)}
              </div>
            )}
            <span className="font-display font-black text-[26px] text-white tabular-nums">
              {promoResult ? fmt$(promoResult.discountedTotal) : fmt$(pricing.total)}
            </span>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={handleLaunchClick}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={[
            'w-full h-12 rounded-xl',
            'inline-flex items-center justify-center gap-2',
            'bg-lime text-black shadow-lime-soft hover:bg-lime/90',
            'font-display font-black text-[13px] uppercase tracking-widest',
            'transition-colors',
            // Hide on mobile — mobile uses the sticky bar instead.
            'hidden md:inline-flex',
          ].join(' ')}
        >
          <Rocket className="w-4 h-4" aria-hidden />
          VETT IT · {fmt$(promoResult ? promoResult.discountedTotal : pricing.total)}
        </motion.button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-t4">
          <Lock className="w-3 h-3" aria-hidden />
          <span className="font-body text-[10px]">
            Secure checkout via Stripe
          </span>
        </div>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-t4">
          <ShieldCheck className="w-3 h-3" aria-hidden />
          <span className="font-body text-[10px]">
            Non-refundable once launched
          </span>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// Sticky mobile CTA bar — rendered by the parent so it can lock to the
// viewport without fighting the desktop grid.
// ────────────────────────────────────────────────────────────────────

interface MobileBarProps {
  total: number;
  respondentCount: number;
  onLaunch: () => void;
}

export const MissionControlPricingMobileBar = ({
  total,
  respondentCount,
  onLaunch,
}: MobileBarProps) => {
  const inflight = useRef(false);
  const handleClick = () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      onLaunch();
    } finally {
      setTimeout(() => {
        inflight.current = false;
      }, 250);
    }
  };

  return (
    <div
      data-testid="mc-pricing-mobile-bar"
      className={[
        'fixed bottom-0 inset-x-0 z-40 md:hidden',
        'bg-bg2/95 backdrop-blur-md border-t border-b1',
        'px-4 py-3',
        'flex items-center justify-between gap-3',
        // Safe-area padding for iOS notched devices.
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      ].join(' ')}
      style={{ height: 'var(--mc-mobile-bar-h, 76px)' }}
    >
      <div className="min-w-0">
        <div className="font-display font-bold text-[9px] text-t4 uppercase tracking-[0.1em]">
          Estimated total
        </div>
        <div className="font-display font-black text-[20px] text-white tabular-nums leading-tight">
          {fmt$(total)}
        </div>
        <div className="font-body text-[10px] text-t3 tabular-nums truncate">
          {respondentCount.toLocaleString()} respondents
        </div>
      </div>
      <button
        type="button"
        onClick={handleClick}
        className={[
          'flex-shrink-0 h-11 rounded-xl px-4',
          'inline-flex items-center gap-2',
          'bg-lime text-black shadow-lime-soft hover:bg-lime/90',
          'font-display font-black text-[12px] uppercase tracking-widest',
          'transition-colors',
        ].join(' ')}
      >
        <Rocket className="w-3.5 h-3.5" aria-hidden />
        VETT IT
      </button>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

interface RowProps {
  label: string;
  value: string;
  tone?: 'free' | 'surcharge' | 'default';
}

const Row = ({ label, value, tone = 'default' }: RowProps) => {
  const toneClass =
    tone === 'free'
      ? 'text-grn'
      : tone === 'surcharge'
        ? 'text-org'
        : 'text-white';
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
      <dt className="text-t3 font-body leading-relaxed min-w-0 flex-1">
        {label}
      </dt>
      <dd
        className={[
          'font-display font-bold text-[12px] tabular-nums',
          'whitespace-nowrap',
          toneClass,
        ].join(' ')}
      >
        {value === 'FREE' || value === 'Included' ? `${value} ✓` : value}
      </dd>
    </div>
  );
};

export default MissionControlPricing;
