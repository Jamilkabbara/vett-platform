import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Rocket } from 'lucide-react';

interface MissionFailureCardProps {
  failureReason?: string | null;
  partialRefundId?: string | null;
  partialRefundAmountCents?: number | null;
}

const STACK_TRACE_PATTERNS = [
  /\bat\s+\w+\s*\(/,
  /\.[jt]sx?:\d+:\d+/,
  /Error:\s/i,
  /TypeError:|ReferenceError:|SyntaxError:|RangeError:/,
  /\bnode_modules\b/,
  /^\s+at\s/m,
];

const looksLikeStackTrace = (reason: string): boolean => {
  return STACK_TRACE_PATTERNS.some((re) => re.test(reason));
};

const formatRefundAmount = (cents: number): string => {
  const dollars = cents / 100;
  return dollars.toFixed(2);
};

export const MissionFailureCard = ({
  failureReason,
  partialRefundId,
  partialRefundAmountCents,
}: MissionFailureCardProps) => {
  const navigate = useNavigate();

  const hasRefund =
    !!partialRefundId &&
    typeof partialRefundAmountCents === 'number' &&
    partialRefundAmountCents > 0;

  const friendlyReason =
    failureReason && !looksLikeStackTrace(failureReason)
      ? failureReason
      : 'Our analysis pipeline encountered an unexpected error.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/5 border border-red-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-xl mb-8"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
            This mission ran into an issue
          </h2>
          <p className="text-white/70 text-sm md:text-base leading-relaxed">
            We couldn't complete the analysis for this mission. {friendlyReason}
          </p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 mb-5">
        {hasRefund ? (
          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            We've automatically refunded{' '}
            <span className="font-bold text-[#ccff00]">
              ${formatRefundAmount(partialRefundAmountCents as number)}
            </span>{' '}
            to your original payment method. It should arrive in 5-10 business
            days.
          </p>
        ) : (
          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            We owe you a refund - our team has been alerted and will process it
            within 1 business day. If you don't see it within a few business
            days, email{' '}
            <a
              href="mailto:support@vett.it"
              className="text-[#ccff00] font-bold hover:underline"
            >
              support@vett.it
            </a>
            .
          </p>
        )}
      </div>

      <button
        onClick={() => navigate('/setup')}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-lime to-primary text-gray-900 rounded-xl font-black text-sm uppercase tracking-wider hover:scale-105 transition-transform shadow-lg shadow-primary/30"
      >
        <Rocket className="w-4 h-4" />
        Start a new mission
      </button>
    </motion.div>
  );
};
