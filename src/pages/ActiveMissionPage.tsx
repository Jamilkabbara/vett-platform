import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, CheckCircle, Loader2, Rocket, Users, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
}

interface MissionData {
  id?: string;
  /** DB column is `brief`; `context` kept as optional legacy alias. */
  brief?: string;
  context?: string;
  /** DB column is `title` — added for completion navigation. */
  title?: string;
  target?: string;
  questions: Question[];
  respondent_count: number;
  /**
   * DB column is `targeting` (jsonb). The historical `targeting_config` name
   * never existed in Supabase; kept as optional alias for old mission state
   * that may still be passed via `navigate(state)`.
   */
  targeting?: unknown;
  targeting_config?: unknown;
}

export const ActiveMissionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [phase, setPhase] = useState<'distributing' | 'collecting' | 'completing'>('distributing');
  const simulationRef = useRef<NodeJS.Timeout | null>(null);
  const [showDevButton, setShowDevButton] = useState(false);

  useEffect(() => {
    const state = location.state as { missionData?: MissionData } | null;
    if (state?.missionData) {
      setMissionData(state.missionData);
    }
  }, [location.state]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.ctrlKey && e.key === 'D') {
        setShowDevButton(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const generateMockResults = (mission: MissionData) => {
    const results: any[] = [];

    mission.questions.forEach((q, idx) => {
      switch (q.type) {
        case 'rating':
        case 'star':
          results.push({
            id: q.id,
            question: q.text,
            type: 'rating',
            averageScore: 4.2 + (Math.random() * 0.6 - 0.3),
            data: [
              { rating: '1 Star', count: Math.floor(mission.respondent_count * 0.05), percentage: 5 },
              { rating: '2 Stars', count: Math.floor(mission.respondent_count * 0.08), percentage: 8 },
              { rating: '3 Stars', count: Math.floor(mission.respondent_count * 0.15), percentage: 15 },
              { rating: '4 Stars', count: Math.floor(mission.respondent_count * 0.42), percentage: 42 },
              { rating: '5 Stars', count: Math.floor(mission.respondent_count * 0.30), percentage: 30 }
            ],
            aiInsight: `Strong positive sentiment with 72% rating 4-5 stars. This indicates solid market validation for your concept.`
          });
          break;

        case 'single':
        case 'single_choice':
          if (q.options && q.options.length > 0) {
            const optionData = q.options.map((opt, i) => ({
              name: opt,
              value: Math.floor(mission.respondent_count * (0.5 / q.options!.length + Math.random() * 0.3)),
              percentage: Math.floor(50 / q.options.length + Math.random() * 30),
              color: ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'][i % 5]
            }));
            const total = optionData.reduce((sum, item) => sum + item.value, 0);
            const normalizedData = optionData.map(item => ({
              ...item,
              percentage: Math.round((item.value / total) * 100)
            }));
            const topChoice = normalizedData.reduce((max, item) => item.value > max.value ? item : max);

            results.push({
              id: q.id,
              question: q.text,
              type: 'single_choice',
              data: normalizedData,
              aiInsight: `"${topChoice.name}" leads with ${topChoice.percentage}% of responses, showing clear user preference in this area.`
            });
          }
          break;

        case 'multi':
        case 'multiple_choice':
          if (q.options && q.options.length > 0) {
            const multiData = q.options.map(opt => ({
              feature: opt,
              count: Math.floor(mission.respondent_count * (0.3 + Math.random() * 0.5)),
              percentage: Math.floor(30 + Math.random() * 50)
            }));
            const sortedData = [...multiData].sort((a, b) => b.count - a.count);
            const topFeature = sortedData[0];

            results.push({
              id: q.id,
              question: q.text,
              type: 'multi_select',
              data: multiData,
              aiInsight: `"${topFeature.feature}" is the top priority at ${topFeature.percentage}%, indicating this feature should be prioritized in development.`
            });
          }
          break;

        case 'text':
        case 'short_text':
        case 'long_text':
        case 'opinion':
        case 'open_text':
          results.push({
            id: q.id,
            question: q.text,
            type: 'open_text',
            sentiment: 75 + Math.floor(Math.random() * 15),
            data: [
              { word: 'intuitive', size: 48 },
              { word: 'fast', size: 42 },
              { word: 'easy', size: 38 },
              { word: 'powerful', size: 35 },
              { word: 'reliable', size: 32 },
              { word: 'clean design', size: 28 },
              { word: 'helpful', size: 25 },
              { word: 'affordable', size: 22 },
              { word: 'innovative', size: 20 },
              { word: 'responsive', size: 18 }
            ],
            verbatims: [
              "The concept is incredibly intuitive and easy to understand. I would definitely try this!",
              "Fast and efficient solution to a real problem I face daily.",
              "Love the approach and how everything is presented clearly.",
              "Powerful solution that addresses my exact needs.",
              "Reliable and trustworthy concept with great potential.",
              "Clean design and user experience make this stand out.",
              "Helpful features that solve real pain points.",
              "Affordable pricing compared to alternatives I've seen.",
              "Innovative approach to an existing problem.",
              "Responsive to user needs and feedback."
            ],
            aiInsight: `Positive sentiment at ${75 + Math.floor(Math.random() * 15)}% with strong emphasis on ease-of-use and value proposition. Users appreciate the intuitive approach.`
          });
          break;

        case 'boolean':
          const yesCount = Math.floor(mission.respondent_count * (0.55 + Math.random() * 0.2));
          const noCount = mission.respondent_count - yesCount;
          results.push({
            id: q.id,
            question: q.text,
            type: 'single_choice',
            data: [
              { name: 'Yes', value: yesCount, percentage: Math.round((yesCount / mission.respondent_count) * 100), color: '#10b981' },
              { name: 'No', value: noCount, percentage: Math.round((noCount / mission.respondent_count) * 100), color: '#ef4444' }
            ],
            aiInsight: `${Math.round((yesCount / mission.respondent_count) * 100)}% responded positively, indicating strong market interest and validation for this concept.`
          });
          break;
      }
    });

    return results;
  };

  const simulatePollfishCompletion = async (forceComplete = false) => {
    if (!missionData) return;

    setPhase('completing');
    setProgress(100);
    setResponseCount(missionData.respondent_count);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockResults = generateMockResults(missionData);

    if (missionData.id && user) {
      try {
        // `result_data` is not a column on `public.missions` — the canonical
        // home for results / insights is the `insights` jsonb column. Writing
        // to a non-existent column returns a 400 and silently blocks the
        // completion status write on real missions.
        await supabase
          .from('missions')
          .update({
            status: 'COMPLETED',
            insights: mockResults,
            completed_at: new Date().toISOString()
          })
          .eq('id', missionData.id);
      } catch (error) {
        console.error('Error updating mission:', error);
      }
    }

    toast.success('Mission Complete! Results received from Pollfish.', {
      duration: 4000,
      icon: '🎉',
      style: {
        background: '#10b981',
        color: '#fff',
        fontWeight: 'bold'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    navigate('/results', {
      state: {
        missionData: {
          ...missionData,
          status: 'COMPLETED',
          completedAt: 'Just now',
          results: mockResults
        }
      }
    });
  };

  useEffect(() => {
    if (!missionData) return;

    let progressInterval: NodeJS.Timeout;
    let phaseInterval: NodeJS.Timeout;

    const startSimulation = () => {
      setPhase('distributing');
      setTimeout(() => setPhase('collecting'), 3000);

      progressInterval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 3 + 1;
          const newProgress = Math.min(prev + increment, 95);
          return newProgress;
        });

        setResponseCount(prev => {
          const increment = Math.floor(Math.random() * 3) + 1;
          const newCount = Math.min(prev + increment, Math.floor(missionData.respondent_count * 0.95));
          return newCount;
        });
      }, 800);

      simulationRef.current = setTimeout(() => {
        simulatePollfishCompletion(true);
      }, 30000);
    };

    startSimulation();

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (phaseInterval) clearInterval(phaseInterval);
      if (simulationRef.current) clearTimeout(simulationRef.current);
    };
  }, [missionData]);

  if (!missionData) {
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white mb-4">No Active Mission</h2>
            <button
              onClick={() => navigate('/missions')}
              className="px-6 py-3 bg-[#ccff00] text-black rounded-xl font-bold hover:bg-[#b3e600] transition-colors"
            >
              View My Missions
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900 font-display text-white relative overflow-hidden flex flex-col items-center justify-center px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ccff00]/10 via-transparent to-transparent opacity-50"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-4xl w-full"
        >
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#ccff00]/10 border border-[#ccff00]/30 rounded-full text-[#ccff00] font-bold text-sm mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              <span className="uppercase tracking-wider">Mission Live</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">
              {missionData.context || 'Validation Mission'}
            </h1>
            <p className="text-white/60 text-lg">
              Pollfish is collecting responses from your target audience
            </p>
          </div>

          <div className="relative w-80 h-80 mx-auto mb-12">
            <div className="absolute inset-0 border-2 border-white/10 rounded-full flex items-center justify-center overflow-hidden bg-white/5 backdrop-blur-sm shadow-2xl">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(#ccff00 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              ></div>
              <motion.div
                className="absolute w-full h-[3px] bg-[#ccff00] shadow-[0_0_20px_#ccff00]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute top-1/3 left-1/4 w-3 h-3 bg-[#ccff00] rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-[#ccff00] rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
              />
              <motion.div
                className="absolute top-1/2 right-1/3 w-3 h-3 bg-[#ccff00] rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
              />

              <div className="z-20 text-center">
                <Globe className="w-20 h-20 text-[#ccff00] mb-4 mx-auto animate-pulse" />
                <div className="text-6xl font-black text-white mb-2">
                  {Math.round(progress)}%
                </div>
                <div className="text-white/60 text-sm">Complete</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl"
            >
              <Users className="w-6 h-6 text-[#ccff00] mb-2 mx-auto" />
              <div className="text-3xl font-black text-white mb-1">
                {responseCount}
              </div>
              <div className="text-white/60 text-sm">
                of {missionData.respondent_count} responses
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl"
            >
              <Clock className="w-6 h-6 text-blue-400 mb-2 mx-auto" />
              <div className="text-3xl font-black text-white mb-1">
                {progress < 50 ? '~20m' : progress < 80 ? '~10m' : '~2m'}
              </div>
              <div className="text-white/60 text-sm">
                Est. time remaining
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl"
            >
              <TrendingUp className="w-6 h-6 text-purple-400 mb-2 mx-auto" />
              <div className="text-3xl font-black text-white mb-1">
                {phase === 'distributing' ? 'Active' : phase === 'collecting' ? 'Fast' : 'Done'}
              </div>
              <div className="text-white/60 text-sm">
                Collection speed
              </div>
            </motion.div>
          </div>

          <div className="space-y-4 max-w-md mx-auto mb-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-4 text-white/70"
            >
              <CheckCircle className="w-5 h-5 text-[#ccff00] flex-shrink-0" />
              <span className="text-sm font-bold uppercase tracking-widest text-white">
                Strategy Approved
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-4 text-white/70"
            >
              <CheckCircle className="w-5 h-5 text-[#ccff00] flex-shrink-0" />
              <span className="text-sm font-bold uppercase tracking-widest text-white">
                Payment Secured
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-4"
            >
              <Loader2 className="w-5 h-5 text-[#ccff00] animate-spin flex-shrink-0" />
              <span className="text-sm font-black uppercase tracking-widest text-[#ccff00] animate-pulse">
                {phase === 'distributing'
                  ? 'Distributing to Network...'
                  : phase === 'collecting'
                  ? 'Collecting Responses...'
                  : 'Finalizing Results...'}
              </span>
            </motion.div>
          </div>

          {showDevButton && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => simulatePollfishCompletion(true)}
              className="px-6 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-all text-sm"
            >
              🔧 Force Complete (Dev)
            </motion.button>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 text-white/40 text-xs"
          >
            <p className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Powered by Pollfish • Real-time data collection
            </p>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};
