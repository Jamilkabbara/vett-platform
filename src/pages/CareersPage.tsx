import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { AuthModal } from '../components/layout/AuthModal';
import { useState } from 'react';
import { Mail } from 'lucide-react';

export const CareersPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="relative min-h-[100dvh] flex flex-col font-display bg-[#0B0C15]">
      <div className="aurora-blob blob-1"></div>
      <div className="aurora-blob blob-2"></div>

      <Navbar onSignInClick={() => setShowAuthModal(true)} />

      <main className="relative z-10 flex-1 px-4 sm:px-6 py-20 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-tight">
              Build the OS for{' '}
              <span className="text-primary">Truth.</span>
            </h1>
          </div>

          <div className="glass-panel rounded-3xl p-12 border-white/10 bg-background-dark/50">
            <div className="space-y-8 text-white/70 text-lg md:text-xl leading-relaxed font-medium">
              <p>
                We are currently a lean, high-velocity team. We do not have any open roles at this
                moment, but we are always looking for obsessive builders.
              </p>

              <div className="pt-8 border-t border-white/10">
                <p className="text-white font-bold mb-6 text-center">
                  Think you belong here? Send your portfolio to:
                </p>
                <div className="flex justify-center">
                  <a
                    href="mailto:careers@vettit.ai"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#DFFF00] hover:bg-[#E5FF40] text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#DFFF00]/30"
                  >
                    <Mail className="w-5 h-5" />
                    careers@vettit.ai
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};
