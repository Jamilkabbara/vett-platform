import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { Logo } from '../components/ui/Logo';
import { TopNav } from '../components/ui/TopNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

/**
 * Email-only password reset form. Calls Supabase's
 * resetPasswordForEmail with a redirectTo that points back into the app
 * (/reset-password — not yet built, but the link is safe to hand out;
 * Supabase hosts the actual reset form until we replace it).
 */
export function ForgotPasswordPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (authError) throw authError;
      setSent(true);
      toast.success('Check your email for the reset link.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send reset link.';
      setError(msg);
      toast.error(msg);
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
              <Mail className="w-5 h-5 text-lime" />
            </div>

            <div>
              <h1 className="font-display font-black text-white text-[22px] tracking-tight-2 leading-tight">
                Reset your password
              </h1>
              <p className="mt-1 font-body text-[13px] text-t2 leading-relaxed">
                Enter the email address on your VETT account and we&apos;ll send you
                a link to set a new password.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red/40 bg-red/10 px-3 py-2.5 font-body text-[13px] text-red"
              >
                {error}
              </div>
            )}

            {sent ? (
              <div className="rounded-lg border border-grn/40 bg-grn/10 px-3 py-3 font-body text-[13px] text-grn">
                If an account exists for <span className="font-semibold">{email}</span>,
                we just sent a reset link. Check your inbox (and spam folder).
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block">
                  <span className="block font-display font-bold text-[11px] text-t3 uppercase tracking-widest mb-1.5">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                    className="w-full h-11 px-3.5 bg-bg3 border border-b1 rounded-lg font-body text-[14px] text-t1 placeholder:text-t4 focus:outline-none focus:border-lime/60 focus:ring-2 focus:ring-lime/20 transition-colors"
                  />
                </label>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  rounded="lg"
                  fullWidth
                  loading={submitting}
                >
                  Send reset link
                </Button>
              </form>
            )}

            <div className="pt-1 text-center font-body text-[12px] text-t3">
              Remembered it?{' '}
              <Link to="/signin" className="text-lime hover:underline">
                Back to sign in →
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
