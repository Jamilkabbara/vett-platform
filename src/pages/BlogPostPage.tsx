import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Calendar, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OverlayPage } from '../components/layout/OverlayPage';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_markdown: string | null;
  tag: string | null;
  emoji: string | null;
  cover_image_url: string | null;
  published: boolean;
  published_at: string | null;
  views_count: number;
}

function fmt(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data || !data.published) {
          setNotFound(true);
        } else {
          setPost(data as BlogPost);
          // Increment view count (fire-and-forget)
          supabase.rpc('increment_blog_views', { post_id: data.id }).catch(() => {});
        }
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (notFound) navigate('/blog', { replace: true });
  }, [notFound, navigate]);

  if (loading) {
    return (
      <OverlayPage>
        <div className="flex items-center gap-2 text-white/40 py-32 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      </OverlayPage>
    );
  }

  if (!post) return null;

  const ogImage = post.cover_image_url || '/og-image.png';

  return (
    <>
      {/* Per-post SEO meta — injected via a side effect; in a real SSR setup
          these would be server-rendered. For SPA they update document.title. */}
      {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
      {typeof document !== 'undefined' && (() => {
        document.title = `${post.title} - VETT`;
        // Update og:image meta if tag exists
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg) ogImg.setAttribute('content', ogImage);
        return null;
      })()}

      <OverlayPage>
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-[13px] font-body mb-8">
            <ArrowLeft className="w-4 h-4" />
            All posts
          </Link>

          {/* Cover image */}
          {post.cover_image_url && (
            <div className="w-full h-64 rounded-2xl overflow-hidden mb-8 bg-bg3">
              <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            {post.tag && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-lime/10 text-lime border border-lime/20">
                {post.tag}
              </span>
            )}
            <span className="text-white/30 text-[12px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {fmt(post.published_at)}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display font-black text-white text-[clamp(28px,5vw,52px)] tracking-tight leading-tight mb-4">
            {post.emoji && <span className="mr-2">{post.emoji}</span>}
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="font-body text-[17px] text-t2 leading-relaxed mb-10 border-l-2 border-lime/30 pl-4">
              {post.excerpt}
            </p>
          )}

          {/* Body */}
          {post.body_markdown ? (
            <div className="prose prose-invert prose-lime max-w-none font-body text-[15px] leading-[1.8]
              prose-headings:font-display prose-headings:font-black prose-headings:tracking-tight
              prose-h2:text-2xl prose-h3:text-xl
              prose-a:text-lime prose-a:no-underline hover:prose-a:underline
              prose-code:bg-bg3 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-lime prose-code:text-[13px]
              prose-blockquote:border-lime/30 prose-blockquote:text-t2
              prose-strong:text-white">
              <ReactMarkdown>{post.body_markdown}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/30 py-8">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[13px]">No content yet.</span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-b1 text-[12px] text-white/30 font-body">
            Synthetic insights generated by VETT AI. Not a substitute for primary research.
          </div>
        </div>
      </OverlayPage>
    </>
  );
}

export default BlogPostPage;
