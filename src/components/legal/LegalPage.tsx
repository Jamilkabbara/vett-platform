import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Footer } from '../layout/Footer';

/**
 * Pass 24 Bug 24.03 — shared legal page layout.
 *
 * Renders one of the three legal markdown files (privacy / terms /
 * refunds) inside the VETT brand chrome:
 *   - Top nav with VETT logo + Dashboard back link
 *   - Article column max-w-3xl mx-auto for readability
 *   - Lime accent on every heading (h1-h6)
 *   - font-display (Inter) on headings, font-body (Manrope) on prose
 *   - Existing Footer at the bottom (with /privacy + /terms + /refunds)
 *
 * Markdown rendering rules:
 *   - h1 → page hero, larger
 *   - h2 → section header with top margin separator
 *   - h3 → sub-section header
 *   - p / li → font-body, white/80
 *   - strong → white (full opacity) for emphasis
 *   - hr → muted separator
 *   - table → styled border + cell padding
 *   - a → lime hover underline
 *   - blockquote → indigo accent border-l for "Note:" callouts
 */

interface LegalPageProps {
  /** The full markdown source. */
  markdown: string;
  /** Page title for `document.title` (matches the markdown's `# H1`). */
  documentTitle: string;
}

export function LegalPage({ markdown, documentTitle }: LegalPageProps) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${documentTitle} - VETT`;
    return () => {
      document.title = previous;
    };
  }, [documentTitle]);

  return (
    <div className="min-h-[100dvh] bg-bg text-t1 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-white/5 bg-bg/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between gap-4">
          <Link to="/" aria-label="VETT home">
            <Logo responsive />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Dashboard
          </Link>
        </div>
      </header>

      {/* Article body */}
      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-16">
          <div className="prose-vett">
            <ReactMarkdown
              components={{
                h1: ({ node: _node, ...props }) => (
                  <h1
                    {...props}
                    className="font-display font-black text-4xl md:text-5xl tracking-tighter text-lime mb-2"
                  />
                ),
                h2: ({ node: _node, ...props }) => (
                  <h2
                    {...props}
                    className="font-display font-black text-2xl md:text-3xl tracking-tight text-lime mt-12 mb-4"
                  />
                ),
                h3: ({ node: _node, ...props }) => (
                  <h3
                    {...props}
                    className="font-display font-bold text-lg md:text-xl text-lime mt-8 mb-3"
                  />
                ),
                h4: ({ node: _node, ...props }) => (
                  <h4
                    {...props}
                    className="font-display font-bold text-base md:text-lg text-lime mt-6 mb-2"
                  />
                ),
                p: ({ node: _node, ...props }) => (
                  <p
                    {...props}
                    className="font-body text-base text-white/80 leading-relaxed mb-4"
                  />
                ),
                strong: ({ node: _node, ...props }) => (
                  <strong {...props} className="text-white font-bold" />
                ),
                em: ({ node: _node, ...props }) => (
                  <em {...props} className="text-white/70 italic" />
                ),
                ul: ({ node: _node, ...props }) => (
                  <ul
                    {...props}
                    className="font-body text-base text-white/80 leading-relaxed list-disc list-outside ml-6 mb-4 space-y-2"
                  />
                ),
                ol: ({ node: _node, ...props }) => (
                  <ol
                    {...props}
                    className="font-body text-base text-white/80 leading-relaxed list-decimal list-outside ml-6 mb-4 space-y-2"
                  />
                ),
                li: ({ node: _node, ...props }) => <li {...props} className="pl-1" />,
                hr: ({ node: _node, ...props }) => (
                  <hr {...props} className="my-10 border-white/10" />
                ),
                a: ({ node: _node, href, ...props }) => {
                  const isExternal = !!href && /^https?:\/\//i.test(href);
                  return (
                    <a
                      href={href}
                      {...(isExternal
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      {...props}
                      className="text-lime hover:underline underline-offset-4 decoration-lime/40 transition-colors"
                    />
                  );
                },
                blockquote: ({ node: _node, ...props }) => (
                  <blockquote
                    {...props}
                    className="border-l-2 border-lime/40 bg-white/[0.02] pl-4 py-2 my-6 italic text-white/70 rounded-r"
                  />
                ),
                code: ({ node: _node, ...props }) => (
                  <code
                    {...props}
                    className="font-mono text-[0.92em] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/90"
                  />
                ),
                pre: ({ node: _node, ...props }) => (
                  <pre
                    {...props}
                    className="font-mono text-sm bg-white/5 border border-white/10 rounded-lg p-4 my-6 overflow-x-auto text-white/90"
                  />
                ),
                table: ({ node: _node, ...props }) => (
                  <div className="my-6 overflow-x-auto rounded-lg border border-white/10">
                    <table {...props} className="font-body text-sm w-full" />
                  </div>
                ),
                thead: ({ node: _node, ...props }) => (
                  <thead {...props} className="bg-white/[0.04]" />
                ),
                th: ({ node: _node, ...props }) => (
                  <th
                    {...props}
                    className="text-left font-bold text-white/90 px-4 py-3 border-b border-white/10"
                  />
                ),
                td: ({ node: _node, ...props }) => (
                  <td
                    {...props}
                    className="text-white/75 px-4 py-3 border-b border-white/5"
                  />
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

export default LegalPage;
