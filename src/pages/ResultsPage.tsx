import { useEffect, useState, useRef, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { MissionFailureCard } from '../components/shared/MissionFailureCard';
import { ShareButton, ExecutiveSummary, AIInsight, TensionCard, SegmentedControl, RecommendedNextStep, CategoryGroup, type Contradiction } from '../components/results';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileJson,
  Users,
  Clock,
  Filter,
  AlertCircle,
  MessageSquare,
  FileDown,
  Bot,
  Target
} from 'lucide-react';
// Pass 22 Bug 22.28 — lazy ChatWidget. react-markdown (~30KB gz) + chat
// state machinery only load when the user opens the chat for the first
// time on /results.
const ChatWidget = lazy(() =>
  import('../components/chat/ChatWidget').then(m => ({ default: m.ChatWidget })),
);
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

type ExportFormat = 'pdf' | 'xlsx' | 'pptx' | 'raw';

const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

// Map backend question types → frontend types
function mapQuestionType(t: string): QuestionResult['type'] {
  switch (t) {
    case 'multi':
    case 'multi_select':
      return 'multi_select';
    case 'rating':
      return 'rating';
    case 'text':
    case 'open_text':
      return 'open_text';
    case 'single':
    case 'opinion':
    case 'single_choice':
    default:
      return 'single_choice';
  }
}

interface ToastState {
  show: boolean;
  message: string;
  subtext: string;
  isGenerating: boolean;
}

interface QuestionResult {
  id: string;
  question: string;
  type: 'single_choice' | 'multi_select' | 'rating' | 'open_text';
  data: any[];
  aiInsight: string;
  sentiment?: number;
  averageScore?: number;
  verbatims?: string[];
  // Pass 22 Bug 22.17 — confidence interval fields for rating questions.
  // Backend insights.aggregate computes these; null if n<2.
  ci_low?: number;
  ci_high?: number;
  stddev?: number;
  rating_n?: number;
  // Pass 23 Bug 23.56 — Brand Lift category framework. Tagged on
  // brand_lift goal_type missions only (claudeAI.js system prompt
  // emits the field for every question on those missions). Used by
  // the per-question card to surface a small category pill so users
  // see "this Q measures Aided Recall" / "this Q measures Purchase
  // Intent" without parsing the question text.
  category?:
    | 'brand_recall_unaided'
    | 'brand_recall_aided'
    | 'brand_attribution'
    | 'brand_awareness'
    | 'message_association'
    | 'brand_favorability'
    | 'purchase_intent'
    | 'recommendation_intent'
    | 'ad_recall';
}

// Pass 23 Bug 23.56 — humanized labels for the Brand Lift question
// categories. Used by the small category pill on each per-Q card.
export const BRAND_LIFT_CATEGORY_LABEL: Record<string, string> = {
  brand_recall_unaided:  'Brand Recall (Unaided)',
  brand_recall_aided:    'Brand Recall (Aided)',
  brand_attribution:     'Brand Attribution',
  brand_awareness:       'Brand Awareness',
  message_association:   'Message Association',
  brand_favorability:    'Brand Favorability',
  purchase_intent:       'Purchase Intent',
  recommendation_intent: 'Recommendation Intent (NPS)',
  ad_recall:             'Ad Recall',
};

interface FilterOption {
  label: string;
  value: string;
}

interface DemographicFilter {
  name: string;
  options: FilterOption[];
}

interface PersonaChip {
  label: string;
  value: string;
}

interface MissionData {
  name: string;
  targeting: {
    demographics: DemographicFilter[];
  };
  questions: QuestionResult[];
  totalRespondents: number;
  completedAt: string;
  // Real data from API
  executiveSummary?: string;
  personaChips?: PersonaChip[];
  missionBrief?: string;
  // Pass 21 Bug 6 (Option B): qualification metadata for the header /
  // per-question sub-labels. `hasScreening` is true when at least one
  // question on the mission was marked isScreening — sub-labels switch
  // to "X of N respondents answered" only on missions that screen.
  qualifiedRespondents?: number;
  qualificationRate?: number; // 0..1; null/undefined if no screening
  hasScreening?: boolean;
  /** Per-question id → boolean tag from backend's aggregatedByQuestion. */
  screeningQuestionIds?: Set<string>;
  /**
   * Pass 23 Bug 23.25 — delivery integrity surface.
   *   deliveryStatus      : 'full' | 'partial' | null (null on legacy rows)
   *   paidFor             : mission.respondent_count at purchase time
   *   partialRefundCents  : amount Stripe credited back; null if delivery=full
   *                         OR delivery=partial but the auto-refund failed
   *                         (admin processes manually — banner says so)
   *   refundRequestedCents: proposed refund amount (paidCents * gap / paidFor),
   *                         used to display the dollar value when the actual
   *                         Stripe refund hasn't landed yet.
   */
  deliveryStatus?: 'full' | 'partial' | null;
  paidFor?: number;
  partialRefundCents?: number | null;
  refundRequestedCents?: number | null;
  // Pass 22 Bug 22.16 — full insights object surfaced for the Tensions Flagged
  // card. Typed loosely because backend may add fields over time; UI guards
  // each use behind Array.isArray / typeof checks.
  insights?: {
    contradictions?: Array<{
      question_a?: string;
      question_b?: string;
      tension_description?: string;
      severity?: 'high' | 'medium' | 'low';
    }>;
    // Pass 22 Bug 22.15 — cross-cut segmentation by demographic-ish axes.
    segment_breakdowns?: Array<{
      axis?: string;
      segments?: Array<{
        name?: string;
        n?: number;
        key_findings?: string;
      }>;
    }>;
    [key: string]: unknown;
  };
}


