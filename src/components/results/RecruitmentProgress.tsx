/**
 * Pass 42 E1 — live recruitment progress widget for ProcessingPage.
 *
 * Polls GET /api/missions/:id/progress every 5s while the mission
 * is in 'recruiting' or 'pending'. Disappears once the loop exits
 * (target_hit OR ceiling_hit) so the surrounding processing UI
 * can show its synthesis-step view.
 *
 * Honest copy on the "strict screener" warning: only shown when
 * recruited > target * 3, which is the spec threshold.
 */
import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';

interface ProgressResponse {
  recruited: number;
  qualified: number;
  target: number;
  status: 'pending' | 'recruiting' | 'target_hit' | 'ceiling_hit';
  spent_usd: number;
  spend_ceiling_usd: number;
  mission_status: string;
}

interface Props {
  missionId: string;
}

export function RecruitmentProgress({ missionId }: Props) {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const r = (await api.get(`/api/missions/${missionId}/progress`)) as ProgressResponse;
        if (cancelled) return;
        setData(r);
        setError(null);
        // Stop polling when the loop has exited.
        if (r.status === 'target_hit' || r.status === 'ceiling_hit') return;
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'progress fetch failed');
      }
      timer = setTimeout(tick, 5000);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [missionId]);

  if (error || !data) return null;
  // Hide once the loop has finished — the surrounding processing
  // step view takes over.
  if (data.status === 'target_hit' || data.status === 'ceiling_hit') return null;

  const remaining = Math.max(0, data.target - data.qualified);
  const pct = data.target > 0 ? Math.min(100, (data.qualified / data.target) * 100) : 0;
  const tooManyRecruited = data.recruited > data.target * 3;

  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-6">
      <p className="text-xs text-t3 uppercase mb-2 tracking-widest font-display font-bold">
        Recruitment
      </p>
      <p className="text-t1 text-sm leading-relaxed">
        Generated <strong className="text-white tabular-nums">{data.recruited}</strong> personas
        {' · '}
        <strong className="text-lime tabular-nums">{data.qualified}</strong> qualified
        {' · '}
        <strong className="text-white tabular-nums">{remaining}</strong> more needed
      </p>
      <div className="mt-3 h-2 bg-bg3 rounded-full overflow-hidden">
        <div
          className="h-full bg-lime rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {tooManyRecruited && (
        <p className="text-amber-400 text-xs mt-2">
          Your screener is tighter than typical — recruitment is taking longer.
        </p>
      )}
    </div>
  );
}
