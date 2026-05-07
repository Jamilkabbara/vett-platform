import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  User,
  Building2,
  Briefcase,
  Layers,
  DollarSign,
  CalendarDays,
  Target,
  StickyNote,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  company_name: string;
  role: string;
  project_stage: string;
  is_admin: boolean;
  created_at: string;
  mission_count: number;
  ltv_usd: number;
  paid_count: number;
}

interface UserMission {
  id: string;
  status: string;
  goal_type: string;
  brief: string;
  total_price_usd: number;
  created_at: string;
}

interface UserNote {
  id: string;
  content: string;
  created_at: string;
}

interface UserTotals {
  mission_count: number;
  paid_count: number;
  ltv_usd: number;
  avg_order: number;
}

interface UserDetail {
  profile: UserRow;
  missions: UserMission[];
  notes: UserNote[];
  totals: UserTotals;
}

/**
 * Pass 32 X4 — server response shape. Backend returns the row array
 * under `data` (matches AdminMissions, AdminPaymentErrors and the
 * other admin list endpoints). The legacy frontend interface declared
 * `users` and read `json.users`, which silently resolved to undefined
 * — totals showed correctly (3) but the table body was always empty.
 */
interface UsersListResponse {
  data: UserRow[];
  total: number;
  limit: number;
  offset: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Pass 32 X9 — derive 1–2 char avatar initials from a profile.
 * Falls back through first/last → full_name → company → id so the
 * drawer never renders the "?" placeholder. The legacy fallback
 * literally rendered "?" any time first_name was null, even when
 * full_name and company were perfectly fine.
 */
function profileInitials(p: { first_name?: string; last_name?: string; full_name?: string; company_name?: string; id?: string } | null | undefined): string {
  if (!p) return '';
  const f = (p.first_name || '').trim();
  const l = (p.last_name || '').trim();
  if (f || l) return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  const full = (p.full_name || '').trim();
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    const a = parts[0]?.charAt(0) ?? '';
    const b = parts[1]?.charAt(0) ?? '';
    const combined = `${a}${b}`.trim();
    if (combined) return combined.toUpperCase();
  }
  const company = (p.company_name || '').trim();
  if (company) {
    const parts = company.split(/\s+/).filter(Boolean);
    const a = parts[0]?.charAt(0) ?? '';
    const b = parts[1]?.charAt(0) ?? '';
    const combined = `${a}${b}`.trim();
    if (combined) return combined.toUpperCase();
  }
  if (p.id) return p.id.charAt(0).toUpperCase();
  return '·';
}

