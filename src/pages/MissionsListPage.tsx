import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Zap, Plus, BarChart3, Clock, Users, ArrowRight, Trash2, Eye, X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/apiClient';
import { VOLUME_TIERS } from '../utils/pricingEngine';
import { LeadCaptureForm } from '../components/marketing/LeadCaptureForm';
import { deliveryNoun } from '../lib/missionDeliveryUnit';
// Pass 42 G3 — user-friendly error copy. Internal logs keep the
// technical message; user-visible surfaces show the mapped version.
import { userFacingError } from '../lib/errorCopy';

// Pass 33 W7 — site-wide Ask VETT now mounted in App.tsx; per-page
// ChatWidget removed from this route to avoid double-mount.

const BANNER_DISMISSED_KEY = 'vett_dashboard_banner_dismissed';

/**
 * Shape aligned with `public.missions` columns. The legacy backend shim used
 * to return {context, target, estimated_price} — we now mirror the DB names
 * (`brief`, `target_audience`, `price_estimated`, `title`) and accept the old
 * names as optional fallbacks so a not-yet-redeployed backend keeps rendering
 * instead of showing "Untitled Mission" / "$undefined".
 */
interface Mission {
  id: string;
  title?: string | null;
  brief?: string | null;
  target_audience?: unknown;
  status: string;
  goal_type?: string | null;
  // Pass 32 X2 — drives the noun in mission-card labels (respondent vs creative).
  delivery_unit?: 'respondent' | 'creative_asset' | null;
  respondent_count: number;
  /** Actual collected responses (from mission_responses join). */
  responses_collected?: number;
  // Pass 21 Bug 5/6: persisted qualification aggregates.
  total_simulated_count?: number | null;
  qualified_respondent_count?: number | null;
  qualification_rate?: number | null;
  // Pass 23 Bug 23.25: delivery integrity. 'partial' triggers a badge on
  // completed missions; 'full' renders nothing (the green completed pill
  // is enough). null on legacy rows pre-backfill.
  delivery_status?: 'full' | 'partial' | 'screener_too_restrictive' | null;
  price_estimated?: number | null;
  // Pass 21 Bug 8: actual paid price (set at checkout). For any mission past
  // the draft stage, this is the truth — `price_estimated` is just the
  // pre-checkout quote and may not match what was charged.
  total_price_usd?: number | string | null;
  created_at: string;
  // Pass 36 A0e — paid_at drives the dynamic ETA label on in-flight cards.
  paid_at?: string | null;
  // Pass 37 A2 — delivered count surfaced on completed mission cards.
  delivered_respondent_count?: number | null;
  questions: unknown[];
  // Legacy backend field names — kept optional for graceful fallback.
  context?: string;
  target?: string;
  estimated_price?: number;
  // Pass 23 Bug 23.80: auto-refund + failure metadata
  partial_refund_id?: string | null;
  partial_refund_amount_cents?: number | null;
  failure_reason?: string | null;
}

// Pass 37 A6 — MOCK_MISSIONS removed. The anonymous /dashboard used to
// render 3 fake mission cards (Meal Planning, Sustainable Sneakers,
// Premium Coffee Subscription) that looked like real user data but
// would 404 on click. Anonymous visitors now bounce to /signin so the
// page never lies about what's there.

/** target_audience is jsonb — could be a string (legacy) or { segments, ... } */
function formatTarget(mission: Mission): string {
  const ta = mission.target_audience;
  if (typeof ta === 'string' && ta.trim()) return ta;
  if (ta && typeof ta === 'object') {
    const asRec = ta as Record<string, unknown>;
    if (typeof asRec.summary === 'string') return asRec.summary;
    if (Array.isArray(asRec.segments) && asRec.segments.length > 0) {
      return asRec.segments.filter((s) => typeof s === 'string').join(', ') || 'General audience';
    }
  }
  // Legacy backend shim
  if (mission.target) return mission.target;
  return 'General audience';
}

