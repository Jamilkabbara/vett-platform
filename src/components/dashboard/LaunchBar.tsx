import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { PricingBreakdown } from '../../utils/pricingEngine';

interface LaunchBarProps {
  pricingBreakdown: PricingBreakdown;
  onLaunch: () => void;
  isLaunching?: boolean;
}

export const LaunchBar = ({ pricingBreakdown, onLaunch, isLaunching = false }: LaunchBarProps) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-gray-900/95 to-transparent backdrop-blur-xl border-t border-white/10"
    >
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-sm text-white/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Ready to launch
              </div>
            </div>
          </div>

          <motion.button
            onClick={onLaunch}
            disabled={isLaunching}
            whileHover={{ scale: isLaunching ? 1 : 1.02 }}
            whileTap={{ scale: isLaunching ? 1 : 0.98 }}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-black text-lg shadow-2xl transition-all ${
              isLaunching
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-neon-lime text-gray-900 hover:shadow-primary/50'
            }`}
          >
            {isLaunching ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="w-6 h-6" />
                LAUNCH MISSION
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="h-2 bg-gradient-to-r from-primary via-neon-lime to-primary opacity-30" />
    </motion.div>
  );
};
