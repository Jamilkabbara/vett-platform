import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { api } from '../lib/apiClient';
import { prettifyAuthError } from '../lib/authErrors';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Logo } from '../components/ui/Logo';
import { TopNav } from '../components/ui/TopNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { OAuthButtons } from '../components/auth/OAuthButtons';

type Tab = 'signin' | 'signup';

const DEFAULT_REDIRECT = '/dashboard';

/**
 * Full-page sign-in / create-account screen matching prototype's
 * #pg-signin layout. Two tabs share a single Card (max-width 440px).
 *
 * Supabase wiring exactly mirrors the legacy AuthModal:
 *   signin   → supabase.auth.signInWithPassword({email, password})
 *   signup   → supabase.auth.signUp({email, password})
 *              then non-blocking api.post('/api/auth/register', {...})
 *   oauth    → delegated to <OAuthButtons/>
 *
 * Query params:
 *   ?tab=signup    → open on the Create Account tab
 *   ?redirect=/x   → where to land after success (default /dashboard)
 *
 * `useSearchParams` drives tab state so the browser back button restores
 * the correct tab.
 */
export function SignInPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const tab: Tab = params.get('tab') === 'signup' ? 'signup' : 'signin';
  const redirectPath = params.get('redirect') || DEFAULT_REDIRECT;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already authed? Skip the screen entirely.
  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [authLoading, user, redirectPath, navigate]);

  // Clear error when tab switches.
  useEffect(() => {
    setError('');
  }, [tab]);

  const setTab = (next: Tab) => {
    const nextParams = new URLSearchParams(params);
    if (next === 'signup') {
      nextParams.set('tab', 'signup');
    } else {
      nextParams.delete('tab');
    }
    setParams(nextParams, { replace: false });
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      toast.success('Welcome back!');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const pretty = prettifyAuthError(err, {
        fallback: 'Sign-in failed. Please try again.',
      });
      setError(pretty);
      toast.error(pretty);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (!agreed) {
      const msg = 'Please agree to the Terms & Privacy to continue.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
          },
        },
      });
      if (authError) throw authError;

      // Non-blocking: create profile row + send welcome email via backend.
      // Matches the legacy AuthModal side effect.
      //
      // Pass 23 Bug 23.33 — backend /api/auth/register reads `name` (single
      // string), not `firstName`/`lastName`. The mismatch meant the welcome
      // email went out without a name interpolation. Building the combined
      // name on this side preserves the existing two-input UX without
      // changing the backend contract.
      if (data.user) {
        const fullName = `${firstName} ${lastName}`.trim() || undefined;
        api
          .post('/api/auth/register', {
            userId: data.user.id,
            email: data.user.email,
            name: fullName,
          })
          .catch(() => {});
      }

      // Supabase returns a session immediately when email confirmation is
      // disabled, and null when it requires verification. Handle both.
      if (data.session) {
        toast.success('Account created — welcome to VETT!');
        navigate(redirectPath, { replace: true });
      } else {
        toast.success('Check your email to verify your account.');
        setTab('signin');
      }
    } catch (err) {
      const pretty = prettifyAuthError(err, {
        fallback: 'Sign-up failed. Please try again.',
      });
      setError(pretty);
      toast.error(pretty);
    } finally {
      setSubmitting(false);
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
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        }
      />

      <main className="flex-1 flex items-start justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-[440px]">
          <Card className="!p-0 overflow-hidden">
            {/* Tab toggle */}
            <div className="flex border-b border-b1" role="tablist">
              <TabBtn active={tab === 'signin'} onClick={() => setTab('signin')}>
                Sign In
              </TabBtn>
              <TabBtn active={tab === 'signup'} onClick={() => setTab('signup')}>
                Create Account
              </TabBtn>
            </div>

            <div className="p-6 md:p-7 space-y-4">
              <div>
                <h1 className="font-display font-black text-white text-[22px] tracking-tight-2 leading-tight">
                  {tab === 'signin' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="mt-1 font-body text-[13px] text-t2 leading-relaxed">
                  {tab === 'signin'
                    ? 'Sign in to your VETT account to access your missions and results.'
                    : 'Start running AI-simulated consumer research in minutes. No credit card required to create an account.'}
                </p>
              </div>

              {error && <ErrorBanner message={error} />}

              {tab === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-3">
                  <FieldInput
                    type="email"
                    label="Email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={setEmail}
                    required
                    autoComplete="email"
                  />
                  <FieldInput
                    type="password"
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    required
                    autoComplete="current-password"
                  />
                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="font-body text-[12px] text-lime hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    rounded="lg"
                    fullWidth
                    loading={submitting}
                  >
                    Sign In
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput
                      type="text"
                      label="First name"
                      placeholder="Ada"
                      value={firstName}
                      onChange={setFirstName}
                      required
                      autoComplete="given-name"
                    />
                    <FieldInput
                      type="text"
                      label="Last name"
                      placeholder="Lovelace"
                      value={lastName}
                      onChange={setLastName}
                      required
                      autoComplete="family-name"
                    />
                  </div>
                  <FieldInput
                    type="email"
                    label="Email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={setEmail}
                    required
                    autoComplete="email"
                  />
                  <FieldInput
                    type="password"
                    label="Password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={setPassword}
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <PasswordStrengthMeter password={password} />

                  <label className="flex items-start gap-2.5 font-body text-[12px] text-t2 leading-snug select-none">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-lime shrink-0"
                      required
                    />
                    <span>
                      I agree to the{' '}
                      <Link to="/terms" className="text-lime hover:underline">
                        Terms
                      </Link>{' '}
                      &amp;{' '}
                      <Link to="/privacy" className="text-lime hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    rounded="lg"
                    fullWidth
                    loading={submitting}
                  >
                    Create Account
                  </Button>
                </form>
              )}

              <div className="relative flex items-center gap-3 my-1">
                <span className="flex-1 h-px bg-b1" />
                <span className="font-body text-[11px] text-t3 uppercase tracking-widest">
                  or continue with
                </span>
                <span className="flex-1 h-px bg-b1" />
              </div>

              <OAuthButtons redirectPath={redirectPath} disabled={submitting} />

              <div className="pt-2 text-center font-body text-[12px] text-t3">
                {tab === 'signin' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('signup')}
                      className="text-lime hover:underline"
                    >
                      Create one free →
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('signin')}
                      className="text-lime hover:underline"
                    >
                      Sign in →
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

