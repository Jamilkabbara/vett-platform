import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Rocket } from 'lucide-react';

interface MissionFailureCardProps {
  failureReason?: string | null;
  // Pass 43 T4a — partialRefundId / partialRefundAmountCents are retained
  // in the prop type for caller compatibility (ResultsPage passes them)
  // but are NO LONGER rendered. The NO REFUNDS policy (Pass 42 G4, Terms
  // §5.3) means the failure UI offers a prioritized re-run at no extra
  // cost instead of promising a refund.
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

export const MissionFailureCard = ({
  failureReason,
}: MissionFailureCardProps) => {
  const navigate = useNavigate();

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

      {/* Pass 43 T4a — no-refund-consistent recovery copy. Replaces the
          prior two-branch refund-promising block. */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 mb-5">
        <p className="text-white/90 text-sm md:text-base leading-relaxed">
          Our team has been alerted. Email{' '}
          <a
            href="mailto:support@vett.it"
            className="text-[#ccff00] font-bold hover:underline"
          >
            support@vett.it
          </a>{' '}
          and we'll prioritize a re-run of your mission at no extra cost.
        </p>
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
