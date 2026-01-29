import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface OverlayPageProps {
  children: React.ReactNode;
}

export const OverlayPage = ({ children }: OverlayPageProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    navigate('/landing', { replace: true });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background-dark/95 backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative w-full min-h-[100dvh]"
        >
          <button
            onClick={handleClose}
            className="fixed top-8 right-8 z-50 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 hover:scale-110 group"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
          </button>

          <div className="px-4 sm:px-6 py-24 max-w-6xl mx-auto">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
