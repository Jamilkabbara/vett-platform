import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface OverlayPageProps {
  children: React.ReactNode;
}

export const OverlayPage = ({ children }: OverlayPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Pass 40 CRASH40-1 — ref on the scrollable container so we can
  // forcibly reset scrollTop on mount AND on route change. The
  // outer div is the scroll container (body has overflow:hidden,
  // see the effect below), and a previous mount or the browser's
  // scroll-anchoring logic can leave it at a non-zero scrollTop
  // when a new OverlayPage instance mounts.
  // DOM forensic from Pass 39 live audit on /results/b2072d69:
  //   <div class="fixed inset-0 z-50 ...">
  //     scrollTop: 1460.5      ← hero is at -1309px, KPI strip invisible
  //     scrollHeight: 2261
  //     clientHeight: 801
  //   </div>
  // The user could only see content from index 1460..2261 (recommendations
  // + follow-ups); the hero + KPI strip lived above the visible region.
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Pass 40 CRASH40-1 — reset scrollTop on mount and every route change
  // inside the overlay. Two rAF ticks: the first lets framer-motion's
  // initial layout settle, the second lets the inner content's mount
  // effects (KPI strip data hydration, chart sizing) finish, so the
  // forced scroll-to-top survives any layout shift those might trigger.
  useEffect(() => {
    let cancelled = false;
    const r1 = requestAnimationFrame(() => {
      if (cancelled || !containerRef.current) return;
      containerRef.current.scrollTop = 0;
      const r2 = requestAnimationFrame(() => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.scrollTop = 0;
      });
      // r2 is captured in closure; cancelled flag handles unmount mid-rAF.
      void r2;
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(r1);
    };
  }, [location.pathname]);

  const handleClose = () => {
    navigate('/landing', { replace: true });
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background-dark/95 backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative w-full min-h-[100dvh]"
        >
          <button
            onClick={handleClose}
            className="fixed top-8 right-8 z-50 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 hover:scale-110 group"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
          </button>

          <div className="px-4 sm:px-6 py-24 max-w-6xl mx-auto">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
