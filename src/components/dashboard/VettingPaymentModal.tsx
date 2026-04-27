import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, CreditCard, Lock, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  PaymentRequest,
  PaymentRequestPaymentMethodEvent,
  StripeError,
} from '@stripe/stripe-js';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { api } from '../../lib/apiClient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { trackFunnel } from '../../lib/funnelTrack';
import { logPaymentError, shapeStripeError } from '../../lib/paymentErrorLogger';
import { AuthModal } from '../layout/AuthModal';
import { StripeElementsWrapper } from './StripeElementsWrapper';

// Flip the mission row from draft → active the moment the charge clears so
// the post-payment page can trust mission.status. We only touch columns that
// exist on public.missions today (status + paid_at) — payment_status and
// stripe_payment_intent_id are handled server-side by /api/payments/confirm.
async function activateMission(missionId: string | undefined): Promise<void> {
  if (!missionId) return;
  const { error } = await supabase
    .from('missions')
    .update({ status: 'active', paid_at: new Date().toISOString() })
    .eq('id', missionId);
  if (error) {
    // Don't block navigation — the backend confirm endpoint is authoritative.
    console.warn('[payment] mission activate failed (non-blocking)', error);
  }
}

/**
 * Normalise whatever got thrown into a user-readable string. Stripe errors
 * include `code` / `decline_code` which we surface so the user can act
 * ("Your card was declined" → "Use a different card" rather than silence).
 *
 * This is the root cause of the reported "4242 → spinner reverts, no error"
 * bug: every catch block previously did `err.message || 'Payment failed'`
 * and routed it through a toast — and the global Toaster was z-indexed
 * BELOW the modal backdrop, so the toast rendered invisibly behind the
 * modal. We now surface the message inline inside the modal AND bump the
 * Toaster z-index (see App.tsx).
 */
function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Partial<StripeError> & { message?: string };
    if (e.code === 'card_declined' && e.decline_code) {
      return `Card declined (${e.decline_code}). Try a different card.`;
    }
    if (e.message && typeof e.message === 'string' && e.message.trim()) {
      return e.message;
    }
    if (e.code && typeof e.code === 'string') {
      return `Payment error: ${e.code}`;
    }
  }
  if (typeof err === 'string' && err.trim()) return err;
  return 'Payment failed. Please try again.';
}

interface VettingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  totalCost: number;
  respondentCount: number;
  missionId?: string | null;
  /** Override the post-payment redirect. Defaults to /mission/:missionId/live */
  successPath?: string;
}

type Stage = 'vetting' | 'payment' | 'processing' | 'success';

interface VettingCheck {
  label: string;
  completed: boolean;
}

const CARD_ELEMENT_STYLE = {
  style: {
    base: {
      color: '#fff',
      fontFamily: 'inherit',
      fontSize: '14px',
      '::placeholder': { color: 'rgba(255,255,255,0.4)' },
    },
    invalid: { color: '#ef4444' },
  },
};

