/**
 * Pass 35 A6 — Admin Support: full build (was Coming soon stub).
 *
 * Backend: /api/admin/support GET list, PATCH :id (status, priority,
 * admin_notes), POST :id/ai-draft AI suggestion.
 *
 * UI: filter chip row + table + side drawer with status/priority
 * dropdowns + admin notes textarea + Mark Resolved button.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Headphones, Loader2, AlertCircle, X,
  Mail, MessageSquare, Smartphone, Globe,
} from 'lucide-react';

interface Ticket {
  id: string;
  user_id: string | null;
  mission_id: string | null;
  subject: string;
  body: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channel: 'web' | 'email' | 'mobile' | 'api';
  created_at: string;
  resolved_at: string | null;
  admin_notes: string | null;
  ai_draft_response?: string | null;
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

const STATUS_COLOR: Record<Ticket['status'], string> = {
  open:        'bg-amber-500/15 text-amber-300 border-amber-500/30',
  in_progress: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  resolved:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  closed:      'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const PRIORITY_COLOR: Record<Ticket['priority'], string> = {
  low:    'bg-gray-700/40 text-gray-300',
  medium: 'bg-blue-700/40 text-blue-300',
  high:   'bg-amber-700/40 text-amber-300',
  urgent: 'bg-red-700/40 text-red-300',
};

const CHANNEL_ICON = {
  web:    Globe,
  email:  Mail,
  mobile: Smartphone,
  api:    MessageSquare,
} as const;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

interface AdminSupportProps {
  apiFetch: (path: string, opts?: RequestInit) => Promise<Response>;
}

export const AdminSupport = ({ apiFetch }: AdminSupportProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [filter, setFilter]   = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter === 'all' ? '' : `?status=${filter}`;
      const res = await apiFetch(`/api/admin/support${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, filter]);

  useEffect(() => { load(); }, [load]);

  const updateTicket = async (
    id: string,
    patch: Partial<Pick<Ticket, 'status' | 'priority' | 'admin_notes'>>,
  ) => {
    setUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: Ticket = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (selected?.id === id) setSelected(updated);
    } catch {
      load();
    } finally {
      setUpdating(false);
    }
  };

  const FILTERS: Array<{ id: StatusFilter; label: string }> = [
    { id: 'all',         label: 'All' },
    { id: 'open',        label: 'Open' },
    { id: 'in_progress', label: 'In progress' },
    { id: 'resolved',    label: 'Resolved' },
    { id: 'closed',      label: 'Closed' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Headphones className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-black text-white">Support tickets</h2>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-bold transition-colors',
              filter === f.id
                ? 'bg-primary text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-2xl overflow-hidden">
        {error ? (
          <div className="flex items-center gap-3 p-8 text-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 font-bold">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-900/50 border-b border-gray-800">
                <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Channel</th>
                  <th className="px-4 py-2.5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  </td></tr>
                )}
                {!loading && tickets.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    No tickets in this view.
                  </td></tr>
                )}
                {!loading && tickets.map((t) => {
                  const Channel = CHANNEL_ICON[t.channel] ?? Globe;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5 text-white font-medium max-w-[320px] truncate">
                        {t.subject}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_COLOR[t.status]}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${PRIORITY_COLOR[t.priority]}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Channel className="w-3.5 h-3.5" />
                          {t.channel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                        {fmtTime(t.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSelected(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#0a111e] border-l border-gray-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-black text-white pr-4">{selected.subject}</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {selected.body}
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Status</p>
                  <select
                    value={selected.status}
                    onChange={(e) => updateTicket(selected.id, { status: e.target.value as Ticket['status'] })}
                    disabled={updating}
                    className="w-full bg-[#0f172a] border border-gray-800 rounded-lg px-3 py-2 text-white text-xs"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Priority</p>
                  <select
                    value={selected.priority}
                    onChange={(e) => updateTicket(selected.id, { priority: e.target.value as Ticket['priority'] })}
                    disabled={updating}
                    className="w-full bg-[#0f172a] border border-gray-800 rounded-lg px-3 py-2 text-white text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Admin notes</p>
                <textarea
                  value={selected.admin_notes ?? ''}
                  onChange={(e) => setSelected({ ...selected, admin_notes: e.target.value })}
                  onBlur={(e) => updateTicket(selected.id, { admin_notes: e.target.value })}
                  placeholder="Internal notes (not visible to customer)…"
                  rows={4}
                  className="w-full bg-[#0f172a] border border-gray-800 rounded-lg px-3 py-2 text-white text-xs"
                />
              </div>
              <div className="text-[10px] text-gray-500 space-y-1">
                <p>Created {fmtTime(selected.created_at)}</p>
                {selected.resolved_at && <p>Resolved {fmtTime(selected.resolved_at)}</p>}
                <p className="font-mono">ID: {selected.id}</p>
              </div>
            </div>
            {selected.status !== 'resolved' && selected.status !== 'closed' && (
              <div className="px-6 py-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => updateTicket(selected.id, { status: 'resolved' })}
                  disabled={updating}
                  className="w-full py-3 rounded-xl bg-primary text-black font-black text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Mark resolved
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSupport;
