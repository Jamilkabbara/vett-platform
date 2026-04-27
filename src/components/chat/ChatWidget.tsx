/**
 * VETT Chat Widget — floating copilot.
 *
 * Scopes (wired to the backend):
 *   - 'results'   → per-mission copilot (30 messages / mission)
 *   - 'dashboard' → portfolio copilot   (30 messages / month)
 *   - 'setup'     → setup advisor       (20 messages / session)
 *
 * Protocol:
 *   - On open: GET /api/chat/session?scope=...&missionId=... (creates if missing)
 *   - Send:    POST /api/chat/stream (SSE), falls back to /api/chat/message
 *   - Block:   server returns {blocked:true, reason:'quota_exceeded'} → open overage modal
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../lib/supabase';
import { OverageModal } from './OverageModal';

const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

export type ChatScope = 'results' | 'dashboard' | 'setup';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface Quota { used: number; limit: number; remaining: number; }

interface ChatWidgetProps {
  scope: ChatScope;
  missionId?: string | null;
  /** Defaults to bottom-right. Pass null to render inline wherever the parent mounts it. */
  anchor?: 'floating' | 'inline';
  /** When the parent owns open state (inline mode), pass these in. */
  isOpen?: boolean;
  onClose?: () => void;
  /** Override the eyebrow title. Defaults depend on scope. */
  title?: string;
}

/**
 * Pass 21 Bug 17 — every scope's quota resets on a different cadence.
 * Surface that explicitly so the user knows whether they're spending
 * forever-budget or burnable-this-month budget.
 *
 *   results   → 30 messages, resets per mission (new mission = fresh quota)
 *   dashboard → 30 messages, resets monthly on the 1st (rolling month)
 *   setup     → 20 messages, resets per setup draft (one budget per mission)
 *
 * `resetWindow` is the short label shown next to the quota pill and in the
 * tooltip; `resetSentence` is the full microcopy for the empty/overage states.
 */
