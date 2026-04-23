import { useState, useEffect, ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';

/**
 * Module-level singleton — loadStripe() is called exactly once for the
 * lifetime of the app, regardless of how many times the modal opens/closes.
 */
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripeElementsWrapperProps {
  children: ReactNode;
  /** Rendered while the Stripe.js bundle is still downloading. */
  fallback?: ReactNode;
}

/**
 * Awaits the loadStripe() promise before mounting <Elements>.
 *
 * Why this matters
 * ────────────────
 * Passing a Promise to <Elements> means inner components call
 * useStripe() → null while the Stripe.js bundle downloads. When the
 * card iframes initialise and fire their "ready" events before the
 * Stripe instance arrives, those events are lost. The result: the
 * Pay button stays permanently disabled because allElementsReady never
 * flips to true — exactly the issue reported on desktop card payment.
 *
 * By waiting for the resolved Stripe instance we guarantee that
 * <Elements> always receives a fully-initialised stripe object,
 * eliminating the race between iframe ready events and JS bundle load.
 *
 * UX note: the parent VettingPaymentModal already plays a 3-second
 * vetting animation before the card form appears. Stripe.js loads in
 * < 500 ms on a reasonable connection, so users never see the fallback.
 */
export const StripeElementsWrapper = ({
  children,
  fallback = null,
}: StripeElementsWrapperProps) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    stripePromise
      .then((instance) => {
        if (!mounted) return;
        if (!instance) {
          setFailed(true);
        } else {
          setStripe(instance);
        }
      })
      .catch(() => {
        if (mounted) setFailed(true);
      });
    return () => { mounted = false; };
  }, []);

  if (failed) {
    return (
      <div className="p-4 text-center text-red-400 text-sm">
        Payment provider failed to load. Check your connection and try again.
      </div>
    );
  }

  if (!stripe) return <>{fallback}</>;

  return <Elements stripe={stripe}>{children}</Elements>;
};
