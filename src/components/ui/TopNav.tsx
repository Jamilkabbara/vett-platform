import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

/**
 * Sticky top nav — mirrors prototype.html's .topnav:
 *   transparent bg, 72px min-height, backdrop-blur, 14px 40px padding
 *   (→ 0 16px on mobile).
 *
 * Uses a 3-slot layout: `left` (usually <Logo/>), `center` (optional nav
 * links), `right` (CTAs / avatar). Below 768px the `right` slot collapses
 * into a hamburger drawer.
 */
export interface TopNavProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  /** Contents shown inside the mobile drawer. Defaults to `right`. */
  mobileMenu?: ReactNode;
  className?: string;
}

export function TopNav({
  left,
  center,
  right,
  mobileMenu,
  className = '',
}: TopNavProps) {
  const [open, setOpen] = useState(false);

  // Close drawer when viewport grows past the md breakpoint (Tailwind 768px).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Lock body scroll while drawer open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const drawerContents = mobileMenu ?? right;

  return (
    <>
      <header
        className={[
          'sticky top-0 z-[100]',
          'flex items-center justify-between gap-4',
          'min-h-[72px] px-4 md:px-10 py-3 md:py-3.5',
          'bg-transparent backdrop-blur-md',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Left slot */}
        <div className="flex items-center shrink-0">{left}</div>

        {/* Center slot — hidden on mobile, shown at md+ */}
        {center && (
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {center}
          </nav>
        )}

        {/* Right slot — shown at md+, replaced with hamburger below md */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">{right}</div>

        {/* Hamburger — only visible on mobile, and only when there's drawer content */}
        {drawerContents && (
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && drawerContents && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="md:hidden fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
              aria-hidden
            />
            <motion.div
              key="drawer-panel"
              role="dialog"
              aria-modal="true"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="md:hidden fixed top-0 right-0 bottom-0 z-[160] w-[80%] max-w-sm bg-bg2 border-l border-b1 shadow-float"
            >
              <div className="flex items-center justify-end h-[72px] px-4">
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-col gap-3 px-6 pb-6">{drawerContents}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default TopNav;