// Pass 22 Bug 22.15 — Cross-Cut Analysis card. Renders backend-supplied
// segment_breakdowns as a tab-style axis selector with per-segment findings.
function CrossCutCard({
  breakdowns,
}: {
  breakdowns: Array<{
    axis?: string;
    segments?: Array<{ name?: string; n?: number; key_findings?: string }>;
  }>;
}) {
  const validBreakdowns = breakdowns.filter(
    b => b.segments && b.segments.length > 0,
  );
  const [activeIdx, setActiveIdx] = useState(0);
  if (validBreakdowns.length === 0) return null;
  const active = validBreakdowns[Math.min(activeIdx, validBreakdowns.length - 1)];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/15">
          <Filter className="w-5 h-5 text-purple-300" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white">Cross-Cut Analysis</h2>
      </div>
      {/* Pass 23 Bug 23.60 Chunk 6 — segmented control replaces pill tabs.
          Reads as a single unified UI element with internal divisions
          rather than a row of independent pills. Adds keyboard nav
          (←/→/Home/End) per WAI-ARIA radiogroup pattern. */}
      <div className="mb-4">
        <SegmentedControl
          ariaLabel="Cross-Cut analysis dimension"
          options={validBreakdowns.map((b, i) => b.axis || `Axis ${i + 1}`)}
          activeIdx={activeIdx}
          onChange={setActiveIdx}
          variant="purple"
        />
      </div>
      <div className="space-y-3">
        {(active.segments || []).map((seg, i) => (
          <div key={(seg.name || '') + i} className="border-l-2 border-purple-400/30 pl-4 py-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-white font-bold text-sm">{seg.name || 'Unnamed segment'}</span>
              {typeof seg.n === 'number' && (
                <span className="text-white/50 text-xs font-mono">n={seg.n}</span>
              )}
            </div>
            {seg.key_findings && (
              <p className="text-white/80 text-sm leading-relaxed">{seg.key_findings}</p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const COLORS = [
  '#8B5CF6',
  '#10B981',
  '#F43F5E',
  '#F59E0B',
  '#3B82F6',
  '#6366F1'
];

export const ResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { missionId: missionIdParam } = useParams<{ missionId?: string }>();
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [filteredRespondentCount, setFilteredRespondentCount] = useState(0);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionResult[]>([]);
  // Pass 22 Bug 22.14 — sample-reasoning modal state.
  const [reasoningModal, setReasoningModal] = useState<{
    open: boolean;
    questionId?: string;
    questionText?: string;
  }>({ open: false });
  const [reasoningRows, setReasoningRows] = useState<Array<{
    persona_id: string;
    response_value: string | null;
    reasoning_text: string;
  }> | null>(null);
  const [reasoningLoading, setReasoningLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    subtext: '',
    isGenerating: false
  });
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Pass 20 Bug 7: progress envelope now matches new backend shape:
  //   { collected, target, percent }
  const [resultsProgress, setResultsProgress] = useState<{
    collected: number;
    target: number;
    percent: number;
  } | null>(null);
  // Pass 23 Bug 23.80: failure state now carries refund metadata so the
  // failure UI can branch between "we refunded $X" and "we owe you a refund".
  const [missionFailed, setMissionFailed] = useState<{
    reason: string;
    partialRefundId?: string | null;
    partialRefundAmountCents?: number | null;
  } | null>(null);
  const [screeningFunnel, setScreeningFunnel] = useState<{ total: number; passed: number; screenedOut: number } | null>(null);
  // Pass 23 Bug 23.60 Chunk 2 — shareCopied state moved into ShareButton component.
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Pass 20 Bug 7: poll timer + first-poll-at tracking. Refs (not state) so
  // updates don't re-render and so cleanup can clear them. firstPollAtRef is
  // reset whenever missionId changes (cleanup in the effect below) so the
  // adaptive 5s→15s curve restarts per mission.
  const pollTimerRef = useRef<number | null>(null);
  const firstPollAtRef = useRef<number | null>(null);

  // Get missionId — path param takes priority (clean URLs), fall back to
  // query string (?missionId=) and location state for backward compat.
  const missionId =
    missionIdParam ||
    new URLSearchParams(location.search).get('missionId') ||
    (location.state as any)?.missionId ||
    null;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (missionId) {
      fetchResults(missionId);
    }
    return () => {
      // Reset poll state when missionId changes or component unmounts.
      if (pollTimerRef.current != null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      firstPollAtRef.current = null;
    };
  }, [missionId]);

  const fetchResults = async (id: string) => {
    setIsLoadingResults(true);
    try {
      const { api } = await import('../lib/apiClient');
      const data = await api.get(`/api/results/${id}`);

      // Pass 20 Bug 7: in-flight ('paid' or 'processing' on the backend
      // collapses to the single 'processing' shape here). Render progress
      // UI and self-schedule the next poll. Adaptive cadence: 5s for the
      // first 30s of waiting, 15s thereafter.
      if (data.status === 'processing') {
        const p = data.progress || {};
        setResultsProgress({
          collected: Number(p.collected || 0),
          target:    Number(p.target || 0),
          percent:   Number(p.percent || 0),
        });
        setMissionFailed(null);

        if (firstPollAtRef.current == null) firstPollAtRef.current = Date.now();
        const waitedMs = Date.now() - firstPollAtRef.current;
        const nextDelayMs = waitedMs < 30_000 ? 5_000 : 15_000;

        if (pollTimerRef.current != null) window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = window.setTimeout(() => {
          pollTimerRef.current = null;
          fetchResults(id);
        }, nextDelayMs);
        return;
      }

      // Pass 20 Bug 7: fatal failure — render error state, stop polling.
      // Pass 23 Bug 23.80: also fetch refund metadata from missions table so
      // the failure card can show "we refunded $X" vs "we owe you a refund".
      if (data.status === 'failed') {
        const reason = data.error || 'Mission could not complete.';
        setMissionFailed({ reason });
        setResultsProgress(null);
        firstPollAtRef.current = null;
        try {
          const { supabase } = await import('../lib/supabase');
          const { data: row } = await supabase
            .from('missions')
            .select('partial_refund_id, partial_refund_amount_cents')
            .eq('id', id)
            .maybeSingle();
          if (row) {
            setMissionFailed({
              reason,
              partialRefundId: row.partial_refund_id,
              partialRefundAmountCents: row.partial_refund_amount_cents,
            });
          }
        } catch { /* refund metadata is best-effort */ }
        return;
      }

      // Completed (or legacy responses missing the explicit status field):
      // clear poll/progress/failure state and fall through to the success
      // path below.
      setResultsProgress(null);
      setMissionFailed(null);
      firstPollAtRef.current = null;
      if (!data.mission) {
        setFetchError('Mission data not found. It may still be processing.');
        return;
      }

      const mission = data.mission;
      const agg = data.aggregatedByQuestion || {};
      const respondentCount = data.responseCount ?? mission.respondent_count ?? 0;

      // Build question list — prefer order from mission.questions[]
      const missionQuestions: any[] = Array.isArray(mission.questions)
        ? mission.questions
        : Object.keys(agg).map((k) => ({ id: k, ...(agg[k]?.question || {}) }));

      const questions: QuestionResult[] = missionQuestions.map((q: any, idx: number) => {
        const qid = q.id || q.question_id || `q${idx + 1}`;
        const bucket = agg[qid] || {};
        const backendType = q.type || bucket.type || 'single';
        const fType = mapQuestionType(backendType);
        const qText = q.text || q.question || bucket.question || `Question ${idx + 1}`;
        // Per-question insight lookup — snake_case first.
        // Backend writes `insights.per_question_insights` as an array of
        // `{ question_id, headline, body, significance }`. Older paths
        // and stale clients used `questionInsights[idx]` / `byQuestion[qid]`.
        const perQList: any[] =
          (data?.insights?.per_question_insights as any[]) ||
          (data?.mission?.insights?.per_question_insights as any[]) ||
          [];
        const perQItem = Array.isArray(perQList)
          ? perQList.find((pi: any) => pi && pi.question_id === qid)
          : null;
        const perQText = perQItem
          // Pass 23 Bug 23.77 — was joined with ` — ` which inserted an
          // em-dash into the rendered insight body. The downstream render
          // now splits headline from body via the `insightHeadline`
          // sibling field so we keep them separate elements (lead-sentence
          // typography per the Bug 23.60 spec). Insight string keeps just
          // the body for backwards compat with surfaces that read the
          // raw concatenation.
          ? [perQItem.headline, perQItem.body].filter(Boolean).join('. ').replace(/\.\.\s/, '. ')
          : '';
        const aiInsight =
          bucket.insight ||
          perQText ||
          data.insights?.questionInsights?.[idx] ||
          data.insights?.byQuestion?.[qid] ||
          '';

        if (fType === 'rating') {
          const dist: Record<string, number> = bucket.distribution || bucket.counts || {};
          const total =
            Object.values(dist).reduce((a: number, b: any) => a + Number(b || 0), 0) || respondentCount || 1;
          const ratingData = [1, 2, 3, 4, 5].map((n) => {
            const count = Number(dist[String(n)] ?? dist[`${n} Star`] ?? 0);
            return {
              rating: `${n} Star${n === 1 ? '' : 's'}`,
              count,
              percentage: Math.round((count / total) * 100),
            };
          });
          const weightedSum = ratingData.reduce((s, r, i) => s + (i + 1) * r.count, 0);
          const avg = total ? weightedSum / total : 0;
          // Pass 22 Bug 22.17 — pull CI fields from the backend bucket if
          // present (backend insights.aggregate persists ci_low/ci_high/stddev/rating_n).
          // Falls back gracefully on legacy missions where these are absent.
          const ci_low   = typeof bucket.ci_low   === 'number' ? bucket.ci_low   : undefined;
          const ci_high  = typeof bucket.ci_high  === 'number' ? bucket.ci_high  : undefined;
          const stddev   = typeof bucket.stddev   === 'number' ? bucket.stddev   : undefined;
          const rating_n = typeof bucket.rating_n === 'number' ? bucket.rating_n : undefined;
          return {
            id: qid, question: qText, type: 'rating', data: ratingData,
            averageScore: avg, aiInsight,
            ci_low, ci_high, stddev, rating_n,
          };
        }

        if (fType === 'multi_select') {
          const dist: Record<string, number> = bucket.distribution || bucket.counts || {};
          const total = respondentCount || Object.values(dist).reduce((a: number, b: any) => a + Number(b || 0), 0) || 1;
          const arr = Object.entries(dist).map(([feature, count]) => ({
            feature,
            count: Number(count || 0),
            percentage: Math.round((Number(count || 0) / total) * 100),
          })).sort((a, b) => b.count - a.count);
          return { id: qid, question: qText, type: 'multi_select', data: arr, aiInsight };
        }

        if (fType === 'open_text') {
          const verbatims: string[] = bucket.verbatims || bucket.samples || [];
          const keywords: any[] = bucket.keywords || bucket.topWords || [];
          const wordData = keywords.length
            ? keywords.map((w: any) => ({ word: w.word || w.text || String(w), size: w.size || w.count || 20 }))
            : [];
          return {
            id: qid,
            question: qText,
            type: 'open_text',
            data: wordData,
            verbatims: verbatims.slice(0, 50),
            sentiment: bucket.sentiment ?? bucket.sentimentScore,
            aiInsight,
          };
        }

        // single_choice
        const dist: Record<string, number> = bucket.distribution || bucket.counts || {};
        const total = Object.values(dist).reduce((a: number, b: any) => a + Number(b || 0), 0) || respondentCount || 1;
        const arr = Object.entries(dist).map(([name, count], i) => {
          const value = Math.round((Number(count || 0) / total) * 100);
          return {
            name,
            value,
            percentage: value,
            color: COLORS[i % COLORS.length],
          };
        });
        return { id: qid, question: qText, type: 'single_choice', data: arr, aiInsight };
      });

      // Pass 23 Bug 23.56 — propagate Brand Lift category tags from the
      // source mission_questions JSONB onto each QuestionResult. The
      // category is set by claudeAI's brand_lift-aware system prompt
      // (8-category Happydemics framework). Non-brand_lift missions have
      // no category field and the map is a no-op.
      questions.forEach((qr, idx) => {
        const src = (missionQuestions as Array<{ category?: string }>)[idx];
        if (src?.category) {
          (qr as QuestionResult).category = src.category as QuestionResult['category'];
        }
      });

      // Build persona chips from target_audience jsonb
      const parsePersonaChips = (ta: any): PersonaChip[] => {
        const chips: PersonaChip[] = [];
        if (!ta) return chips;
        if (typeof ta === 'string' && ta.trim()) {
          chips.push({ label: 'Audience', value: ta.trim() });
          return chips;
        }
        if (typeof ta === 'object') {
          if (ta.summary) chips.push({ label: 'Summary', value: String(ta.summary) });
          if (Array.isArray(ta.segments)) ta.segments.slice(0, 4).forEach((s: string) => chips.push({ label: 'Segment', value: String(s) }));
          if (ta.age) chips.push({ label: 'Age', value: String(ta.age) });
          if (ta.gender) chips.push({ label: 'Gender', value: String(ta.gender) });
          if (ta.income) chips.push({ label: 'Income', value: String(ta.income) });
          if (ta.location) chips.push({ label: 'Location', value: String(ta.location) });
          if (ta.interests && Array.isArray(ta.interests)) chips.push({ label: 'Interests', value: ta.interests.slice(0, 3).join(', ') });
        }
        return chips.slice(0, 6);
      };

      // Extract executive summary from insights.
      // Backend writes snake_case to:
      //   - missions.executive_summary  (top-level column, most authoritative)
      //   - missions.insights.executive_summary  (JSONB key)
      // Older client code also looked for camelCase variants; preserved as last-resort.
      const execSummary =
        mission.executive_summary ||
        data.insights?.executive_summary ||
        data.insights?.executiveSummary ||
        data.insights?.summary ||
        data.insights?.overview ||
        (typeof data.insights === 'string' ? data.insights : null);

      // Pass 21 Bug 6 (Option B): pull qualification metadata persisted by
      // runMission (see backend Bug 5). Falls back to screeningFunnel when
      // present, then to respondent_count, so older missions still render.
      const totalSimulated =
        Number(mission.total_simulated_count ?? 0) ||
        Number(data.screeningFunnel?.total ?? 0) ||
        Number(mission.respondent_count ?? 0) ||
        respondentCount ||
        0;
      const qualifiedCount =
        mission.qualified_respondent_count != null
          ? Number(mission.qualified_respondent_count)
          : data.screeningFunnel?.passed != null
            ? Number(data.screeningFunnel.passed)
            : undefined;
      const qualificationRate =
        mission.qualification_rate != null
          ? Number(mission.qualification_rate)
          : qualifiedCount != null && totalSimulated > 0
            ? qualifiedCount / totalSimulated
            : undefined;
      const hasScreening = Boolean(
        data.screeningFunnel ||
        (Array.isArray(mission.questions) && mission.questions.some((q: any) => q?.isScreening || q?.is_screening))
      );
      const screeningQuestionIds = new Set<string>(
        Object.entries(agg)
          .filter(([, b]: [string, any]) => b && b.is_screening === true)
          .map(([qid]) => qid)
      );

      // Pass 23 Bug 23.25 — delivery integrity hydration.
      // delivery_status is stamped by runMission. paid_amount_cents comes
      // from the Stripe PI succeed webhook; falls back to total_price_usd
      // when the row is older or webhook ran on a different code path.
      // refundRequestedCents is the proportional amount we *should* refund
      // (used in the banner if delivery=partial but partial_refund_id is
      // null — i.e., the Stripe call failed and admin is processing).
      const paidForCount = Number(mission.respondent_count ?? 0);
      const paidCentsBase = Number.isFinite(mission.paid_amount_cents)
        ? Number(mission.paid_amount_cents)
        : Math.round(Number(mission.total_price_usd ?? 0) * 100);
      const refundRequestedCents =
        mission.delivery_status === 'partial' &&
        paidForCount > 0 &&
        Number.isFinite(qualifiedCount) &&
        qualifiedCount! < paidForCount
          ? Math.floor((paidCentsBase * (paidForCount - qualifiedCount!)) / paidForCount)
          : null;

      const loaded: MissionData = {
        // Canonical columns on `public.missions` are `title` + `brief`.
        // `mission_statement`, `name`, and `context` never existed on the DB;
        // kept as last-resort fallbacks for mission rows still held in memory
        // by older client code paths.
        name:
          mission.title ||
          mission.brief ||
          mission.mission_statement ||
          mission.name ||
          mission.context ||
          'Your Mission',
        missionBrief: mission.brief || mission.context || undefined,
        completedAt: mission.completed_at
          ? new Date(mission.completed_at).toLocaleString()
          : 'Just now',
        // totalRespondents = total simulated personas (Option B primary metric).
        totalRespondents: totalSimulated || respondentCount,
        targeting: { demographics: [] },
        questions,
        executiveSummary: execSummary || undefined,
        personaChips: parsePersonaChips(mission.target_audience),
        qualifiedRespondents: qualifiedCount,
        qualificationRate: qualificationRate,
        hasScreening,
        screeningQuestionIds,
        // Pass 22 Bug 22.16 — surface raw insights so the Tensions Flagged
        // card can read insights.contradictions.
        insights: typeof data.insights === 'object' && data.insights !== null
          ? (data.insights as MissionData['insights'])
          : undefined,
        // Pass 23 Bug 23.25 — delivery integrity.
        deliveryStatus: mission.delivery_status === 'full' || mission.delivery_status === 'partial'
          ? mission.delivery_status
          : null,
        paidFor: paidForCount || undefined,
        partialRefundCents: Number.isFinite(mission.partial_refund_amount_cents)
          ? Number(mission.partial_refund_amount_cents)
          : null,
        refundRequestedCents,
      };

      setMissionData(loaded);
      setFilteredRespondentCount(loaded.totalRespondents);
      setFilteredQuestions(loaded.questions);
      // Screening funnel — only present if mission has a screening question.
      setScreeningFunnel(data.screeningFunnel || null);
    } catch (err: any) {
      console.error('Failed to load results:', err);
      setFetchError(err?.message || 'Failed to load mission results. Please try again.');
    } finally {
      setIsLoadingResults(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }

      if (openFilterDropdown) {
        const filterRef = filterRefs.current[openFilterDropdown];
        if (filterRef && !filterRef.contains(event.target as Node)) {
          setOpenFilterDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openFilterDropdown]);

  const getFormatLabel = (format: ExportFormat): string => {
    switch (format) {
      case 'pdf':
        return 'PDF';
      case 'xlsx':
        return 'Excel';
      case 'pptx':
        return 'PowerPoint';
      case 'raw':
        return 'Raw JSON';
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setIsDropdownOpen(false);

    if (!missionId) {
      setToast({
        show: true,
        message: 'Export unavailable for demo data',
        subtext: 'Open results from a real mission to export',
        isGenerating: false,
      });
      setTimeout(() => setToast({ show: false, message: '', subtext: '', isGenerating: false }), 3000);
      return;
    }

    setToast({
      show: true,
      message: `Generating ${getFormatLabel(format)}…`,
      subtext: 'This may take a moment.',
      isGenerating: true,
    });

    const extMap: Record<ExportFormat, string> = { pdf: 'pdf', xlsx: 'xlsx', pptx: 'pptx', raw: 'json' };
    const endpoint = `/api/results/${missionId}/export/${format}`;

    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`${API_URL}${endpoint}`, { headers });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (missionData?.name || 'vett_results').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 60);
      link.href = url;
      link.download = `${safeName}.${extMap[format]}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({
        show: true,
        message: `${safeName}.${extMap[format]} downloaded`,
        subtext: 'Your export is ready',
        isGenerating: false,
      });
      setTimeout(() => setToast({ show: false, message: '', subtext: '', isGenerating: false }), 3000);
    } catch (err: any) {
      console.error('Export failed:', err);
      setToast({
        show: true,
        message: `${getFormatLabel(format)} export failed`,
        subtext: err?.message || 'Please try again.',
        isGenerating: false,
      });
      setTimeout(() => setToast({ show: false, message: '', subtext: '', isGenerating: false }), 4000);
    }
  };

  const applyFilterToData = (filters: Record<string, string>) => {
    const activeFilters = Object.entries(filters).filter(([_, v]) => v !== 'all');
    const activeCount = activeFilters.length;

    if (activeCount === 0) {
      setFilteredQuestions(missionData?.questions || []);
      setFilteredRespondentCount(missionData?.totalRespondents ?? 0);
      return;
    }

    const seed = activeFilters.map(([k, v]) => `${k}:${v}`).join('|');
    const variance = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;

    const newTotal = Math.floor((missionData?.totalRespondents ?? 0) / (activeCount + 1)) * (activeCount + 1);
    setFilteredRespondentCount(Math.max(newTotal, 25));

    const filterLabel = activeFilters.map(([k, v]) => `${k} ${v}`).join(', ');

    const newQuestions = (missionData?.questions || []).map((q) => {
      if (q.type === 'single_choice') {
        const shuffledData = q.data.map((item, idx) => {
          const shift = (variance + idx * 13) % 30 - 15;
          let newValue = Math.max(5, item.value + shift);
          const { color, ...itemWithoutColor } = item;
          return { ...itemWithoutColor, value: newValue, percentage: newValue };
        });

        const total = shuffledData.reduce((sum, item) => sum + item.value, 0);
        const normalizedData = shuffledData.map(item => ({
          ...item,
          value: Math.round((item.value / total) * 100),
          percentage: Math.round((item.value / total) * 100)
        }));

        const topChoice = normalizedData.reduce((max, item) => item.value > max.value ? item : max);

        return {
          ...q,
          data: normalizedData,
          aiInsight: `💡 [${filterLabel} Segment]: '${topChoice.name}' leads at ${topChoice.percentage}%, showing distinct preferences in this demographic compared to the overall population.`
        };
      }

      if (q.type === 'multi_select') {
        const shuffledData = q.data.map((item, idx) => {
          const shift = (variance + idx * 17) % 25 - 12;
          const newCount = Math.max(10, item.count + shift);
          const newPercentage = Math.round((newCount / newTotal) * 100);
          return { ...item, count: newCount, percentage: newPercentage };
        });

        const sortedData = [...shuffledData].sort((a, b) => b.count - a.count);
        const topFeature = sortedData[0];

        return {
          ...q,
          data: shuffledData,
          aiInsight: `💡 [${filterLabel} Segment]: '${topFeature.feature}' is the top priority (${topFeature.percentage}%), indicating this demographic has unique feature preferences.`
        };
      }

      if (q.type === 'rating') {
        const shuffledData = q.data.map((item, idx) => {
          const shift = (variance + idx * 11) % 10 - 5;
          const newCount = Math.max(2, item.count + shift);
          const newPercentage = Math.round((newCount / newTotal) * 100);
          return { ...item, count: newCount, percentage: newPercentage };
        });

        const weightedSum = shuffledData.reduce((sum, item, idx) => sum + (idx + 1) * item.count, 0);
        const totalCount = shuffledData.reduce((sum, item) => sum + item.count, 0);
        const newAverage = weightedSum / totalCount;

        const highRatings = shuffledData.slice(-2).reduce((sum, item) => sum + item.percentage, 0);

        return {
          ...q,
          data: shuffledData,
          averageScore: newAverage,
          aiInsight: `💡 [${filterLabel} Segment]: Average score of ${newAverage.toFixed(1)}/5.0 with ${highRatings}% rating 4-5 stars, showing ${newAverage >= 4.0 ? 'high' : 'moderate'} satisfaction in this segment.`
        };
      }

      if (q.type === 'open_text') {
        return {
          ...q,
          aiInsight: `💡 [${filterLabel} Segment]: Sentiment analysis shows this demographic emphasizes similar keywords, with slight variations in priority reflecting their unique perspective.`
        };
      }

      return q;
    });

    setFilteredQuestions(newQuestions);
  };

  const handleFilterChange = (filterName: string, value: string) => {
    const newFilters = { ...selectedFilters, [filterName]: value };
    setSelectedFilters(newFilters);
    setOpenFilterDropdown(null);
    setIsFilterLoading(true);

    setTimeout(() => {
      applyFilterToData(newFilters);
      setIsFilterLoading(false);
    }, 500);
  };

  const getActiveFilterCount = () => {
    return Object.values(selectedFilters).filter(v => v !== 'all').length;
  };

  const clearAllFilters = () => {
    const clearedFilters: Record<string, string> = {};
    (missionData?.targeting.demographics || []).forEach(demo => {
      clearedFilters[demo.name] = 'all';
    });
    setSelectedFilters(clearedFilters);
    setIsFilterLoading(true);
    setTimeout(() => {
      applyFilterToData(clearedFilters);
      setIsFilterLoading(false);
    }, 500);
  };

  const handleCsvExport = () => {
    const rows: string[][] = [['Question', 'Type', 'Choice / Label', 'Count / Value', 'Percentage']];
    filteredQuestions.forEach((q) => {
      if (q.type === 'single_choice' || q.type === 'multi_select') {
        q.data.forEach((d: any) => {
          rows.push([
            `"${(q.question || '').replace(/"/g, '""')}"`,
            q.type,
            `"${String(d.name || d.feature || '').replace(/"/g, '""')}"`,
            String(d.value ?? d.count ?? ''),
            String(d.percentage ?? '') + '%',
          ]);
        });
      } else if (q.type === 'rating') {
        q.data.forEach((d: any) => {
          rows.push([
            `"${(q.question || '').replace(/"/g, '""')}"`,
            'rating',
            `"${d.rating}"`,
            String(d.count),
            String(d.percentage) + '%',
          ]);
        });
        if (q.averageScore != null) {
          rows.push([`"${(q.question || '').replace(/"/g, '""')}"`, 'rating', 'Average Score', q.averageScore.toFixed(2), '']);
        }
      } else if (q.type === 'open_text') {
        (q.verbatims || []).forEach((v: string, i: number) => {
          rows.push([
            `"${(q.question || '').replace(/"/g, '""')}"`,
            'open_text',
            `Response ${i + 1}`,
            `"${(v || '').replace(/"/g, '""')}"`,
            '',
          ]);
        });
      }
    });
    // Pass 23 Bug 23.62 — UTF-8 BOM (﻿) + RFC-4180 \r\n line endings.
    //   - BOM: Excel for Mac and Windows both auto-detect encoding from
    //     the BOM. Without it, Arabic / accented chars (Lebanese mission
    //     verbatims, French/Spanish persona names) open as mojibake. The
    //     BOM is invisible to RFC-4180 parsers and standard tooling.
    //   - \r\n: RFC 4180 §2.1 mandates CRLF between records. Excel for
    //     Windows tolerates \n but Excel for Mac and some legacy parsers
    //     break on it; \r\n is the universally-safe choice.
    const csv = '﻿' + rows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (missionData?.name || 'vett_results').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 60);
    link.href = url;
    link.download = `${safeName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [briefDownloading, setBriefDownloading] = useState(false);

  const handleTargetingBriefExport = async () => {
    if (briefDownloading || !missionId) return;
    setIsDropdownOpen(false);
    setBriefDownloading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`${API_URL}/api/results/${missionId}/export/targeting-brief`, { headers });

      if (res.status === 202) {
        // Brief still generating — notify and bail.
        // Pass 21 Bug 18: previously called the non-existent setNotification
        // helper, which threw `setNotification is not defined` and dropped
        // the user into the catch block with a misleading "Targeting brief
        // export failed" message. Use the real setToast like every other
        // export flow on this page.
        const data = await res.json().catch(() => ({}));
        setToast({
          show: true,
          message: 'Targeting brief is generating…',
          subtext: data.error || 'Try again in about a minute',
          isGenerating: true,
        });
        setTimeout(() => setToast({ show: false, message: '', subtext: '', isGenerating: false }), 4000);
        return;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VETT-TargetingBrief-${missionId.slice(0, 8).toUpperCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Pass 21 Bug 18: see comment above on the 202 branch — same fix.
      setToast({
        show: true,
        message: 'Targeting Brief downloaded',
        subtext: 'Ready to paste into Meta Ads, Google, or LinkedIn',
        isGenerating: false,
      });
      setTimeout(() => setToast({ show: false, message: '', subtext: '', isGenerating: false }), 3000);
    } catch (err) {
      console.error('Targeting brief export failed:', err);
      setToast({
        show: true,
        message: 'Targeting brief export failed',
        subtext: err instanceof Error ? err.message : 'Please try again',
        isGenerating: false,
      });
      setTimeout(() => setToast({ show: false, message: '', subtext: '', isGenerating: false }), 4000);
    } finally {
      setBriefDownloading(false);
    }
  };

  // Pass 23 Bug 23.60 Chunk 2 — handleShareLink moved into ShareButton component.

  const exportOptions = [
    {
      format: 'pdf' as ExportFormat,
      icon: FileText,
      label: 'PDF Report',
      subtext: 'Charts & Summary'
    },
    {
      format: 'pptx' as ExportFormat,
      icon: Presentation,
      label: 'PowerPoint',
      subtext: 'Presentation Slides'
    },
    {
      format: 'xlsx' as ExportFormat,
      icon: FileSpreadsheet,
      label: 'Excel Workbook',
      subtext: 'Raw Respondent Data'
    },
    {
      format: 'raw' as ExportFormat,
      icon: FileJson,
      label: 'Raw JSON',
      subtext: 'Every response + insights'
    }
  ];

  const csvExportOption = { icon: FileDown, label: 'CSV (local)', subtext: 'Quick client-side download' };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[#1e293b]/90 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-3">
          <p className="text-white font-bold text-sm mb-1">{data.name}</p>
          <p className="text-primary font-bold text-lg">{data.value}%</p>
        </div>
      );
    }
    return null;
  };

  const renderChart = (result: QuestionResult) => {
    switch (result.type) {
      case 'single_choice': {
        // Pass 21 Bug 9: when every qualifying respondent picked the same
        // option, the donut renders as a single full-circle slice — visually
        // anemic and harder to read than the underlying signal ("100%
        // answered X"). Fall back to a callout card in that case. Forensic:
        // 8 question-level distributions on production missions hit this
        // case (e.g. 077b6e23 q1, e18c9802 q1/q3, c69001d9 q1–q5).
        if (result.data.length === 1) {
          const only = result.data[0];
          const tint = only.color || COLORS[0];
          return (
            <div className="flex flex-col items-center justify-center text-center py-10 px-6 rounded-xl border border-white/10 bg-white/5">
              <div
                className="text-6xl md:text-7xl font-black tracking-tight"
                style={{ color: tint }}
              >
                {Number(only.percentage ?? only.value ?? 100)}%
              </div>
              <div className="mt-3 text-base md:text-lg font-semibold text-white max-w-md">
                answered <span className="text-white">“{only.name}”</span>
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-white/40">
                Unanimous response
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex justify-center items-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={result.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                    labelLine={false}
                  >
                    {result.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend content={() => null} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 w-full">
              {result.data.map((entry, index) => (
                <div key={index} className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-300 truncate">{entry.name}</span>
                  </div>
                  <span className="text-base font-bold text-white flex-shrink-0">{entry.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'multi_select': {
        // Pass 23 Bug 23.66 — chart row-height fix. Long multi-select
        // labels (e.g. "Energy or lives system with optional skip purchases")
        // wrap to 3-4 lines and overlap the bars at default Recharts row
        // heights. Two fixes:
        //   1. Custom YAxisTick that hard-wraps each label at ~22 chars
        //      and renders one <text> per line, vertically centered
        //      around the row anchor.
        //   2. Dynamic chart height computed per-row from line count.
        const maxCount = Math.max(...result.data.map((item) => item.count));
        const MAX_CHARS_PER_LINE = 22;
        const LINE_HEIGHT_PX = 14;
        const ROW_PADDING_PX = 24;
        const wrapLabel = (label: string): string[] => {
          const words = String(label || '').split(/\s+/);
          const lines: string[] = [];
          let line = '';
          for (const word of words) {
            const tentative = line ? line + ' ' + word : word;
            if (tentative.length > MAX_CHARS_PER_LINE && line) {
              lines.push(line);
              line = word;
            } else {
              line = tentative;
            }
          }
          if (line) lines.push(line);
          // Cap any single line at MAX_CHARS_PER_LINE * 1.5 to handle a
          // single ungainly word — adds a hyphen-truncate ellipsis.
          return lines.map((l) =>
            l.length > MAX_CHARS_PER_LINE * 1.5
              ? l.slice(0, MAX_CHARS_PER_LINE * 1.5 - 1) + '…'
              : l,
          );
        };
        const linesPerRow = result.data.map((d) => wrapLabel(String((d as { feature?: string }).feature ?? '')).length);
        const chartHeight =
          60 +
          linesPerRow.reduce((sum, n) => sum + Math.max(n * LINE_HEIGHT_PX + ROW_PADDING_PX, 48), 0);
        const CustomYAxisTick = (props: { x?: number; y?: number; payload?: { value?: string } }) => {
          const { x = 0, y = 0, payload } = props;
          const lines = wrapLabel(String(payload?.value || ''));
          const offset = -((lines.length - 1) * LINE_HEIGHT_PX) / 2;
          return (
            <g transform={`translate(${x},${y})`}>
              {lines.map((line, i) => (
                <text
                  key={i}
                  x={-8}
                  y={offset + i * LINE_HEIGHT_PX}
                  dy={4}
                  textAnchor="end"
                  fontSize={11}
                  fill="rgba(255,255,255,0.85)"
                >
                  {line}
                </text>
              ))}
            </g>
          );
        };
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={result.data} layout="vertical" margin={{ left: 4, right: 24, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#fff" tick={{ fill: '#fff' }} />
              <YAxis
                dataKey="feature"
                type="category"
                stroke="#fff"
                tick={CustomYAxisTick}
                width={200}
                interval={0}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
                itemStyle={{ color: '#ffffff' }}
                labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                formatter={(value: number, _name: string, props: { payload?: { percentage?: number } }) =>
                  [`${value} (${props.payload?.percentage ?? 0}%)`, 'Responses']
                }
              />
              <Legend formatter={() => 'Number of Responses'} wrapperStyle={{ color: '#ffffff' }} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[0, 8, 8, 0]}>
                {result.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count === maxCount ? '#10B981' : '#8B5CF6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'rating':
        return (
          <div className="space-y-6">
            {result.averageScore && (
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-6xl font-black text-white mb-2">{result.averageScore.toFixed(1)}</div>
                  <div className="text-white/60 text-sm font-medium">Average Score</div>
                  <div className="text-white/40 text-xs">out of 5.0</div>
                  {/* Pass 22 Bug 22.17 — render 95% CI when backend supplies it.
                      Persisted on insights.per_question_insights[*].ci_low/high/stddev/rating_n
                      (see backend insights.aggregate). For tiny samples (n<8)
                      we still show the CI but flag low confidence. */}
                  {(() => {
                    const ci = (result as { ci_low?: number; ci_high?: number; stddev?: number; rating_n?: number }).ci_low != null
                      ? result as { ci_low: number; ci_high: number; stddev: number; rating_n: number }
                      : null;
                    if (!ci || ci.ci_low == null || ci.ci_high == null) return null;
                    const margin = ((ci.ci_high - ci.ci_low) / 2).toFixed(1);
                    const lowConfidence = (ci.rating_n ?? 0) < 8;
                    return (
                      <div className="mt-3">
                        <div className="text-white/70 text-xs font-mono">
                          ± {margin} (95% CI: {ci.ci_low.toFixed(1)}–{ci.ci_high.toFixed(1)}, n={ci.rating_n ?? '?'})
                        </div>
                        {lowConfidence && (
                          <div className="text-amber-300/80 text-[10px] mt-1 italic">
                            Low confidence, small sample
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="rating" stroke="#fff" tick={{ fill: '#fff' }} />
                <YAxis stroke="#fff" tick={{ fill: '#fff' }} label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#fff' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  itemStyle={{
                    color: '#ffffff'
                  }}
                  labelStyle={{
                    color: '#ffffff',
                    fontWeight: 'bold'
                  }}
                  formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.percentage}%)`, 'Responses']}
                />
                <Legend formatter={() => 'Number of Responses'} wrapperStyle={{ color: '#ffffff' }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'open_text':
        return (
          <div className="space-y-6">
            <div className="py-8">
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                {result.data.map((word, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white font-medium"
                    style={{
                      fontSize: `${Math.max(12, Math.min(word.size / 2, 24))}px`
                    }}
                  >
                    {word.word}
                  </span>
                ))}
              </div>
              {result.sentiment !== undefined && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm font-medium">Sentiment Score</span>
                    <span className="text-white font-bold text-lg">{result.sentiment}%</span>
                  </div>
                  <div className="relative">
                    <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          result.sentiment >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          result.sentiment >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${result.sentiment}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-red-400 text-xs font-medium">Negative</span>
                      <span className="text-green-400 text-xs font-medium">Positive</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {result.verbatims && result.verbatims.length > 0 && (
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <h4 className="text-lg font-bold text-white">Verbatims ({result.verbatims.length} responses)</h4>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {result.verbatims.map((verbatim, index) => (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed flex-1">{verbatim}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const hasNoResults = filteredRespondentCount === 0;
  const hasActiveFilters = getActiveFilterCount() > 0;

  // Pass 20 Bug 7 + Pass 23 Bug 23.80: failed state — render MissionFailureCard
  // with branched refund messaging. Polling is already stopped at fetch time.
  if (missionFailed) {
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-24">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Missions
            </button>
            <MissionFailureCard
              failureReason={missionFailed.reason}
              partialRefundId={missionFailed.partialRefundId}
              partialRefundAmountCents={missionFailed.partialRefundAmountCents}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Pass 20 Bug 7: in-flight state — real progress UI. Polling is driven
  // by fetchResults's adaptive setTimeout (5s for first 30s, 15s after).
  if (resultsProgress) {
    const pct = resultsProgress.percent;
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-8" />
            <h2 className="text-3xl font-black text-white mb-3">Simulating respondents…</h2>
            <p className="text-white/60 mb-8">We're running your synthetic audience now.</p>
            <div className="bg-white/10 rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="h-full bg-neon-lime rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-white/40 text-sm">
              {resultsProgress.collected} / {resultsProgress.target} responses ({pct}%)
            </p>
            <p className="text-white/30 text-xs mt-4">This usually takes 1–3 minutes.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Loading state — missionId present but data not yet fetched
  if (!missionData && !fetchError) {
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-8" />
            <h2 className="text-2xl font-black text-white mb-3">Loading Results</h2>
            <p className="text-white/60">Fetching your mission data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (fetchError && !missionData) {
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Could Not Load Results</h2>
            <p className="text-white/60 mb-8">{fetchError}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold transition-all mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // At this point missionData is guaranteed non-null
  const mission = missionData!;

  // Pass 23 Bug 23.60 Chunk 3 — derive a "top theme" string for the
  // ExecutiveSummary stat callout. Picks the rating question with the
  // highest averageScore (≥ 70 of 100, our soft "strong signal" floor)
  // and uses its question text. Falls back to the first multi-select
  // question's top option label, then null. Returns null if nothing
  // crosses the bar — the component renders an em-dash.
  const topTheme = useMemo<string | null>(() => {
    if (!Array.isArray(mission.questions) || mission.questions.length === 0) return null;
    const ratingHits = mission.questions
      .filter((q): q is QuestionResult => q.type === 'rating' && typeof q.averageScore === 'number')
      .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));
    const topRating = ratingHits[0];
    if (topRating && (topRating.averageScore ?? 0) >= 70) {
      // Truncate to 70 chars so the callout doesn't wrap awkwardly.
      const text = topRating.question;
      return text.length > 70 ? `${text.slice(0, 67).trimEnd()}…` : text;
    }
    const ms = mission.questions.find(
      (q): q is QuestionResult => q.type === 'multi_select' && Array.isArray(q.data) && q.data.length > 0,
    );
    if (ms) {
      const top = (ms.data as Array<{ name?: string; label?: string }>)[0];
      const label = top?.name || top?.label;
      if (label) return label.length > 70 ? `${label.slice(0, 67).trimEnd()}…` : label;
    }
    return null;
  }, [mission.questions]);

  // Pass 23 Bug 23.60 Chunk 2 — markdown payload for the "Copy summary"
  // ShareButton next to the Executive Summary heading. Includes the
  // summary text, total respondents, completion timestamp, and a
  // permalink. Memoized so we don't rebuild on every filter toggle.
  const summaryMarkdown = useMemo(() => {
    const lines = [
      `# ${mission.name}`,
      '',
      '## Executive Summary',
      mission.executiveSummary?.trim() || '_(not yet generated)_',
      '',
      '---',
      `**Respondents:** ${mission.totalRespondents}` +
        (mission.qualificationRate != null && mission.hasScreening
          ? ` (${Math.round(mission.qualificationRate * 100)}% qualified)`
          : ''),
      `**Completed:** ${mission.completedAt}`,
      `**Permalink:** ${typeof window !== 'undefined' ? window.location.href : ''}`,
    ];
    return lines.join('\n');
  }, [
    mission.name,
    mission.executiveSummary,
    mission.totalRespondents,
    mission.qualificationRate,
    mission.hasScreening,
    mission.completedAt,
  ]);

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900">

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>

      {/* Pass 23 Bug 23.60 Chunk 8 — outer container padding tightened.
          pt: 80px → 48px mobile, 96px → 64px desktop.
          pb: 96px → 64px both. Saves ~32-48px each side; main results
          surface fits more on a single laptop viewport without
          changing card breathing. */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Missions
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">
                {mission.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/60 mb-4">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {/*
                    Pass 21 Bug 6 (Option B):
                      • Mixed-screening (rate < 100%): "10 respondents · 40% qualified"
                      • All-qualified or no-screening:  "10 respondents"
                      • Filter active:                  "X of 10 respondents" (preserves
                                                                   prior filter affordance)
                  */}
                  {hasActiveFilters
                    ? `${filteredRespondentCount} of ${mission.totalRespondents} respondents`
                    : (() => {
                        const total = mission.totalRespondents;
                        const rate  = mission.qualificationRate;
                        const showRate = mission.hasScreening
                          && rate != null
                          && Number.isFinite(rate)
                          && rate < 0.999;
                        return showRate
                          ? `${total} respondents · ${Math.round(rate * 100)}% qualified`
                          : `${total} respondents`;
                      })()
                  }
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Completed {mission.completedAt}
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Mission Complete
                </span>
              </div>

              {/* Persona chips — shown when real target_audience data is available */}
              {mission.personaChips && mission.personaChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {mission.personaChips.map((chip, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-white/5 border border-white/10 text-white/70"
                    >
                      <span className="text-white/40">{chip.label}:</span>
                      {chip.value}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pass 23 Bug 23.60 Chunk 2 — Share button moved to shared component. */}
            <ShareButton mode="link" />


            {/* Export Data dropdown — always visible */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/20 rounded-lg text-sm font-bold text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Export Data
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[60]"
                  >
                    {exportOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.format}
                          onClick={() => handleExport(option.format)}
                          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-700/50"
                        >
                          <div className="flex items-center justify-center w-10 h-10 bg-white/5 rounded-lg">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-bold text-sm">{option.label}</div>
                            <div className="text-white/60 text-xs">{option.subtext}</div>
                          </div>
                        </button>
                      );
                    })}
                    {/* Client-side CSV — always works, no server needed */}
                    <button
                      onClick={() => { setIsDropdownOpen(false); handleCsvExport(); }}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-white/5 rounded-lg">
                        <csvExportOption.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-bold text-sm">{csvExportOption.label}</div>
                        <div className="text-white/60 text-xs">{csvExportOption.subtext}</div>
                      </div>
                    </button>
                    {/* AI Targeting Brief — Meta / Google / LinkedIn specs */}
                    <button
                      onClick={handleTargetingBriefExport}
                      disabled={briefDownloading}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-primary/10 transition-all duration-200 border-t border-white/5 disabled:opacity-50"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                        <Target className={`w-5 h-5 text-primary ${briefDownloading ? 'animate-pulse' : ''}`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-primary font-bold text-sm">
                          {briefDownloading ? 'Downloading…' : 'Targeting Brief'}
                        </div>
                        <div className="text-white/60 text-xs">AI-generated Meta / Google / LinkedIn specs</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {mission.targeting.demographics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-50 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl mb-8"
            >
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:flex-wrap flex-1">
                  <div className="flex items-center gap-2 text-white/60">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filter by:</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:flex-wrap gap-3 w-full md:w-auto md:flex-1">
                    {mission.targeting.demographics.map((filter) => (
                      <div
                        key={filter.name}
                        className="relative w-full md:w-auto"
                        ref={(el) => { filterRefs.current[filter.name] = el; }}
                      >
                        <button
                          onClick={() => setOpenFilterDropdown(openFilterDropdown === filter.name ? null : filter.name)}
                          className={`w-full md:w-auto flex items-center justify-between gap-2 px-4 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedFilters[filter.name] !== 'all'
                              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                              : 'bg-white/5 border border-white/20 text-white hover:bg-white/10 hover:border-white/30'
                          }`}
                        >
                          <span>
                            {filter.name}: {filter.options.find(opt => opt.value === selectedFilters[filter.name])?.label.replace(`All ${filter.name}s`, 'All').replace(`All ${filter.name} Levels`, 'All') || 'All'}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openFilterDropdown === filter.name ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {openFilterDropdown === filter.name && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute top-full left-0 right-0 md:right-auto mt-2 w-full md:w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[60]"
                            >
                              {filter.options.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleFilterChange(filter.name, option.value)}
                                  className={`w-full px-4 py-3 text-left text-sm transition-all duration-200 ${
                                    selectedFilters[filter.name] === option.value
                                      ? 'bg-blue-500/20 text-blue-300 font-bold'
                                      : 'text-white hover:bg-gray-700/50'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium underline text-left w-full md:w-auto"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {isFilterLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white/60 text-lg">Recalculating data...</p>
                </div>
              </motion.div>
            ) : hasNoResults ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-xl text-center"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Data for This Segment</h3>
                <p className="text-white/60 mb-6">No respondents match the selected filter criteria. Try adjusting your filters to see results from different demographics.</p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-bold transition-colors"
                >
                  Clear All Filters
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Pass 23 Bug 23.25 — partial-delivery banner. Appears above
                    the Executive Summary when delivery_status='partial'. The
                    refund-already-issued vs refund-pending copy splits on
                    whether partial_refund_amount_cents is populated. */}
                {mission.deliveryStatus === 'partial' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="relative z-0 mb-6"
                  >
                    <div className="relative bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 md:p-6 backdrop-blur-xl">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-amber-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-amber-100 text-sm md:text-base font-bold mb-1">
                            We delivered{' '}
                            {mission.qualifiedRespondents ?? 0} of{' '}
                            {mission.paidFor ?? '—'}{' '}
                            qualified respondents
                          </h3>
                          <p className="text-amber-100/75 text-sm leading-relaxed">
                            The screener was strict for this audience. We
                            over-recruited up to 5&times; to try to hit your
                            target, but the screener kept dropping personas.{' '}
                            {mission.partialRefundCents != null && mission.partialRefundCents > 0 ? (
                              <>
                                We&rsquo;ve refunded{' '}
                                <strong className="text-white">
                                  ${(mission.partialRefundCents / 100).toFixed(2)}
                                </strong>{' '}
                                proportionally for the gap &mdash; it&rsquo;ll
                                land on your card in 5&ndash;10 business days.
                              </>
                            ) : mission.refundRequestedCents != null && mission.refundRequestedCents > 0 ? (
                              <>
                                A{' '}
                                <strong className="text-white">
                                  ${(mission.refundRequestedCents / 100).toFixed(2)}
                                </strong>{' '}
                                refund for the gap is being processed by our
                                team and will land within one business day.
                              </>
                            ) : (
                              <>
                                Our team has been notified about the gap and
                                will reach out about a refund within one business day.
                              </>
                            )}
                          </p>
                          <p className="text-amber-100/55 text-xs leading-relaxed mt-2">
                            Tip for next time: loosen the screener criteria
                            one notch and we&rsquo;ll likely fill the full target.
                            The report below is still real signal &mdash; only
                            qualified respondents counted toward your insights.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Pass 23 Bug 23.58 — center the Executive Summary card.
                    The card was full-width inside the parent main; on a
                    1920px monitor it ran edge-to-edge while the body
                    paragraphs stayed at max-w-prose, leaving lopsided
                    whitespace. Constrained to max-w-3xl mx-auto so the
                    whole card reads as a deliberate magazine pull-quote.
                    Header centered; paragraphs stay left-aligned within
                    the centered container (text blocks read better
                    left-aligned than centered). */}
                {/* Pass 23 Bug 23.60 Chunk 3 — moved into ExecutiveSummary
                    component (lead-sentence pull-quote + 3 stat callouts). */}
                <ExecutiveSummary
                  executiveSummary={mission.executiveSummary}
                  summaryMarkdown={summaryMarkdown}
                  totalRespondents={mission.totalRespondents}
                  qualificationRate={mission.qualificationRate}
                  hasScreening={mission.hasScreening}
                  topTheme={topTheme}
                  completedAt={mission.completedAt}
                />

                {/* Pass 22 Bug 22.16 + Pass 23 Bug 23.60 Chunk 5 — moved into
                    TensionCard component (severity pills + clickable backrefs
                    that scroll to the per-question card). */}
                {Array.isArray((mission.insights as { contradictions?: unknown })?.contradictions) &&
                  ((mission.insights as { contradictions: Contradiction[] }).contradictions.length > 0) && (
                  <TensionCard
                    contradictions={(mission.insights as { contradictions: Contradiction[] }).contradictions}
                  />
                )}

                {/* Pass 22 Bug 22.15 — Cross-Cut Analysis card. Renders only
                    when insights.segment_breakdowns has at least one axis with
                    segments. Tab-style axis selector lets the user pick which
                    cut to view. */}
                {Array.isArray((mission.insights as { segment_breakdowns?: unknown })?.segment_breakdowns) &&
                 ((mission.insights as { segment_breakdowns: Array<{ axis?: string; segments?: Array<{ name?: string; n?: number; key_findings?: string }> }> }).segment_breakdowns.length > 0) && (
                  <div id="cross-cut" className="scroll-mt-20">
                    <CrossCutCard
                      breakdowns={(mission.insights as { segment_breakdowns: Array<{ axis?: string; segments?: Array<{ name?: string; n?: number; key_findings?: string }> }> }).segment_breakdowns}
                    />
                  </div>
                )}

                {/* Pass 23 Bug 23.60 Chunk 7 — Screening Funnel card. Hidden
                    when 100% of starters qualify (no actual screening drama —
                    showing a 100/100 pass rate is just noise). Existing null
                    guard still drops the section when the backend doesn't ship
                    funnel data. */}
                {screeningFunnel && screeningFunnel.passed < screeningFunnel.total && (
                  <motion.div
                    id="screening-funnel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl scroll-mt-20"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime-400/10">
                        <Users className="w-5 h-5 text-lime-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Screening Funnel</h2>
                        <p className="text-white/40 text-xs">Respondents filtered before entering the survey</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-2xl font-black text-white mb-1">{screeningFunnel.total}</div>
                        <div className="text-xs text-white/50 uppercase tracking-wide">Started</div>
                      </div>
                      <div className="text-center p-4 bg-lime-400/10 rounded-xl border border-lime-400/20">
                        <div className="text-2xl font-black text-lime-400 mb-1">{screeningFunnel.passed}</div>
                        <div className="text-xs text-lime-400/70 uppercase tracking-wide">Qualified</div>
                      </div>
                      <div className="text-center p-4 bg-red-400/10 rounded-xl border border-red-400/20">
                        <div className="text-2xl font-black text-red-400 mb-1">{screeningFunnel.screenedOut}</div>
                        <div className="text-xs text-red-400/70 uppercase tracking-wide">Screened Out</div>
                      </div>
                    </div>
                    {screeningFunnel.total > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
                          <span>Pass rate</span>
                          <span>{Math.round((screeningFunnel.passed / screeningFunnel.total) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-lime-400 rounded-full transition-all"
                            style={{ width: `${Math.round((screeningFunnel.passed / screeningFunnel.total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {(() => {
                  /**
                   * Pass 23 Bug 23.60 Chunk 9 — Brand Lift category-grouped layout.
                   *
                   * If any question carries a category tag (Bug 23.56 storage on
                   * brand_lift goal_type missions), render the per-question stack
                   * grouped by category in a logical funnel order: Awareness →
                   * Recall → Attribution → Message Association → Favorability →
                   * Purchase Intent → Recommendation → Ad Recall. Questions
                   * without a category go into a final "Other" group.
                   *
                   * For non-Brand-Lift missions (no category tags), render the
                   * existing flat per-question stack untouched.
                   *
                   * Per-question card JSX is identical in both branches — pulled
                   * out into a local `renderCard` so we don't duplicate.
                   */
                  const renderCard = (question: QuestionResult, index: number) => (
                    <motion.div
                      key={question.id}
                      id={`q-${question.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl scroll-mt-20"
                    >
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-2 gap-3">
                          <h3 className="text-xl font-bold text-white flex-1">{question.question}</h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {question.category && BRAND_LIFT_CATEGORY_LABEL[question.category] && (
                              <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-200 font-bold border border-purple-500/30 uppercase tracking-wider whitespace-nowrap">
                                {BRAND_LIFT_CATEGORY_LABEL[question.category]}
                              </span>
                            )}
                            <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                              {question.type === 'single_choice' && 'Single Choice'}
                              {question.type === 'multi_select' && 'Multi-Select'}
                              {question.type === 'rating' && 'Rating Scale'}
                              {question.type === 'open_text' && 'Open Text'}
                            </span>
                          </div>
                        </div>
                        <div className="text-white/40 text-sm">
                          {(() => {
                            const isScreener   = mission.screeningQuestionIds?.has(question.id);
                            const total        = mission.totalRespondents;
                            const qualified    = mission.qualifiedRespondents ?? total;
                            if (hasActiveFilters) {
                              return `${filteredRespondentCount} of ${total} responses`;
                            }
                            if (!mission.hasScreening || isScreener) {
                              return `${total} responses`;
                            }
                            return `${qualified} of ${total} respondents answered`;
                          })()}
                        </div>
                      </div>

                      {renderChart(question)}

                      <div className="mt-6">
                        <AIInsight text={question.aiInsight} />
                      </div>

                      <button
                        onClick={() => setReasoningModal({ open: true, questionId: question.id, questionText: question.question })}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Show sample reasoning
                      </button>
                    </motion.div>
                  );

                  // Detect Brand Lift mode: any question carries a category tag.
                  const isBrandLiftMode = filteredQuestions.some((q) => !!q.category);

                  if (!isBrandLiftMode) {
                    return (
                      <motion.div
                        id="per-question"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6 mb-8 scroll-mt-20"
                      >
                        {filteredQuestions.map((q, i) => renderCard(q, i))}
                      </motion.div>
                    );
                  }

                  // Funnel-order list of category keys; questions outside this
                  // ladder fall into "Other".
                  const CATEGORY_ORDER: Array<keyof typeof BRAND_LIFT_CATEGORY_LABEL> = [
                    'brand_awareness',
                    'brand_recall_unaided',
                    'brand_recall_aided',
                    'ad_recall',
                    'brand_attribution',
                    'message_association',
                    'brand_favorability',
                    'purchase_intent',
                    'recommendation_intent',
                  ];
                  const buckets = new Map<string, QuestionResult[]>();
                  for (const cat of CATEGORY_ORDER) buckets.set(cat, []);
                  buckets.set('__other__', []);
                  filteredQuestions.forEach((q) => {
                    const key = q.category && BRAND_LIFT_CATEGORY_LABEL[q.category] ? q.category : '__other__';
                    buckets.get(key)!.push(q);
                  });
                  // Flatten with running index so animation delay still
                  // reflects scroll order.
                  let runningIdx = 0;
                  const groups = Array.from(buckets.entries()).filter(([, qs]) => qs.length > 0);

                  return (
                    <motion.div
                      id="per-question"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-8 mb-8 scroll-mt-20"
                    >
                      {groups.map(([catKey, qs]) => {
                        const label =
                          catKey === '__other__'
                            ? 'Other'
                            : BRAND_LIFT_CATEGORY_LABEL[catKey];
                        return (
                          <CategoryGroup key={catKey} label={label} count={qs.length}>
                            {qs.map((q) => {
                              const card = renderCard(q, runningIdx);
                              runningIdx += 1;
                              return card;
                            })}
                          </CategoryGroup>
                        );
                      })}
                    </motion.div>
                  );
                })()}

                {/* Pass 23 Bug 23.60 Chunk 7 — Recommended Next Step is now
                    the last call-to-action in the main content flow (the AI
                    disclaimer follows as a footer per spec: "AI disclaimer
                    footer-style"). CTA button got prominence boost: bigger
                    padding, uppercase tracking, scale-on-hover, stronger
                    shadow. Component lives at components/results/. */}
                <RecommendedNextStep />

                {/* Pass 23 Bug 23.60 Chunk 7 — AI Disclosure rendered as a
                    true footer below the primary CTA. Was above Next Step
                    before, which buried the action. */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 mb-4 text-[12px] text-white/30 font-body">
                  <Bot className="w-4 h-4 mt-0.5 shrink-0 text-white/20" />
                  <span>
                    Insights and summaries are generated by VETT AI using synthetic respondents modelled on real demographic data.
                    They are directionally indicative and are not a substitute for primary market research or human survey data.
                    Always validate key findings with your target audience.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <div className={`${
              toast.isGenerating
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 shadow-blue-500/20'
                : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 shadow-green-500/20'
            } border rounded-xl p-4 backdrop-blur-xl shadow-lg flex items-center gap-3 min-w-[300px]`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                toast.isGenerating ? 'bg-blue-500/20' : 'bg-green-500/20'
              }`}>
                {toast.isGenerating ? (
                  <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">{toast.message}</div>
                <div className="text-white/60 text-xs">{toast.subtext}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {missionId && (
        <Suspense fallback={null}>
          <ChatWidget scope="results" missionId={missionId} />
        </Suspense>
      )}

      {/* Pass 22 Bug 22.14 — sample-reasoning modal */}
      <AnimatePresence>
        {reasoningModal.open && missionId && (
          <ReasoningModal
            missionId={missionId}
            questionId={reasoningModal.questionId || ''}
            questionText={reasoningModal.questionText || ''}
            rows={reasoningRows}
            loading={reasoningLoading}
            onClose={() => {
              setReasoningModal({ open: false });
              setReasoningRows(null);
            }}
            onLoad={async (qid) => {
              setReasoningLoading(true);
              try {
                const { api } = await import('../lib/apiClient');
                const res = await api.get(
                  `/api/results/${missionId}/reasoning?question_id=${encodeURIComponent(qid)}&limit=5`
                );
                setReasoningRows(Array.isArray(res?.rows) ? res.rows : []);
              } catch {
                setReasoningRows([]);
              } finally {
                setReasoningLoading(false);
              }
            }}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

// Pass 22 Bug 22.14 — modal listing up to 5 persona-level reasoning quotes
// for one question. Persona ids are anonymized to "Persona 1, 2, 3..." for
// privacy; reasoning_text is shown verbatim.
function ReasoningModal({
  missionId,
  questionId,
  questionText,
  rows,
  loading,
  onClose,
  onLoad,
}: {
  missionId: string;
  questionId: string;
  questionText: string;
  rows: Array<{ persona_id: string; response_value: string | null; reasoning_text: string }> | null;
  loading: boolean;
  onClose: () => void;
  onLoad: (questionId: string) => Promise<void>;
}) {
  useEffect(() => {
    if (questionId) onLoad(questionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, missionId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-white/20 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-white/10">
          <div>
            <div className="text-purple-300 text-xs font-bold uppercase tracking-widest mb-1">
              Sample Reasoning
            </div>
            <h3 className="text-white font-bold text-lg leading-snug">{questionText}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <span className="text-white/70">✕</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-white/40 text-sm">
              Loading sample reasoning...
            </div>
          ) : !rows || rows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 text-sm">No reasoning data for this question yet.</p>
              <p className="text-white/40 text-xs mt-2">
                Reasoning is captured for missions with up to 50 personas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((r, i) => (
                <div key={r.persona_id + i} className="border-l-2 border-purple-400/40 pl-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-white font-semibold text-sm">Persona {i + 1}</span>
                    {r.response_value && (
                      <span className="text-purple-300 text-xs font-mono">
                        chose &quot;{r.response_value}&quot;
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed italic">{r.reasoning_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
