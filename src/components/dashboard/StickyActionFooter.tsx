import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

interface StickyActionFooterProps {
  pricingBreakdown: {
    base: number;
    questionSurcharge: number;
    targetingSurcharge: number;
    screeningSurcharge: number;
    total: number;
    filterCount: number;
  };
  onLaunch: () => void;
  isLaunching: boolean;
  respondentCount?: number;
}

export const StickyActionFooter = ({ pricingBreakdown, onLaunch, isLaunching, respondentCount = 10 }: StickyActionFooterProps) => {
  const addOnsTotal = pricingBreakdown.total - pricingBreakdown.base;
  const hasAddOns = addOnsTotal > 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="hidden md:flex fixed bottom-0 left-0 right-0 z-[50] border-t border-white/10 backdrop-blur-xl bg-[#0B0C15]/95 pointer-events-auto"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 md:py-5 w-full">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side: Sleek Checkout Total */}
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase mb-0.5">
              ESTIMATED TOTAL
            </p>
            <div className="flex items-start gap-1 flex-wrap">
              <span className="text-[#ccff00] text-xl md:text-2xl font-black mt-0.5 md:mt-1">$</span>
              <span className="text-2xl md:text-4xl font-black text-white leading-none">
                {pricingBreakdown.total}
              </span>
              {hasAddOns && (
                <span className="text-[10px] md:text-xs bg-[#ccff00]/20 text-[#ccff00] px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-bold ml-1 md:ml-2 mt-0.5 md:mt-1 whitespace-nowrap">
                  +${addOnsTotal} Add-ons
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium mt-0.5 md:mt-1">
              {respondentCount} Respondents • Standard Reach
            </p>
          </div>

          {/* Right Side: Launch Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("🚀 LAUNCH CLICKED - Opening Payment Modal");
              onLaunch();
            }}
            disabled={isLaunching}
            className="relative z-[9999] px-6 md:px-10 py-3 md:py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest transition-all duration-300 bg-gradient-to-r from-[#ccff00] to-[#b3e600] text-black shadow-[0_0_30px_rgba(204,255,0,0.4)] hover:shadow-[0_0_40px_rgba(204,255,0,0.6)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 md:gap-3 cursor-pointer pointer-events-auto whitespace-nowrap"
          >
            {isLaunching ? (
              <>
                <div className="w-4 md:w-5 h-4 md:h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span className="hidden sm:inline">Launching...</span>
                <span className="sm:hidden">Launch...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 md:w-5 h-4 md:h-5" />
                <span className="hidden sm:inline">Launch Mission</span>
                <span className="sm:hidden">Launch</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