// Inner component that uses Stripe hooks (must be inside <Elements>)
const PaymentForm = ({
  isOpen,
  onClose,
  onComplete,
  totalCost,
  respondentCount,
  missionId,
  successPath,
}: VettingPaymentModalProps) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [stage, setStage] = useState<Stage>('vetting');
  const [vettingChecks, setVettingChecks] = useState<VettingCheck[]>([
    { label: 'PII (Personal Data) Check', completed: false },
    { label: 'Profanity Filter', completed: false },
    { label: 'Policy Compliance', completed: false },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState(totalCost);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakeExpressPayment, setCanMakeExpressPayment] = useState(false);

  // Server-authoritative quote — fetched on open, updated on promo apply.
  // Stores total + line-item breakdown for the pricing card.
  const [serverQuote, setServerQuote] = useState<{
    total: number;
    breakdown: Array<{ label: string; amount: number }>;
  } | null>(null);
  const [serverOriginalPrice, setServerOriginalPrice] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  // Track when each card Element fires its internal ready event.
  // Stripe's "ready event not emitted" error fires when confirmCardPayment()
  // is called before the iframe has finished initialising — even if the ref
  // exists. We disable the Pay button until all three are ready.
  const [cardNumberReady, setCardNumberReady] = useState(false);
  const [cardExpiryReady, setCardExpiryReady] = useState(false);
  const [cardCvcReady, setCardCvcReady] = useState(false);
  const allElementsReady = cardNumberReady && cardExpiryReady && cardCvcReady;

  // Stable options object for PaymentRequestButtonElement — prevents the
  // "options.paymentRequest is not a mutable property" Stripe warning that
  // fires on every render when a fresh object literal is passed inline.
  const paymentRequestButtonOptions = useMemo(() => {
    if (!paymentRequest) return null;
    return {
      paymentRequest,
      style: {
        paymentRequestButton: {
          type: 'buy' as const,
          theme: 'dark' as const,
          height: '48px',
        },
      },
    };
  }, [paymentRequest]);

  /**
   * Inline error surface. This lives *inside* the modal so failures stay
   * visible even if a toast is miscounted or the user dismisses it. Cleared
   * on every new payment attempt and on modal close.
   */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch the authoritative server quote whenever the modal opens.
  // We use this to (a) set the correct price from the server, and
  // (b) populate the pricing breakdown card below the Pay button.
  useEffect(() => {
    if (!isOpen || !missionId) return;
    let cancelled = false;
    setQuoteLoading(true);
    api.post('/api/pricing/quote', { missionId })
      .then((data: { total: number; breakdown: Array<{ label: string; amount: number }> }) => {
        if (cancelled) return;
        setServerQuote(data);
        setDiscountedPrice(data.total);
      })
      .catch(() => {
        if (cancelled) return;
        // Fall back silently to the prop value — the modal still works.
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, missionId]);

  // Pass 22 Bug 22.1 — emit checkout_opened once when the modal opens.
  // This is the new mid-funnel stage between mission_setup_completed and
  // mission_paid; it lets us measure setup→checkout drop-off (the user
  // completed setup but didn't reach the pay screen).
  useEffect(() => {
    if (!isOpen || !missionId) return;
    const tier = respondentCount >= 100 ? 'large' : respondentCount >= 50 ? 'medium' : 'small';
    trackFunnel('checkout_opened', {
      tier, respondent_count: respondentCount,
    }, { mission_id: missionId });
  }, [isOpen, missionId, respondentCount]);

  /**
   * Set up Apple Pay / Google Pay via Stripe's Payment Request API.
   *
   * ── Availability requirements ─────────────────────────────────────
   *   - Apple Pay: Safari on macOS/iOS, a card in Wallet, and the domain
   *     MUST be registered in the Stripe Dashboard under
   *     Settings → Payments → Apple Pay → "Add new domain". We upload
   *     the file returned by /.well-known/apple-developer-merchantid-domain-association
   *     to the site root. This is a MANUAL step per environment — dev,
   *     staging, and production each need their own verification. See
   *     .design-reference/STRIPE_DOMAIN_VERIFICATION.md for the runbook.
   *   - Google Pay: Chrome with a saved card. No domain registration.
   *   - `canMakePayment()` only resolves truthy once the browser confirms
   *     at least one method. If it resolves null the Payment Request button
   *     is never rendered and we silently fall back to the card form.
   *
   * ── displayItems ──────────────────────────────────────────────────
   * The wallet sheet shows `total.label` as the top line and `displayItems`
   * as the breakdown. Shipping this itemised list ("100 × $1.90 = $190")
   * matches what the mission pricing panel shows and avoids the "Why am I
   * paying X?" confusion that a single total row causes.
   */
  useEffect(() => {
    if (!stripe || discountedPrice <= 0) return;

    const amountInCents = Math.round(discountedPrice * 100);
    const perRespondent = respondentCount > 0 ? discountedPrice / respondentCount : 0;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Vettit Mission',
        amount: amountInCents,
      },
      displayItems: [
        {
          label: `${respondentCount} respondents × $${perRespondent.toFixed(2)}`,
          amount: amountInCents,
        },
      ],
      requestPayerName: false,
      requestPayerEmail: false,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakeExpressPayment(true);
      } else {
        // Explicitly clear so a stale request from a prior mount doesn't
        // leak through when the user retries on a browser that doesn't
        // support wallet payments.
        setPaymentRequest(null);
        setCanMakeExpressPayment(false);
      }
    });

    const onPaymentMethod = async (event: PaymentRequestPaymentMethodEvent) => {
      if (!user) {
        event.complete('fail');
        setShowAuthModal(true);
        return;
      }
      if (!missionId) {
        event.complete('fail');
        const msg = 'Mission not found — reload the page and try again.';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
      setIsProcessing(true);
      setStage('processing');
      setErrorMessage(null);
      const toastId = toast.loading('Processing payment...');

      try {
        const { clientSecret, paymentIntentId } = await api.post(
          '/api/payments/create-intent',
          { missionId },
        );
        if (!clientSecret) {
          throw new Error('Payment could not be started — our server did not return a client secret.');
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false },
        );

        if (confirmError) {
          event.complete('fail');
          throw confirmError;
        }

        if (paymentIntent?.status === 'requires_action') {
          const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
          if (actionError) {
            event.complete('fail');
            throw actionError;
          }
        }

        event.complete('success');
        await api.post('/api/payments/confirm', { missionId, paymentIntentId });
        await activateMission(missionId);
        // Pass 22 Bug 22.4 — enrich with tier + promo for admin segment view.
        trackFunnel('mission_paid', {
          method: 'wallet',
          tier:   respondentCount >= 100 ? 'large' : respondentCount >= 50 ? 'medium' : 'small',
          respondent_count: respondentCount,
          promo_code: promoApplied ? (promoCode || null) : null,
          amount_cents: Math.round(discountedPrice * 100),
        }, { mission_id: missionId });

        setStage('success');
        toast.success('Mission Launched!', { id: toastId });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        onClose();
        navigate(successPath ?? `/mission/${missionId}/live`);
      } catch (err: unknown) {
        // Apple Pay / Google Pay sheet closes on event.complete('fail');
        // we may have already completed it above — ignore double-complete.
        try { event.complete('fail'); } catch { /* already completed */ }

        const msg = extractErrorMessage(err);
        setIsProcessing(false);
        setStage('payment');
        setErrorMessage(msg);
        toast.error(msg, { id: toastId });
        console.error('[payment] wallet charge failed', err);

        // Pass 22 Bug 22.9 — log to payment_errors so the admin viewer
        // sees Apple/Google Pay failures with full context (event.paymentMethod
        // type, last_payment_error code, viewport, UA).
        const shaped = shapeStripeError(err);
        logPaymentError({
          stage:                 'client_wallet_payment_method',
          missionId:             missionId ?? null,
          stripePaymentIntentId: null,
          errorCode:             shaped.errorCode,
          errorMessage:          shaped.errorMessage || msg,
          declineCode:           shaped.declineCode,
          paymentMethod:         shaped.paymentMethod || event.paymentMethod?.type || null,
          amountCents:           Math.round(discountedPrice * 100),
          currency:              'usd',
        });
      }
    };

    pr.on('paymentmethod', onPaymentMethod);
    return () => { pr.off('paymentmethod', onPaymentMethod); };
  }, [stripe, discountedPrice, respondentCount, missionId, user, navigate, onClose]);

  // Fetch the authoritative server price as soon as the modal opens.
  // The client-computed totalCost prop is a UX estimate only; the backend is
  // the single source of truth (country tier, surcharges, rounding).
  useEffect(() => {
    if (!isOpen || !missionId) return;
    api.post('/api/pricing/quote', { missionId })
      .then((data: any) => {
        if (typeof data?.total === 'number') {
          setServerOriginalPrice(data.total);
          setDiscountedPrice(data.total);
        }
      })
      .catch(() => {
        // Non-fatal: keep client-computed totalCost shown until server responds.
      });
  }, [isOpen, missionId]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || promoLoading) return;
    setPromoLoading(true);
    setPromoMessage('');
    try {
      const originalTotal = serverOriginalPrice ?? serverQuote?.total ?? totalCost;
      const data: any = await api.post('/api/pricing/quote', {
        missionId,
        promoCode: promoCode.trim().toUpperCase(),
      });
      const hasDiscount = typeof data?.total === 'number' &&
        (data.total < originalTotal || data.total === 0);

      if (hasDiscount) {
        setPromoApplied(true);
        setDiscountedPrice(data.total);
        if (data.breakdown) setServerQuote(data);
        const discountLine = Array.isArray(data.breakdown)
          ? data.breakdown.find((b: any) => b.amount < 0)
          : null;
        setPromoMessage(discountLine ? `✅ ${discountLine.label}` : '✅ Promo applied');
        if (data.total === 0) setCanMakeExpressPayment(false);
      } else {
        setPromoApplied(false);
        setDiscountedPrice(originalTotal);
        setPromoMessage('❌ Invalid or expired code');
        setTimeout(() => setPromoMessage(''), 3000);
      }
    } catch {
      setPromoApplied(false);
      setPromoMessage('❌ Could not validate code');
      setTimeout(() => setPromoMessage(''), 3000);
    } finally {
      setPromoLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && stage === 'vetting') {
      const runVetting = async () => {
        for (let i = 0; i < vettingChecks.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setVettingChecks(prev =>
            prev.map((check, idx) =>
              idx === i ? { ...check, completed: true } : check
            )
          );
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        setStage('payment');
      };
      runVetting();
    }
  }, [isOpen, stage]);

  useEffect(() => {
    if (!isOpen) {
      setStage('vetting');
      setVettingChecks([
        { label: 'PII (Personal Data) Check', completed: false },
        { label: 'Profanity Filter', completed: false },
        { label: 'Policy Compliance', completed: false },
      ]);
      setIsProcessing(false);
      setPromoCode('');
      setPromoMessage('');
      setPromoApplied(false);
      setDiscountedPrice(totalCost);
      setServerOriginalPrice(null);
      setPromoLoading(false);
      setErrorMessage(null);
      setServerQuote(null);
      setQuoteLoading(false);
      setPromoLoading(false);
      // Reset card-element ready state so "Loading payment form..." is shown
      // again when the modal reopens and Elements remount.
      setCardNumberReady(false);
      setCardExpiryReady(false);
      setCardCvcReady(false);
    }
  }, [isOpen, totalCost]);

  const handleCardPayment = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Clear any prior error banner on retry so the user isn't staring at
    // a stale message while their new attempt spins.
    setErrorMessage(null);

    // toastId is assigned later — after the card element is captured and right
    // before the first await — so React doesn't flush a re-render that unmounts
    // CardNumberElement before we call elements.getElement().
    let toastId = '';

    // Tracks the in-flight Stripe PI id so payment_errors logs can correlate
    // with the Stripe Dashboard. Set after /api/payments/create-intent returns
    // and before confirmCardPayment runs.
    let activePaymentIntentId: string | null = null;

    const fail = (msg: string, err?: unknown) => {
      setIsProcessing(false);
      setStage('payment');
      setErrorMessage(msg);
      if (toastId) {
        toast.error(msg, { id: toastId });
      } else {
        toast.error(msg);
      }
      if (err !== undefined) console.error('[payment] card charge failed', err);

      // Pass 22 Bug 22.9 — every failure point in the card flow funnels
      // through fail(), so this is the single instrumentation point for
      // client-side card-flow telemetry.
      const shaped = shapeStripeError(err);
      logPaymentError({
        stage:                 'client_confirm_card',
        missionId:             missionId ?? null,
        stripePaymentIntentId: activePaymentIntentId,
        errorCode:             shaped.errorCode,
        errorMessage:          shaped.errorMessage || msg,
        declineCode:           shaped.declineCode,
        paymentMethod:         shaped.paymentMethod || 'card',
        amountCents:           Math.round(discountedPrice * 100),
        currency:              'usd',
      });
    };

    try {
      // Free launch via promo code — call backend free-launch endpoint so
      // runMission() actually fires and AI generation starts.
      // Previously this path only called activateMission() (a bare DB write)
      // which never triggered the synthetic audience pipeline.
      if (promoApplied && discountedPrice === 0) {
        if (!missionId) return fail('Mission not found — reload the page and try again.');
        setIsProcessing(true);
        setStage('processing');
        toastId = toast.loading('Processing secure payment...');
        await new Promise((resolve) => setTimeout(resolve, 1200));
        try {
          await api.post('/api/payments/free-launch', { missionId, promoCode: promoCode || 'VETT100' });
        } catch (freeLaunchErr) {
          return fail(extractErrorMessage(freeLaunchErr), freeLaunchErr);
        }
        setStage('success');
        toast.success('Mission Launched!', { id: toastId });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        onClose();
        navigate(successPath ?? `/mission/${missionId}/live`);
        return;
      }

      // Guard each pre-condition with a distinct, user-readable error so
      // "nothing happened" can never happen silently.
      if (!stripe) return fail('Payment system not ready — Stripe is still loading. Try again in a moment.');
      if (!elements) return fail('Payment form not ready — please refresh the page.');
      if (!missionId) return fail('Mission not found — reload the page and try again.');

      // Belt-and-suspenders: the Pay button is already disabled until
      // allElementsReady, but guard here too in case of a timing edge case.
      if (!cardNumberReady || !cardExpiryReady || !cardCvcReady) {
        return fail('Payment form is still loading — please wait a moment and try again.');
      }

      // ── Root-cause fix ───────────────────────────────────────────────────────
      // Capture CardNumberElement reference BEFORE setStage('processing').
      // setStage() queues a React re-render; the first `await` below yields
      // control back to React, which flushes the update and unmounts the card
      // inputs (stage='processing' shows a spinner, not the card form).
      // After that unmount, elements.getElement(CardNumberElement) returns null —
      // triggering the misleading "Please enter your card details" error even
      // when the user correctly filled the form.
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        if (import.meta.env.DEV) {
          console.error('[payment] CardNumberElement not found in Elements registry', {
            stripe: !!stripe,
            elements: !!elements,
          });
        }
        return fail('Payment form is still loading — please wait a moment and try again.');
      }

      // Element ref captured — safe to transition to processing UI.
      setIsProcessing(true);
      setStage('processing');
      toastId = toast.loading('Processing secure payment...');

      // 1. Create payment intent on backend.
      let clientSecret: string | undefined;
      let paymentIntentId: string | undefined;
      try {
        const res = await api.post('/api/payments/create-intent', { missionId });
        clientSecret = res?.clientSecret;
        paymentIntentId = res?.paymentIntentId;
        // Pass 22 Bug 22.9: stash for the fail() telemetry path. Survives
        // through the awaits below without needing to re-thread it.
        activePaymentIntentId = paymentIntentId ?? null;
      } catch (apiErr) {
        return fail(extractErrorMessage(apiErr), apiErr);
      }
      if (!clientSecret) {
        return fail('Payment could not be started — our server did not return a client secret.');
      }

      // 2. Confirm card payment.

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: { card: cardNumberElement } },
      );

      if (stripeError) {
        return fail(extractErrorMessage(stripeError), stripeError);
      }
      if (!paymentIntent) {
        return fail('Payment did not complete — no payment intent returned. Please try again.');
      }
      if (paymentIntent.status !== 'succeeded') {
        // Surface the actual state so "requires_action" / "processing" aren't
        // indistinguishable from a generic decline in the user's eyes.
        return fail(
          `Payment not completed (status: ${paymentIntent.status}). Please try again or use a different card.`,
        );
      }

      // 3. Confirm with backend. If this fails the charge already went through
      // — we still have to surface the error so the user knows their mission
      // isn't queued, but we also warn them not to re-pay.
      try {
        await api.post('/api/payments/confirm', { missionId, paymentIntentId });
      } catch (confirmErr) {
        return fail(
          'Your card was charged but we couldn\'t confirm the mission. Please contact support with your mission ID — do not re-pay.',
          confirmErr,
        );
      }

      await activateMission(missionId);
      // Pass 22 Bug 22.4 — enrich with tier + promo for admin segment view.
      trackFunnel('mission_paid', {
        method: 'card',
        tier:   respondentCount >= 100 ? 'large' : respondentCount >= 50 ? 'medium' : 'small',
        respondent_count: respondentCount,
        promo_code: promoApplied ? (promoCode || null) : null,
        amount_cents: Math.round(discountedPrice * 100),
      }, { mission_id: missionId });

      setStage('success');
      toast.success('Mission Launched Successfully!', { id: toastId });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onClose();
      navigate(successPath ?? `/mission/${missionId}/live`);
    } catch (err: unknown) {
      // Final safety net — anything that escapes the targeted catches above.
      fail(extractErrorMessage(err), err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={stage === 'payment' ? onClose : undefined}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-white/20 shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
        >
          {stage === 'payment' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-20"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}

          {/* VETTING STAGE */}
          {stage === 'vetting' && (
            <div className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-white text-center mb-2">Vetting your Mission...</h2>
              <p className="text-white/60 text-center mb-8">Running safety and compliance checks</p>
              <div className="space-y-4">
                {vettingChecks.map((check, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      check.completed ? 'bg-green-500' : 'bg-white/10 border-2 border-white/30'
                    }`}>
                      {check.completed && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${check.completed ? 'text-white' : 'text-white/60'}`}>
                      {check.label}
                    </span>
                    {check.completed && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                        <Check className="w-5 h-5 text-green-400" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENT STAGE */}
          {stage === 'payment' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              <div className="sticky top-0 z-10 flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <h2 className="text-xl sm:text-2xl font-black text-white">Secure Checkout</h2>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-6">

                {/*
                 * Inline error banner — persists until dismissed or retry.
                 * This is the primary failure surface; the toast is a
                 * redundant confirmation. Previously the modal had neither
                 * an inline surface nor a visible toast (z-index was below
                 * the modal), so a 4242 decline looked like "nothing happened."
                 */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/40 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="flex-1 text-sm text-red-200 leading-snug">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => setErrorMessage(null)}
                      className="flex-shrink-0 p-0.5 rounded hover:bg-red-500/20 transition-colors"
                      aria-label="Dismiss error"
                    >
                      <X className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                )}

                {/* Pricing breakdown card */}
                <div className="bg-gray-700/30 rounded-lg p-4 mb-5">
                  {quoteLoading ? (
                    <div className="flex items-center gap-2 text-white/40 text-xs py-1">
                      <div className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin flex-shrink-0" />
                      Calculating price…
                    </div>
                  ) : serverQuote ? (
                    <div className="space-y-2">
                      {serverQuote.breakdown.map((line, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-white/60">{line.label}</span>
                          <span className={line.amount < 0 ? 'text-green-400 font-medium' : 'text-white'}>
                            {line.amount < 0
                              ? `-$${Math.abs(line.amount).toFixed(2)}`
                              : `$${line.amount.toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-white font-bold text-sm">Total</span>
                        <span className="text-white font-bold text-lg">${discountedPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    /* Fallback while quote hasn't loaded yet */
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">
                        {respondentCount} Respondent{respondentCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-white font-bold text-lg">${discountedPrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Apple Pay / Google Pay — shown automatically if available on device */}
                {canMakeExpressPayment && paymentRequestButtonOptions && discountedPrice > 0 && (
                  <>
                    <div className="mb-4">
                      <PaymentRequestButtonElement
                        options={paymentRequestButtonOptions}
                      />
                    </div>
                    <div className="relative mb-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white/50">
                          or pay with card
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Card form — always shown as fallback */}
                {discountedPrice > 0 && (
                  <div className="space-y-3 sm:space-y-4 mb-5">
                    <div>
                      <label className="block text-xs sm:text-sm text-white/70 mb-1.5">Card Number</label>
                      <div className="relative px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/30 border border-white/20 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                        <CardNumberElement
                          options={CARD_ELEMENT_STYLE}
                          onReady={() => setCardNumberReady(true)}
                        />
                        <CreditCard className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40 pointer-events-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm text-white/70 mb-1.5">MM / YY</label>
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/30 border border-white/20 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                          <CardExpiryElement
                            options={CARD_ELEMENT_STYLE}
                            onReady={() => setCardExpiryReady(true)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-white/70 mb-1.5">CVC</label>
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/30 border border-white/20 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                          <CardCvcElement
                            options={CARD_ELEMENT_STYLE}
                            onReady={() => setCardCvcReady(true)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Promo Code */}
                <div className="mb-5 w-full">
                  <label className="block text-xs sm:text-sm text-white/70 mb-1.5">Discount Code</label>
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      placeholder="Code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      className="flex-1 min-w-0 px-3 py-2.5 bg-gray-700/30 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || promoLoading}
                      className="px-4 sm:px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0 min-w-[72px]"
                    >
                      {promoLoading ? 'Checking…' : 'Apply'}
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`text-xs mt-2 ${promoApplied ? 'text-green-400' : 'text-red-400'}`}>
                      {promoMessage}
                    </p>
                  )}
                </div>

                {/* Pay Button — disabled until all card Elements emit their ready event */}
                <button
                  onClick={handleCardPayment}
                  disabled={isProcessing || (discountedPrice > 0 && !allElementsReady)}
                  className={`w-full py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all ${
                    !isProcessing && (discountedPrice === 0 || allElementsReady)
                      ? 'bg-gradient-to-r from-neon-lime to-primary text-gray-900 hover:shadow-2xl hover:shadow-neon-lime/50'
                      : 'bg-gray-700/30 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {discountedPrice === 0
                    ? 'Launch Mission (Free)'
                    : !allElementsReady
                    ? 'Loading payment form...'
                    : `Pay $${discountedPrice.toFixed(2)}`}
                </button>
              </div>

              <div className="flex-shrink-0 p-3 sm:p-6 pt-3 border-t border-white/10">
                <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-white/50">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-center">Secured by Stripe. Apple Pay &amp; Google Pay supported where available.</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* PROCESSING STAGE */}
          {stage === 'processing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-6" />
                <h2 className="text-2xl font-black text-white text-center mb-2">Processing Payment...</h2>
                <p className="text-white/60 text-center">Securely processing your payment</p>
              </div>
            </motion.div>
          )}

          {/* SUCCESS STAGE */}
          {stage === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6"
                >
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </motion.div>
                <h2 className="text-3xl font-black text-white text-center mb-2">Payment Approved!</h2>
                <p className="text-white/60 text-center">Launching your mission...</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </AnimatePresence>
  );
};

// Outer component wraps with Stripe Elements provider.
// StripeElementsWrapper resolves loadStripe() before mounting <Elements> so
// card iframes never fire their "ready" events before the Stripe instance
// arrives — the root cause of the desktop card payment failure (Nourhan's bug).
export const VettingPaymentModal = (props: VettingPaymentModalProps) => {
  if (!props.isOpen) return null;

  return (
    <StripeElementsWrapper>
      <PaymentForm {...props} />
    </StripeElementsWrapper>
  );
};
