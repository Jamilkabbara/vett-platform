import { motion } from 'framer-motion';
import { Zap, CheckCircle2, Palette, Clock } from 'lucide-react';

export const FeatureRows = () => {
  return (
    <section className="relative z-10 px-6 py-20 md:py-32 max-w-7xl mx-auto space-y-[100px]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col md:flex-row items-center gap-12 backdrop-blur-3xl bg-gradient-to-b from-white/5 to-transparent rounded-[3rem] p-8 md:p-16 border border-white/10 overflow-hidden"
      >
        <div className="flex-1 space-y-6">
          <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
            Results in 4 Hours, <span className="text-primary italic">not 4 Weeks.</span>
          </h3>
          <p className="text-xl text-white/60 leading-relaxed font-medium">
            Agencies take a month. We take a day. Watch the data roll in real-time.
          </p>
        </div>
        <div className="flex-1 w-full relative group">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative glass-panel rounded-3xl p-8 border-white/10">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Agencies
                    </p>
                    <p className="text-sm font-bold text-white/30">28 Days</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-xs font-black text-red-400">SLOW</span>
                </div>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      VETT
                    </p>
                    <p className="text-sm font-bold text-white">1 Day</p>
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="px-3 py-1 bg-neon-lime/10 border border-neon-lime/20 rounded-lg"
                >
                  <span className="text-xs font-black text-neon-lime">28x FASTER</span>
                </motion.div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-black text-primary">98%</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mt-1">
                    Accuracy
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-primary">100+</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mt-1">
                    Verified
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-primary">$19</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mt-1">
                    Starting
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col md:flex-row-reverse items-center gap-12 backdrop-blur-3xl bg-gradient-to-b from-white/5 to-transparent rounded-[3rem] p-8 md:p-16 border border-white/10 overflow-hidden"
      >
        <div className="flex-1 space-y-6">
          <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
            Real Humans. <span className="text-neon-lime italic">Verified IDs.</span>
          </h3>
          <p className="text-xl text-white/60 leading-relaxed font-medium">
            No bots. No click-farms. Every respondent is ID-verified via government databases.
          </p>
        </div>
        <div className="flex-1 w-full relative group">
          <div className="absolute inset-0 bg-neon-lime/20 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative glass-panel rounded-3xl p-12 border-white/10 flex flex-col items-center justify-center">
            <div className="relative">
              <svg
                className="w-32 h-32 text-white/20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 1a11 11 0 0 0-4 21.24V18a4 4 0 1 1 8 0v4.24A11 11 0 0 0 12 1zm0 2a9 9 0 0 1 4 17.09V18a6 6 0 1 0-8 0v2.09A9 9 0 0 1 12 3zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
              </svg>
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-1 bg-neon-lime shadow-[0_0_15px_#c6ff1a] z-10"
              ></motion.div>
            </div>
            <div className="mt-8 px-4 py-2 bg-neon-lime/10 border border-neon-lime/20 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-neon-lime rounded-full"></span>
              <span className="text-[10px] font-black text-neon-lime uppercase tracking-widest">
                Identity Match Confirmed
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col md:flex-row items-center gap-12 backdrop-blur-3xl bg-gradient-to-b from-white/5 to-transparent rounded-[3rem] p-8 md:p-16 border border-white/10 overflow-hidden"
      >
        <div className="flex-1 space-y-6">
          <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
            AI that reads <span className="text-purple-400 italic">between the lines.</span>
          </h3>
          <p className="text-xl text-white/60 leading-relaxed font-medium">
            Our sentiment engine detects sarcasm, hesitation, and excitement.
          </p>
        </div>
        <div className="flex-1 w-full relative group">
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative glass-panel rounded-3xl p-12 border-white/10 flex items-center justify-center overflow-hidden">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 180, 270, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border border-purple-500/20 rounded-full"
              ></motion.div>
              <motion.div
                animate={{ scale: [1.2, 1, 1.2] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-24 h-24 bg-purple-500/20 rounded-full blur-xl absolute"
              ></motion.div>
              <svg className="w-28 h-28 text-purple-400 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/>
              </svg>
              <div className="absolute top-0 right-0 w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
              <div className="absolute bottom-4 left-0 w-2 h-2 bg-purple-400 rounded-full animate-ping delay-500"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
