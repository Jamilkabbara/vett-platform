import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react';

/**
 * Toast system — mirrors prototype.html's .toast variants.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Mission launched');
 *   toast.error('Something went wrong');
 *   const id = toast.loading('Saving…');
 *   toast.dismiss(id);
 *   toast.update(id, { type: 'success', message: 'Saved!' });
 *
 * Behaviour:
 *   - Desktop: bottom-right stack, 320px max-width.
 *   - Mobile (<640px): bottom-center stack, ~90vw.
 *   - Auto-dismiss after 3s (loading never auto-dismisses).
 *   - Animates in/out with framer-motion.
 *
 * Graceful fallback: if `useToast()` is called without a provider mounted,
 * it returns a no-op stub so components like DesignSystemPreview don't
 * crash before ToastProvider is wired in main.tsx.
 */

export type ToastType = 'success' | 'error' | 'loading' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastUpdate {
  type?: ToastType;
  message?: string;
  duration?: number;
}

interface ToastApi {
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  loading: (message: string) => string;
  dismiss: (id: string) => void;
  update: (id: string, patch: ToastUpdate) => void;
}

const NOOP_API: ToastApi = {
  success: () => '',
  error: () => '',
  info: () => '',
  loading: () => '',
  dismiss: () => {},
  update: () => {},
};

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 3000;

const VARIANT_CLASS: Record<ToastType, string> = {
  success:
    'bg-grn/15 border-grn/40 text-grn',
  error:
    'bg-red/15 border-red/40 text-red',
  info:
    'bg-blu/15 border-blu/30 text-blu',
  loading:
    'bg-lime/[0.12] border-lime/30 text-lime',
};

function ToastIcon({ type }: { type: ToastType }) {
  const cls = 'w-4 h-4 shrink-0';
  switch (type) {
    case 'success':
      return <CheckCircle2 className={cls} />;
    case 'error':
      return <AlertCircle className={cls} />;
    case 'info':
      return <Info className={cls} />;
    case 'loading':
      return <Loader2 className={`${cls} animate-spin`} />;
  }
}

function makeId() {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Default auto-dismiss duration in ms (ignored for loading toasts). */
  duration?: number;
}

export function ToastProvider({
  children,
  duration = DEFAULT_DURATION,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, ms: number) => {
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => dismiss(id), ms);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const push = useCallback(
    (type: ToastType, message: string, customDuration?: number) => {
      const id = makeId();
      const item: ToastItem = { id, type, message, duration: customDuration };
      setToasts((prev) => [...prev, item]);
      if (type !== 'loading') {
        scheduleDismiss(id, customDuration ?? duration);
      }
      return id;
    },
    [duration, scheduleDismiss],
  );

  const update = useCallback(
    (id: string, patch: ToastUpdate) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
      const nextType = patch.type;
      if (nextType && nextType !== 'loading') {
        scheduleDismiss(id, patch.duration ?? duration);
      }
    },
    [duration, scheduleDismiss],
  );

  // Clean up outstanding timers on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, d) => push('success', message, d),
      error: (message, d) => push('error', message, d),
      info: (message, d) => push('info', message, d),
      loading: (message) => push('loading', message),
      dismiss,
      update,
    }),
    [push, dismiss, update],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={[
          'fixed z-[9999] pointer-events-none',
          // Mobile: bottom-center, near-full width
          'bottom-4 left-4 right-4',
          // Desktop (sm+): bottom-right, fixed max width
          'sm:left-auto sm:right-6 sm:bottom-6 sm:w-auto sm:max-w-sm',
          'flex flex-col gap-2 items-stretch sm:items-end',
        ].join(' ')}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={[
                'pointer-events-auto',
                'flex items-center gap-2.5',
                'px-4 py-3 rounded-lg border',
                'font-body text-[13px]',
                'shadow-toast backdrop-blur-md',
                'w-full sm:w-auto sm:max-w-[320px]',
                VARIANT_CLASS[t.type],
              ].join(' ')}
            >
              <ToastIcon type={t.type} />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Access the toast API. Returns a no-op shim when called outside a
 * ToastProvider so components that render in isolation (e.g. Storybook,
 * the /__design preview before commit 5) don't throw.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? NOOP_API;
}

export default ToastProvider;
