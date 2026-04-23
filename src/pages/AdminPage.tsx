import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, RefreshCw, Trash2, CheckCircle2, Plus, Download,
  Users, FileText, BarChart2, ChevronDown, X, Loader2, Tag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { PromosPanel } from '../components/admin/PromosPanel';

const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';
const ADMIN_EMAIL = 'kabbarajamil@gmail.com';

type Tab = 'missions' | 'crm' | 'content' | 'promos';

// ---- Types -----------------------------------------------------------------

interface AdminMission {
  id: string;
  title: string;
  status: string;
  respondent_count: number;
  price_estimated: number;
  total_price_usd: number;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  ai_cost_usd: number;
  profiles?: { email?: string };
}

interface CRMLead {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  stage: string;
  ltv_usd: number;
  notes: string | null;
  created_at: string;
  last_activity_at: string | null;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  tag: string | null;
  emoji: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  views_count: number;
}

interface NewLeadForm { name: string; email: string; company: string; notes: string; }
interface NewPostForm { title: string; slug: string; excerpt: string; body_markdown: string; tag: string; published: boolean; cover_image_url: string; }

// ---- Helpers ---------------------------------------------------------------

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed:  'bg-green-500/15 text-green-400',
    processing: 'bg-lime/15 text-lime',
    paid:       'bg-blue-500/15 text-blue-400',
    failed:     'bg-red-500/15 text-red-400',
    draft:      'bg-white/10 text-white/50',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${map[status] ?? 'bg-white/10 text-white/40'}`}>
      {status}
    </span>
  );
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

// ---- Component -------------------------------------------------------------

export function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('missions');
  const [missions, setMissions] = useState<AdminMission[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newLead, setNewLead] = useState<NewLeadForm>({ name: '', email: '', company: '', notes: '' });
  const [newPost, setNewPost] = useState<NewPostForm>({ title: '', slug: '', excerpt: '', body_markdown: '', tag: '', published: false, cover_image_url: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Redirect non-admins immediately
  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Use the app-wide supabase singleton — previously this created a NEW
  // client on every call, which triggered onAuthStateChange via localStorage
  // cross-instance events, causing setUser in AuthContext, changing the
  // `user` ref in AdminPage's useEffect deps, and re-firing loadLeads 30+
  // times per second (an infinite loop through the auth ↔ effect chain).
  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? '';
  }, []); // [] stable: supabase is a module-level singleton, never changes

  const apiFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      ...opts,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
  }, [getToken]);

  const loadMissions = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/missions');
      setMissions(await res.json());
    } catch { toast.error('Failed to load missions'); }
  }, [apiFetch]);

  const loadLeads = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/crm');
      setLeads(await res.json());
    } catch { toast.error('Failed to load leads'); }
  }, [apiFetch]);

  const loadPosts = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/blog');
      setPosts(await res.json());
    } catch { toast.error('Failed to load posts'); }
  }, [apiFetch]);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    if (tab === 'missions') loadMissions();
    if (tab === 'crm') loadLeads();
    if (tab === 'content') loadPosts();
  }, [tab, user, loadMissions, loadLeads, loadPosts]);

  const deleteMission = async (id: string) => {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/missions/${id}`, { method: 'DELETE' });
      setMissions(m => m.filter(x => x.id !== id));
      toast.success('Mission deleted');
    } catch { toast.error('Delete failed'); }
    setBusy(false);
    setConfirmDelete(null);
  };

  const forceComplete = async (id: string) => {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/missions/${id}/force-complete`, { method: 'PATCH' });
      setMissions(m => m.map(x => x.id === id ? { ...x, status: 'completed', completed_at: new Date().toISOString() } : x));
      toast.success('Mission forced to completed');
    } catch { toast.error('Force-complete failed'); }
    setBusy(false);
  };

  const createLead = async () => {
    if (!newLead.email) return;
    setBusy(true);
    try {
      const res = await apiFetch('/api/admin/crm', { method: 'POST', body: JSON.stringify(newLead) });
      const lead = await res.json();
      setLeads(l => [lead, ...l]);
      setShowNewLead(false);
      setNewLead({ name: '', email: '', company: '', notes: '' });
      toast.success('Lead added');
    } catch { toast.error('Failed to create lead'); }
    setBusy(false);
  };

  const exportCSV = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/admin/crm/export`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'crm_leads.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const createPost = async () => {
    if (!newPost.title || !newPost.slug) return;
    setBusy(true);
    try {
      const res = await apiFetch('/api/admin/blog', { method: 'POST', body: JSON.stringify(newPost) });
      const post = await res.json();
      setPosts(p => [post, ...p]);
      setShowNewPost(false);
      setNewPost({ title: '', slug: '', excerpt: '', body_markdown: '', tag: '', published: false, cover_image_url: '' });
      toast.success('Post created');
    } catch { toast.error('Failed to create post'); }
    setBusy(false);
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      await apiFetch(`/api/admin/blog/${post.id}`, { method: 'PATCH', body: JSON.stringify({ published: !post.published }) });
      setPosts(p => p.map(x => x.id === post.id ? { ...x, published: !post.published } : x));
      toast.success(post.published ? 'Post unpublished' : 'Post published');
    } catch { toast.error('Update failed'); }
  };

  const deletePost = async (id: string) => {
    try {
      await apiFetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      setPosts(p => p.filter(x => x.id !== id));
      toast.success('Post deleted');
    } catch { toast.error('Delete failed'); }
  };

  if (authLoading) return null;
  if (!user || user.email !== ADMIN_EMAIL) return null;

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: 'missions', label: 'Missions', icon: BarChart2 },
    { id: 'crm',      label: 'CRM',      icon: Users },
    { id: 'content',  label: 'Content',  icon: FileText },
    { id: 'promos',   label: 'Promos',   icon: Tag },
  ];

  const inputCls = 'w-full h-10 px-3 bg-bg3 border border-b1 rounded-lg text-[13px] text-t1 placeholder:text-t4 focus:outline-none focus:border-lime/60';
  const textareaCls = 'w-full px-3 py-2 bg-bg3 border border-b1 rounded-lg text-[13px] text-t1 placeholder:text-t4 focus:outline-none focus:border-lime/60 resize-none';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime/10 border border-lime/20">
            <Shield className="w-5 h-5 text-lime" />
          </div>
          <div>
            <h1 className="font-display font-black text-white text-2xl tracking-tight">Admin</h1>
            <p className="text-t3 text-[12px] font-body">Visible to {ADMIN_EMAIL} only</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-b1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 text-[13px] font-display font-bold border-b-2 -mb-px transition-colors',
                  tab === t.id
                    ? 'border-lime text-lime'
                    : 'border-transparent text-t3 hover:text-t1',
                ].join(' ')}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Missions Tab ──────────────────────────────────────────────── */}
        {tab === 'missions' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-black text-white text-lg">All Missions</h2>
              <button onClick={loadMissions} className="text-t3 hover:text-t1 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-b1">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-b1 text-t3 font-display font-bold uppercase tracking-wider">
                    {['Title', 'Status', 'Resp.', 'Price', 'AI Cost', 'Created', 'Paid', 'Completed', 'Actions'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {missions.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-8 text-t3">No missions yet</td></tr>
                  )}
                  {missions.map(m => (
                    <tr key={m.id} className="border-b border-b1/50 hover:bg-white/2 transition-colors">
                      <td className="px-3 py-2.5 max-w-[200px] truncate text-t1 font-medium">{m.title || '(untitled)'}</td>
                      <td className="px-3 py-2.5">{statusBadge(m.status)}</td>
                      <td className="px-3 py-2.5 text-t2">{m.respondent_count}</td>
                      <td className="px-3 py-2.5 text-t2">${(m.total_price_usd ?? m.price_estimated ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-t2">${(m.ai_cost_usd ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-t3 whitespace-nowrap">{fmt(m.created_at)}</td>
                      <td className="px-3 py-2.5 text-t3 whitespace-nowrap">{fmt(m.paid_at)}</td>
                      <td className="px-3 py-2.5 text-t3 whitespace-nowrap">{fmt(m.completed_at)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/results?missionId=${m.id}`)}
                            title="View results"
                            className="p-1.5 rounded text-t3 hover:text-lime hover:bg-lime/10 transition-colors"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                          </button>
                          {m.status !== 'completed' && (
                            <button
                              onClick={() => forceComplete(m.id)}
                              disabled={busy}
                              title="Force complete"
                              className="p-1.5 rounded text-t3 hover:text-green-400 hover:bg-green-400/10 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDelete(m.id)}
                            title="Delete mission"
                            className="p-1.5 rounded text-t3 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CRM Tab ───────────────────────────────────────────────────── */}
        {tab === 'crm' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-black text-white text-lg">CRM Leads</h2>
              <div className="flex gap-2">
                <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-b1 text-t2 text-[12px] hover:border-lime/40 hover:text-lime transition-colors">
                  <Download className="w-3.5 h-3.5" />Export CSV
                </button>
                <button onClick={() => setShowNewLead(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime text-bg text-[12px] font-bold hover:bg-lime/90 transition-colors">
                  <Plus className="w-3.5 h-3.5" />New lead
                </button>
              </div>
            </div>

            {showNewLead && (
              <div className="mb-4 p-4 rounded-xl border border-lime/30 bg-lime/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-white text-[14px]">New lead</h3>
                  <button onClick={() => setShowNewLead(false)}><X className="w-4 h-4 text-t3" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputCls} placeholder="Name" value={newLead.name} onChange={e => setNewLead(l => ({ ...l, name: e.target.value }))} />
                  <input className={inputCls} placeholder="Email *" value={newLead.email} onChange={e => setNewLead(l => ({ ...l, email: e.target.value }))} />
                  <input className={inputCls} placeholder="Company" value={newLead.company} onChange={e => setNewLead(l => ({ ...l, company: e.target.value }))} />
                  <input className={inputCls} placeholder="Notes" value={newLead.notes} onChange={e => setNewLead(l => ({ ...l, notes: e.target.value }))} />
                </div>
                <button onClick={createLead} disabled={busy || !newLead.email} className="px-4 py-2 rounded-lg bg-lime text-bg text-[13px] font-bold disabled:opacity-50">
                  {busy ? 'Creating…' : 'Create lead'}
                </button>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-b1">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-b1 text-t3 font-display font-bold uppercase tracking-wider">
                    {['Email', 'Name', 'Company', 'Stage', 'LTV', 'Created', 'Notes'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-t3">No leads yet</td></tr>
                  )}
                  {leads.map(l => (
                    <tr key={l.id} className="border-b border-b1/50 hover:bg-white/2 transition-colors">
                      <td className="px-3 py-2.5 text-t1 font-medium">{l.email}</td>
                      <td className="px-3 py-2.5 text-t2">{l.name || '—'}</td>
                      <td className="px-3 py-2.5 text-t2">{l.company || '—'}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-block px-2 py-0.5 rounded bg-white/10 text-white/60 text-[11px] font-bold uppercase">{l.stage}</span>
                      </td>
                      <td className="px-3 py-2.5 text-t2">${(l.ltv_usd ?? 0).toFixed(0)}</td>
                      <td className="px-3 py-2.5 text-t3 whitespace-nowrap">{fmt(l.created_at)}</td>
                      <td className="px-3 py-2.5 text-t3 max-w-[200px] truncate">{l.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Content Tab ───────────────────────────────────────────────── */}
        {tab === 'content' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-black text-white text-lg">Blog Posts</h2>
              <button onClick={() => setShowNewPost(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime text-bg text-[12px] font-bold hover:bg-lime/90 transition-colors">
                <Plus className="w-3.5 h-3.5" />New post
              </button>
            </div>

            {showNewPost && (
              <div className="mb-4 p-4 rounded-xl border border-lime/30 bg-lime/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-white text-[14px]">New post</h3>
                  <button onClick={() => setShowNewPost(false)}><X className="w-4 h-4 text-t3" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputCls} placeholder="Title *" value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value, slug: p.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} />
                  <input className={inputCls} placeholder="slug (auto-filled)" value={newPost.slug} onChange={e => setNewPost(p => ({ ...p, slug: e.target.value }))} />
                  <input className={inputCls} placeholder="Excerpt" value={newPost.excerpt} onChange={e => setNewPost(p => ({ ...p, excerpt: e.target.value }))} />
                  <input className={inputCls} placeholder="Tag (AI Research, Pricing…)" value={newPost.tag} onChange={e => setNewPost(p => ({ ...p, tag: e.target.value }))} />
                  <input className={inputCls} placeholder="Cover image URL" value={newPost.cover_image_url} onChange={e => setNewPost(p => ({ ...p, cover_image_url: e.target.value }))} />
                  <label className="flex items-center gap-2 text-[13px] text-t2 cursor-pointer">
                    <input type="checkbox" checked={newPost.published} onChange={e => setNewPost(p => ({ ...p, published: e.target.checked }))} className="accent-lime" />
                    Publish immediately
                  </label>
                </div>
                <textarea className={textareaCls} rows={8} placeholder="Body (Markdown)" value={newPost.body_markdown} onChange={e => setNewPost(p => ({ ...p, body_markdown: e.target.value }))} />
                <button onClick={createPost} disabled={busy || !newPost.title || !newPost.slug} className="px-4 py-2 rounded-lg bg-lime text-bg text-[13px] font-bold disabled:opacity-50">
                  {busy ? 'Creating…' : 'Create post'}
                </button>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-b1">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-b1 text-t3 font-display font-bold uppercase tracking-wider">
                    {['Title', 'Slug', 'Tag', 'Status', 'Views', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-t3">No posts yet</td></tr>
                  )}
                  {posts.map(p => (
                    <tr key={p.id} className="border-b border-b1/50 hover:bg-white/2 transition-colors">
                      <td className="px-3 py-2.5 text-t1 font-medium max-w-[180px] truncate">{p.emoji} {p.title}</td>
                      <td className="px-3 py-2.5 text-t3 font-mono">{p.slug}</td>
                      <td className="px-3 py-2.5 text-t3">{p.tag || '—'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${p.published ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-white/40'}`}>
                          {p.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-t3">{p.views_count}</td>
                      <td className="px-3 py-2.5 text-t3 whitespace-nowrap">{fmt(p.created_at)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/blog/${p.slug}`)} title="View" className="p-1.5 rounded text-t3 hover:text-lime hover:bg-lime/10 transition-colors">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => togglePublish(p)} title={p.published ? 'Unpublish' : 'Publish'} className="p-1.5 rounded text-t3 hover:text-green-400 hover:bg-green-400/10 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deletePost(p.id)} title="Delete" className="p-1.5 rounded text-t3 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Promos Tab ────────────────────────────────────────────────── */}
        {tab === 'promos' && (
          <PromosPanel apiFetch={apiFetch} />
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-bg2 border border-b1 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-display font-black text-white text-lg mb-2">Delete mission?</h3>
            <p className="text-t2 text-[13px] mb-6">This permanently deletes the mission and all its responses. Cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-lg border border-b1 text-t2 text-[13px] hover:border-white/30 transition-colors">Cancel</button>
              <button onClick={() => deleteMission(confirmDelete)} disabled={busy} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 disabled:opacity-50 transition-colors">
                {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminPage;
