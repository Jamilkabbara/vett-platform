import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

interface MobilePriceSummaryProps {
  pricingBreakdown: {
    base: number;
    questionSurcharge: number;
    targetingSurcharge: number;
    screeningSurcharge: number;
    retargetingSurcharge: number;
    total: number;
    filterCount: number;
  };
  onLaunch: () => void;
  isLaunching: boolean;
  respondentCount?: number;
}

export const MobilePriceSummary = ({ pricingBreakdown, onLaunch, isLaunching, respondentCount = 50 }: MobilePriceSummaryProps) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="block md:hidden fixed bottom-[108px] left-0 w-full z-[65] bg-[#0f172a]/95 border-t border-white/10 border-b border-white/5 shadow-2xl backdrop-blur-xl p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
            Est. Total
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-white text-2xl font-black">
              ${pricingBreakdown.total}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {respondentCount} respondents
          </p>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLaunch();
          }}
          disabled={isLaunching}
          className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 bg-gradient-to-r from-[#ccff00] to-[#b3e600] text-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          {isLaunching ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Launch...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Launch
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};
