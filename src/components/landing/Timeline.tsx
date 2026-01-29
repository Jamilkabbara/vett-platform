import { motion } from 'framer-motion';
import { Keyboard, Sparkles, Fingerprint, BarChart3 } from 'lucide-react';

const timelineSteps = [
  {
    step: '01',
    title: 'Input',
    text: "Drop your wildest idea into our Context Engine. Don't worry about formatting; we speak human.",
    icon: Keyboard,
    align: 'left' as const,
  },
  {
    step: '02',
    title: 'Strategy',
    text: 'VETT AI generates a surgical research strategy, stripping away bias to find what actually matters.',
    icon: Sparkles,
    align: 'right' as const,
  },
  {
    step: '03',
    title: 'Verify',
    text: 'Instantly reach 250M+ verified real humans. Real people, real wallets, real opinions. No bots allowed.',
    icon: Fingerprint,
    align: 'left' as const,
  },
  {
    step: '04',
    title: 'Truth',
    text: "Access your brutal honesty dashboard. We don't sugarcoat; we give you the data to dominate.",
    icon: BarChart3,
    align: 'right' as const,
  },
];

export const Timeline = () => {
  return (
    <section className="relative z-10 px-6 py-20 md:py-32 max-w-5xl mx-auto">
      <div className="text-center mb-24">
        <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4 italic">
          The Intelligence Loop
        </h3>
        <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">
          Zero friction. Total clarity.
        </p>
      </div>

      <div className="relative space-y-12">
        <motion.div
          initial={{ height: 0 }}
          whileInView={{ height: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0 hidden md:block"
        ></motion.div>

        {timelineSteps.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: item.align === 'left' ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`flex flex-col md:flex-row items-center gap-8 ${
              item.align === 'right' ? 'md:flex-row-reverse' : ''
            }`}
          >
            <div className="w-full md:w-1/2">
              <div
                className={`glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-500 border-white/5 hover:border-primary/40 ${
                  item.align === 'left' ? 'md:text-right' : 'md:text-left'
                }`}
              >
                <div
                  className={`absolute top-0 bottom-0 w-1 bg-primary transition-all duration-500 group-hover:h-full h-0 ${
                    item.align === 'left' ? 'right-0' : 'left-0'
                  }`}
                ></div>

                <span className="text-6xl font-black text-white/5 absolute -top-2 left-4 group-hover:text-primary/10 transition-colors pointer-events-none uppercase italic">
                  {item.step}
                </span>

                <div
                  className={`flex items-center gap-4 mb-4 ${
                    item.align === 'left' ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-2xl font-black text-white tracking-tight uppercase">
                    {item.title}
                  </h4>
                </div>
                <p className="text-white/50 text-base leading-relaxed group-hover:text-white/80 transition-colors">
                  {item.text}
                </p>
              </div>
            </div>

            <div className="hidden md:flex relative z-10 w-12 h-12 rounded-full bg-[#0B0C15] border-4 border-primary/20 items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            </div>

            <div className="hidden md:block md:w-1/2"></div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
