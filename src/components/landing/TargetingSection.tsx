import { motion } from 'framer-motion';
import { Globe, Users, Target, TrendingUp } from 'lucide-react';

export const TargetingSection = () => {
  const geographyTags = [
    '140+ Countries',
    'Global Cities',
    'Specific Regions',
    'Local Districts',
  ];

  const demographicsTags = [
    'Age (16-54+)',
    'Gender',
    'Income',
    'Education',
    'Marital Status',
    'Parental Status',
  ];

  const behaviorTags = [
    'Founders & C-Suite',
    'IT Decision Makers',
    'Software Developers',
    'Marketing Professionals',
    'Small Business Owners',
    'High Income Earners',
    'iOS Premium Users',
    'Remote Workers',
    'Early Tech Adopters',
    'Investors / Finance',
  ];

  return (
    <section className="relative z-10 px-6 py-20 md:py-32 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
          Target the exact human,
        </h2>
        <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-neon-lime italic mb-6">
          not the haystack.
        </h3>
        <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
          From broad national sentiment to niche local verified IDs. We find them instantly.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-3 gap-6"
      >
        <div className="glass-panel rounded-3xl p-8 border-white/10 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-black text-white">Geography</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {geographyTags.map((tag, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-bold text-blue-300 uppercase tracking-wider hover:bg-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8 border-white/10 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-black text-white">Demographics</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {demographicsTags.map((tag, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary uppercase tracking-wider hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all cursor-pointer"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8 border-white/10 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-neon-lime/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-neon-lime" />
            </div>
            <h3 className="text-xl font-black text-white">Business & Career</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {behaviorTags.map((tag, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="px-3 py-1.5 bg-neon-lime/10 border border-neon-lime/20 rounded-full text-xs font-bold text-neon-lime uppercase tracking-wider hover:bg-neon-lime/20 hover:shadow-[0_0_15px_rgba(190,242,100,0.3)] transition-all cursor-pointer"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <TrendingUp className="w-4 h-4 text-neon-lime" />
          <span className="text-sm font-bold text-white/80">
            Mix and match filters for laser-precision targeting
          </span>
        </div>
      </motion.div>
    </section>
  );
};
