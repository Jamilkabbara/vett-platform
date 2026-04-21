import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

/**
 * Notification bell + dropdown panel.
 *
 * Mirrors .notif-btn / .notif-panel from
 * .design-reference/prototype.html (lines ~1200–1260).
 *
 * This is a **stub** for Prompt 3 of the redesign. Items are static and
 * local-only — there is no backend yet. "Mark all read" only flips local
 * state, and "View all notifications →" surfaces a `toast.info` pointer
 * until we build a notifications service. Tracked in
 * `.design-reference/PROMPT_3_STUBS.md`.
 *
 * The shape (`NotifItem`, tab set, "Mark all read") matches the eventual
 * API contract so the UI can swap to live data without re-skinning.
 */

type NotifKind = 'mission' | 'insight' | 'billing' | 'content' | 'promo';
type NotifTab = 'all' | 'missions' | 'billing';

interface NotifItem {
  id: string;
  kind: NotifKind;
  icon: string;
  accent: string; // tailwind color token, e.g. 'grn'
  title: string;
  body: string;
  timeLabel: string;
  href?: string;
  unread: boolean;
}

const SEED: NotifItem[] = [
  {
    id: 'n1',
    kind: 'mission',
    icon: '✓',
    accent: 'grn',
    title: 'Mission complete — Meal Kit Validation',
    body: '100 AI personas analysed · NPS +62 · View results now',
    timeLabel: '2 min',
    href: '/dashboard',
    unread: true,
  },
  {
    id: 'n2',
    kind: 'insight',
    icon: '✦',
    accent: 'lime',
    title: 'AI insight ready',
    body: 'Your pricing study revealed a $49 sweet spot — see recommendations',
    timeLabel: '15 min',
    unread: true,
  },
  {
    id: 'n3',
    kind: 'billing',
    icon: '💳',
    accent: 'blu',
    title: 'Payment confirmed',
    body: '$105 charged to Visa ending 4242 · Invoice INV-2042 sent',
    timeLabel: '1 hour',
    href: '/billing',
    unread: true,
  },
  {
    id: 'n4',
    kind: 'content',
    icon: '📰',
    accent: 'pur',
    title: 'New blog post',
    body: 'Price sensitivity in MENA SaaS: the $49 sweet spot',
    timeLabel: 'Yesterday',
    href: '/blog',
    unread: false,
  },
  {
    id: 'n5',
    kind: 'promo',
    icon: '🎟',
    accent: 'org',
    title: 'Promo code FOLLOW50 unlocked',
    body: '50% off your next mission — expires in 7 days',
    timeLabel: '2 days',
    unread: false,
  },
];

/** Tailwind needs literal class strings for the JIT to include them. */
const ACCENT_CLASSES: Record<string, string> = {
  grn: 'bg-grn/15 text-grn border-grn/30',
  lime: 'bg-lime/15 text-lime border-lime/30',
  blu: 'bg-blu/15 text-blu border-blu/30',
  pur: 'bg-pur/15 text-pur border-pur/30',
  org: 'bg-org/15 text-org border-org/30',
  red: 'bg-red/15 text-red border-red/30',
};

function accentClass(token: string): string {
  return ACCENT_CLASSES[token] ?? ACCENT_CLASSES.lime;
}

export interface NotificationBellProps {
  /** When provided, label placed in mobile list context (larger hit area). */
  inDrawer?: boolean;
}

export function NotificationBell({ inDrawer = false }: NotificationBellProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<NotifTab>('all');
  const [items, setItems] = useState<NotifItem[]>(SEED);
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((i) => i.unread).length;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const visible = items.filter((i) => {
    if (tab === 'all') return true;
    if (tab === 'missions') return i.kind === 'mission' || i.kind === 'insight';
    if (tab === 'billing') return i.kind === 'billing' || i.kind === 'promo';
    return true;
  });

  const markAllRead = () => {
    setItems((prev) => prev.map((i) => ({ ...i, unread: false })));
  };

  const handleItemClick = (item: NotifItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, unread: false } : i)),
    );
    setOpen(false);
    if (item.href) navigate(item.href);
  };

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
        {unreadCount > 0 && (
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
            {unreadCount}
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

            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Notification filter"
              className="flex items-center gap-1 px-2 pt-2"
            >
              {(
                [
                  ['all', 'All'],
                  ['missions', 'Missions'],
                  ['billing', 'Billing'],
                ] as const
              ).map(([id, label]) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setTab(id)}
                    className={[
                      'flex-1 h-8 rounded-md',
                      'font-display font-bold text-[11px] uppercase tracking-widest',
                      'transition-colors',
                      active
                        ? 'bg-lime/15 text-lime border border-lime/30'
                        : 'text-t3 hover:text-t2 hover:bg-white/5 border border-transparent',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <ul className="max-h-[380px] overflow-y-auto py-1">
              {visible.length === 0 ? (
                <li className="px-4 py-10 text-center font-body text-[13px] text-t3">
                  You&apos;re all caught up.
                </li>
              ) : (
                visible.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={[
                        'w-full text-left flex items-start gap-3',
                        'px-4 py-3 border-b border-b1/50 last:border-b-0',
                        'hover:bg-white/[0.03] transition-colors',
                        item.unread ? 'bg-lime/[0.02]' : '',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'shrink-0 w-8 h-8 rounded-lg inline-flex items-center justify-center',
                          'border text-[14px]',
                          accentClass(item.accent),
                        ].join(' ')}
                        aria-hidden
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-white text-[13px] leading-tight truncate">
                            {item.title}
                          </span>
                          {item.unread && (
                            <span
                              aria-hidden
                              className="shrink-0 w-1.5 h-1.5 rounded-full bg-lime"
                            />
                          )}
                        </span>
                        <span className="block mt-0.5 font-body text-[12px] text-t3 leading-snug">
                          {item.body}
                        </span>
                        <span className="block mt-1 font-display font-bold text-[10px] uppercase tracking-widest text-t4">
                          {item.timeLabel}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-b1 bg-bg3/40">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toast.info('Full notifications inbox coming soon.');
                }}
                className="w-full text-center font-display font-bold text-[11px] uppercase tracking-widest text-lime hover:text-lime/80 transition-colors"
              >
                View all notifications →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
