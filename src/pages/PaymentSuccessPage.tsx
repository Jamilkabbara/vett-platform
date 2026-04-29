/**
 * Pass 23 Bug 23.0e v2 + Bug 23.52 — Stripe Checkout success landing page.
 *
 * URL shape:
 *   /payment-success?session_id=cs_xxx  (mission flow — default)
 *   /payment-success?session_id=cs_xxx&kind=chat_overage&chat_session_id=...&return=...
 *     (chat overage flow — bounce back to where the user was chatting)
 *
 * Bug 23.52 changes:
 *   - Backend GET /api/payments/checkout-session/:id is now anon-friendly
 *     (the session id itself is the capability token), so the polling loop
 *     works even before the user re-authenticates after a long Stripe
 *     Checkout flow.
 *   - PaymentSuccessPage detects unauthenticated state on mount. If
 *     the session id is valid but the user's Supabase auth has expired,
 *     we still poll the session for status, AND surface a sign-in CTA
 *     that round-trips back to /payment-success?session_id=<id>.
 *   - POLL_MAX_MS bumped from 60s to 90s — Apple Pay biometric + 3DS can
 *     stretch the legitimate window.
 *   - Diagnostic funnel emits (`payment_success_*`) at every branch so
 *     we can replay the user's exact path post-mortem if anything goes
 *     wrong again.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { api } from '../lib/apiClient';
import { supabase } from '../lib/supabase';
import { trackFunnel } from '../lib/funnelTrack';
import { logPaymentError } from '../lib/paymentErrorLogger';

type PollStatus = 'polling' | 'success' | 'delayed' | 'error';

interface CheckoutSessionResponse {
  id: string;
  status: string;        // open | complete | expired
  paymentStatus: string; // paid | unpaid | no_payment_required
  paymentIntentId: string | null;
  missionId: string | null;
  amountTotal: number | null;
  currency: string | null;
}

const POLL_INTERVAL_MS = 2000;
// Pass 23 Bug 23.52 — 60s → 90s. Apple Pay biometric prompt + 3DS
// interstitial + a slow Stripe webhook can legitimately push past 60s
// before the mission row reflects the paid state. 90s = 45 polls × 2s.
const POLL_MAX_MS = 90_000;

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get('session_id');
  const kind = searchParams.get('kind') || 'mission';
  const returnUrl = searchParams.get('return');
  const chatSessionId = searchParams.get('chat_session_id');

  const [status, setStatus] = useState<PollStatus>('polling');
  const [missionId, setMissionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Pass 23 Bug 23.52 — auth state captured on mount. `null` = still
  // resolving, `false` = signed out, `true` = signed in. The signed-out
  // branch surfaces a sign-in CTA but still runs the polling loop in
  // parallel so the user can come back to a finished state if they sign
  // in mid-poll.
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  // ─── Mount-time auth check + diagnostic emit ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let hasAuth = false;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        hasAuth = Boolean(session?.access_token);
      } catch { /* swallow — treat as unauth */ }
      if (cancelled) return;
      setIsAuthed(hasAuth);
      trackFunnel('payment_success_page_loaded', {
        session_id: sessionId,
        has_auth: hasAuth,
        kind,
      }).catch(() => {});
      if (!hasAuth) {
        trackFunnel('payment_success_session_expired', {
          session_id: sessionId,
          kind,
        }).catch(() => {});
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Polling loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('Missing session id in URL.');
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    let attempt = 0;

    async function poll() {
      attempt += 1;
      try {
        const session = await api.get(
          `/api/payments/checkout-session/${encodeURIComponent(sessionId!)}`,
        ) as CheckoutSessionResponse;

        if (cancelled) return;

        if (session.missionId && !missionId) setMissionId(session.missionId);

        trackFunnel('payment_success_poll_attempt', {
          session_id: session.id,
          attempt,
          status: session.status,
          payment_status: session.paymentStatus,
        }).catch(() => {});

        // Stripe says "complete" with paid → success, redirect.
        if (session.status === 'complete' && session.paymentStatus === 'paid') {
          // Funnel event — we lost the inline-modal mission_paid emit, so
          // fire it here once the success page confirms payment.
          if (kind === 'mission' && session.missionId) {
            trackFunnel('mission_paid', {
              method: 'stripe_checkout',
              amount_cents: session.amountTotal ?? 0,
              session_id: session.id,
            }, { mission_id: session.missionId });
          }

          if (kind === 'chat_overage' && returnUrl) {
            // Best-effort: also call confirm-overage to credit early in case
            // the webhook is slow. The endpoint is idempotent.
            if (chatSessionId && session.paymentIntentId) {
              api.post('/api/chat/confirm-overage', {
                sessionId: chatSessionId,
                paymentIntentId: session.paymentIntentId,
              }).catch(() => {});
            }
            // Bounce to where the user was chatting.
            trackFunnel('payment_success_redirect', {
              target: returnUrl,
              kind: 'chat_overage',
            }).catch(() => {});
            window.location.href = returnUrl;
            return;
          }

          // Mission flow → /dashboard/:missionId by default, but creative
          // attention missions go to /creative-results/:missionId. The
          // session response doesn't carry goal_type, so we resolve it
          // from the mission row (RLS lets the owner read it). On any
          // lookup failure we fall back to /dashboard/:missionId.
          //
          // Bug 23.52 note: if the user is signed-out, the supabase read
          // is RLS-blocked → falls through to /dashboard/:id (which itself
          // redirects to /signin?redirect=... for unauthed users, with
          // missionId preserved in the redirect target). Either way the
          // user lands somewhere they can resume from.
          if (session.missionId) {
            setStatus('success');
            let dest = `/dashboard/${session.missionId}`;
            try {
              const { data: missionRow } = await supabase
                .from('missions')
                .select('goal_type')
                .eq('id', session.missionId)
                .maybeSingle();
              if (missionRow?.goal_type === 'creative_attention') {
                dest = `/creative-results/${session.missionId}`;
              }
            } catch {
              /* fall through to default dashboard route */
            }
            trackFunnel('payment_success_redirect', {
              target: dest,
              mission_id: session.missionId,
              kind: 'mission',
            }, { mission_id: session.missionId }).catch(() => {});
            setTimeout(() => {
              if (cancelled) return;
              navigate(dest);
            }, 1500);
            return;
          }
        }

        // Still in progress — keep polling.
        if (Date.now() - startedAt < POLL_MAX_MS) {
          setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          // Graceful fallback — payment is paid (Stripe redirected us here),
          // but downstream processing is slow. The webhook will catch up;
          // the user can refresh or check /missions later.
          setStatus('delayed');
          trackFunnel('payment_success_timeout', {
            session_id: session.id,
            mission_id: session.missionId,
            attempts: attempt,
            stripe_status: session.status,
            stripe_payment_status: session.paymentStatus,
          }, { mission_id: session.missionId }).catch(() => {});
          logPaymentError({
            stage:                 'client_checkout_polling_timeout',
            missionId:             session.missionId ?? null,
            stripePaymentIntentId: session.paymentIntentId ?? null,
            errorCode:             'success_page_poll_timeout_90s',
            errorMessage:          `Polled session ${session.id} for 90s (${attempt} attempts); status=${session.status} paymentStatus=${session.paymentStatus}`,
          });
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        // 404 / 403 from server → terminal error; otherwise keep retrying
        // until timeout.
        if (Date.now() - startedAt < POLL_MAX_MS && !message.toLowerCase().includes('not found')) {
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }
        setStatus('error');
        setErrorMessage(message);
        logPaymentError({
          stage:        'client_checkout_polling_timeout',
          missionId:    null,
          errorCode:    'success_page_poll_error',
          errorMessage: message,
        });
      }
    }

    poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Build a sign-in URL that preserves the success page so the user
  // returns to the same polling state after auth.
  const signInWithReturn = () => {
    const here = sessionId
      ? `/payment-success?session_id=${encodeURIComponent(sessionId)}${kind && kind !== 'mission' ? `&kind=${encodeURIComponent(kind)}` : ''}${chatSessionId ? `&chat_session_id=${encodeURIComponent(chatSessionId)}` : ''}${returnUrl ? `&return=${encodeURIComponent(returnUrl)}` : ''}`
      : '/missions';
    navigate(`/signin?redirect=${encodeURIComponent(here)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        {status === 'polling' && (
          <>
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/15 mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-white text-xl font-black mb-2">Payment received</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Starting your mission. This usually takes a few seconds.
            </p>
            {isAuthed === false && (
              <div className="mt-5 pt-5 border-t border-white/10">
                <p className="text-white/70 text-xs leading-relaxed mb-3">
                  Your sign-in expired during checkout. Sign back in to view
                  your processing mission.
                </p>
                <button
                  onClick={signInWithReturn}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-gray-900 hover:bg-primary-hover font-bold text-sm transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in to view your mission
                </button>
              </div>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-500/20 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-white text-xl font-black mb-2">Mission launched</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Redirecting you now...
            </p>
          </>
        )}

        {status === 'delayed' && (
          <>
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-amber-500/15 mb-4">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-white text-xl font-black mb-2">Payment received</h1>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Your mission is paid and queued. Processing is taking a little
              longer than usual to start. You can open the mission now to
              watch progress live, or we&rsquo;ll email you when the report
              is ready.
            </p>
            <div className="flex flex-col gap-2">
              {isAuthed === false ? (
                <button
                  onClick={signInWithReturn}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-gray-900 hover:bg-primary-hover font-bold text-sm transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in to view your mission
                </button>
              ) : (
                <>
                  {missionId && (
                    <button
                      onClick={() => navigate(`/dashboard/${missionId}`)}
                      className="w-full py-2 px-4 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary font-semibold text-sm transition-colors"
                    >
                      Open mission
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/missions')}
                    className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 font-semibold text-sm transition-colors"
                  >
                    View all missions
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-red-500/15 mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-white text-xl font-black mb-2">Something is off</h1>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              {errorMessage ?? 'We could not confirm your payment status.'}{' '}
              If your card was charged, your mission is still queued. Check{' '}
              <button
                onClick={() => navigate('/missions')}
                className="underline text-primary hover:text-primary-hover"
              >
                your missions
              </button>{' '}
              or email{' '}
              <a href="mailto:hello@vettit.ai" className="underline text-primary hover:text-primary-hover">
                hello@vettit.ai
              </a>.
            </p>
            {isAuthed === false && (
              <button
                onClick={signInWithReturn}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-gray-900 hover:bg-primary-hover font-bold text-sm transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
