import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Clock,
  Download,
  Play,
  MessageSquare,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MissionData {
  id: string;
  visualization_type: string;
  status: string;
  context?: string;
  question?: string;
  respondent_count?: number;
  questions?: Question[];
}

interface Question {
  id: string;
  text: string;
  type: string;
  options: string[];
}

interface ResultsEngineProps {
  missionData: MissionData;
}

interface ChartData {
  questionId: string;
  questionText: string;
  type: string;
  data: any;
}

export const ResultsEngine = ({ missionData }: ResultsEngineProps) => {
  const [simulationMode, setSimulationMode] = useState(false);
  const [respondentCount, setRespondentCount] = useState(0);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const targetRespondents = missionData.respondent_count || 100;

  useEffect(() => {
    if (simulationMode) {
      const interval = setInterval(() => {
        setRespondentCount(prev => {
          if (prev >= targetRespondents) {
            clearInterval(interval);
            return targetRespondents;
          }
          return Math.min(prev + Math.floor(Math.random() * 3) + 1, targetRespondents);
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [simulationMode, targetRespondents]);

  useEffect(() => {
    if (simulationMode && missionData.questions) {
      const mockData = missionData.questions.map(q => ({
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        data: generateMockData(q.type, q.options)
      }));
      setChartData(mockData);
    }
  }, [simulationMode, missionData.questions]);

  const generateMockData = (type: string, options: string[]) => {
    switch (type) {
      case 'single':
      case 'single_choice':
        return options.map(opt => ({
          label: opt,
          value: Math.floor(Math.random() * 40) + 10,
          percentage: Math.floor(Math.random() * 40) + 10
        }));

      case 'multiple':
      case 'multiple_choice':
        return options.map(opt => ({
          label: opt,
          value: Math.floor(Math.random() * 60) + 20,
          percentage: Math.floor(Math.random() * 60) + 20
        }));

      case 'rating':
        return [1, 2, 3, 4, 5].map(rating => ({
          rating,
          count: rating >= 4 ? Math.floor(Math.random() * 30) + 20 : Math.floor(Math.random() * 15) + 5,
          percentage: rating >= 4 ? Math.floor(Math.random() * 30) + 20 : Math.floor(Math.random() * 15) + 5
        }));

      case 'text':
      case 'open_text':
        return [
          'Really love the concept! Would definitely use this daily.',
          'Pricing seems a bit high for what it offers.',
          'Great idea but needs more features to compete.',
          'The UI looks clean and modern. Would recommend.',
          'Not sure if this solves my problem yet.',
          'Interesting approach, will keep an eye on development.'
        ];

      default:
        return [];
    }
  };

  const handleSimulate = () => {
    setSimulationMode(true);
    setRespondentCount(0);
  };

  const handleExport = () => {
    toast.success('Downloading report...');
  };

  if (missionData.status === 'DRAFT') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl border border-white/10 p-12 text-center"
      >
        <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <h3 className="text-2xl font-black text-white mb-3">
          Waiting for Data...
        </h3>
        <p className="text-white/60 max-w-md mx-auto">
          Your mission is in draft mode. Configure targeting and launch to start collecting responses.
        </p>
      </motion.div>
    );
  }

  const hasData = respondentCount > 0;

  return (
    <div className="space-y-6">
      {/* Simulation Control (Dev Only) */}
      {!simulationMode && (
        <div className="flex justify-end">
          <button
            onClick={handleSimulate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-bold border border-blue-500/30"
          >
            <Play className="w-4 h-4" />
            Simulate Data (Demo)
          </button>
        </div>
      )}

      {/* Waiting Banner Over Skeletons */}
      <AnimatePresence>
        {!hasData && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-blue-400/30 border-t-blue-400 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-black text-white mb-1">
                  Waiting for first respondent...
                </h3>
                <p className="text-white/60 text-sm">
                  Your survey is live. Data will populate below as responses arrive (typically 15-30 mins for first response).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${hasData ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            <h2 className="text-2xl font-black text-white">
              {hasData ? 'Live & Collecting' : 'Awaiting Responses'}
            </h2>
          </div>
          {hasData && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-neon-lime/20 text-neon-lime rounded-lg hover:bg-neon-lime/30 transition-colors text-sm font-bold"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <div className="text-white/60 text-sm font-medium">Respondents</div>
            </div>
            <div className="text-3xl font-black text-white">
              {hasData ? (
                <motion.span
                  key={respondentCount}
                  initial={{ scale: 1.2, color: '#c4ff61' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.3 }}
                >
                  {respondentCount}
                </motion.span>
              ) : (
                '0'
              )}
              <span className="text-white/40 text-xl"> / {targetRespondents}</span>
            </div>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(respondentCount / targetRespondents) * 100}%` }}
                className="h-full bg-gradient-to-r from-primary to-neon-lime"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <div className="text-white/60 text-sm font-medium">Avg. Time</div>
            </div>
            <div className="text-3xl font-black text-white">
              {hasData ? '2:34' : '--'}
            </div>
            <div className="text-white/40 text-xs mt-1">
              {hasData ? 'Per response' : 'Calculating...'}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-green-400" />
              <div className="text-white/60 text-sm font-medium">Completion Rate</div>
            </div>
            <div className="text-3xl font-black text-white">
              {hasData ? '87%' : '--'}
            </div>
            <div className="text-white/40 text-xs mt-1">
              {hasData ? 'High quality' : 'No data yet'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {missionData.questions && missionData.questions.length > 0 ? (
          missionData.questions.map((question, index) => {
            const data = chartData.find(d => d.questionId === question.id);

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel rounded-2xl border border-white/10 p-6"
              >
                <div className="mb-4">
                  <div className="text-xs text-white/40 font-bold mb-2">QUESTION {index + 1}</div>
                  <h3 className="text-lg font-bold text-white">{question.text}</h3>
                </div>

                {!hasData ? (
                  <SkeletonChart type={question.type} />
                ) : (
                  <RenderChart type={question.type} data={data?.data || []} />
                )}
              </motion.div>
            );
          })
        ) : (
          <>
            {/* Default Skeleton Charts when no questions */}
            <SkeletonChartCard title="Question 1" type="single" />
            <SkeletonChartCard title="Question 2" type="rating" />
            <SkeletonChartCard title="Question 3" type="multiple" />
            <SkeletonChartCard title="Question 4" type="text" />
          </>
        )}
      </div>
    </div>
  );
};

const SkeletonChartCard = ({ title, type }: { title: string; type: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-panel rounded-2xl border border-white/10 p-6"
  >
    <div className="mb-4">
      <div className="h-4 w-24 bg-white/5 rounded animate-pulse mb-2" />
      <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
    </div>
    <SkeletonChart type={type} />
  </motion.div>
);

const SkeletonChart = ({ type }: { type: string }) => {
  if (type === 'single' || type === 'single_choice') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 200 200" className="opacity-20">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="30"
              className="animate-pulse"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <PieChart className="w-12 h-12 text-white/20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'rating') {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-4 bg-white/10 rounded animate-pulse" />
            <div className="flex-1 h-6 bg-white/5 rounded animate-pulse" />
            <div className="w-12 h-4 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'multiple' || type === 'multiple_choice') {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-20 h-4 bg-white/10 rounded animate-pulse" />
            <div className="flex-1 h-8 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'text' || type === 'open_text') {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded mb-2 w-full" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <BarChart3 className="w-12 h-12 text-white/20 animate-pulse" />
    </div>
  );
};

const RenderChart = ({ type, data }: { type: string; data: any }) => {
  if (type === 'single' || type === 'single_choice') {
    return <DonutChart data={data} />;
  }

  if (type === 'rating') {
    return <RatingHistogram data={data} />;
  }

  if (type === 'multiple' || type === 'multiple_choice') {
    return <HorizontalBarChart data={data} />;
  }

  if (type === 'text' || type === 'open_text') {
    return <VerbatimList data={data} />;
  }

  return <DonutChart data={data} />;
};

const DonutChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#8b5cf6', '#c4ff61', '#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

  let accumulatedPercentage = 0;

  return (
    <div className="py-6">
      <div className="relative w-48 h-48 mx-auto mb-10">
        <svg viewBox="0 0 200 200" className="transform -rotate-90">
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="30"
          />
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const circumference = 2 * Math.PI * 80;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercentage / 100) * circumference);

            accumulatedPercentage += percentage;

            return (
              <motion.circle
                key={index}
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="30"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-black text-white mb-2">{total}</div>
            <div className="text-white/60 text-sm font-medium">Total</div>
            <div className="text-white/40 text-xs">Responses</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3 border border-white/10"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-300 truncate">{item.label}</span>
            </div>
            <span className="text-base font-bold text-white flex-shrink-0">{item.percentage}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const RatingHistogram = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count));
  const average = data.reduce((sum, d) => sum + (d.rating * d.count), 0) / data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="py-4">
      <div className="flex items-center justify-center mb-6">
        <div className="text-center">
          <div className="text-5xl font-black text-white mb-1">
            {average.toFixed(1)}
          </div>
          <div className="text-white/60 text-sm">Average Rating</div>
          <div className="flex items-center gap-1 mt-2 justify-center">
            {[1, 2, 3, 4, 5].map(star => (
              <div
                key={star}
                className={`w-2 h-2 rounded-full ${star <= Math.round(average) ? 'bg-neon-lime' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {[...data].reverse().map((item, index) => (
          <motion.div
            key={item.rating}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 text-white/60 text-sm font-bold">{item.rating}</div>
            <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / maxCount) * 100}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                className={`h-full ${
                  item.rating >= 4
                    ? 'bg-gradient-to-r from-green-500 to-neon-lime'
                    : item.rating === 3
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
              />
            </div>
            <div className="w-16 text-white/60 text-sm text-right">
              {item.count} ({item.percentage}%)
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const HorizontalBarChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-4 py-4">
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm font-medium">{item.label}</span>
            <span className="text-white font-bold text-sm">{item.percentage}%</span>
          </div>
          <div className="h-10 bg-white/5 rounded-lg overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
              className="h-full bg-gradient-to-r from-primary to-blue-400 flex items-center justify-end px-3"
            >
              <span className="text-white text-xs font-bold">{item.value}</span>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const VerbatimList = ({ data }: { data: string[] }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h4 className="text-white font-bold">Recent Responses</h4>
      </div>
      {data.map((response, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <p className="text-white/80 text-sm leading-relaxed">{response}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-white/40">{Math.floor(Math.random() * 30) + 1} minutes ago</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
