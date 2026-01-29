import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Zap, DollarSign } from 'lucide-react';

interface WhiteLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhiteLabelModal = ({ isOpen, onClose }: WhiteLabelModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-2xl pointer-events-auto"
            >
              <div className="glass-panel rounded-3xl p-8 md:p-12 border-white/10 bg-background-dark/95 backdrop-blur-xl">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all z-10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>

                <div className="mb-8">
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4 leading-tight">
                    Partner with <span className="text-primary">VETT</span>
                  </h2>
                  <p className="text-white/60 text-lg">
                    Power your agency with our Validation Engine.
                  </p>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-lg mb-1">Brand the experience with your Agency Logo</h3>
                      <p className="text-white/60 text-sm">
                        White-label our platform to match your brand identity.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-lg mb-1">API Access for bulk survey creation</h3>
                      <p className="text-white/60 text-sm">
                        Programmatically launch missions at scale for your clients.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-lg mb-1">Wholesale pricing on respondents</h3>
                      <p className="text-white/60 text-sm">
                        Volume discounts for agencies and enterprise partners.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="mailto:partners@vettit.ai"
                    className="flex-1 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest bg-[#DFFF00] hover:bg-[#E5FF40] text-black shadow-lg shadow-[#DFFF00]/30 hover:shadow-[#DFFF00]/40 transition-all duration-300 hover:scale-105 text-center"
                  >
                    Contact Partnerships
                  </a>
                  <button
                    onClick={onClose}
                    className="px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
