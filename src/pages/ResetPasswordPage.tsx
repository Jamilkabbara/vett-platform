import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { prettifyAuthError } from '../lib/authErrors';
import { useToast } from '../components/ui/Toast';
import { Logo } from '../components/ui/Logo';
import { TopNav } from '../components/ui/TopNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

/**
 * /reset-password — password-update form reached via email link.
 *
 * Flow (PKCE):
 *   1. ForgotPasswordPage calls resetPasswordForEmail with redirectTo=/reset-password.
 *   2. Supabase emails a link → supabase.co/auth/v1/verify?…&redirect_to=/reset-password
 *   3. Supabase verify endpoint redirects to /reset-password?code=XXX
 *   4. Supabase JS client (flowType:'pkce') auto-exchanges the code using the
 *      code_verifier stored in localStorage, fires onAuthStateChange with
 *      event=PASSWORD_RECOVERY.
 *   5. This page shows the form, user submits → supabase.auth.updateUser({ password }).
 *   6. Navigate to /signin on success.
 *
 * Gmail/Outlook pre-fetcher safety: link prefetchers hit the Supabase verify
 * URL (step 2) which redirects to the app URL (step 3). Prefetchers don't run
 * JS, so they never trigger the code exchange (step 4). The code survives
 * until the user's own browser loads the page.
 *
 * Error cases handled:
 *   - No code in URL (direct navigation) → "invalid link" state
 *   - Supabase returns error hash (otp_expired, etc.) → error state
 *   - Code exchange times out → error state
 */

type PageState = 'waiting' | 'ready' | 'error' | 'submitting' | 'done';

function extractHashError(): string | null {
  // Supabase sometimes redirects with #error_code=otp_expired or
  // #error_description=... in the fragment when the OTP was already used.
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const desc = params.get('error_description') || params.get('error');
  if (desc) return decodeURIComponent(desc.replace(/\+/g, ' '));
  return null;
}

export function ResetPasswordPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>('waiting');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    // Surface any error Supabase encoded in the URL hash immediately.
    const hashErr = extractHashError();
    if (hashErr) {
      setErrorMsg(hashErr);
      setPageState('error');
      return;
    }

    // No code and no hash params at all → direct navigation, not a valid link.
    const code = new URLSearchParams(window.location.search).get('code');
    const hasFragment = window.location.hash.includes('access_token');
    if (!code && !hasFragment) {
      setErrorMsg('This link is invalid or has already been used. Request a new one.');
      setPageState('error');
      return;
    }

    // Listen for the PASSWORD_RECOVERY event that fires once the Supabase
    // client has exchanged the code for a session (happens automatically with
    // detectSessionInUrl:true, which is the default).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready');
      }
    });

    // Safety timeout — if the exchange hasn't fired after 8s, surface an error.
    const timeout = setTimeout(() => {
      setErrorMsg(
        'The reset link may have expired. Request a new one from the sign-in page.',
      );
      setPageState('error');
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldError('');

    if (password.length < 8) {
      setFieldError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setFieldError('Passwords do not match.');
      return;
    }

    setPageState('submitting');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPageState('done');
      toast.success('Password updated. You can now sign in.');
      setTimeout(() => navigate('/signin'), 1500);
    } catch (err) {
      const pretty = prettifyAuthError(err, {
        fallback: 'Could not update password. The link may have expired — request a new one.',
      });
      setErrorMsg(pretty);
      setPageState('error');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg text-t1">
      <TopNav
        left={
          <Link to="/" aria-label="Home">
            <Logo responsive />
          </Link>
        }
        right={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/signin')}
          >
            Back to sign in
          </Button>
        }
      />

      <main className="flex-1 flex items-start justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-[440px]">
          <Card className="space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-lime/10 border border-lime/20">
              <KeyRound className="w-5 h-5 text-lime" />
            </div>

            <div>
              <h1 className="font-display font-black text-white text-[22px] tracking-tight-2 leading-tight">
                Set new password
              </h1>
              <p className="mt-1 font-body text-[13px] text-t2 leading-relaxed">
                Choose a strong password — at least 8 characters.
              </p>
            </div>

            {/* Waiting for Supabase code exchange */}
            {pageState === 'waiting' && (
              <div className="flex items-center gap-2 font-body text-[13px] text-t2 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-lime" />
                Verifying reset link…
              </div>
            )}

            {/* Error state */}
            {pageState === 'error' && (
              <div className="space-y-3">
                <div
                  role="alert"
                  className="rounded-lg border border-red/40 bg-red/10 px-3 py-2.5 font-body text-[13px] text-red"
                >
                  {errorMsg}
                </div>
                <Link
                  to="/forgot-password"
                  className="block text-center font-body text-[13px] text-lime hover:underline"
                >
                  Request a new reset link →
                </Link>
              </div>
            )}

            {/* Success state */}
            {pageState === 'done' && (
              <div className="rounded-lg border border-grn/40 bg-grn/10 px-3 py-3 font-body text-[13px] text-grn">
                Password updated. Redirecting to sign in…
              </div>
            )}

            {/* Form — shown when session is ready or while submitting */}
            {(pageState === 'ready' || pageState === 'submitting') && (
              <form onSubmit={handleSubmit} className="space-y-3">
                {fieldError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red/40 bg-red/10 px-3 py-2.5 font-body text-[13px] text-red"
                  >
                    {fieldError}
                  </div>
                )}

                <label className="block">
                  <span className="block font-display font-bold text-[11px] text-t3 uppercase tracking-widest mb-1.5">
                    New password
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    autoFocus
                    className="w-full h-11 px-3.5 bg-bg3 border border-b1 rounded-lg font-body text-[14px] text-t1 placeholder:text-t4 focus:outline-none focus:border-lime/60 focus:ring-2 focus:ring-lime/20 transition-colors"
                  />
                </label>

                <label className="block">
                  <span className="block font-display font-bold text-[11px] text-t3 uppercase tracking-widest mb-1.5">
                    Confirm password
                  </span>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Same password again"
                    required
                    autoComplete="new-password"
                    className="w-full h-11 px-3.5 bg-bg3 border border-b1 rounded-lg font-body text-[14px] text-t1 placeholder:text-t4 focus:outline-none focus:border-lime/60 focus:ring-2 focus:ring-lime/20 transition-colors"
                  />
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  rounded="lg"
                  fullWidth
                  loading={pageState === 'submitting'}
                >
                  Update password
                </Button>
              </form>
            )}

            <div className="pt-1 text-center font-body text-[12px] text-t3">
              Need help?{' '}
              <Link to="/forgot-password" className="text-lime hover:underline">
                Request another reset link →
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default ResetPasswordPage;
