import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export const MissionSection = () => {
  return (
    <section className="relative z-10 px-6 py-20 md:py-32 max-w-5xl mx-auto">
      <div className="glass-panel p-12 md:p-24 rounded-[4rem] text-center relative overflow-hidden border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-purple-500/5 opacity-50 animate-pulse"></div>

        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-10 relative z-10 shadow-2xl shadow-primary/20"
        >
          <Users className="text-primary w-8 h-8" />
        </motion.div>

        <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-10 relative z-10 italic">
          Truth shouldn't be a luxury.
        </h3>
        <p className="text-xl md:text-3xl text-white/70 font-medium leading-[1.4] max-w-3xl mx-auto relative z-10">
          For decades, only big companies could afford real market research. We built VETT to
          democratize data.{' '}
          <span className="text-white">
            {' '}
            A kid in a dorm room should have the same tools as a Fortune 500 CEO.
          </span>
        </p>

        <div className="mt-12 flex items-center justify-center gap-4 relative z-10 opacity-40">
          <div className="h-px w-12 bg-white"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em]">
            The VETT Mission
          </span>
          <div className="h-px w-12 bg-white"></div>
        </div>
      </div>
    </section>
  );
};
