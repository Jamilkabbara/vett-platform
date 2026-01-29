import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export const MissionSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const respondentCount = searchParams.get('respondents') || '100';
  const totalCost = searchParams.get('total') || '150';
  const missionTitle = searchParams.get('title') || 'Your Mission';
  const location = searchParams.get('location') || 'Toronto, Canada';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] bg-gradient-to-b from-[#0B0C15] via-[#1A1B2E] to-[#0B0C15]">

      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 40px rgba(34, 197, 94, 0.4), 0 0 80px rgba(34, 197, 94, 0.2);
          }
          50% {
            box-shadow: 0 0 60px rgba(34, 197, 94, 0.6), 0 0 120px rgba(34, 197, 94, 0.3);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-32 pb-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-flex items-center justify-center mb-8"
          >
            <div className="absolute inset-0 rounded-full animate-pulse-glow" />
            <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 ring-4 ring-green-500/20">
              <CheckCircle className="w-24 h-24 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-black mb-4 animate-fade-in-up"
          >
            <span className="bg-gradient-to-r from-green-400 to-emerald-600 text-transparent bg-clip-text">
              Mission Launched!
            </span>{' '}
            🚀
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl text-white mb-3 font-bold"
          >
            Payment Successful. Validation is Underway.
          </motion.p>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-lg text-white/60 mb-12"
          >
            Your mission is being distributed to qualified respondents.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-12 max-w-2xl mx-auto"
          >
            <h3 className="text-lg font-bold text-white/80 mb-6 text-left">Mission Summary</h3>

            <div className="space-y-4 text-left">
              <div className="flex justify-between items-start py-3 border-b border-white/10">
                <span className="text-white/60 font-medium">Mission:</span>
                <span className="text-white font-bold text-right max-w-[60%]">{missionTitle}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 border-b border-white/10 gap-1">
                <span className="text-white/60 font-medium">Targeting:</span>
                <span className="text-white font-bold text-right sm:max-w-[60%] break-words">{location} ({respondentCount} Respondents)</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 border-b border-white/10 gap-1">
                <span className="text-white/60 font-medium">Est. Completion:</span>
                <span className="text-green-400 font-black text-right break-words">
                  {parseInt(respondentCount) > 500 ? '12-24 Hours' : '4-12 Hours'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 gap-1">
                <span className="text-white/60 font-medium">Total Paid:</span>
                <span className="text-white font-black text-xl text-right">${totalCost}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col items-center gap-6"
          >
            <button
              onClick={() => navigate('/results')}
              className="px-12 py-5 rounded-2xl bg-gradient-to-r from-neon-lime via-primary to-neon-lime bg-size-200 bg-pos-0 hover:bg-pos-100 text-gray-900 font-black text-xl transition-all duration-500 shadow-2xl shadow-primary/50 hover:shadow-neon-lime/60 hover:scale-105 flex items-center justify-center gap-3 min-w-[320px] animate-pulse-glow"
            >
              <BarChart3 className="w-6 h-6" />
              GO TO LIVE DASHBOARD
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="text-white/60 hover:text-white font-medium transition-colors flex items-center gap-2"
            >
              Back to My Missions
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      </div>
      </div>
    </DashboardLayout>
  );
};
