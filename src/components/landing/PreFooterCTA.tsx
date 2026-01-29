import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface PreFooterCTAProps {
  onAuthModalOpen: () => void;
}

export const PreFooterCTA = ({ onAuthModalOpen }: PreFooterCTAProps) => {

  return (
    <section className="relative z-10 px-6 py-20 md:py-32 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative glass-panel rounded-[3rem] p-12 md:p-20 text-center border-white/10 bg-background-dark/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-violet-600/10 rounded-[3rem] blur-3xl"></div>

        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
            Ready to stop guessing?
          </h2>

          <p className="text-white/60 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12">
            Join 1,200+ founders who stopped betting on luck and started betting on data.
          </p>

          <Link
            to="/setup"
            className="inline-block px-12 py-6 rounded-full font-black text-base uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:shadow-[0_0_60px_rgba(99,102,241,0.8)] transition-all duration-500 hover:scale-105"
          >
            START VETTING NOW
          </Link>
        </div>
      </motion.div>
    </section>
  );
};
