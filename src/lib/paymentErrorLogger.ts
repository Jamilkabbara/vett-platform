/**
 * Pass 22 Bug 22.9 — Frontend Stripe-failure logger.
 *
 * Posts to /api/payments/errors/log so client-side payment failures land in
 * the same payment_errors table as backend errors. Best-effort by design:
 * a logging failure must never block the user-visible error path.
 *
 * Stage values match the backend's allowed set:
 *   'client_confirm_card'           — confirmCardPayment(card) catch
 *   'client_wallet_payment_method'  — Apple/Google Pay PaymentRequest catch
 *   'client_chat_overage'           — OverageModal confirmCardPayment catch
 *   'client_element_not_ready'      — pre-flight Element-mounted guard tripped
 *   'client_element_mount_timeout'  — Pass 23 Bug 23.0a: 5s ready-event timeout
 *   'elements_provider_error'       — Pass 23 Bug 23.0c: Stripe Elements onError
 *
 * Pass 23 Bug 23.0c — backend route is now anon-friendly. user_id is
 * best-effort resolved from the Authorization Bearer JWT if present; null
 * otherwise. This lets us capture mount failures that fire pre-auth or
 * with stale sessions (the Bali Safari forensic showed the original logger
 * silently 401-ed exactly there).
 */
import { api } from './apiClient';

export type ClientStage =
  // Legacy Elements stages — kept for type-safety on historic call sites
  // and so old payment_errors rows keep their semantic group, even though
  // the Elements integration was removed in Pass 23 Bug 23.0e v2.
  | 'client_confirm_card'
  | 'client_wallet_payment_method'
  | 'client_chat_overage'
  | 'client_element_not_ready'
  | 'client_element_mount_timeout'
  | 'elements_provider_error'
  // Pass 23 Bug 23.0e v2 — Checkout redirect flow stages.
  | 'client_checkout_redirect_failed'   // window.location.href set / network error before redirect
  | 'client_checkout_polling_timeout';  // /payment-success page gave up polling at 30s

export interface PaymentErrorPayload {
  stage: ClientStage;
  missionId?: string | null;
  stripePaymentIntentId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  declineCode?: string | null;
  paymentMethod?: string | null;
  amountCents?: number | null;
  currency?: string | null;
}

/**
 * Shape an unknown thrown error into the field set the backend expects.
 * Stripe errors carry { code, message, decline_code, payment_method.type }.
 * Generic Error / string / null all fall through to a sane shape.
 */
export function shapeStripeError(err: unknown): {
  errorCode: string | null;
  errorMessage: string | null;
  declineCode: string | null;
  paymentMethod: string | null;
} {
  if (!err || typeof err !== 'object') {
    return {
      errorCode: null,
      errorMessage: typeof err === 'string' ? err : null,
      declineCode: null,
      paymentMethod: null,
    };
  }
  const e = err as {
    code?: string;
    type?: string;
    message?: string;
    decline_code?: string;
    payment_method?: { type?: string };
  };
  return {
    errorCode: e.code || e.type || null,
    errorMessage: typeof e.message === 'string' ? e.message : null,
    declineCode: e.decline_code || null,
    paymentMethod: e.payment_method?.type || null,
  };
}

/**
 * Fire-and-forget log to backend. Returns the row id when successful;
 * resolves to null on any logging failure (network, 4xx, 5xx). Never
 * throws — callers don't need a try/catch.
 */
export async function logPaymentError(payload: PaymentErrorPayload): Promise<string | null> {
  try {
    const viewportWidth =
      typeof window !== 'undefined' && Number.isFinite(window.innerWidth) ? window.innerWidth : null;

    const body = {
      stage:                 payload.stage,
      missionId:             payload.missionId             ?? null,
      stripePaymentIntentId: payload.stripePaymentIntentId ?? null,
      errorCode:             payload.errorCode             ?? null,
      errorMessage:          payload.errorMessage          ?? null,
      declineCode:           payload.declineCode           ?? null,
      paymentMethod:         payload.paymentMethod         ?? null,
      amountCents:           Number.isFinite(payload.amountCents) ? payload.amountCents : null,
      currency:              payload.currency              ?? 'usd',
      viewportWidth,
    };

    const result = await api.post('/api/payments/errors/log', body);
    return (result as { id?: string })?.id ?? null;
  } catch (e) {
    // Telemetry failure must never block the user-visible error path.
    if (import.meta.env.DEV) {
      console.warn('[paymentErrorLogger] log failed (non-fatal)', e);
    }
    return null;
  }
}
