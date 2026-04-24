/**
 * VETT — Creative Attention Results Page.
 * Route: /creative-results/:missionId
 *
 * Shows:
 *  - Overall Engagement Score (gauge)
 *  - Emotion timeline (Recharts LineChart)
 *  - Attention arc description
 *  - Strengths / Weaknesses / Recommendations
 *  - Frame-by-frame gallery
 *  - "vs Benchmark" callout
 *  - Platform fit pills
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  ArrowLeft, Loader2, Film, TrendingUp, TrendingDown,
  Minus, AlertCircle, CheckCircle2, Lightbulb,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FrameAnalysis {
  timestamp: number;
  emotions: Record<string, number>;
  attention_hotspots: string[];
  message_clarity: number;
  audience_resonance: number;
  engagement_score: number;
  brief_description: string;
}

interface EmotionPeak {
  emotion: string;
  peak_timestamp: number;
  peak_value: number;
  interpretation: string;
}

interface CreativeSummary {
  overall_engagement_score: number;
  emotion_peaks: EmotionPeak[];
  attention_arc: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  vs_benchmark: string;
  best_platform_fit: string[];
}

interface CreativeAnalysis {
  frame_analyses: FrameAnalysis[];
  summary: CreativeSummary;
  total_frames: number;
  is_video: boolean;
  generated_at: string;
}

// ── Emotion color map ─────────────────────────────────────────────────────────

const EMOTION_COLORS: Record<string, string> = {
  joy:          '#BEF264', // lime
  trust:        '#60A5FA', // blue
  surprise:     '#F59E0B', // amber
  anticipation: '#A78BFA', // violet
  fear:         '#F87171', // red
  sadness:      '#6B7280', // gray
  disgust:      '#10B981', // emerald
  anger:        '#EF4444', // red-500
};

// ── Gauge component ───────────────────────────────────────────────────────────

function EngagementGauge({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const color = clamped >= 70 ? '#BEF264' : clamped >= 40 ? '#F59E0B' : '#F87171';

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-36 h-36 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(${color} ${clamped * 3.6}deg, #1F2937 0deg)`,
        }}
      >
        <div className="w-28 h-28 rounded-full bg-[var(--bg)] flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{clamped}</span>
          <span className="text-[10px] text-[var(--t3)] uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <p className="text-sm font-medium text-[var(--t2)]">Overall Engagement</p>
    </div>
  );
}

// ── Trend icon ────────────────────────────────────────────────────────────────

function TrendIcon({ value }: { value: number }) {
  if (value >= 65) return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (value >= 40) return <Minus className="w-4 h-4 text-amber-400" />;
  return <TrendingDown className="w-4 h-4 text-red-400" />;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CreativeAttentionResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission,    setMission]    = useState<Record<string, unknown> | null>(null);
  const [analysis,   setAnalysis]   = useState<CreativeAnalysis | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [polling,    setPolling]    = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!missionId) return;

    const fetchMission = async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('*')
        .eq('id', missionId)
        .single();

      if (fetchErr || !data) {
        setError('Mission not found');
        setLoading(false);
        return;
      }

      setMission(data);

      if (data.creative_analysis) {
        setAnalysis(data.creative_analysis as CreativeAnalysis);
        setLoading(false);
        setPolling(false);
      } else if (data.status === 'failed') {
        setError('Creative analysis failed. Please contact support.');
        setLoading(false);
      } else {
        // Still processing — poll
        setPolling(true);
        setLoading(false);
      }
    };

    fetchMission();
  }, [missionId]);

  // Poll every 5s if still processing
  useEffect(() => {
    if (!polling || !missionId) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('missions')
        .select('creative_analysis, status')
        .eq('id', missionId)
        .single();

      if (data?.creative_analysis) {
        setAnalysis(data.creative_analysis as CreativeAnalysis);
        setPolling(false);
      } else if (data?.status === 'failed') {
        setError('Creative analysis failed. Please contact support.');
        setPolling(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [polling, missionId]);

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--lime)] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4 text-center px-5">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-bold text-[var(--t1)]">{error}</h2>
        <Link to="/dashboard" className="text-[var(--lime)] text-sm hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (polling) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4 text-center px-5">
        <div className="relative">
          <Film className="w-16 h-16 text-purple-400" />
          <Loader2 className="w-6 h-6 text-[var(--lime)] animate-spin absolute -bottom-1 -right-1" />
        </div>
        <h2 className="text-xl font-bold text-[var(--t1)]">Analyzing your creative…</h2>
        <p className="text-[var(--t2)] text-sm max-w-sm">
          Claude AI is reviewing each frame for emotion, attention, and engagement.
          This takes 1–3 minutes for a 30-second video.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--t3)]">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          Processing — this page updates automatically
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const { summary, frame_analyses } = analysis;

  // Build chart data from frame analyses
  const chartData = frame_analyses.map((f) => ({
    t: f.timestamp,
    ...Object.fromEntries(
      Object.entries(f.emotions).map(([k, v]) => [k, v])
    ),
    engagement: f.engagement_score,
  }));

  // Top 3 most variable emotions (most signal)
  const emotionVariance: Record<string, number> = {};
  for (const emotion of Object.keys(frame_analyses[0]?.emotions ?? {})) {
    const vals = frame_analyses.map((f) => f.emotions[emotion] ?? 0);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    emotionVariance[emotion] = variance;
  }
  const topEmotions = Object.entries(emotionVariance)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([e]) => e);

  const title = (mission?.title as string) || 'Creative Analysis';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      {/* Nav */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[var(--b1)] bg-[var(--bg)]/90 backdrop-blur">
        <Link to="/landing"><Logo /></Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--t2)] hover:text-[var(--t1)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 space-y-12">
        {/* Title */}
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <Film className="w-3.5 h-3.5" />
            Creative Attention Analysis
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        </div>

        {/* Hero metrics row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 flex flex-col items-center">
            <EngagementGauge score={summary.overall_engagement_score} />
          </div>

          <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
            <p className="text-xs text-[var(--t3)] font-semibold uppercase tracking-wider mb-3">
              Attention Arc
            </p>
            <p className="text-sm text-[var(--t1)] leading-relaxed">{summary.attention_arc}</p>
          </div>

          <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
            <p className="text-xs text-[var(--t3)] font-semibold uppercase tracking-wider mb-3">
              Best Platform Fit
            </p>
            <div className="flex flex-wrap gap-2">
              {(summary.best_platform_fit || []).map((p) => (
                <span
                  key={p}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/15 border border-purple-500/30 text-purple-300"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* vs Benchmark */}
        {summary.vs_benchmark && (
          <div className="bg-[var(--bg2)] border border-[var(--lime)]/20 rounded-2xl p-5 flex items-start gap-3">
            <TrendIcon value={summary.overall_engagement_score} />
            <p className="text-sm text-[var(--t1)] leading-relaxed">{summary.vs_benchmark}</p>
          </div>
        )}

        {/* Emotion Timeline */}
        {chartData.length > 1 && (
          <section>
            <h2 className="text-lg font-bold mb-4">Emotion Timeline</h2>
            <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="t"
                    tickFormatter={(v: number) => `${v}s`}
                    tick={{ fill: 'var(--t3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'var(--t3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg3,#1a2233)',
                      border: '1px solid var(--b1)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(val: number, name: string) => [val, name]}
                    labelFormatter={(l: number) => `${l}s`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {topEmotions.map((emotion) => (
                    <Line
                      key={emotion}
                      type="monotone"
                      dataKey={emotion}
                      stroke={EMOTION_COLORS[emotion] ?? '#9CA3AF'}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="#E5E7EB"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={false}
                    name="engagement"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Emotion peaks */}
        {(summary.emotion_peaks || []).length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">Peak Moments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.emotion_peaks.map((peak, i) => (
                <div key={i} className="bg-[var(--bg2)] border border-[var(--b1)] rounded-xl p-4 flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: EMOTION_COLORS[peak.emotion] + '22', color: EMOTION_COLORS[peak.emotion] ?? '#BEF264' }}
                  >
                    {peak.peak_value}
                  </span>
                  <div>
                    <p className="text-sm font-semibold capitalize">{peak.emotion} @ {peak.peak_timestamp}s</p>
                    <p className="text-xs text-[var(--t3)] mt-0.5 leading-relaxed">{peak.interpretation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Strengths / Weaknesses / Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strengths */}
          <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-green-400">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {(summary.strengths || []).map((s, i) => (
                <li key={i} className="text-xs text-[var(--t2)] leading-relaxed flex gap-2">
                  <span className="text-green-400 shrink-0">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400">Weaknesses</h3>
            </div>
            <ul className="space-y-2">
              {(summary.weaknesses || []).map((w, i) => (
                <li key={i} className="text-xs text-[var(--t2)] leading-relaxed flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-[var(--lime)]" />
              <h3 className="text-sm font-semibold text-[var(--lime)]">Recommendations</h3>
            </div>
            <ul className="space-y-2">
              {(summary.recommendations || []).map((r, i) => (
                <li key={i} className="text-xs text-[var(--t2)] leading-relaxed flex gap-2">
                  <span className="text-[var(--lime)] shrink-0 font-bold">{i + 1}.</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Frame gallery */}
        {frame_analyses.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">Frame-by-Frame Breakdown</h2>
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4">
                {frame_analyses.map((f, i) => {
                  const topEmotion = Object.entries(f.emotions)
                    .sort((a, b) => b[1] - a[1])[0];
                  return (
                    <div
                      key={i}
                      className="shrink-0 w-48 bg-[var(--bg2)] border border-[var(--b1)] rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-[var(--t3)]">{f.timestamp}s</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: (EMOTION_COLORS[topEmotion?.[0]] ?? '#BEF264') + '22',
                            color: EMOTION_COLORS[topEmotion?.[0]] ?? '#BEF264',
                          }}
                        >
                          {f.engagement_score}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--t2)] leading-snug">{f.brief_description}</p>
                      {topEmotion && (
                        <p className="text-[10px] text-[var(--t3)] capitalize">
                          ↑ {topEmotion[0]} ({topEmotion[1]})
                        </p>
                      )}
                      {(f.attention_hotspots || []).slice(0, 1).map((h, j) => (
                        <p key={j} className="text-[10px] text-[var(--t3)] italic">"{h}"</p>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
