import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, User as UserIcon, Receipt, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Lime-on-black initials avatar with a dropdown menu.
 *
 * Mirrors .avatar from .design-reference/prototype.html (lines ~1205+):
 * 36x36 lime square, black initials, brand lime glow. The dropdown adds
 * Profile / Billing / Settings / Sign out — the prototype only had the
 * bubble itself, but real auth needs somewhere to log out from.
 *
 * Derives initials in this order:
 *   1. user_metadata.first_name + last_name (first letter of each)
 *   2. user_metadata.full_name (first letters of first two words)
 *   3. Email local-part (first two alpha chars)
 *   4. Literal 'VT' as a last-resort so the bubble never renders empty.
 */

export interface AvatarBubbleProps {
  /**
   * Override the underlying auth user (useful for storybook / preview).
   * When omitted the hook reads from AuthContext.
   */
  user?: User | null;
  /**
   * Render a simplified bubble without the dropdown menu — used inside
   * the mobile drawer, where nav items already expose the same routes.
   */
  plain?: boolean;
  className?: string;
}

export function deriveInitials(user: User | null | undefined): string {
  if (!user) return 'VT';
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const first = typeof meta.first_name === 'string' ? meta.first_name : '';
  const last = typeof meta.last_name === 'string' ? meta.last_name : '';
  if (first || last) {
    const a = first.charAt(0);
    const b = last.charAt(0);
    const combined = `${a}${b}`.trim();
    if (combined) return combined.toUpperCase();
  }
  const full = typeof meta.full_name === 'string' ? meta.full_name : '';
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    const a = parts[0]?.charAt(0) ?? '';
    const b = parts[1]?.charAt(0) ?? '';
    const combined = `${a}${b}`.trim();
    if (combined) return combined.toUpperCase();
  }
  const email = typeof user.email === 'string' ? user.email : '';
  if (email) {
    const local = email.split('@')[0] ?? '';
    const alpha = local.replace(/[^a-zA-Z]/g, '');
    if (alpha.length >= 2) return alpha.slice(0, 2).toUpperCase();
    if (alpha.length === 1) return alpha.toUpperCase();
  }
  return 'VT';
}

export function AvatarBubble({
  user: userProp,
  plain = false,
  className = '',
}: AvatarBubbleProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = userProp ?? auth.user;
  const initials = deriveInitials(user);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent | globalThis.KeyboardEvent) => {
      if ((e as globalThis.KeyboardEvent).key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey as EventListener);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey as EventListener);
    };
  }, [open]);

  const bubble = (
    <span
      aria-hidden={!plain}
      className={[
        'inline-flex items-center justify-center',
        'w-9 h-9 rounded-lg bg-lime shadow-lime-glow',
        'font-display font-black text-[13px] text-black',
        'tracking-tight-2 leading-none',
      ].join(' ')}
    >
      {initials}
    </span>
  );

  if (plain) {
    return (
      <button
        type="button"
        onClick={() => navigate('/profile')}
        className={`inline-flex items-center gap-3 ${className}`}
        aria-label="View profile"
      >
        {bubble}
        <span className="flex flex-col items-start">
          <span className="font-display font-bold text-white text-[13px] leading-tight">
            {user?.email ?? 'Your account'}
          </span>
          <span className="font-body text-[11px] text-t3 leading-tight">
            View profile
          </span>
        </span>
      </button>
    );
  }

  const handleSignOut = async () => {
    setOpen(false);
    await auth.signOut();
    navigate('/');
  };

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-lime/40"
      >
        {bubble}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="avatar-menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="menu"
            aria-label="Account"
            className={[
              'absolute right-0 mt-2 z-[120]',
              'w-[240px] rounded-xl bg-bg2 border border-b1 shadow-float',
              'overflow-hidden',
            ].join(' ')}
          >
            <div className="px-4 py-3 border-b border-b1">
              <div className="font-display font-bold text-white text-[13px] truncate">
                {user?.email ?? 'Your account'}
              </div>
              <div className="font-body text-[11px] text-t3 mt-0.5">
                Signed in
              </div>
            </div>
            <nav className="py-1">
              <MenuItem icon={<UserIcon className="w-4 h-4" />} onClick={() => go('/profile')}>
                Profile
              </MenuItem>
              <MenuItem icon={<Receipt className="w-4 h-4" />} onClick={() => go('/billing')}>
                Billing
              </MenuItem>
              <MenuItem icon={<Settings className="w-4 h-4" />} onClick={() => go('/settings')}>
                Settings
              </MenuItem>
            </nav>
            <div className="py-1 border-t border-b1">
              <MenuItem icon={<LogOut className="w-4 h-4" />} onClick={handleSignOut} destructive>
                Sign out
              </MenuItem>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  onClick,
  destructive = false,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2.5 px-4 py-2',
        'font-body text-[13px]',
        'transition-colors',
        destructive
          ? 'text-red hover:bg-red/10'
          : 'text-t2 hover:text-white hover:bg-white/5',
      ].join(' ')}
    >
      <span className="shrink-0" aria-hidden>
        {icon}
      </span>
      <span>{children}</span>
    </button>
  );
}

export default AvatarBubble;
