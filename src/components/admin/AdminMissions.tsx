import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, BarChart2, CheckCircle2, Trash2, Loader2, Search, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminMission {
  id: string;
  user_id: string;
  status: string;
  goal_type: string;
  brief: string;
  total_price_usd: number;
  ai_cost_usd: number;
  margin_usd: number;
  respondent_count: number;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  user: { first_name?: string; last_name?: string; company_name?: string } | null;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed:  'bg-green-500/15 text-green-400 border-green-500/20',
    processing: 'bg-primary/15 text-primary border-primary/20',
    paid:       'bg-blue-500/15 text-blue-400 border-blue-500/20',
    failed:     'bg-red-500/15 text-red-400 border-red-500/20',
    draft:      'bg-gray-700 text-gray-400 border-gray-600',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${map[status] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
      {status}
    </span>
  );
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export const AdminMissions = ({ apiFetch }: { apiFetch: (path: string, opts?: RequestInit) => Promise<Response> }) => {
  const navigate = useNavigate();
  const [missions, setMissions]         = useState<AdminMission[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [busy, setBusy]                 = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset]             = useState(0);
  const LIMIT = 50;

  const fetchMissions = useCallback(async (s: string, sf: string, off: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) });
      if (s)  params.set('search', s);
      if (sf) params.set('status', sf);
      const res = await apiFetch(`/api/admin/missions?${params}`);
      const json = await res.json();
      setMissions(Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      setTotal(json.total ?? 0);
    } catch {
      toast.error('Failed to load missions');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchMissions(search, statusFilter, offset); }, [fetchMissions, search, statusFilter, offset]);

  const deleteMission = async (id: string) => {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/missions/${id}`, { method: 'DELETE' });
      setMissions(m => m.filter(x => x.id !== id));
      toast.success('Mission deleted');
    } catch {
      toast.error('Delete failed');
    }
    setBusy(false);
    setConfirmDelete(null);
  };

  const forceComplete = async (id: string) => {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/missions/${id}/force-complete`, { method: 'PATCH' });
      setMissions(m => m.map(x => x.id === id ? { ...x, status: 'completed', completed_at: new Date().toISOString() } : x));
      toast.success('Marked as completed');
    } catch {
      toast.error('Force-complete failed');
    }
    setBusy(false);
  };

  const reanalyze = async (id: string) => {
    setBusy(true);
    const t = toast.loading('Reanalyzing mission…');
    try {
      const res = await apiFetch(`/api/admin/missions/${id}/reanalyze`, { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Reanalyze failed');
      }
      const j = await res.json();
      toast.success(`Reanalyzed (summary ${j.executive_summary_length || 0} chars)`, { id: t });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Reanalyze failed', { id: t });
    }
    setBusy(false);
  };

  /**
   * Pass 21 Bug 20 — bulk-reanalyze all stale missions. Two-step UX:
   *   1. dryRun fetch shows the candidate count and asks for confirmation.
   *   2. On confirm, real run processes up to 25 missions sequentially.
   * The button is disabled while any single-mission action is in flight
   * to keep cost predictable.
   */
  const bulkReanalyze = async () => {
    setBusy(true);
    const t = toast.loading('Finding stale missions…');
    try {
      const dry = await apiFetch('/api/admin/missions/bulk-reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true, limit: 25 }),
      });
      if (!dry.ok) {
        const j = await dry.json().catch(() => ({}));
        throw new Error(j.error || 'Dry run failed');
      }
      const dryJson = await dry.json();
      const count = Number(dryJson.totalStale || 0);
      toast.dismiss(t);

      if (count === 0) {
        toast.success('No stale missions found');
        return;
      }
      const ok = window.confirm(
        `Reanalyze ${count} stale mission${count === 1 ? '' : 's'}? ` +
        `Each call costs ~$0.10–0.30 in AI spend. The action runs sequentially ` +
        `and reports per-mission success/failure when done.`
      );
      if (!ok) return;

      const t2 = toast.loading(`Reanalyzing ${count} mission${count === 1 ? '' : 's'}…`);
      const res = await apiFetch('/api/admin/missions/bulk-reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 25 }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Bulk reanalyze failed');
      }
      const j = await res.json();
      const succeeded = Number(j.succeeded || 0);
      const failed = Number(j.failed || 0);
      if (failed === 0) {
        toast.success(`Reanalyzed ${succeeded} mission${succeeded === 1 ? '' : 's'}`, { id: t2 });
      } else {
        toast.error(`Reanalyzed ${succeeded}, failed ${failed} — check Railway logs`, { id: t2 });
      }
      // Refresh the table so updated rows show their new state.
      fetchMissions(search, statusFilter, offset);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bulk reanalyze failed');
    } finally {
      setBusy(false);
    }
  };

  const STATUS_OPTIONS = ['', 'draft', 'paid', 'processing', 'completed', 'failed'];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setOffset(0); }}
            placeholder="Search briefs…"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setOffset(0); }}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
        <button
          onClick={() => fetchMissions(search, statusFilter, offset)}
          className="p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"
          title="Refresh mission list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        {/* Pass 21 Bug 20 — bulk reanalyze stale missions. */}
        <button
          onClick={bulkReanalyze}
          disabled={busy}
          title="Reanalyze all stale missions (null/short summary, missing insights, or analysis_error)"
          className="flex items-center gap-1.5 px-3 py-2.5 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-300 hover:bg-violet-500/20 disabled:opacity-40 transition-colors text-xs font-bold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reanalyze stale</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="w-full text-[12px]">
          <thead className="bg-gray-900/60">
            <tr className="text-gray-500 font-bold uppercase tracking-wider">
              {['Brief', 'User', 'Status', 'Resp.', 'Revenue', 'AI Cost', 'Margin', 'Created', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {loading && (
              <tr><td colSpan={9} className="text-center py-10 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </td></tr>
            )}
            {!loading && missions.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-gray-500">No missions found</td></tr>
            )}
            {!loading && missions.map(m => {
              const userName = m.user
                ? [m.user.first_name, m.user.last_name].filter(Boolean).join(' ') || m.user.company_name || '—'
                : '—';
              return (
                <tr key={m.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="px-4 py-3 max-w-[180px] text-white font-medium truncate">{m.brief?.slice(0, 60) || '(untitled)'}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{userName}</td>
                  <td className="px-4 py-3">{statusBadge(m.status)}</td>
                  <td className="px-4 py-3 text-gray-400">{m.respondent_count}</td>
                  <td className="px-4 py-3 text-white font-semibold">${(m.total_price_usd || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-400">${(m.ai_cost_usd || 0).toFixed(2)}</td>
                  <td className={`px-4 py-3 font-semibold ${(m.margin_usd || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${(m.margin_usd || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(m.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/results/${m.id}`)}
                        title="View results"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                      {m.status !== 'completed' && (
                        <button
                          onClick={() => forceComplete(m.id)}
                          disabled={busy}
                          title="Force complete"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {m.status === 'completed' && (
                        <button
                          onClick={() => reanalyze(m.id)}
                          disabled={busy}
                          title="Reanalyze insights"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-400/10 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(m.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
              disabled={offset === 0}
              className="px-4 py-2 text-xs font-bold bg-gray-900 border border-gray-700 rounded-xl text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(o => o + LIMIT)}
              disabled={offset + LIMIT >= total}
              className="px-4 py-2 text-xs font-bold bg-gray-900 border border-gray-700 rounded-xl text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-black text-white text-lg mb-2">Delete mission?</h3>
            <p className="text-gray-400 text-sm mb-6">This permanently deletes the mission and all its responses. Cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMission(confirmDelete)}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