const fmtCurrency = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`;

const statusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'live':
    case 'completed':
      return 'text-primary bg-primary/10';
    case 'draft':
      return 'text-gray-400 bg-white/5';
    case 'paused':
      return 'text-yellow-400 bg-yellow-400/10';
    case 'cancelled':
      return 'text-red-400 bg-red-400/10';
    default:
      return 'text-gray-400 bg-white/5';
  }
};

// ── User Detail Drawer ─────────────────────────────────────────────────────

interface UserDetailDrawerProps {
  userId: string;
  apiFetch: (path: string, opts?: RequestInit) => Promise<Response>;
  onClose: () => void;
}

const UserDetailDrawer = ({ userId, apiFetch, onClose }: UserDetailDrawerProps) => {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Fetch user detail
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    apiFetch(`/api/admin/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: UserDetail) => {
        if (!cancelled) setDetail(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load user');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, apiFetch]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteText.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newNote: UserNote = await res.json();
      setDetail((prev) =>
        prev ? { ...prev, notes: [newNote, ...prev.notes] } : prev
      );
      setNoteText('');
      setNoteSuccess(true);
      setTimeout(() => setNoteSuccess(false), 2000);
    } catch {
      // keep note text so user can retry
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col bg-[#0a111e] border-l border-gray-800 shadow-2xl overflow-hidden"
        style={{ animation: 'slideInRight 0.22s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-black text-white tracking-tight">User Detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm font-bold">{error}</p>
            </div>
          )}

          {detail && (
            <>
              {/* Profile */}
              <section>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-black text-lg">
                      {profileInitials(detail.profile)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-white truncate">
                        {detail.profile.full_name}
                      </h3>
                      {detail.profile.is_admin && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-black">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-0.5">
                      {detail.profile.role} · {detail.profile.company_name}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Stage: {detail.profile.project_stage}
                    </p>
                  </div>
                </div>

                {/* Totals grid */}
                <div className="grid grid-cols-4 gap-3 mt-5">
                  {[
                    { label: 'LTV', value: fmtCurrency(detail.totals.ltv_usd) },
                    { label: 'Missions', value: detail.totals.mission_count },
                    { label: 'Paid', value: detail.totals.paid_count },
                    { label: 'Avg Order', value: fmtCurrency(detail.totals.avg_order) },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-[#0f172a] border border-gray-800 rounded-xl p-3 text-center"
                    >
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                        {label}
                      </p>
                      <p className="text-base font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <p className="text-gray-600 text-xs mt-3">
                  Member since {fmtDate(detail.profile.created_at)}
                </p>
              </section>

              {/* Missions */}
              <section>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  Missions ({detail.missions.length})
                </h4>
                {detail.missions.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">No missions yet</p>
                ) : (
                  <div className="space-y-3">
                    {detail.missions.map((m) => (
                      <div
                        key={m.id}
                        className="bg-[#0f172a] border border-gray-800 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor(m.status)}`}
                            >
                              {m.status}
                            </span>
                            <span className="text-xs text-gray-500 font-bold capitalize">
                              {m.goal_type}
                            </span>
                          </div>
                          <span className="text-primary font-black text-sm flex-shrink-0">
                            ${m.total_price_usd}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                          {m.brief}
                        </p>
                        <p className="text-gray-600 text-xs mt-2">{fmtDate(m.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Notes */}
              <section>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <StickyNote className="w-3.5 h-3.5" />
                  Notes ({detail.notes.length})
                </h4>

                {/* Add note */}
                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 mb-4">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note about this user..."
                    rows={3}
                    className="w-full bg-transparent text-white text-sm placeholder-gray-600 resize-none outline-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                    <span className="text-gray-600 text-xs">
                      {noteText.length} chars
                    </span>
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={submittingNote || !noteText.trim()}
                      className="flex items-center gap-2 px-4 py-1.5 bg-primary text-[#0f172a] rounded-lg text-xs font-black hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      {submittingNote ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : noteSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : null}
                      {noteSuccess ? 'Saved!' : 'Add Note'}
                    </button>
                  </div>
                </div>

                {/* Existing notes */}
                {detail.notes.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">No notes yet</p>
                ) : (
                  <div className="space-y-3">
                    {detail.notes.map((n) => (
                      <div
                        key={n.id}
                        className="bg-[#0f172a] border border-gray-800 rounded-xl p-4"
                      >
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {n.content}
                        </p>
                        <p className="text-gray-600 text-xs mt-2">{fmtDate(n.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

const PAGE_LIMIT = 50;

interface AdminUsersProps {
  apiFetch: (path: string, opts?: RequestInit) => Promise<Response>;
}

export const AdminUsers = ({ apiFetch }: AdminUsersProps) => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      limit: String(PAGE_LIMIT),
      offset: String(offset),
    });
    if (debouncedSearch) params.set('search', debouncedSearch);

    try {
      const res = await apiFetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: UsersListResponse = await res.json();
      // Pass 32 X4 — read row array under `data` (backend convention).
      setUsers(Array.isArray(json.data) ? json.data : []);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, offset, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / PAGE_LIMIT);
  const currentPage = Math.floor(offset / PAGE_LIMIT) + 1;
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + PAGE_LIMIT, total);

  return (
    <div className="space-y-5">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Users</h1>
          <p className="text-gray-500 text-xs mt-1">
            {total.toLocaleString()} total users
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, role…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#0f172a] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-2xl overflow-hidden">
        {error ? (
          <div className="flex items-center gap-3 p-8 text-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 font-bold">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {[
                      { label: 'Name', icon: <User className="w-3 h-3" /> },
                      { label: 'Company', icon: <Building2 className="w-3 h-3" /> },
                      { label: 'Role', icon: <Briefcase className="w-3 h-3" /> },
                      { label: 'Stage', icon: <Layers className="w-3 h-3" /> },
                      { label: 'Missions', icon: <Target className="w-3 h-3" /> },
                      { label: 'LTV', icon: <DollarSign className="w-3 h-3" /> },
                      { label: 'Since', icon: <CalendarDays className="w-3 h-3" /> },
                      { label: 'Admin', icon: <Shield className="w-3 h-3" /> },
                    ].map(({ label, icon }) => (
                      <th
                        key={label}
                        className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1.5">
                          {icon}
                          {label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [...Array(8)].map((_, i) => (
                        <tr key={i} className="border-b border-gray-800/50 animate-pulse">
                          {[...Array(8)].map((__, j) => (
                            <td key={j} className="px-4 py-3.5">
                              <div className="h-3.5 bg-gray-800 rounded-full w-full max-w-[100px]" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : users.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="text-center py-16 text-gray-600">
                          No users found
                          {debouncedSearch && ` for "${debouncedSearch}"`}
                        </td>
                      </tr>
                    )
                    : users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className="border-b border-gray-800/50 hover:bg-white/[0.03] cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-white group-hover:text-primary transition-colors whitespace-nowrap">
                            {user.full_name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">
                          {user.company_name || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">
                          {user.role || '—'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {user.project_stage ? (
                            <span className="px-2 py-0.5 bg-white/5 border border-gray-800 rounded-full text-xs font-bold text-gray-400">
                              {user.project_stage}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black text-white">{user.mission_count}</span>
                            {user.paid_count > 0 && (
                              <span className="text-xs text-primary font-bold">
                                {user.paid_count} paid
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-black text-primary whitespace-nowrap">
                          {fmtCurrency(user.ltv_usd)}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                          {fmtDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          {user.is_admin ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-black w-fit">
                              <Shield className="w-2.5 h-2.5" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-700 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 font-bold">
                  {start}–{end} of {total.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOffset(Math.max(0, offset - PAGE_LIMIT))}
                    disabled={offset === 0 || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-gray-800 rounded-lg text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>
                  <span className="text-xs text-gray-600 font-bold px-1">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOffset(offset + PAGE_LIMIT)}
                    disabled={end >= total || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-gray-800 rounded-lg text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Detail Drawer */}
      {selectedUserId && (
        <UserDetailDrawer
          userId={selectedUserId}
          apiFetch={apiFetch}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
