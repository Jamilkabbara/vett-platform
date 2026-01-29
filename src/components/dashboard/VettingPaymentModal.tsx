import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, CreditCard, Lock, X, Apple } from 'lucide-react';
import toast from 'react-hot-toast';

interface VettingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  totalCost: number;
  respondentCount: number;
}

type Stage = 'vetting' | 'payment' | 'processing' | 'success';

interface VettingCheck {
  label: string;
  completed: boolean;
}

interface CardDetails {
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export const VettingPaymentModal = ({
  isOpen,
  onClose,
  onComplete,
  totalCost,
  respondentCount
}: VettingPaymentModalProps) => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('vetting');
  const [vettingChecks, setVettingChecks] = useState<VettingCheck[]>([
    { label: 'PII (Personal Data) Check', completed: false },
    { label: 'Profanity Filter', completed: false },
    { label: 'Policy Compliance', completed: false }
  ]);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiry: '',
    cvc: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState(totalCost);

  const isCardValid = cardDetails.cardNumber.length >= 3;

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
        { label: 'Policy Compliance', completed: false }
      ]);
      setCardDetails({ cardNumber: '', expiry: '', cvc: '' });
      setIsProcessing(false);
      setPromoCode('');
      setPromoMessage('');
      setPromoApplied(false);
      setDiscountedPrice(totalCost);
    }
  }, [isOpen, totalCost]);

  const handlePayment = async () => {
    console.log("💳 Payment button clicked - Starting payment flow");
    setIsProcessing(true);
    setStage('processing');

    const toastId = toast.loading('Processing secure payment...');

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("✅ Payment processed successfully");

    setStage('success');
    toast.success('Mission Launched Successfully!', { id: toastId });

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log("🎊 Navigating to mission success page");
    onClose();
    navigate(`/mission-success?respondents=${respondentCount}&total=${totalCost.toFixed(2)}`);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + ' / ' + cleaned.substring(2, 4);
    }
    return cleaned;
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

          {stage === 'vetting' && (
            <div className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-white text-center mb-2">
                Vetting your Mission...
              </h2>
              <p className="text-white/60 text-center mb-8">
                Running safety and compliance checks
              </p>

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
                      check.completed
                        ? 'bg-green-500'
                        : 'bg-white/10 border-2 border-white/30'
                    }`}>
                      {check.completed && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${
                      check.completed ? 'text-white' : 'text-white/60'
                    }`}>
                      {check.label}
                    </span>
                    {check.completed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <Check className="w-5 h-5 text-green-400" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {stage === 'payment' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-full"
            >
              {/* HEADER - Sticky at top */}
              <div className="sticky top-0 z-10 flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Secure Checkout
                </h2>
              </div>

              {/* BODY - Scrollable content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-6 custom-scrollbar">
                <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">
                      {respondentCount} Respondents × ${(totalCost / respondentCount).toFixed(2)}
                    </span>
                    <div className="text-right">
                      {promoApplied && (
                        <div className="text-xs text-white/50 line-through mb-1">
                          ${totalCost.toFixed(2)}
                        </div>
                      )}
                      <span className="text-white font-bold text-lg">
                        ${discountedPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full h-12 sm:h-14 rounded-lg text-white bg-black hover:bg-gray-950 transition-colors flex items-center justify-center gap-1.5 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Apple className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" />
                  <span className="text-lg sm:text-xl font-normal tracking-tight">Pay</span>
                </button>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full h-12 sm:h-14 rounded-lg text-white bg-black hover:bg-gray-950 transition-colors flex items-center justify-center gap-1 mb-4 sm:mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-base sm:text-lg font-medium">Pay</span>
                </button>

                <div className="relative mb-4 sm:mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-3 sm:px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white/60">
                      Or pay with card
                    </span>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div>
                    <label className="block text-xs sm:text-sm text-white/70 mb-1.5 sm:mb-2">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails({
                          ...cardDetails,
                          cardNumber: formatCardNumber(e.target.value)
                        })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/30 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs sm:text-sm"
                      />
                      <CreditCard className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-white/70 mb-1.5 sm:mb-2">MM / YY</label>
                      <input
                        type="text"
                        placeholder="12 / 25"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({
                          ...cardDetails,
                          expiry: formatExpiry(e.target.value)
                        })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/30 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-white/70 mb-1.5 sm:mb-2">CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        value={cardDetails.cvc}
                        onChange={(e) => setCardDetails({
                          ...cardDetails,
                          cvc: e.target.value.replace(/\D/g, '')
                        })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/30 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* PROMO CODE SECTION */}
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

                <button
                  onClick={handlePayment}
                  disabled={(!isCardValid && discountedPrice > 0) || isProcessing}
                  className={`w-full py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all ${
                    ((isCardValid && !isProcessing) || discountedPrice === 0)
                      ? 'bg-gradient-to-r from-neon-lime to-primary text-gray-900 hover:shadow-2xl hover:shadow-neon-lime/50'
                      : 'bg-gray-700/30 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {discountedPrice === 0 ? 'Start Mission' : `Pay $${discountedPrice.toFixed(2)}`}
                </button>
              </div>

              {/* FOOTER - Fixed at bottom */}
              <div className="flex-shrink-0 p-3 sm:p-6 pt-3 sm:pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-white/50">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-center">Payments processed securely via Ziina (UAE). All major cards accepted.</span>
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8"
            >
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-6" />
                <h2 className="text-2xl font-black text-white text-center mb-2">
                  Connecting to Ziina...
                </h2>
                <p className="text-white/60 text-center">
                  Securely processing your payment
                </p>
              </div>
            </motion.div>
          )}

          {stage === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8"
            >
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6"
                >
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </motion.div>
                <h2 className="text-3xl font-black text-white text-center mb-2">
                  Payment Approved!
                </h2>
                <p className="text-white/60 text-center">
                  Launching your mission...
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
