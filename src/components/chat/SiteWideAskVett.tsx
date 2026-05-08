/**
 * Pass 33 W7 — site-wide Ask VETT mount.
 *
 * Pass 32 X10 promised "Ask VETT mounted site-wide" but the actual
 * mount only appeared on /missions and /help. This component wraps
 * the floating ChatWidget and renders it on every route except:
 *   - /signin, /forgot-password, /reset-password (auth funnels)
 *   - /admin (admin owns its own chat surface)
 *   - /results/:id (per-mission ChatWidget with scope='results' wins)
 *   - /payment-success, /payment-cancel (in-flight checkout)
 *   - /help (HelpPage uses inline ChatWidget — no double-mount)
 *
 * For authed users: scope='dashboard' (30 messages / month rolling).
 * For anonymous users: floating "Have a question?" button that opens
 * a small CTA pointing to /signin. NO API call is made, so logged-out
 * pages never burn Anthropic tokens on chat.
 */

import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircleQuestion, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ChatWidget = lazy(() =>
  import('./ChatWidget').then(m => ({ default: m.ChatWidget })),
);

// Routes where the site-wide chatbot must NOT mount.
const HIDE_PATTERNS = [
  /^\/signin/,
  /^\/signup/,
  /^\/forgot-password/,
  /^\/reset-password/,
  /^\/admin/,
  /^\/results\/[^/]+/,
  /^\/creative-results\/[^/]+/,
  /^\/payment-success/,
  /^\/payment-cancel/,
  /^\/help/,
  /^\/missions/, // Pass 32 X10 era already had a per-page mount; site-wide replaces it
];

export function SiteWideAskVett() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [anonOpen, setAnonOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close anon popover on outside-click + Escape.
  useEffect(() => {
    if (!anonOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) setAnonOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAnonOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [anonOpen]);

  if (loading) return null;
  if (HIDE_PATTERNS.some((re) => re.test(pathname))) return null;

  // Authed: full chatbot (lazy-loaded).
  if (user) {
    return (
      <Suspense fallback={null}>
        <ChatWidget scope="dashboard" />
      </Suspense>
    );
  }

  // Anonymous: floating button that pops a sign-in CTA. No API token spend.
  return (
    <div ref={popoverRef} className="fixed bottom-6 right-6 z-[80]">
      {anonOpen ? (
        <div
          role="dialog"
          aria-label="Ask VETT — sign in"
          className="w-72 rounded-2xl bg-[#0d0e1a] border border-white/10 shadow-2xl p-5"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="w-5 h-5 text-[#BEF264]" aria-hidden />
              <h3 className="text-white font-black text-sm">Ask VETT</h3>
            </div>
            <button
              type="button"
              onClick={() => setAnonOpen(false)}
              className="text-white/40 hover:text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/60 text-xs leading-relaxed mb-4">
            The dashboard copilot is ready to answer questions about missions,
            methodologies, or how to read a result. Sign in to start chatting —
            it&apos;s on your account, no extra cost.
          </p>
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="w-full py-2.5 rounded-lg bg-[#BEF264] text-black text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Sign in to chat
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAnonOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#BEF264] text-black font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Ask VETT"
        >
          <MessageCircleQuestion className="w-4 h-4" aria-hidden />
          Have a question?
        </button>
      )}
    </div>
  );
}

export default SiteWideAskVett;
