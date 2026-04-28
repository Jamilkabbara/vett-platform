/**
 * Pass 23 Bug 23.0e v2 — full Stripe Checkout migration.
 *
 * One pay flow replaces the entire <Elements>/Modal stack:
 *   1. Click → POST /api/payments/create-checkout-session (or any custom
 *      `createSession` callback for non-mission flows like chat overage)
 *   2. Backend returns { url }
 *   3. window.location.href = url → redirect to checkout.stripe.com
 *   4. Stripe redirects back to /payment-success or /payment-cancel
 *
 * Design notes:
 *   - The button is just a button. No modal, no Stripe Elements, no
 *     iframe lifecycle. Works reliably across browsers including Safari.
 *   - Apple Pay / Google Pay surface natively on the Stripe-hosted page
 *     once the domain is verified in the Stripe Dashboard (one-time
 *     setup; see PASS_23_REPORT.md).
 *   - Promo codes: pre-applied via the optional `promoCode` arg (baked
 *     into unit_amount on the Session) OR Stripe-side via
 *     allow_promotion_codes (user enters on the Checkout page).
 *   - Errors during session creation are logged to payment_errors via
 *     the existing logger and surfaced inline.
 */
import { useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { logPaymentError } from '../../lib/paymentErrorLogger';

interface PayButtonProps {
  /** What the button shows when ready (e.g. "Pay $35 — Launch Mission"). */
  label: string;
  /** Optional disabled state, e.g. while a server quote is loading. */
  disabled?: boolean;
  /** ClassName override for full visual control. */
  className?: string;
  /** Custom session creator. Defaults to /api/payments/create-checkout-session
   *  with the supplied missionId / promoCode. */
  createSession?: () => Promise<{ url: string; sessionId?: string }>;
  /** When using the default mission flow, the mission id to checkout. */
  missionId?: string;
  /** Optional promo code to bake into pre-applied price. */
  promoCode?: string | null;
  /** Called after the session is created but before the redirect, e.g. to
   *  fire a checkout_opened funnel event. Best-effort, errors swallowed. */
  onBeforeRedirect?: (sessionId: string) => Promise<void> | void;
}

export function PayButton({
  label,
  disabled,
  className,
  createSession,
  missionId,
  promoCode,
  onBeforeRedirect,
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function defaultCreateSession() {
    if (!missionId) throw new Error('PayButton: missionId is required for default flow');
    return await api.post('/api/payments/create-checkout-session', {
      missionId,
      promoCode: promoCode || undefined,
    });
  }

  async function handleClick() {
    if (loading || disabled) return;
    setError(null);
    setLoading(true);

    try {
      const result = await (createSession ?? defaultCreateSession)();
      if (!result?.url) {
        throw new Error('Server did not return a checkout URL');
      }

      // Best-effort hook before navigating away — funnel event, etc.
      if (onBeforeRedirect && result.sessionId) {
        try {
          await onBeforeRedirect(result.sessionId);
        } catch {
          /* ignore — telemetry never blocks redirect */
        }
      }

      // Redirect. Browser navigates away; loading state never clears.
      window.location.href = result.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not start checkout.';
      setError(message);
      setLoading(false);

      logPaymentError({
        stage:        'client_checkout_redirect_failed',
        missionId:    missionId ?? null,
        errorCode:    'create_session_failed',
        errorMessage: message,
      });
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={
          className ??
          'w-full py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all bg-gradient-to-r from-neon-lime to-primary text-gray-900 hover:shadow-2xl hover:shadow-neon-lime/50 disabled:opacity-50 disabled:cursor-not-allowed'
        }
      >
        {loading ? 'Opening secure checkout…' : label}
      </button>
      {error && (
        <p
          role="alert"
          className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
        >
          {error} If this keeps happening, email <a href="mailto:hello@vettit.ai" className="underline">hello@vettit.ai</a>.
        </p>
      )}
      <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-white/50">
        <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-center">Secured by Stripe. Apple Pay &amp; Google Pay supported on supported devices.</span>
      </div>
    </div>
  );
}