export const MissionsListPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  // Pass 37 A6 — showAuthModal removed. Anonymous users now bounce to
  // /signin in useEffect; no inline auth modal needed.
  const [bannerVisible, setBannerVisible] = useState(
    () => !sessionStorage.getItem(BANNER_DISMISSED_KEY)
  );

  const dismissBanner = () => {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
    setBannerVisible(false);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Pass 37 A6 — anonymous /dashboard bounces to /signin. The old
        // path mounted MOCK_MISSIONS cards that looked like real data
        // but 404'd on click. ?redirect=/dashboard lands the user back
        // here with their actual missions after auth (matches the
        // SignInPage `redirectPath` convention).
        navigate('/signin?redirect=/dashboard', { replace: true });
        return;
      }
      fetchMissions();
    }
  }, [user, authLoading, navigate]);

  // Pass 36 A0e — keep mission cards live for in-flight missions.
  // Refetch on window focus (tab switch + return) so a customer who
  // came back to the dashboard after a mission completed sees the
  // status flip immediately. Light poll while any card is in-flight.
  useEffect(() => {
    if (!user) return;
    const inFlight = missions.some((m) => {
      const s = (m.status || '').toUpperCase();
      return s === 'PENDING_PAYMENT' || s === 'PENDING' || s === 'PROCESSING' ||
        s === 'ACTIVE' || s === 'IN_PROGRESS';
    });
    // Pass 39 A-CONT-3 — focus + interval refetches now run in background
    // mode (no skeleton flicker). Users tab-switching frequently no longer
    // see the dashboard reset to the skeleton on every return.
    const onFocus = () => fetchMissions({ background: true });
    window.addEventListener('focus', onFocus);
    let interval: ReturnType<typeof setInterval> | null = null;
    if (inFlight) {
      interval = setInterval(() => fetchMissions({ background: true }), 15000);
    }
    return () => {
      window.removeEventListener('focus', onFocus);
      if (interval) clearInterval(interval);
    };
  }, [user, missions]);

  // Pass 36 A4 — surface fetch errors instead of falling through to
  // empty state. The dashboard previously rendered "No missions yet"
  // whether the user genuinely had none OR the API failed; users
  // couldn't tell which. With an error string surfaced, the empty
  // state CTA changes to "Try again" so the user can recover.
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Pass 39 A-CONT-3 — distinguish initial load from background refresh.
  // Pre-Pass-39: every fetchMissions() call (initial mount AND window
  // focus AND in-flight poll) flipped `loading=true`, which dumped the
  // user back into the skeleton view for the API's 200-800ms window.
  // For users who tab-switched frequently, the dashboard flickered to
  // skeleton on every return. Now the initial mount keeps the existing
  // `loading=true` seed; background refreshes pass `{background: true}`
  // which leaves `loading` alone and just updates `missions` in place.
  const fetchMissions = async ({ background = false }: { background?: boolean } = {}) => {
    try {
      if (!background) setLoading(true);
      setFetchError(null);
      const data = await api.get('/api/missions');
      const realMissions = Array.isArray(data) ? data : [];
      setMissions(realMissions);
    } catch (error) {
      console.error('Error fetching missions:', error);
      // Background refetch failures don't clobber existing missions
      // (better to show stale data than a "Try again" page during a
      // transient network blip).
      if (!background) {
        // Pass 42 G3 — surface user-friendly copy in the visible
        // error state. Original error.message stays in the
        // console.error above for internal debugging.
        setFetchError(userFacingError(error));
        setMissions([]);
      }
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleDeleteMission = async (missionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this mission?')) return;

    try {
      await api.delete(`/api/missions/${missionId}`);
      setMissions(missions.filter(m => m.id !== missionId));
    } catch (error) {
      console.error('Error deleting mission:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'COMPLETED':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'DRAFT':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Live';
      case 'COMPLETED':
        return 'Completed';
      case 'DRAFT':
        return 'Draft';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getMissionTitle = (mission: Mission) => {
    // Prefer canonical DB columns (`title`, `brief`); fall back to the legacy
    // backend-shim names (`context`) so a not-yet-redeployed backend keeps
    // rendering something readable.
    return mission.title || mission.brief || mission.context || 'Untitled Mission';
  };

  /**
   * Pass 21 Bug 6 (Option B) + Pass 32 X2b: mission-card respondent label.
   *
   * delivery_unit reads from missions.delivery_unit (Pass 32 X2 backend);
   * Creative Attention missions render "1 creative analyzed" instead of
   * the misleading "1 respondent" the dashboard used to show even though
   * mission_responses had 0 rows.
   *
   *   DRAFT          → "{respondent_count} {noun}"   (no slash, no rate)
   *   COMPLETED mixed→ "{total} {noun} · {rate}% qualified"
   *   COMPLETED full → "{total} {noun}"             (rate >= 99.9%)
   *   ACTIVE/other   → "{collected}/{target} {noun}" — preserved live-progress UI
   */
  const getRespondentProgress = (mission: Mission) => {
    const statusUp = (mission.status || '').toUpperCase();
    const target   = mission.respondent_count || 0;
    const noun     = deliveryNoun(mission as { delivery_unit?: string | null; goal_type?: string | null });

    if (statusUp === 'COMPLETED') {
      // Pass 37 A2 — read delivered_respondent_count first (the Pass
      // 36 A0 truth: COUNT(DISTINCT persona_id)). total_simulated_count
      // is the pre-screener count and could be higher; the customer
      // cares about how many actually contributed responses.
      const delivered = Number(
        (mission as { delivered_respondent_count?: number | null }).delivered_respondent_count ?? 0,
      );
      const total = delivered || Number(mission.total_simulated_count ?? target) || target;
      const rate  = mission.qualification_rate;
      const showRate = rate != null && Number.isFinite(rate) && rate < 0.999;
      return showRate
        ? `${total} ${noun} delivered · ${Math.round(Number(rate) * 100)}% qualified`
        : `${total} ${noun} delivered`;
    }

    if (statusUp === 'DRAFT') {
      return `${target} ${noun}`;
    }

    // Active or other in-progress states: keep the live progress format.
    const actual = mission.responses_collected ?? 0;
    return `${actual}/${target} ${noun}`;
  };

  /**
   * Pass 21 Bug 8: card price label.
   *
   *   DRAFT          → price_estimated (pre-checkout quote — nothing has been charged)
   *   anything else  → total_price_usd (what the user actually paid)
   *                    fall back to price_estimated only if paid is missing
   *
   * Forensic: 3/6 completed missions have paid ≠ estimated (e.g. $9 paid vs
   * $35 estimated after promo discount). The card was overstating spend by
   * up to 4× because it always read price_estimated.
   */
  const getMissionPriceLabel = (mission: Mission): string => {
    const statusUp = (mission.status || '').toUpperCase();
    const estimated = Number(mission.price_estimated ?? mission.estimated_price ?? 0);
    if (statusUp === 'DRAFT') return `$${estimated || 0}`;
    const paid = mission.total_price_usd != null ? Number(mission.total_price_usd) : NaN;
    if (Number.isFinite(paid) && paid > 0) {
      // Strip trailing .00 for whole-dollar amounts; keep cents otherwise.
      return Number.isInteger(paid) ? `$${paid}` : `$${paid.toFixed(2)}`;
    }
    return `$${estimated || 0}`;
  };

  const getEstimatedTime = (mission: Mission) => {
    // Pass 32 X8 — case-insensitive status comparison. The DB stores
    // 'completed' lowercase; the legacy uppercase comparison silently
    // fell through and showed "12-24h" on completed missions.
    //
    // Pass 36 A0e — replace static "4-12h" / "12-24h" hardcoded ETAs
    // with stage-aware dynamic labels. May 11 demo: card said
    // "4-12 hours" for 4 hours while DB had status=completed. The
    // hardcoded text was technically accurate as a worst-case
    // ceiling but actively misleading for a 5-15 min mission.
    const statusUp = (mission.status || '').toUpperCase();
    if (statusUp === 'COMPLETED') return 'Completed';
    if (statusUp === 'FAILED')    return 'Failed';
    if (statusUp === 'DRAFT')     return 'Not launched';
    if (statusUp === 'PENDING_PAYMENT' || statusUp === 'PENDING') {
      return 'Awaiting payment';
    }
    // In-flight: use elapsed-time heuristic per goal_type.
    const paidIso = mission.paid_at ?? mission.created_at;
    if (!paidIso) return 'Processing…';
    const minutes = (Date.now() - new Date(paidIso).getTime()) / 60000;
    if (minutes < 2) return 'Generating questions…';
    if (minutes < 8) return 'Personas responding…';
    if (minutes < 15) return 'Computing insights…';
    return 'Almost done…';
  };

  /**
   * Pass 32 X8 — Dashboard View Results gate. The DB stores statuses
   * lowercase ('completed' / 'paid' / 'processing' / 'failed' / 'draft'),
   * but the previous comparison checked uppercase strings ('COMPLETED'
   * etc.). Real completed missions fell through to /dashboard/:id,
   * which then redirected to /results/:id — but the brief flash and
   * occasional race produced an apparent 404 for users.
   *
   * Routing rule: anything past DRAFT goes straight to /results/:id;
   * DRAFT goes to the editor (/dashboard/:id, where DashboardPage
   * also lives for in-progress edits).
   */
  const handleMissionClick = (mission: Mission) => {
    const statusUp = (mission.status || '').toUpperCase();
    if (statusUp === 'DRAFT') {
      navigate(`/dashboard/${mission.id}`);
    } else if (statusUp === 'PENDING_PAYMENT' || statusUp === 'PENDING') {
      // Pass 37 A4 — PENDING_PAYMENT mission: route back into Mission
      // Control with ?action=pay so DashboardPage auto-triggers the
      // Stripe checkout redirect. Previously these cards routed to
      // /results/:id and rendered the empty/failed results UI — a
      // user with a payment failure had no path back to retry.
      navigate(`/dashboard/${mission.id}?action=pay`);
    } else {
      navigate(`/results/${mission.id}`);
    }
  };

  // Pass 21 Bug 15: replaced the centered spinner with skeleton cards
  // that mirror the actual mission card layout (status pill, title, target
  // line, two metric rows, footer with price + CTA). The previous centered
  // spinner gave no preview of the page structure — users on slow networks
  // saw a blank page for ~600ms before everything popped in. The skeleton
  // mirrors the real grid (1/2/3 cols at sm/md/lg) so when results land
  // there's no layout shift.
  //
  // Pass 39 A-CONT-1 — defensive guard for the sign-out-while-on-
  // /dashboard race. The useEffect above fires navigate('/signin')
  // when user becomes null, but React renders the rest of the
  // component once before the navigation completes. Without this
  // guard, missions state (real or stale) would flash for ~1 frame
  // before the redirect. Returning the skeleton here keeps the
  // brand canvas visible during the transition.
  if (!authLoading && !user) {
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] bg-[#0B0C15]" />
      </DashboardLayout>
    );
  }

  // Pass 37 A9 — skeleton background now uses the brand canvas `#0B0C15`
  // (matches PageLoader and main render below) instead of the
  // `bg-gradient-to-br from-gray-950 via-black to-gray-900` gradient.
  // The gradient flashed a near-pure-black during the brief moment
  // before the gray-on-black skeleton tiles painted, causing a visible
  // brand-color shift between PageLoader (#0B0C15) → skeleton (black)
  // → loaded page. Solid brand canvas = single paint frame.
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] bg-[#0B0C15]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-row items-center justify-between">
                <div className="h-9 md:h-14 w-44 md:w-72 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-10 md:h-12 w-32 md:w-44 bg-white/5 rounded-xl animate-pulse" />
              </div>
              <div className="h-4 w-40 bg-white/5 rounded-md animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-7 w-20 bg-white/10 rounded-lg" />
                  </div>
                  <div className="h-6 w-3/4 bg-white/10 rounded mb-2" />
                  <div className="h-6 w-2/3 bg-white/10 rounded mb-4" />
                  <div className="h-3 w-1/2 bg-white/5 rounded mb-5" />
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-white/10 rounded" />
                      <div className="h-3 w-32 bg-white/10 rounded" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-white/10 rounded" />
                      <div className="h-3 w-24 bg-white/10 rounded" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/5 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="h-7 w-16 bg-white/10 rounded" />
                      <div className="h-4 w-20 bg-white/10 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <span className="sr-only" role="status" aria-live="polite">
              Loading your missions…
            </span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Pass 37 A9 — brand canvas (#0B0C15) replaces the previous
          gradient so the skeleton/loaded transition is single-frame. */}
      <div className="min-h-[100dvh] bg-[#0B0C15]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-row items-center justify-between">
              <h1 className="text-2xl md:text-6xl font-black tracking-tighter text-white">
                My Missions
              </h1>
              <button
                onClick={() => navigate('/setup')}
                className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-neon-lime to-primary text-gray-900 hover:scale-105 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all shadow-lg shadow-primary/30 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                New Mission
              </button>
            </div>
            <p className="text-white/60 text-sm md:text-base">
              {missions.length === 0
                ? 'Create your first mission to get started'
                : `${missions.length} ${missions.length === 1 ? 'mission' : 'missions'} total`}
            </p>
          </div>

          {/* Early-access banner — show for authenticated users with no completed missions */}
          <AnimatePresence>
            {user && bannerVisible && !missions.some(m => m.status === 'COMPLETED') && (
              <motion.div
                key="dashboard-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="relative mb-6 rounded-2xl border border-lime/20 bg-lime/5 px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <button
                  onClick={dismissBanner}
                  aria-label="Dismiss"
                  className="absolute top-3 right-3 p-1 text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 flex-1">
                  <Sparkles className="w-5 h-5 text-lime shrink-0" />
                  <div>
                    <p className="text-white font-bold text-[14px] leading-tight">Ship faster with VETT Pro</p>
                    <p className="text-white/50 text-[12px] mt-0.5">Unlimited missions, priority synthesis, and team sharing - coming soon.</p>
                  </div>
                </div>
                <LeadCaptureForm
                  cta="Join waitlist"
                  page="dashboard_banner"
                  placeholder="your@email.com"
                  variant="inline"
                  className="shrink-0 sm:w-auto w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {fetchError ? (
            // Pass 36 A4 — fetch failure: distinct from "empty state" so
            // the user can retry instead of being told "no missions yet".
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-red-500/5 to-red-500/[0.02] border border-red-500/30 rounded-3xl p-8 md:p-12 text-center backdrop-blur-xl"
            >
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                Couldn&apos;t load your missions
              </h2>
              {/* Pass 42 G3 — strip font-mono; the error string is
                  now user-friendly copy (errorCopy.userFacingError),
                  not a raw exception. */}
              <p className="text-white/60 mb-6 text-sm">{fetchError}</p>
              <button
                type="button"
                onClick={fetchMissions}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Try again
              </button>
            </motion.div>
          ) : missions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-12 text-center backdrop-blur-xl"
            >
              <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3">
                <Zap className="w-10 h-10 text-primary" fill="currentColor" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                Ready to validate your idea?
              </h2>
              <p className="text-white/60 text-base md:text-lg mb-6 max-w-md mx-auto">
                Launch your first mission to get real feedback from your target audience in hours, not weeks.
                Pay per mission. Every respondent matches your audience.
              </p>
              <button
                onClick={() => navigate('/setup')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-lime to-primary text-gray-900 rounded-xl font-black text-base hover:scale-105 transition-transform shadow-2xl shadow-neon-lime/30"
              >
                <Plus className="w-5 h-5" />
                Create Your First Mission
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Pass 23 Bug 23.31 — tier-shortcut row. Lets new users see
                  the 4 packages at a glance and click straight into setup
                  with a tier in mind. Uses the canonical VOLUME_TIERS from
                  pricingEngine so this stays in sync with the landing
                  pricing teaser and the Mission Setup slider markers. */}
              <div className="mt-10 pt-8 border-t border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-4">
                  Or pick a depth
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mx-auto">
                  {VOLUME_TIERS.map((tier) => {
                    const isPopular = tier.id === 'validate';
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => navigate('/setup')}
                        className={[
                          'relative flex flex-col items-center justify-center gap-1',
                          'px-3 py-3 rounded-lg border transition-colors',
                          'hover:border-primary/40 hover:bg-white/5',
                          isPopular
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-white/10 bg-white/[0.02]',
                        ].join(' ')}
                        aria-label={`Start a ${tier.name} mission (${tier.anchorCount} respondents, $${tier.packagePrice})`}
                      >
                        {isPopular && (
                          <span
                            aria-hidden
                            className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-primary text-gray-900 text-[8px] font-black uppercase tracking-wider whitespace-nowrap"
                          >
                            Popular
                          </span>
                        )}
                        <span className="text-white text-sm font-bold">{tier.name}</span>
                        <span className="text-primary text-base font-black tabular-nums">${tier.packagePrice}</span>
                        <span className="text-white/50 text-[10px]">{tier.anchorCount} respondents</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missions.map((mission, index) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  // Pass 39 A-CONT-3 — cap stagger delay at 0.5s. With the
                  // unbounded `index * 0.1` a user with 50 missions saw the
                  // last card fade in at 5s (the "5-6s dimmed cards"
                  // symptom in the live audit). Capping at 500ms means the
                  // whole grid is visible within half a second regardless
                  // of count, while preserving the first-row stagger as
                  // visual delight.
                  transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.2 }}
                  onClick={() => handleMissionClick(mission)}
                  className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all cursor-pointer group backdrop-blur-xl relative h-full flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusColor(mission.status)}`}>
                        {mission.status === 'ACTIVE' && (
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {getStatusText(mission.status)}
                        </span>
                      </div>
                      {/* Pass 23 Bug 23.25 — partial-delivery badge. Only on
                          completed missions where delivery_status='partial'.
                          'full' renders nothing (the green completed pill is
                          enough). */}
                      {/* Pass 44 — "refund issued" claim removed (NO
                          REFUNDS policy, Terms §5.3). Partial delivery
                          means the screener was strict; the badge now
                          states that honestly without asserting a
                          refund that doesn't exist. */}
                      {(mission.status || '').toUpperCase() === 'COMPLETED'
                        && mission.delivery_status === 'partial' && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                            Partial · strict screener
                          </span>
                        </div>
                      )}
                    </div>
                    {mission.status === 'DRAFT' && (
                      <button
                        onClick={(e) => handleDeleteMission(mission.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                        title="Delete mission"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                    {getMissionTitle(mission)}
                  </h3>

                  <p className="text-white/50 text-sm mb-4 line-clamp-1">
                    Target: {formatTarget(mission)}
                  </p>

                  <div className="space-y-4 mb-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="w-4 h-4 text-white/40" />
                      <span className="text-white/70">
                        {/* Pass 21 Bug 6: helper now returns the full label
                            including the word "respondents" so we can vary
                            it per status (drafts vs completed vs active). */}
                        {getRespondentProgress(mission)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-white/40" />
                      <span className="text-white/70">
                        {getEstimatedTime(mission)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-white">
                        {/* Pass 21 Bug 8: prefer total_price_usd (actually
                            charged) for non-draft missions; price_estimated
                            is just the pre-checkout quote and may diverge
                            from the final charge by up to 4× after promos. */}
                        {getMissionPriceLabel(mission)}
                      </span>
                      {/* Pass 37 A4 — status-driven CTA. PENDING_PAYMENT
                          gets a payment-recovery CTA (was silently routing
                          to /results/:id which rendered an empty page). */}
                      {(() => {
                        const statusUp = (mission.status || '').toUpperCase();
                        if (statusUp === 'DRAFT') {
                          return (
                            <div className="flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
                              <span className="text-sm font-bold">Edit</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          );
                        }
                        if (statusUp === 'PENDING_PAYMENT' || statusUp === 'PENDING') {
                          return (
                            <div className="flex items-center gap-2 text-amber-300 group-hover:translate-x-1 transition-transform">
                              <span className="text-sm font-bold">Complete Payment</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-bold">View Results</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        </div>
      </div>

      {/* Pass 33 W7 — Ask VETT moved to App-level SiteWideAskVett mount.
          The per-page ChatWidget here was duplicating the site-wide
          floating chat. The dashboard scope still applies (matches the
          /missions context). */}
    </DashboardLayout>
  );
};
