import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OverlayPage } from '../components/layout/OverlayPage';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  tag: string | null;
  emoji: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  views_count: number;
}

function fmt(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('id,slug,title,excerpt,tag,emoji,cover_image_url,published_at,views_count')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <OverlayPage>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
            Insights & Research
          </h1>
          <p className="text-white/60 text-xl">
            Market intelligence from the VETT synthetic research engine.
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-white/40 py-16">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading…
          </div>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-white/40 text-center py-16">No posts published yet. Check back soon.</p>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group flex flex-col glass-panel p-7 rounded-3xl hover:border-primary/40 transition-all duration-300"
              >
                {post.cover_image_url && (
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-5 bg-bg3">
                    <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  {post.tag && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-lime/10 text-lime border border-lime/20">
                      {post.tag}
                    </span>
                  )}
                  <span className="text-white/30 text-[11px] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {fmt(post.published_at)}
                  </span>
                </div>

                <h2 className="text-xl font-black text-white mb-2 group-hover:text-primary transition-colors leading-tight flex-1">
                  {post.emoji && <span className="mr-1.5">{post.emoji}</span>}
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p className="text-white/50 text-[13px] leading-relaxed mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}

                <span className="text-lime text-[13px] font-bold flex items-center gap-1 mt-auto">
                  Read more <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </OverlayPage>
  );
};

export default BlogPage;
