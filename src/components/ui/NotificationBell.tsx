import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, AlertTriangle, XCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Pass 23 A2 (Bug 23.11) — real-data notification bell.
 *
 * Reads + writes to `public.notifications` directly via the supabase anon
 * client. RLS policy `users_own_notif` (FOR ALL TO authenticated USING
 * auth.uid() = user_id) scopes both reads and writes to the user's own
 * rows; realtime subscriptions on the same channel respect the policy.
 *
 * Wire-up (signed in + bell mounted in AuthedTopNav):
 *   1. On mount + on window focus → fetch latest 10 notifications.
 *   2. Subscribe to realtime INSERT events on `public.notifications`
 *      filtered by user_id; new rows prepend in real time.
 *   3. Click a row → optimistically mark `read_at = now()` + navigate.
 *   4. "Mark all as read" → bulk UPDATE all user's unread to read.
 *
 * Backend insert templates (Bug 23.12) drive the icon/accent per type:
 *   mission_complete   ✓ green check  — runMission deliveryFull branch
 *   mission_partial    ⚠ amber alert  — runMission partial-delivery branch
 *   mission_failed     ✗ red x        — runMission catch
 *   payment_received   💳 indigo card — webhooks checkout.session.completed
 *   payment_failed     ✗ red x        — webhooks payment_intent.payment_failed
 *
 * Empty state: "No notifications yet."
 *
 * Pre-Pass-23 this component held a static SEED array — every signed-in
 * user saw the same 5 fake notifications. Production forensic at A2 spec
 * time showed 9 unread mission_complete rows in the table that NO USER
 * HAS EVER SEEN. This rewrite plugs that gap.
 */

const FETCH_LIMIT = 10;

type NotifType =
  | 'mission_complete'
  | 'mission_partial'
  | 'mission_failed'
  | 'payment_received'
  | 'payment_failed'
  | string; // tolerate unknown future types — render as a generic bell

