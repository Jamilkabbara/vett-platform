import { motion } from 'framer-motion';
import { Receipt, Clock } from 'lucide-react';
import { PricingBreakdown } from '../../utils/pricingEngine';
import { TimeEstimate } from '../../utils/timeEstimation';

interface PricingReceiptProps {
  pricingBreakdown: PricingBreakdown;
  respondentCount: number;
  timeEstimate: TimeEstimate;
}

export const PricingReceipt = ({ pricingBreakdown, respondentCount, timeEstimate }: PricingReceiptProps) => {
  const costPerRespondent = pricingBreakdown.base / respondentCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-xl p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-black text-white">Order Summary</h3>
      </div>

      <div className="mb-4 p-4 bg-gradient-to-r from-emerald-500/10 to-primary/10 border border-emerald-400/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white/90">Delivery Time</span>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${timeEstimate.color}`}>
              {timeEstimate.display}
            </div>
            <div className="text-xs text-emerald-400/80 mt-0.5">
              {timeEstimate.badge}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">
            Base Price ({respondentCount} × ${costPerRespondent.toFixed(2)})
          </span>
          <span className="text-white font-semibold">${pricingBreakdown.base}</span>
        </div>

        {pricingBreakdown.targetingSurcharge > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Targeting Filters</span>
            <span className="text-white font-semibold">+${pricingBreakdown.targetingSurcharge}</span>
          </div>
        )}

        {pricingBreakdown.questionSurcharge > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Extra Questions</span>
            <span className="text-white font-semibold">+${pricingBreakdown.questionSurcharge}</span>
          </div>
        )}

        {pricingBreakdown.screeningSurcharge > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Screening Questions</span>
            <span className="text-white font-semibold">+${pricingBreakdown.screeningSurcharge}</span>
          </div>
        )}

        <div className="border-t border-white/10 pt-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-base">Total</span>
            <div className="text-right">
              <div className="text-2xl font-black text-primary">
                ${pricingBreakdown.total}
              </div>
              <div className="text-xs text-white/40">
                ${(pricingBreakdown.total / respondentCount).toFixed(2)}/respondent
              </div>
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
};