const scopeMeta = (scope: ChatScope) => {
  switch (scope) {
    case 'results':
      return {
        title: 'Results Copilot',
        blurb: 'Ask anything about this mission.',
        resetWindow: 'per mission',
        resetSentence: 'You have 30 messages for this mission. The quota resets when you open a new mission.',
      };
    case 'dashboard':
      return {
        title: 'Dashboard Copilot',
        blurb: 'Your research portfolio, on call.',
        resetWindow: 'this month',
        resetSentence: 'You have 30 messages this calendar month. The quota resets on the 1st of next month.',
      };
    case 'setup':
      return {
        title: 'Setup Advisor',
        blurb: 'Coach me through this mission.',
        resetWindow: 'this setup',
        resetSentence: 'You have 20 messages for this setup draft. The quota resets each time you start a new mission.',
      };
  }
};

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`;
  return h;
}

export const ChatWidget = ({
  scope,
  missionId = null,
  anchor = 'floating',
  isOpen: controlledOpen,
  onClose,
  title,
}: ChatWidgetProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = anchor === 'inline' ? !!controlledOpen : internalOpen;
  const close = () => (anchor === 'inline' ? onClose?.() : setInternalOpen(false));

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quota, setQuota] = useState<Quota>({ used: 0, limit: 30, remaining: 30 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingDraft, setStreamingDraft] = useState('');
  const [showOverage, setShowOverage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const meta = scopeMeta(scope);

  // ─ Load session when opened ───────────────────────────────
  const loadSession = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ scope });
      if (missionId) qs.set('missionId', missionId);
      const res = await fetch(`${API_URL}/api/chat/session?${qs}`, { headers: await authHeaders() });
      if (!res.ok) throw new Error(`Chat session failed: ${res.status}`);
      const data = await res.json();
      setSessionId(data.sessionId);
      setQuota(data.quota);
      setMessages((data.messages || []).map((m: any) => ({ role: m.role, content: m.content })));
    } catch (err: any) {
      setError(err?.message || 'Could not load chat session.');
    }
  }, [scope, missionId]);

  useEffect(() => {
    if (open && !sessionId) loadSession();
  }, [open, sessionId, loadSession]);

  // Re-fetch session whenever mission context changes (e.g. switching missions)
  useEffect(() => { setSessionId(null); setMessages([]); }, [scope, missionId]);

  // ─ Auto-scroll on new content ─────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingDraft, isStreaming]);

  // ─ Send via SSE, with fallback to non-streaming ──────────
  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    if (quota.remaining <= 0) { setShowOverage(true); return; }

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setIsStreaming(true);
    setStreamingDraft('');

    try {
      const res = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ scope, missionId, message: trimmed }),
      });

      // 402 = quota_exceeded (server-side guard)
      if (res.status === 402) {
        const blocked = await res.json();
        setQuota(blocked.quota || quota);
        setShowOverage(true);
        setIsStreaming(false);
        // Remove optimistic user message so they don't see it "sent"
        setMessages((prev) => prev.slice(0, -1));
        setInput(trimmed);
        return;
      }
      if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assembled = '';
      let finalQuota: Quota | null = null;
      let blocked = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events (split on double newline)
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const evt of events) {
          const line = evt.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const obj = JSON.parse(payload);
            if (obj.delta) {
              assembled += obj.delta;
              setStreamingDraft(assembled);
            } else if (obj.done) {
              finalQuota = obj.quota || null;
            } else if (obj.blocked) {
              blocked = true;
              finalQuota = obj.quota || null;
            } else if (obj.error) {
              throw new Error(obj.error);
            }
          } catch { /* ignore malformed frame */ }
        }
      }

      if (blocked) {
        setQuota(finalQuota || quota);
        setShowOverage(true);
        setMessages((prev) => prev.slice(0, -1));
        setInput(trimmed);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: assembled }]);
        if (finalQuota) setQuota(finalQuota);
      }
    } catch (err: any) {
      // ── Fallback to non-streaming ────────────────────────
      try {
        const res = await fetch(`${API_URL}/api/chat/message`, {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({ scope, missionId, message: trimmed }),
        });
        const data = await res.json();
        if (res.status === 402 || data.blocked) {
          setQuota(data.quota || quota);
          setShowOverage(true);
          setMessages((prev) => prev.slice(0, -1));
          setInput(trimmed);
        } else if (!res.ok) {
          throw new Error(data.error || `Message failed: ${res.status}`);
        } else {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
          if (data.quota) setQuota(data.quota);
        }
      } catch (fallbackErr: any) {
        setError(fallbackErr?.message || err?.message || 'Chat failed.');
        setMessages((prev) => prev.slice(0, -1));
        setInput(trimmed);
      }
    } finally {
      setIsStreaming(false);
      setStreamingDraft('');
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function handleOverageSuccess() {
    setShowOverage(false);
    // Reload the session to pick up the new purchased overage
    await loadSession();
  }

  // ─ Render ─────────────────────────────────────────────────
  const launcher = anchor === 'floating' && !open && (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => setInternalOpen(true)}
      className="fixed bottom-6 right-6 z-[70] flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-black font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
      aria-label="Open VETT chat"
    >
      <MessageSquare className="w-5 h-5" />
      <span className="hidden sm:inline">Ask VETT</span>
    </motion.button>
  );

  const panel = (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      className={[
        'flex flex-col bg-[#0B0C15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl',
        anchor === 'floating'
          ? 'fixed bottom-6 right-6 z-[70] w-[min(92vw,400px)] h-[min(80dvh,640px)]'
          : 'relative w-full h-full',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm truncate">{title || meta.title}</div>
            <div className="text-white/50 text-[11px] truncate">{meta.blurb}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/*
            Pass 21 Bug 17 — the pill itself stays compact (e.g. "27/30")
            but the tooltip now names the reset window so users understand
            whether burning a message hurts forever or just this month.
          */}
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full border ${
              quota.remaining <= 3
                ? 'bg-red-500/10 text-red-300 border-red-500/30'
                : 'bg-primary/10 text-primary border-primary/30'
            }`}
            title={`${quota.remaining} of ${quota.limit} messages left ${meta.resetWindow}. ${meta.resetSentence}`}
          >
            {quota.remaining}/{quota.limit}{' '}
            <span className="text-white/40">{meta.resetWindow}</span>
          </span>
          <button
            onClick={close}
            aria-label="Close chat"
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            {anchor === 'floating' ? <Minimize2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-8 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-white/80 font-bold text-sm mb-1">{meta.title}</p>
            <p className="text-white/40 text-xs leading-relaxed">{meta.blurb}</p>
            {/* Pass 21 Bug 17 — quota reset window inline on the empty state. */}
            <p className="text-white/30 text-[11px] leading-relaxed mt-3">
              {meta.resetSentence}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}

        {isStreaming && streamingDraft && (
          <Bubble role="assistant" content={streamingDraft} streaming />
        )}
        {isStreaming && !streamingDraft && <TypingDots />}

        {error && (
          <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 px-3 py-3 bg-black/40">
        {quota.remaining === 0 ? (
          /*
            Pass 21 Bug 17 — when out of quota, name the reset window so users
            know whether to wait it out or buy an overage pack.
          */
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-white/60 flex-1 min-w-0">
              <div>You've used all your messages {meta.resetWindow}.</div>
              <div className="text-[10px] text-white/40 mt-0.5 truncate" title={meta.resetSentence}>
                {meta.resetSentence}
              </div>
            </div>
            <button
              onClick={() => setShowOverage(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-black hover:bg-primary-hover transition-colors shrink-0"
            >
              Get 50 more · $5
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Message VETT…"
              className="flex-1 resize-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/40 max-h-32"
              disabled={isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              aria-label="Send"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      {launcher}
      <AnimatePresence>{open && panel}</AnimatePresence>
      <OverageModal
        isOpen={showOverage}
        sessionId={sessionId}
        onClose={() => setShowOverage(false)}
        onSuccess={handleOverageSuccess}
      />
    </>
  );
};

// ─ Bits ────────────────────────────────────────────────────

// Pass 22 Bug 22.26 — chat-bubble Markdown rendering. Forensic from
// chat_messages.content showed the AI emitting **bold**, ##, ---, bullet
// lists, etc., but the bubble was rendering as plain text. Users saw
// literal asterisks. Now we render through react-markdown (already a dep
// from ResultsPage) with chat-bubble-tuned components: tighter margins,
// no top margin on the first child, smaller heading sizes than ResultsPage.
function Bubble({ role, content, streaming = false }: { role: 'user' | 'assistant'; content: string; streaming?: boolean }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
          isUser
            ? 'bg-primary text-black rounded-br-md whitespace-pre-wrap'
            : 'bg-white/5 border border-white/10 text-white/90 rounded-bl-md',
        ].join(' ')}
      >
        {isUser ? (
          // User messages render as plain text (no markdown parsing — user
          // input shouldn't be re-interpreted as formatting).
          content
        ) : (
          <ChatMarkdown content={content} />
        )}
        {streaming && <span className="inline-block w-2 h-4 align-middle bg-white/60 animate-pulse ml-1" />}
      </div>
    </div>
  );
}

function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-2">
      <ReactMarkdown
        components={{
          // first:mt-0 so the very first paragraph sits flush against the
          // bubble's top padding (no awkward extra gap).
          p:        ({ children }) => <p className="first:mt-0 leading-relaxed">{children}</p>,
          strong:   ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em:       ({ children }) => <em className="italic">{children}</em>,
          h1:       ({ children }) => <h3 className="text-base font-bold first:mt-0 mt-3 mb-1">{children}</h3>,
          h2:       ({ children }) => <h3 className="text-base font-semibold first:mt-0 mt-3 mb-1">{children}</h3>,
          h3:       ({ children }) => <h4 className="text-sm font-semibold first:mt-0 mt-2 mb-1">{children}</h4>,
          ul:       ({ children }) => <ul className="list-disc pl-5 space-y-0.5 my-2">{children}</ul>,
          ol:       ({ children }) => <ol className="list-decimal pl-5 space-y-0.5 my-2">{children}</ol>,
          li:       ({ children }) => <li className="leading-relaxed">{children}</li>,
          hr:       () => <hr className="my-3 border-t border-white/15" />,
          code:     ({ children }) => <code className="px-1 py-0.5 rounded bg-black/30 text-[0.85em] font-mono">{children}</code>,
          a:        ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary-hover">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-white/20 pl-3 italic text-white/70 my-2">{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '120ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '240ms' }} />
    </div>
  );
}