interface NotifRow {
  id: string;
  user_id: string;
  type: NotifType;
  title: string | null;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// ── Type → visual mapping ───────────────────────────────────────────────
// Tailwind-resolvable class strings (no dynamic class names — JIT-safe).

interface TypeVisual {
  Icon: typeof CheckCircle2;
  badge: string; // tailwind classes for the icon background pill
}

const TYPE_VISUALS: Record<string, TypeVisual> = {
  mission_complete: {
    Icon: CheckCircle2,
    badge: 'bg-lime/15 text-lime border-lime/30',
  },
  mission_partial: {
    Icon: AlertTriangle,
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  mission_failed: {
    Icon: XCircle,
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
  payment_received: {
    Icon: CreditCard,
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  payment_failed: {
    Icon: XCircle,
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
};

const FALLBACK_VISUAL: TypeVisual = {
  Icon: Bell,
  badge: 'bg-white/10 text-white/80 border-white/15',
};

function visualFor(type: string): TypeVisual {
  return TYPE_VISUALS[type] ?? FALLBACK_VISUAL;
}

// ── Relative-time formatter (no dep) ────────────────────────────────────

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 45) return 'Just now';
  if (seconds < 90) return '1m ago';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Component ───────────────────────────────────────────────────────────

export interface NotificationBellProps {
  /** When provided, bell is laid out for the mobile drawer (larger hit area). */
  inDrawer?: boolean;
}

export function NotificationBell({ inDrawer = false }: NotificationBellProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const userId = user?.id ?? null;

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read_at).length,
    [items],
  );

  /** Pretty badge label. Caps at 99+ per spec. */
  const badgeLabel = useMemo(() => {
    if (unreadCount === 0) return null;
    return unreadCount > 99 ? '99+' : String(unreadCount);
  }, [unreadCount]);

  // ─── Fetch ────────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // RLS scopes to user's own rows — no need for an explicit user_id filter,
      // but we add it anyway as defence-in-depth in case the policy ever
      // gets dropped (the explicit filter is harmless under correct RLS).
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, title, body, link, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(FETCH_LIMIT);
      if (!error && Array.isArray(data)) {
        setItems(data as NotifRow[]);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch + on user change.
  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    refetch();
  }, [userId, refetch]);

  // Refresh on window focus — catches notifications fired while the tab
  // was backgrounded and the realtime subscription either missed the
  // INSERT or queued it.
  useEffect(() => {
    if (!userId) return;
    const onFocus = () => refetch();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [userId, refetch]);

  // Realtime subscription — INSERT events on this user's notifications.
  // Falls back gracefully if the realtime channel can't subscribe (the
  // initial fetch + window-focus refresh keep the bell roughly live).
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotifRow | null;
          if (!row) return;
          setItems((prev) => {
            // Skip if already present (defensive against double-INSERT).
            if (prev.some((n) => n.id === row.id)) return prev;
            // Prepend newest, keep cap at FETCH_LIMIT.
            return [row, ...prev].slice(0, FETCH_LIMIT);
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotifRow | null;
          if (!row) return;
          setItems((prev) =>
            prev.map((n) => (n.id === row.id ? { ...n, ...row } : n)),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ─── Outside-click + Esc to close ────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // ─── Mark as read ─────────────────────────────────────────────────────
  const markRead = useCallback(
    async (id: string) => {
      // Optimistic update — UI flips immediately; if the write fails the
      // realtime UPDATE event won't fire and the next refetch will sync.
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      try {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', id)
          .is('read_at', null);
      } catch {
        /* RLS-scoped update failure → next refetch will reconcile */
      }
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    try {
      await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('user_id', userId)
        .is('read_at', null);
    } catch {
      /* fall through — next refetch reconciles */
    }
  }, [userId, unreadCount]);

  const handleItemClick = useCallback(
    (item: NotifRow) => {
      if (!item.read_at) {
        markRead(item.id);
      }
      setOpen(false);
      if (item.link) navigate(item.link);
    },
    [navigate, markRead],
  );

  // Don't render the bell at all if no user — AuthedTopNav only mounts on
  // authed routes, but this is a defence in case it's ever placed elsewhere.
  if (!userId) return null;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `Notifications — ${unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={open}
        className={[
          'relative inline-flex items-center justify-center',
          inDrawer ? 'w-11 h-11' : 'w-10 h-10',
          'rounded-lg text-white/80 hover:text-white hover:bg-white/5',
          'border border-white/10 hover:border-white/15',
          'transition-colors',
        ].join(' ')}
      >
        <Bell className="w-[18px] h-[18px]" />
        {badgeLabel !== null && (
          <span
            aria-hidden
            className={[
              'absolute -top-1 -right-1',
              'min-w-[18px] h-[18px] px-1',
              'inline-flex items-center justify-center',
              'rounded-full bg-lime text-black',
              'font-display font-black text-[10px] leading-none',
              'border-2 border-bg',
            ].join(' ')}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-label="Notifications"
            className={[
              'absolute z-[120]',
              // Anchor: align right edge to bell on desktop; full-width on small screens.
              'right-0 mt-2',
              'w-[min(92vw,380px)]',
              'rounded-xl bg-bg2 border border-b1 shadow-float',
              'overflow-hidden',
            ].join(' ')}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-b1">
              <span className="font-display font-black text-white text-[14px] tracking-tight-2">
                Notifications
                {loading && items.length === 0 ? (
                  <span className="ml-2 font-body font-normal text-t4 text-[11px]">loading…</span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className={[
                  'font-display font-bold uppercase tracking-widest text-[10px]',
                  'transition-colors',
                  unreadCount === 0
                    ? 'text-t4 cursor-not-allowed'
                    : 'text-lime hover:text-lime/80',
                ].join(' ')}
              >
                Mark all read
              </button>
            </div>

            {/* List */}
            <ul className="max-h-[420px] overflow-y-auto py-1">
              {items.length === 0 ? (
                <li className="px-4 py-10 text-center font-body text-[13px] text-t3">
                  {loading ? 'Loading…' : 'No notifications yet.'}
                </li>
              ) : (
                items.map((item) => {
                  const { Icon, badge } = visualFor(item.type);
                  const unread = !item.read_at;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={[
                          'w-full text-left flex items-start gap-3',
                          'px-4 py-3 border-b border-b1/50 last:border-b-0',
                          'hover:bg-white/[0.03] transition-colors',
                          unread ? 'bg-lime/[0.02]' : '',
                        ].join(' ')}
                      >
                        <span
                          aria-hidden
                          className={[
                            'shrink-0 w-8 h-8 rounded-lg inline-flex items-center justify-center',
                            'border',
                            badge,
                          ].join(' ')}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-display font-bold text-white text-[13px] leading-tight truncate">
                              {item.title || 'Notification'}
                            </span>
                            {unread && (
                              <span
                                aria-hidden
                                className="shrink-0 w-1.5 h-1.5 rounded-full bg-lime"
                              />
                            )}
                          </span>
                          {item.body ? (
                            <span className="block mt-0.5 font-body text-[12px] text-t3 leading-snug line-clamp-2">
                              {item.body}
                            </span>
                          ) : null}
                          <span className="block mt-1 font-display font-bold text-[10px] uppercase tracking-widest text-t4">
                            {relativeTime(item.created_at)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
