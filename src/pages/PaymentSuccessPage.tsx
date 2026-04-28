/**
 * Pass 23 Bug 23.0e v2 — Stripe Checkout success landing page.
 *
 * URL shape:
 *   /payment-success?session_id=cs_xxx  (mission flow — default)
 *   /payment-success?session_id=cs_xxx&kind=chat_overage&chat_session_id=...&return=...
 *     (chat overage flow — bounce back to where the user was chatting)
 *
 * Behaviour (mission flow):
 *   1. Reads ?session_id= from URL.
 *   2. Polls GET /api/payments/checkout-session/:id every 2s for ≤30s OR
 *      until the mission status flips to processing/completed.
 *   3. Shows "Payment received! Your mission is running…" while polling.
 *   4. On success → redirects to /dashboard/:missionId.
 *   5. On 30s timeout → graceful fallback "Payment received but processing
 *      is delayed. We'll email you when ready." + manual View Missions CTA.
 *
 * Behaviour (chat overage flow):
 *   1. Same polling for session.payment_status='paid'.
 *   2. On success → bounce back to ?return= (the page the user was chatting on).
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
const POLL_MAX_MS = 30_000;

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

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('Missing session id in URL.');
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      try {
        const session = await api.get(
          `/api/payments/checkout-session/${encodeURIComponent(sessionId!)}`,
        ) as CheckoutSessionResponse;

        if (cancelled) return;

        if (session.missionId && !missionId) setMissionId(session.missionId);

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
            window.location.href = returnUrl;
            return;
          }

          // Mission flow → /dashboard/:missionId by default, but creative
          // attention missions go to /creative-results/:missionId. The
          // session response doesn't carry goal_type, so we resolve it
          // from the mission row (RLS lets the owner read it). On any
          // lookup failure we fall back to /dashboard/:missionId.
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
          logPaymentError({
            stage:                 'client_checkout_polling_timeout',
            missionId:             session.missionId ?? null,
            stripePaymentIntentId: session.paymentIntentId ?? null,
            errorCode:             'success_page_poll_timeout_30s',
            errorMessage:          `Polled session ${session.id} for 30s; status=${session.status} paymentStatus=${session.paymentStatus}`,
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
              Your mission is queued but processing is taking longer than expected.
              We will email you when the results are ready.
            </p>
            <div className="flex flex-col gap-2">
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
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
