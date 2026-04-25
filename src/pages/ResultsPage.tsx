import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileJson,
  Sparkles,
  Users,
  Clock,
  Rocket,
  Filter,
  AlertCircle,
  MessageSquare,
  Share2,
  FileDown,
  Bot,
  Target
} from 'lucide-react';
import { ChatWidget } from '../components/chat/ChatWidget';
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
}

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
  const [missionFailed, setMissionFailed] = useState<{ reason: string } | null>(null);
  const [screeningFunnel, setScreeningFunnel] = useState<{ total: number; passed: number; screenedOut: number } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
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
      if (data.status === 'failed') {
        setMissionFailed({ reason: data.error || 'Mission could not complete.' });
        setResultsProgress(null);
        firstPollAtRef.current = null;
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
          ? [perQItem.headline, perQItem.body].filter(Boolean).join(' — ')
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
          return { id: qid, question: qText, type: 'rating', data: ratingData, averageScore: avg, aiInsight };
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
    const csv = rows.map((r) => r.join(',')).join('\n');
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
        // Brief still generating — notify and bail
        const data = await res.json().catch(() => ({}));
        setNotification({
          type: 'info',
          message: 'Targeting brief is generating…',
          subtext: data.error || 'Try again in about a minute',
        });
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

      setNotification({
        type: 'success',
        message: 'Targeting Brief downloaded',
        subtext: 'Ready to paste into Meta Ads, Google, or LinkedIn',
      });
    } catch (err) {
      console.error('Targeting brief export failed:', err);
      setNotification({
        type: 'error',
        message: 'Targeting brief export failed',
        subtext: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setBriefDownloading(false);
    }
  };

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Fallback: select and copy
      const el = document.createElement('textarea');
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

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
      case 'single_choice':
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

      case 'multi_select':
        const maxCount = Math.max(...result.data.map(item => item.count));
        return (
          <ResponsiveContainer width="100%" height={Math.max(300, result.data.length * 50)}>
            <BarChart data={result.data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#fff" tick={{ fill: '#fff' }} />
              <YAxis dataKey="feature" type="category" stroke="#fff" tick={{ fill: '#fff' }} width={150} />
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
              <Bar dataKey="count" fill="#8B5CF6" radius={[0, 8, 8, 0]}>
                {result.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count === maxCount ? '#10B981' : '#8B5CF6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'rating':
        return (
          <div className="space-y-6">
            {result.averageScore && (
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-6xl font-black text-white mb-2">{result.averageScore.toFixed(1)}</div>
                  <div className="text-white/60 text-sm font-medium">Average Score</div>
                  <div className="text-white/40 text-xs">out of 5.0</div>
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

  // Pass 20 Bug 7: failed state — surface the persisted reason from the
  // backend (mission_assets.analysis_error.message, or generic fallback)
  // and offer a contact email. Polling is already stopped at fetch time.
  if (missionFailed) {
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 rounded-full bg-red-900/40 border border-red-700/60 flex items-center justify-center mx-auto mb-8">
              <span className="text-3xl">⚠</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-3">Mission Failed</h2>
            <p className="text-white/70 mb-6">{missionFailed.reason}</p>
            <a
              href="mailto:hello@vettit.ai"
              className="inline-block px-5 py-2.5 rounded-lg bg-primary text-black font-semibold hover:bg-primary/90 transition"
            >
              Contact support
            </a>
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

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-24">
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

            {/* Share button */}
            <button
              onClick={handleShareLink}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm font-medium shrink-0"
            >
              {shareCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </button>

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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative z-0 mb-8"
                >
                  <div className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-2xl p-8 backdrop-blur-xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                          <Sparkles className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">Executive Summary</h2>
                      </div>

                      {mission.executiveSummary ? (
                        <p className="text-white/80 text-lg leading-relaxed">{mission.executiveSummary}</p>
                      ) : (
                        <p className="text-white/50 text-base italic">Executive summary is being generated...</p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Screening Funnel card — only shown when mission has a screening question */}
                {screeningFunnel && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
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

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-8 mb-12"
                >
                  {filteredQuestions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                    >
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-white flex-1">{question.question}</h3>
                          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                            {question.type === 'single_choice' && 'Single Choice'}
                            {question.type === 'multi_select' && 'Multi-Select'}
                            {question.type === 'rating' && 'Rating Scale'}
                            {question.type === 'open_text' && 'Open Text'}
                          </span>
                        </div>
                        {/*
                          Pass 21 Bug 6 (Option B) per-question sub-header:
                            • Screener Q (or no screening on mission): "N responses"
                            • Non-screener Q on screening mission:     "X of N respondents answered"
                              where X = qualified, N = total simulated
                          When a filter is active we still show the filtered count
                          on the left to preserve the prior interaction.
                        */}
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

                      <div className="mt-6 bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20 flex-shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-purple-300 text-xs font-bold uppercase tracking-wide mb-1">AI Insight</div>
                            {question.aiInsight ? (
                              <p className="text-white/90 text-sm leading-relaxed">{question.aiInsight}</p>
                            ) : (
                              <p className="text-white/40 text-sm italic">AI insight not yet available for this question.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* AI Disclosure Footer */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 mb-8 text-[12px] text-white/30 font-body">
                  <Bot className="w-4 h-4 mt-0.5 shrink-0 text-white/20" />
                  <span>
                    Insights and summaries are generated by VETT AI using synthetic respondents modelled on real demographic data.
                    They are directionally indicative and are not a substitute for primary market research or human survey data.
                    Always validate key findings with your target audience.
                  </span>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-8"
                >
                  <div className="relative bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/30 rounded-2xl p-8 backdrop-blur-xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                          <Rocket className="w-6 h-6 text-green-400" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">Recommended Next Step</h2>
                      </div>

                      <p className="text-white/80 text-base leading-relaxed mb-6">
                        Review the patterns in your results and consider launching a follow-up mission to
                        dig deeper into any question that surfaced unexpected findings — or to test a
                        specific hypothesis with a more targeted audience segment.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => navigate('/mission-control')}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                        >
                          <Rocket className="w-5 h-5" />
                          Launch Follow-Up Mission
                        </button>

                        <button
                          onClick={() => navigate('/dashboard')}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-bold hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                        >
                          <ArrowLeft className="w-5 h-5" />
                          Back to Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
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

      {missionId && <ChatWidget scope="results" missionId={missionId} />}
    </DashboardLayout>
  );
};
