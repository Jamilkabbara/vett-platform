import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, CreditCard, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { api } from '../../lib/apiClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface VettingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  totalCost: number;
  respondentCount: number;
  missionId?: string | null;
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
}: VettingPaymentModalProps) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

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

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'VETT100') {
      setPromoApplied(true);
      setDiscountedPrice(0);
      setPromoMessage('✅ Code Applied: 100% OFF');
    } else {
      setPromoApplied(false);
      setDiscountedPrice(totalCost);
      setPromoMessage('❌ Invalid Code');
      setTimeout(() => setPromoMessage(''), 3000);
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
    }
  }, [isOpen, totalCost]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setStage('processing');
    const toastId = toast.loading('Processing secure payment...');

    try {
      // Free launch via promo code
      if (promoApplied && discountedPrice === 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStage('success');
        toast.success('Mission Launched!', { id: toastId });
        await new Promise(resolve => setTimeout(resolve, 1500));
        onClose();
        navigate(`/mission-success?respondents=${respondentCount}&total=0`);
        return;
      }

      // Real Stripe payment
      if (!stripe || !elements || !missionId) {
        throw new Error('Payment system not ready. Please try again.');
      }

      // 1. Create payment intent on backend
      const { clientSecret, paymentIntentId } = await api.post('/api/payments/create-intent', {
        missionId,
      });

      // 2. Confirm payment with Stripe
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) throw new Error('Card details not found');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardNumberElement },
      });

      if (stripeError) throw new Error(stripeError.message || 'Payment failed');
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment not completed');

      // 3. Confirm with backend (launches Pollfish + sends emails)
      await api.post('/api/payments/confirm', { missionId, paymentIntentId });

      setStage('success');
      toast.success('Mission Launched Successfully!', { id: toastId });
      await new Promise(resolve => setTimeout(resolve, 1500));
      onClose();
      navigate(`/mission-success?respondents=${respondentCount}&total=${totalCost.toFixed(2)}`);

    } catch (err: any) {
      setIsProcessing(false);
      setStage('payment');
      toast.error(err.message || 'Payment failed. Please try again.', { id: toastId });
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
                {/* Price summary */}
                <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">
                      {respondentCount} Respondents × ${(totalCost / respondentCount).toFixed(2)}
                    </span>
                    <div className="text-right">
                      {promoApplied && (
                        <div className="text-xs text-white/50 line-through mb-1">${totalCost.toFixed(2)}</div>
                      )}
                      <span className="text-white font-bold text-lg">${discountedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Stripe Card Elements */}
                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                      <div>
                        <label className="block text-xs sm:text-sm text-white/70 mb-1.5 sm:mb-2">Card Number</label>
                        <div className="relative px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/30 border border-white/20 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                          <CardNumberElement options={CARD_ELEMENT_STYLE} />
                          <CreditCard className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40 pointer-events-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm text-white/70 mb-1.5 sm:mb-2">MM / YY</label>
                          <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/30 border border-white/20 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                            <CardExpiryElement options={CARD_ELEMENT_STYLE} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-white/70 mb-1.5 sm:mb-2">CVC</label>
                          <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/30 border border-white/20 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                            <CardCvcElement options={CARD_ELEMENT_STYLE} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Promo Code */}
                <div className="mb-4 sm:mb-6 w-full">
                  <label className="block text-xs sm:text-sm text-white/70 mb-1.5 sm:mb-2">Discount Code</label>
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      placeholder="Code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      className="flex-1 min-w-0 px-2 sm:px-3 py-2.5 sm:py-3 bg-gray-700/30 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs sm:text-sm"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim()}
                      className="px-3 sm:px-6 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`text-xs sm:text-sm mt-2 ${promoApplied ? 'text-green-400' : 'text-red-400'}`}>
                      {promoMessage}
                    </p>
                  )}
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className={`w-full py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all ${
                    !isProcessing
                      ? 'bg-gradient-to-r from-neon-lime to-primary text-gray-900 hover:shadow-2xl hover:shadow-neon-lime/50'
                      : 'bg-gray-700/30 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {discountedPrice === 0 ? 'Start Mission (Free)' : `Pay $${discountedPrice.toFixed(2)}`}
                </button>
              </div>

              <div className="flex-shrink-0 p-3 sm:p-6 pt-3 sm:pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-white/50">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-center">Payments processed securely via Stripe. All major cards accepted.</span>
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
    </AnimatePresence>
  );
};

// Outer component wraps with Stripe Elements provider
export const VettingPaymentModal = (props: VettingPaymentModalProps) => {
  if (!props.isOpen) return null;

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};
