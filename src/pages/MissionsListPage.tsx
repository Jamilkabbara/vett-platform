import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Zap, Plus, BarChart3, Clock, Users, ArrowRight, Trash2, Eye, X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/apiClient';
import { ChatWidget } from '../components/chat/ChatWidget';
import { LeadCaptureForm } from '../components/marketing/LeadCaptureForm';

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
  respondent_count: number;
  /** Actual collected responses (from mission_responses join). */
  responses_collected?: number;
  // Pass 21 Bug 5/6: persisted qualification aggregates.
  total_simulated_count?: number | null;
  qualified_respondent_count?: number | null;
  qualification_rate?: number | null;
  price_estimated?: number | null;
  // Pass 21 Bug 8: actual paid price (set at checkout). For any mission past
  // the draft stage, this is the truth — `price_estimated` is just the
  // pre-checkout quote and may not match what was charged.
  total_price_usd?: number | string | null;
  created_at: string;
  questions: unknown[];
  // Legacy backend field names — kept optional for graceful fallback.
  context?: string;
  target?: string;
  estimated_price?: number;
}

const MOCK_MISSIONS: Mission[] = [
  {
    id: 'mock-active-1',
    title: 'AI-powered meal planning app for busy professionals',
    brief: 'AI-powered meal planning app for busy professionals',
    target_audience: 'Working professionals aged 25-45',
    status: 'ACTIVE',
    respondent_count: 150,
    price_estimated: 249,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    questions: []
  },
  {
    id: 'mock-draft-1',
    title: 'Sustainable sneaker brand with recycled materials',
    brief: 'Sustainable sneaker brand with recycled materials',
    target_audience: 'Eco-conscious millennials and Gen Z',
    status: 'DRAFT',
    respondent_count: 100,
    price_estimated: 149,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    questions: []
  },
  {
    id: 'mock-completed-1',
    title: 'Premium coffee subscription service',
    brief: 'Premium coffee subscription service',
    target_audience: 'Coffee enthusiasts with $75k+ household income',
    status: 'COMPLETED',
    respondent_count: 200,
    price_estimated: 299,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    questions: []
  }
];

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
  const [showAuthModal, setShowAuthModal] = useState(false);
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
        setMissions(MOCK_MISSIONS);
        setLoading(false);
      } else {
        fetchMissions();
      }
    }
  }, [user, authLoading]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/missions');
      const realMissions = Array.isArray(data) ? data : [];
      // Always show real data for authenticated users — empty array shows the empty state CTA
      setMissions(realMissions);
    } catch (error) {
      console.error('Error fetching missions:', error);
      // On error, show empty state rather than fake missions
      setMissions([]);
    } finally {
      setLoading(false);
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
   * Pass 21 Bug 6 (Option B): mission-card respondent label.
   *
   *   DRAFT          → "{respondent_count} respondents"   (no slash, no rate)
   *   COMPLETED mixed→ "{total} respondents · {rate}% qualified"
   *   COMPLETED full → "{total} respondents"             (rate >= 99.9%)
   *   ACTIVE/other   → "{collected}/{target}" — preserved live-progress UI
   */
  const getRespondentProgress = (mission: Mission) => {
    const statusUp = (mission.status || '').toUpperCase();
    const target   = mission.respondent_count || 0;

    if (statusUp === 'COMPLETED') {
      const total = Number(mission.total_simulated_count ?? target) || target;
      const rate  = mission.qualification_rate;
      const showRate = rate != null && Number.isFinite(rate) && rate < 0.999;
      return showRate
        ? `${total} respondents · ${Math.round(Number(rate) * 100)}% qualified`
        : `${total} respondents`;
    }

    if (statusUp === 'DRAFT') {
      return `${target} respondents`;
    }

    // Active or other in-progress states: keep the live progress format.
    const actual = mission.responses_collected ?? 0;
    return `${actual}/${target} respondents`;
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
    if (mission.status === 'COMPLETED') return 'Completed';
    if (mission.status === 'DRAFT') return 'Not launched';
    return mission.respondent_count > 500 ? '12-24h' : '4-12h';
  };

  const handleMissionClick = (mission: Mission) => {
    if (mission.status === 'ACTIVE' || mission.status === 'COMPLETED') {
      navigate(`/results/${mission.id}`);
    } else {
      navigate(`/dashboard/${mission.id}`);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-24">
            <div className="flex items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900">
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
                    <p className="text-white/50 text-[12px] mt-0.5">Unlimited missions, priority synthesis, and team sharing — coming soon.</p>
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

          {missions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl"
            >
              <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3">
                <Zap className="w-10 h-10 text-primary" fill="currentColor" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                Ready to validate your idea?
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
                Launch your first mission to get real feedback from your target audience in hours, not weeks.
              </p>
              <button
                onClick={() => navigate('/setup')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-lime to-primary text-gray-900 rounded-xl font-black text-base hover:scale-105 transition-transform shadow-2xl shadow-neon-lime/30"
              >
                <Plus className="w-5 h-5" />
                Create Your First Mission
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missions.map((mission, index) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleMissionClick(mission)}
                  className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all cursor-pointer group backdrop-blur-xl relative h-full flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusColor(mission.status)}`}>
                      {mission.status === 'ACTIVE' && (
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      )}
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {getStatusText(mission.status)}
                      </span>
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
                      <div className="flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
                        {mission.status === 'DRAFT' ? (
                          <>
                            <span className="text-sm font-bold">Edit</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-bold">View Results</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        </div>
      </div>

      {user && <ChatWidget scope="dashboard" />}
    </DashboardLayout>
  );
};
