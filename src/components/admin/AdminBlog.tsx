import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, CheckCircle2, Trash2, FileText, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
  auto_generated: boolean;
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export const AdminBlog = ({ apiFetch }: { apiFetch: (path: string, opts?: RequestInit) => Promise<Response> }) => {
  const navigate                   = useNavigate();
  const [posts, setPosts]          = useState<BlogPost[]>([]);
  const [loading, setLoading]      = useState(true);
  const [showNew, setShowNew]      = useState(false);
  const [aiGenerating, setAiGen]   = useState(false);
  const [busy, setBusy]            = useState(false);
  const [newPost, setNewPost]      = useState({
    title: '', slug: '', excerpt: '', body_markdown: '', tag: '', published: false, cover_image_url: '',
  });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await apiFetch('/api/admin/blog');
      const json = await res.json();
      setPosts(Array.isArray(json) ? json : []);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = async () => {
    if (!newPost.title || !newPost.slug) return;
    setBusy(true);
    try {
      const res  = await apiFetch('/api/admin/blog', { method: 'POST', body: JSON.stringify(newPost) });
      const post = await res.json();
      setPosts(p => [post, ...p]);
      setShowNew(false);
      setNewPost({ title: '', slug: '', excerpt: '', body_markdown: '', tag: '', published: false, cover_image_url: '' });
      toast.success('Post created');
    } catch { toast.error('Failed to create post'); }
    finally { setBusy(false); }
  };

  const aiGenerate = async () => {
    setAiGen(true);
    try {
      const res  = await apiFetch('/api/admin/blog/generate', { method: 'POST' });
      const post = await res.json();
      setPosts(p => [post, ...p]);
      toast.success('AI post generated');
    } catch { toast.error('AI generation failed'); }
    finally { setAiGen(false); }
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

  const inputCls = 'w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <div className="space-y-5">
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={aiGenerate}
          disabled={aiGenerating}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/20 border border-violet-500/30 rounded-xl text-sm text-violet-400 font-bold hover:bg-violet-500/30 disabled:opacity-50 transition-colors"
        >
          {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {aiGenerating ? 'Generating…' : 'AI Generate'}
        </button>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors ml-auto">
          <Plus className="w-4 h-4" />New Post
        </button>
      </div>

      {showNew && (
        <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">New Post</h3>
            <button onClick={() => setShowNew(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className={inputCls} placeholder="Title *" value={newPost.title}
              onChange={e => setNewPost(p => ({
                ...p,
                title: e.target.value,
                slug: p.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              }))}
            />
            <input className={inputCls} placeholder="Slug (auto-filled)" value={newPost.slug} onChange={e => setNewPost(p => ({ ...p, slug: e.target.value }))} />
            <input className={inputCls} placeholder="Excerpt" value={newPost.excerpt} onChange={e => setNewPost(p => ({ ...p, excerpt: e.target.value }))} />
            <input className={inputCls} placeholder="Tag (AI Research, Pricing…)" value={newPost.tag} onChange={e => setNewPost(p => ({ ...p, tag: e.target.value }))} />
            <input className={inputCls} placeholder="Cover image URL" value={newPost.cover_image_url} onChange={e => setNewPost(p => ({ ...p, cover_image_url: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer py-2.5">
              <input type="checkbox" checked={newPost.published} onChange={e => setNewPost(p => ({ ...p, published: e.target.checked }))} className="accent-primary" />
              Publish immediately
            </label>
          </div>
          <textarea
            className={`${inputCls} resize-none`}
            rows={8}
            placeholder="Body (Markdown)"
            value={newPost.body_markdown}
            onChange={e => setNewPost(p => ({ ...p, body_markdown: e.target.value }))}
          />
          <button onClick={createPost} disabled={busy || !newPost.title || !newPost.slug} className="px-5 py-2.5 bg-primary text-black text-sm font-bold rounded-xl disabled:opacity-50">
            {busy ? 'Creating…' : 'Create Post'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="w-full text-xs">
          <thead className="bg-gray-900/60">
            <tr className="text-gray-500 font-bold uppercase tracking-wider">
              {['Title', 'Slug', 'Tag', 'Status', 'Views', 'Created', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {loading && <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading…</td></tr>}
            {!loading && posts.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No posts yet</td></tr>}
            {!loading && posts.map(p => (
              <tr key={p.id} className="hover:bg-gray-900/40 transition-colors">
                <td className="px-4 py-3 text-white font-medium max-w-[180px] truncate">{p.emoji} {p.title}</td>
                <td className="px-4 py-3 text-gray-500 font-mono">{p.slug}</td>
                <td className="px-4 py-3 text-gray-400">{p.tag || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${p.published ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {p.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{p.views_count}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(p.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/blog/${p.slug}`)} title="View" className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors">
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => togglePublish(p)} title={p.published ? 'Unpublish' : 'Publish'} className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deletePost(p.id)} title="Delete" className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
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
  );
};
