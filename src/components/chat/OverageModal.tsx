/**
 * VETT chat overage modal.
 *
 * Flow:
 *   1. POST /api/chat/buy-overage  → { clientSecret, paymentIntentId }
 *   2. stripe.confirmCardPayment(clientSecret, { payment_method: { card } })
 *   3. POST /api/chat/confirm-overage (the webhook also credits; confirm is a fallback)
 *   4. Parent re-loads the session, picks up +50 messages.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CreditCard, Zap, Check } from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { logPaymentError, shapeStripeError } from '../../lib/paymentErrorLogger';

const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

// Lazy-init the Stripe promise (singleton)
let _stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!_stripePromise) _stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
  return _stripePromise;
}

const CARD_STYLE = {
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

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`;
  return h;
}

interface OverageModalProps {
  isOpen: boolean;
  sessionId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const OverageModal = ({ isOpen, sessionId, onClose, onSuccess }: OverageModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="w-full max-w-md bg-[#0B0C15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Elements stripe={getStripe()}>
              <OverageForm sessionId={sessionId} onClose={onClose} onSuccess={onSuccess} />
            </Elements>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Inner form (inside <Elements>) ──────────────────────────

function OverageForm({ sessionId, onClose, onSuccess }: Omit<OverageModalProps, 'isOpen'>) {
  const stripe = useStripe();
  const elements = useElements();

  const [stage, setStage] = useState<'details' | 'processing' | 'success'>('details');
  const [error, setError] = useState<string | null>(null);

  // Pass 22 Bug 22.23 — ready-event parity with VettingPaymentModal.
  // Stripe's "Element is not mounted yet" error fires when confirmCardPayment
  // is called before the card iframe has emitted its 'ready' event. Disable
  // Pay until all three Elements are ready.
  const [cardNumberReady, setCardNumberReady] = useState(false);
  const [cardExpiryReady, setCardExpiryReady] = useState(false);
  const [cardCvcReady,    setCardCvcReady]    = useState(false);
  const allElementsReady = cardNumberReady && cardExpiryReady && cardCvcReady;

  useEffect(() => { setError(null); }, [sessionId]);

  async function handlePay() {
    if (!stripe || !elements || !sessionId) return;

    // Pass 22 Bug 22.23 — belt-and-suspenders ready check (button is also
    // disabled below; this guards a timing edge case where the click slips
    // through before the disabled prop applies).
    if (!allElementsReady) {
      setError('Card form is still loading — please wait a moment and try again.');
      logPaymentError({
        stage:                 'client_element_not_ready',
        missionId:             null,
        stripePaymentIntentId: null,
        errorCode:             'element_not_ready',
        errorMessage:          'OverageModal: handlePay invoked before all Elements ready',
        amountCents:           500,
        currency:              'usd',
      });
      return;
    }

    // Pass 22 Bug 22.23 — capture the CardNumber ref BEFORE setStage('processing')
    // queues a re-render. Same pattern as VettingPaymentModal: avoid the unmount
    // race that returns null from elements.getElement after the await yields.
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setError('Card form not ready.');
      logPaymentError({
        stage:                 'client_element_not_ready',
        missionId:             null,
        stripePaymentIntentId: null,
        errorCode:             'card_number_element_null',
        errorMessage:          'OverageModal: elements.getElement(CardNumberElement) returned null',
        amountCents:           500,
        currency:              'usd',
      });
      return;
    }

    setError(null);
    setStage('processing');

    // Pass 22 Bug 22.9 — track PI id so the catch block can correlate the
    // payment_errors row with the Stripe Dashboard.
    let activePaymentIntentId: string | null = null;

    try {
      // 1) Create the $5 PaymentIntent
      const createRes = await fetch(`${API_URL}/api/chat/buy-overage`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ sessionId }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || 'Could not start payment.');
      }
      const { clientSecret, paymentIntentId } = await createRes.json();
      activePaymentIntentId = paymentIntentId ?? null;

      // 2) Confirm card payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardNumber },
      });
      if (confirmError) throw confirmError;
      if (paymentIntent?.status !== 'succeeded') {
        throw new Error(`Payment status: ${paymentIntent?.status || 'unknown'}`);
      }

      // 3) Confirm with backend (fallback — webhook also credits idempotently)
      try {
        await fetch(`${API_URL}/api/chat/confirm-overage`, {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({ sessionId, paymentIntentId }),
        });
      } catch (_) {
        // Non-fatal — webhook will credit
      }

      setStage('success');
      toast.success('+50 messages added');
      setTimeout(() => { onSuccess(); setStage('details'); }, 1200);
    } catch (err: any) {
      const msg = err?.message || 'Payment failed.';
      setError(msg);
      setStage('details');

      // Pass 22 Bug 22.9 — log to payment_errors so the admin viewer
      // surfaces chat-overage failures alongside mission-payment failures.
      const shaped = shapeStripeError(err);
      logPaymentError({
        stage:                 'client_chat_overage',
        missionId:             null,
        stripePaymentIntentId: activePaymentIntentId,
        errorCode:             shaped.errorCode,
        errorMessage:          shaped.errorMessage || msg,
        declineCode:           shaped.declineCode,
        paymentMethod:         shaped.paymentMethod || 'card',
        amountCents:           500,
        currency:              'usd',
      });
    }
  }

  // ─── Success state ───────────────────────────────────────
  if (stage === 'success') {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mx-auto mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">You're topped up</h3>
        <p className="text-white/60 text-sm">+50 messages added. Keep asking.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-tight">Keep chatting</h2>
            <p className="text-white/60 text-sm mt-1">You've used all your chat messages. Get 50 more for $5.</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-1.5 -mr-1 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          disabled={stage === 'processing'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Summary card */}
      <div className="px-6 pt-5">
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <div>
            <div className="text-[11px] text-white/50 uppercase tracking-wider">50 more messages</div>
            <div className="text-white font-bold text-sm mt-0.5">Chat overage pack</div>
          </div>
          <div className="text-primary font-black text-2xl">$5</div>
        </div>
      </div>

      {/* Card fields */}
      <div className="p-6 space-y-3">
        <div>
          <label className="text-[11px] text-white/50 uppercase tracking-wider mb-1.5 block">Card number</label>
          <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-primary/40 transition-colors">
            <CardNumberElement
              options={CARD_STYLE}
              onReady={() => setCardNumberReady(true)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-white/50 uppercase tracking-wider mb-1.5 block">Expiry</label>
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-primary/40 transition-colors">
              <CardExpiryElement
                options={CARD_STYLE}
                onReady={() => setCardExpiryReady(true)}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-white/50 uppercase tracking-wider mb-1.5 block">CVC</label>
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-primary/40 transition-colors">
              <CardCvcElement
                options={CARD_STYLE}
                onReady={() => setCardCvcReady(true)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={!stripe || stage === 'processing' || !allElementsReady}
          className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {stage === 'processing' ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Processing…
            </>
          ) : !allElementsReady ? (
            <>
              <CreditCard className="w-4 h-4" />
              Loading payment form…
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay $5 · Get 50 messages
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40 pt-1">
          <Lock className="w-3 h-3" /> Payments secured by Stripe
        </div>
      </div>
    </div>
  );
}