/* ── internal helpers ────────────────────────────────────────────── */

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'flex-1 h-12 font-display font-bold text-[13px] transition-colors',
        active
          ? 'text-white bg-bg3 border-b-2 border-lime'
          : 'text-t3 hover:text-t1 border-b-2 border-transparent',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function FieldInput({
  type,
  label,
  placeholder,
  value,
  onChange,
  required,
  autoComplete,
  minLength,
}: {
  type: 'text' | 'email' | 'password';
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="block font-display font-bold text-[11px] text-t3 uppercase tracking-widest mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'w-full h-11 px-3.5',
          'bg-bg3 border border-b1 rounded-lg',
          'font-body text-[14px] text-t1 placeholder:text-t4',
          'focus:outline-none focus:border-lime/60 focus:ring-2 focus:ring-lime/20',
          'transition-colors',
        ].join(' ')}
      />
    </label>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red/40 bg-red/10 px-3 py-2.5 font-body text-[13px] text-red"
    >
      <span className="leading-snug">{message}</span>
    </div>
  );
}

/**
 * Manual 4-bar password strength meter. Uses a simple heuristic (length +
 * character-class mix + repetition penalty) — no zxcvbn dependency needed.
 *
 * Returns a score 0–4 matched to a color/label.
 */
function PasswordStrengthMeter({ password }: { password: string }) {
  const score = useMemo(() => scorePassword(password), [password]);
  if (password.length === 0) {
    return <div className="h-[32px]" aria-hidden />;
  }
  const bars = [0, 1, 2, 3];
  const colors = ['bg-red', 'bg-org', 'bg-org', 'bg-grn'];
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const label = labels[score];
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5">
        {bars.map((i) => (
          <div
            key={i}
            className={[
              'h-1 flex-1 rounded-full transition-colors',
              i < score ? colors[Math.min(score - 1, colors.length - 1)] : 'bg-b1',
            ].join(' ')}
          />
        ))}
      </div>
      <div className="font-body text-[11px] text-t3">
        Strength: <span className="text-t1">{label}</span>
      </div>
    </div>
  );
}

function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  const classes =
    (/[a-z]/.test(pw) ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/\d/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  if (classes >= 2) score += 1;
  if (classes >= 3) score += 1;
  // Heavy repetition penalty (e.g. "aaaaaaaa")
  if (/(.)\1{3,}/.test(pw)) score = Math.max(0, score - 1);
  return Math.min(4, score);
}

export default SignInPage;
