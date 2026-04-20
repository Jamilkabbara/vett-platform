import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';

/**
 * Shared Google + Apple OAuth buttons — wraps Supabase's
 * signInWithOAuth with explicit loading state, per-provider error
 * messaging, and a `redirectTo` hook so callers can round-trip a
 * post-auth destination.
 *
 * Matches prototype's .m-google button style (dark translucent fill,
 * centered icon + text, 10px gap).
 */
export interface OAuthButtonsProps {
  /** Path to return to after OAuth succeeds. Default '/dashboard'. */
  redirectPath?: string;
  /** Disable both buttons (e.g. while an email/password form is submitting). */
  disabled?: boolean;
  className?: string;
}

type Provider = 'google' | 'apple';

export function OAuthButtons({
  redirectPath = '/dashboard',
  disabled = false,
  className = '',
}: OAuthButtonsProps) {
  const toast = useToast();
  const [pending, setPending] = useState<Provider | null>(null);

  const start = async (provider: Provider, label: string) => {
    if (pending) return;
    setPending(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        },
      });
      // On success the browser navigates away before this resolves — if we
      // get here with no error, Supabase just handed us back control while
      // the redirect is in flight.
      if (error) throw error;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Could not connect to ${label}.`;
      toast.error(`${label} sign-in failed — ${message}`);
      setPending(null);
    }
  };

  const base =
    'w-full inline-flex items-center justify-center gap-2.5 rounded-lg px-4 h-11 ' +
    'font-display font-bold text-[13px] text-white ' +
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => start('google', 'Google')}
        disabled={disabled || pending !== null}
        className={`${base} bg-white/[0.08] border border-white/10 hover:bg-white/[0.12]`}
      >
        {pending === 'google' ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : (
          <GoogleIcon />
        )}
        <span>Continue with Google</span>
      </button>
      <button
        type="button"
        onClick={() => start('apple', 'Apple')}
        disabled={disabled || pending !== null}
        className={`${base} bg-white/[0.06] border border-white/[0.15] hover:bg-white/[0.1]`}
      >
        {pending === 'apple' ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : (
          <AppleIcon />
        )}
        <span>Continue with Apple</span>
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width={14} height={17} viewBox="0 0 814 1000" aria-hidden>
      <path
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-42.8-155.5-112.8c-48-68-87.5-168.2-87.5-263.6 0-243.8 158.3-372.5 312.7-372.5 78.6 0 144.7 51.9 193.8 51.9 47.4 0 121.9-55.1 209.4-55.1 16.1 0 113.1 1.3 180.1 80.8zm-134.6-142.5c27.2-57.9 26.7-119.1 5.6-165.2-33.7 2.7-72.8 24.6-103.6 54.5-28.4 27.2-52.5 72-43.6 120.4 37.7 3.2 75-17.7 141.6-9.7z"
        fill="#fff"
      />
    </svg>
  );
}

export default OAuthButtons;
