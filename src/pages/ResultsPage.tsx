import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Presentation,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Clock,
  Rocket,
  Filter,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

type ExportFormat = 'pdf' | 'excel' | 'powerpoint';

interface ToastState {
  show: boolean;
  message: string;
  subtext: string;
  isGenerating: boolean;
}

interface QuestionResult {
  id: string;
  question: string;
  type: 'single_choice' | 'multi_select' | 'rating' | 'open_text';
  data: any[];
  aiInsight: string;
  sentiment?: number;
  averageScore?: number;
  verbatims?: string[];
}

interface FilterOption {
  label: string;
  value: string;
}

interface DemographicFilter {
  name: string;
  options: FilterOption[];
}

interface MissionData {
  name: string;
  targeting: {
    demographics: DemographicFilter[];
  };
  questions: QuestionResult[];
  totalRespondents: number;
  completedAt: string;
}

const MOCK_MISSION_DATA: MissionData = {
  name: "Product Market Fit Survey",
  completedAt: "2h ago",
  totalRespondents: 100,
  targeting: {
    demographics: [
      {
        name: 'Age',
        options: [
          { label: 'All Ages', value: 'all' },
          { label: '18-24', value: '18-24' },
          { label: '25-34', value: '25-34' },
          { label: '35-44', value: '35-44' },
          { label: '45+', value: '45+' }
        ]
      },
      {
        name: 'Gender',
        options: [
          { label: 'All Genders', value: 'all' },
          { label: 'Female', value: 'female' },
          { label: 'Male', value: 'male' },
          { label: 'Non-binary', value: 'non-binary' }
        ]
      },
      {
        name: 'Income',
        options: [
          { label: 'All Income Levels', value: 'all' },
          { label: '$0-50k', value: '0-50k' },
          { label: '$50k-100k', value: '50k-100k' },
          { label: '$100k-150k', value: '100k-150k' },
          { label: '$150k+', value: '150k+' }
        ]
      }
    ]
  },
  questions: [
    {
      id: '1',
      question: 'How would you rate your overall satisfaction with our product?',
      type: 'rating',
      averageScore: 4.2,
      data: [
        { rating: '1 Star', count: 5, percentage: 5 },
        { rating: '2 Stars', count: 8, percentage: 8 },
        { rating: '3 Stars', count: 15, percentage: 15 },
        { rating: '4 Stars', count: 42, percentage: 42 },
        { rating: '5 Stars', count: 30, percentage: 30 }
      ],
      aiInsight: '72% of users rated 4-5 stars, indicating strong product satisfaction. However, 13% gave low ratings (1-2 stars), suggesting room for improvement in user experience.'
    },
    {
      id: '2',
      question: 'Which pricing tier would you choose?',
      type: 'single_choice',
      data: [
        { name: 'Free', value: 25, percentage: 25, color: '#3b82f6' },
        { name: 'Starter ($19/mo)', value: 35, percentage: 35, color: '#8b5cf6' },
        { name: 'Pro ($49/mo)', value: 30, percentage: 30, color: '#ec4899' },
        { name: 'Enterprise ($99/mo)', value: 10, percentage: 10, color: '#14b8a6' }
      ],
      aiInsight: 'Starter tier ($19/mo) is most popular at 35%, suggesting this price point aligns well with perceived value. Only 10% chose Enterprise, indicating potential price resistance at higher tiers.'
    },
    {
      id: '3',
      question: 'Which features are most important to you? (Select all that apply)',
      type: 'multi_select',
      data: [
        { feature: 'AI-Powered Insights', count: 78, percentage: 78 },
        { feature: 'Real-time Analytics', count: 65, percentage: 65 },
        { feature: 'Custom Dashboards', count: 52, percentage: 52 },
        { feature: 'Mobile App', count: 45, percentage: 45 },
        { feature: 'API Access', count: 38, percentage: 38 },
        { feature: 'White Label', count: 22, percentage: 22 }
      ],
      aiInsight: 'AI-Powered Insights (78%) and Real-time Analytics (65%) are clear priority features. White Label support (22%) has lowest demand, suggesting it may not be worth immediate development.'
    },
    {
      id: '4',
      question: 'What do you like most about our product?',
      type: 'open_text',
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
      sentiment: 85,
      verbatims: [
        "The interface is incredibly intuitive and easy to navigate. I was up and running in minutes!",
        "Fast performance is what sets this apart from competitors. No lag at all.",
        "Love the clean design and how everything just works without complexity.",
        "It's powerful yet simple - exactly what I needed for my business.",
        "Reliable service with excellent uptime. Haven't had a single issue.",
        "The AI features are innovative and actually useful, not just a gimmick.",
        "Great value for money. Much more affordable than other enterprise solutions.",
        "Customer support is responsive and helpful whenever I have questions.",
        "The mobile app makes it easy to stay connected on the go.",
        "Regular updates show the team is committed to continuous improvement.",
        "Integration with our existing tools was seamless and straightforward.",
        "The analytics dashboard gives us insights we never had before.",
        "Our team adopted it quickly because the learning curve is so gentle.",
        "The customization options let us tailor it to our specific workflow.",
        "Security features give us confidence in protecting our data."
      ],
      aiInsight: 'Top keywords "intuitive" and "fast" indicate users value ease-of-use and performance. Positive sentiment score of 85% suggests strong brand affinity and user satisfaction.'
    }
  ]
};

const COLORS = [
  '#8B5CF6',
  '#10B981',
  '#F43F5E',
  '#F59E0B',
  '#3B82F6',
  '#6366F1'
];

export const ResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [missionData, setMissionData] = useState<MissionData>(MOCK_MISSION_DATA);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [filteredRespondentCount, setFilteredRespondentCount] = useState(missionData.totalRespondents);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionResult[]>(MOCK_MISSION_DATA.questions);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    subtext: '',
    isGenerating: false
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    window.scrollTo(0, 0);

    const state = location.state as { missionData?: any } | null;
    if (state?.missionData?.results) {
      const loadedMission = {
        name: state.missionData.context || "Your Validation Mission",
        completedAt: state.missionData.completedAt || "Just now",
        totalRespondents: state.missionData.respondent_count || 100,
        targeting: {
          demographics: MOCK_MISSION_DATA.targeting.demographics
        },
        questions: state.missionData.results
      };
      setMissionData(loadedMission);
      setFilteredRespondentCount(loadedMission.totalRespondents);
      setFilteredQuestions(loadedMission.questions);
    }

    const initialFilters: Record<string, string> = {};
    missionData.targeting.demographics.forEach(demo => {
      initialFilters[demo.name] = 'all';
    });
    setSelectedFilters(initialFilters);
  }, [location.state]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }

      if (openFilterDropdown) {
        const filterRef = filterRefs.current[openFilterDropdown];
        if (filterRef && !filterRef.contains(event.target as Node)) {
          setOpenFilterDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openFilterDropdown]);

  const getFormatLabel = (format: ExportFormat): string => {
    switch (format) {
      case 'pdf':
        return 'PDF';
      case 'excel':
        return 'Excel';
      case 'powerpoint':
        return 'PowerPoint';
    }
  };

  const handleExport = (format: ExportFormat) => {
    setIsDropdownOpen(false);

    if (format === 'excel') {
      // Generate CSV data
      let csvContent = 'Question,Question Type,Response,Count,Percentage,Sentiment\n';

      filteredQuestions.forEach((question) => {
        const questionText = `"${question.question.replace(/"/g, '""')}"`;
        const questionType = question.type;

        if (question.type === 'single_choice' || question.type === 'multi_select') {
          question.data.forEach((item) => {
            const answer = `"${(item.name || item.feature || '').replace(/"/g, '""')}"`;
            const count = item.count || item.value || 0;
            const percentage = item.percentage || 0;
            csvContent += `${questionText},${questionType},${answer},${count},${percentage}%,\n`;
          });
        } else if (question.type === 'rating') {
          question.data.forEach((item) => {
            const answer = `"${item.rating.replace(/"/g, '""')}"`;
            const count = item.count || 0;
            const percentage = item.percentage || 0;
            csvContent += `${questionText},${questionType},${answer},${count},${percentage}%,\n`;
          });
        } else if (question.type === 'open_text') {
          const sentiment = question.sentiment || 0;
          csvContent += `${questionText},${questionType},"See verbatims below",${filteredRespondentCount},,${sentiment}%\n`;

          if (question.verbatims && question.verbatims.length > 0) {
            question.verbatims.forEach((verbatim, index) => {
              const cleanVerbatim = `"${verbatim.replace(/"/g, '""')}"`;
              csvContent += `${questionText},verbatim,${cleanVerbatim},,,\n`;
            });
          }
        }
      });

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', 'vett_mission_results.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report downloaded successfully');
    } else {
      // For PDF and PowerPoint, show the generating toast
      setToast({
        show: true,
        message: `Generating ${getFormatLabel(format)}...`,
        subtext: 'This may take a moment.',
        isGenerating: true
      });

      setTimeout(() => {
        setToast({
          show: true,
          message: `${missionData.name}.${format} downloaded successfully.`,
          subtext: 'Your export is ready',
          isGenerating: false
        });

        setTimeout(() => {
          setToast({ show: false, message: '', subtext: '', isGenerating: false });
        }, 3000);
      }, 2000);
    }
  };

  const applyFilterToData = (filters: Record<string, string>) => {
    const activeFilters = Object.entries(filters).filter(([_, v]) => v !== 'all');
    const activeCount = activeFilters.length;

    if (activeCount === 0) {
      setFilteredQuestions(MOCK_MISSION_DATA.questions);
      setFilteredRespondentCount(missionData.totalRespondents);
      return;
    }

    const seed = activeFilters.map(([k, v]) => `${k}:${v}`).join('|');
    const variance = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;

    const newTotal = Math.floor(missionData.totalRespondents / (activeCount + 1)) * (activeCount + 1);
    setFilteredRespondentCount(Math.max(newTotal, 25));

    const filterLabel = activeFilters.map(([k, v]) => `${k} ${v}`).join(', ');

    const newQuestions = MOCK_MISSION_DATA.questions.map((q) => {
      if (q.type === 'single_choice') {
        const shuffledData = q.data.map((item, idx) => {
          const shift = (variance + idx * 13) % 30 - 15;
          let newValue = Math.max(5, item.value + shift);
          const { color, ...itemWithoutColor } = item;
          return { ...itemWithoutColor, value: newValue, percentage: newValue };
        });

        const total = shuffledData.reduce((sum, item) => sum + item.value, 0);
        const normalizedData = shuffledData.map(item => ({
          ...item,
          value: Math.round((item.value / total) * 100),
          percentage: Math.round((item.value / total) * 100)
        }));

        const topChoice = normalizedData.reduce((max, item) => item.value > max.value ? item : max);

        return {
          ...q,
          data: normalizedData,
          aiInsight: `💡 [${filterLabel} Segment]: '${topChoice.name}' leads at ${topChoice.percentage}%, showing distinct preferences in this demographic compared to the overall population.`
        };
      }

      if (q.type === 'multi_select') {
        const shuffledData = q.data.map((item, idx) => {
          const shift = (variance + idx * 17) % 25 - 12;
          const newCount = Math.max(10, item.count + shift);
          const newPercentage = Math.round((newCount / newTotal) * 100);
          return { ...item, count: newCount, percentage: newPercentage };
        });

        const sortedData = [...shuffledData].sort((a, b) => b.count - a.count);
        const topFeature = sortedData[0];

        return {
          ...q,
          data: shuffledData,
          aiInsight: `💡 [${filterLabel} Segment]: '${topFeature.feature}' is the top priority (${topFeature.percentage}%), indicating this demographic has unique feature preferences.`
        };
      }

      if (q.type === 'rating') {
        const shuffledData = q.data.map((item, idx) => {
          const shift = (variance + idx * 11) % 10 - 5;
          const newCount = Math.max(2, item.count + shift);
          const newPercentage = Math.round((newCount / newTotal) * 100);
          return { ...item, count: newCount, percentage: newPercentage };
        });

        const weightedSum = shuffledData.reduce((sum, item, idx) => sum + (idx + 1) * item.count, 0);
        const totalCount = shuffledData.reduce((sum, item) => sum + item.count, 0);
        const newAverage = weightedSum / totalCount;

        const highRatings = shuffledData.slice(-2).reduce((sum, item) => sum + item.percentage, 0);

        return {
          ...q,
          data: shuffledData,
          averageScore: newAverage,
          aiInsight: `💡 [${filterLabel} Segment]: Average score of ${newAverage.toFixed(1)}/5.0 with ${highRatings}% rating 4-5 stars, showing ${newAverage >= 4.0 ? 'high' : 'moderate'} satisfaction in this segment.`
        };
      }

      if (q.type === 'open_text') {
        return {
          ...q,
          aiInsight: `💡 [${filterLabel} Segment]: Sentiment analysis shows this demographic emphasizes similar keywords, with slight variations in priority reflecting their unique perspective.`
        };
      }

      return q;
    });

    setFilteredQuestions(newQuestions);
  };

  const handleFilterChange = (filterName: string, value: string) => {
    const newFilters = { ...selectedFilters, [filterName]: value };
    setSelectedFilters(newFilters);
    setOpenFilterDropdown(null);
    setIsFilterLoading(true);

    setTimeout(() => {
      applyFilterToData(newFilters);
      setIsFilterLoading(false);
    }, 500);
  };

  const getActiveFilterCount = () => {
    return Object.values(selectedFilters).filter(v => v !== 'all').length;
  };

  const clearAllFilters = () => {
    const clearedFilters: Record<string, string> = {};
    missionData.targeting.demographics.forEach(demo => {
      clearedFilters[demo.name] = 'all';
    });
    setSelectedFilters(clearedFilters);
    setIsFilterLoading(true);
    setTimeout(() => {
      applyFilterToData(clearedFilters);
      setIsFilterLoading(false);
    }, 500);
  };

  const exportOptions = [
    {
      format: 'pdf' as ExportFormat,
      icon: FileText,
      label: 'PDF Report',
      subtext: 'Charts & Summary'
    },
    {
      format: 'excel' as ExportFormat,
      icon: FileSpreadsheet,
      label: 'Excel / CSV',
      subtext: 'Raw Respondent Data'
    },
    {
      format: 'powerpoint' as ExportFormat,
      icon: Presentation,
      label: 'PowerPoint',
      subtext: 'Presentation Slides'
    }
  ];

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[#1e293b]/90 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-3">
          <p className="text-white font-bold text-sm mb-1">{data.name}</p>
          <p className="text-primary font-bold text-lg">{data.value}%</p>
        </div>
      );
    }
    return null;
  };

  const renderChart = (result: QuestionResult) => {
    switch (result.type) {
      case 'single_choice':
        return (
          <div className="space-y-6">
            <div className="flex justify-center items-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={result.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                    labelLine={false}
                  >
                    {result.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend content={() => null} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 w-full">
              {result.data.map((entry, index) => (
                <div key={index} className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-300 truncate">{entry.name}</span>
                  </div>
                  <span className="text-base font-bold text-white flex-shrink-0">{entry.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'multi_select':
        const maxCount = Math.max(...result.data.map(item => item.count));
        return (
          <ResponsiveContainer width="100%" height={Math.max(300, result.data.length * 50)}>
            <BarChart data={result.data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#fff" tick={{ fill: '#fff' }} />
              <YAxis dataKey="feature" type="category" stroke="#fff" tick={{ fill: '#fff' }} width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
                itemStyle={{
                  color: '#ffffff'
                }}
                labelStyle={{
                  color: '#ffffff',
                  fontWeight: 'bold'
                }}
                formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.percentage}%)`, 'Responses']}
              />
              <Legend formatter={() => 'Number of Responses'} wrapperStyle={{ color: '#ffffff' }} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[0, 8, 8, 0]}>
                {result.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count === maxCount ? '#10B981' : '#8B5CF6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'rating':
        return (
          <div className="space-y-6">
            {result.averageScore && (
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-6xl font-black text-white mb-2">{result.averageScore.toFixed(1)}</div>
                  <div className="text-white/60 text-sm font-medium">Average Score</div>
                  <div className="text-white/40 text-xs">out of 5.0</div>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="rating" stroke="#fff" tick={{ fill: '#fff' }} />
                <YAxis stroke="#fff" tick={{ fill: '#fff' }} label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#fff' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  itemStyle={{
                    color: '#ffffff'
                  }}
                  labelStyle={{
                    color: '#ffffff',
                    fontWeight: 'bold'
                  }}
                  formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.percentage}%)`, 'Responses']}
                />
                <Legend formatter={() => 'Number of Responses'} wrapperStyle={{ color: '#ffffff' }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'open_text':
        return (
          <div className="space-y-6">
            <div className="py-8">
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                {result.data.map((word, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white font-medium"
                    style={{
                      fontSize: `${Math.max(12, Math.min(word.size / 2, 24))}px`
                    }}
                  >
                    {word.word}
                  </span>
                ))}
              </div>
              {result.sentiment !== undefined && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm font-medium">Sentiment Score</span>
                    <span className="text-white font-bold text-lg">{result.sentiment}%</span>
                  </div>
                  <div className="relative">
                    <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          result.sentiment >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          result.sentiment >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${result.sentiment}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-red-400 text-xs font-medium">Negative</span>
                      <span className="text-green-400 text-xs font-medium">Positive</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {result.verbatims && result.verbatims.length > 0 && (
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <h4 className="text-lg font-bold text-white">Verbatims ({result.verbatims.length} responses)</h4>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {result.verbatims.map((verbatim, index) => (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed flex-1">{verbatim}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const hasNoResults = filteredRespondentCount === 0;
  const hasActiveFilters = getActiveFilterCount() > 0;

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900">

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Missions
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
                {missionData.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {filteredRespondentCount} {hasActiveFilters && `of ${missionData.totalRespondents}`} Responses
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Completed {missionData.completedAt}
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Mission Complete
                </span>
              </div>
            </div>
          </div>

          {missionData.targeting.demographics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-50 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl mb-8"
            >
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:flex-wrap flex-1">
                  <div className="flex items-center gap-2 text-white/60">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filter by:</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:flex-wrap gap-3 w-full md:w-auto md:flex-1">
                    {missionData.targeting.demographics.map((filter) => (
                      <div
                        key={filter.name}
                        className="relative w-full md:w-auto"
                        ref={(el) => { filterRefs.current[filter.name] = el; }}
                      >
                        <button
                          onClick={() => setOpenFilterDropdown(openFilterDropdown === filter.name ? null : filter.name)}
                          className={`w-full md:w-auto flex items-center justify-between gap-2 px-4 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedFilters[filter.name] !== 'all'
                              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                              : 'bg-white/5 border border-white/20 text-white hover:bg-white/10 hover:border-white/30'
                          }`}
                        >
                          <span>
                            {filter.name}: {filter.options.find(opt => opt.value === selectedFilters[filter.name])?.label.replace(`All ${filter.name}s`, 'All').replace(`All ${filter.name} Levels`, 'All') || 'All'}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openFilterDropdown === filter.name ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {openFilterDropdown === filter.name && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute top-full left-0 right-0 md:right-auto mt-2 w-full md:w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[60]"
                            >
                              {filter.options.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleFilterChange(filter.name, option.value)}
                                  className={`w-full px-4 py-3 text-left text-sm transition-all duration-200 ${
                                    selectedFilters[filter.name] === option.value
                                      ? 'bg-blue-500/20 text-blue-300 font-bold'
                                      : 'text-white hover:bg-gray-700/50'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium underline text-left w-full md:w-auto"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative w-full md:w-auto" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 md:py-2 bg-white/5 border border-white/20 rounded-lg text-sm font-bold text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 left-0 md:left-auto mt-2 w-full md:w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[60]"
                      >
                        {exportOptions.map((option, index) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.format}
                              onClick={() => handleExport(option.format)}
                              className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-700/50 transition-all duration-200 ${
                                index !== exportOptions.length - 1 ? 'border-b border-gray-700/50' : ''
                              }`}
                            >
                              <div className="flex items-center justify-center w-10 h-10 bg-white/5 rounded-lg">
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-white font-bold text-sm">{option.label}</div>
                                <div className="text-white/60 text-xs">{option.subtext}</div>
                              </div>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {isFilterLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white/60 text-lg">Recalculating data...</p>
                </div>
              </motion.div>
            ) : hasNoResults ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-xl text-center"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Data for This Segment</h3>
                <p className="text-white/60 mb-6">No respondents match the selected filter criteria. Try adjusting your filters to see results from different demographics.</p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-bold transition-colors"
                >
                  Clear All Filters
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative z-0 mb-8"
                >
                  <div className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-2xl p-8 backdrop-blur-xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                          <Sparkles className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">Executive Summary</h2>
                      </div>

                      <p className="text-white/80 text-lg leading-relaxed">
                        The data indicates <span className="text-blue-400 font-bold">strong product-market fit</span> with 72% of users rating satisfaction at 4-5 stars.
                        However, price sensitivity is evident with only 10% selecting the Enterprise tier, suggesting the market gravitates toward mid-tier pricing.
                        The most valued features are <span className="text-purple-400 font-bold">AI-Powered Insights (78%)</span> and <span className="text-purple-400 font-bold">Real-time Analytics (65%)</span>,
                        indicating users prioritize intelligence and speed over customization options.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                >
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <div className="text-white/60 text-sm font-medium">Satisfaction Rate</div>
                    </div>
                    <div className="text-4xl font-black text-white mb-1">72%</div>
                    <div className="text-white/40 text-xs">Rated 4-5 stars</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      <div className="text-white/60 text-sm font-medium">Price Sweet Spot</div>
                    </div>
                    <div className="text-4xl font-black text-white mb-1">$19-49</div>
                    <div className="text-white/40 text-xs">65% chose these tiers</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <div className="text-white/60 text-sm font-medium">Top Feature Request</div>
                    </div>
                    <div className="text-4xl font-black text-white mb-1">AI</div>
                    <div className="text-white/40 text-xs">78% want AI insights</div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-8 mb-12"
                >
                  {filteredQuestions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                    >
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-white flex-1">{question.question}</h3>
                          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                            {question.type === 'single_choice' && 'Single Choice'}
                            {question.type === 'multi_select' && 'Multi-Select'}
                            {question.type === 'rating' && 'Rating Scale'}
                            {question.type === 'open_text' && 'Open Text'}
                          </span>
                        </div>
                        <div className="text-white/40 text-sm">{filteredRespondentCount} responses</div>
                      </div>

                      {renderChart(question)}

                      <div className="mt-6 bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20 flex-shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-purple-300 text-xs font-bold uppercase tracking-wide mb-1">AI Insight</div>
                            <p className="text-white/90 text-sm leading-relaxed">{question.aiInsight}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-8"
                >
                  <div className="relative bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/30 rounded-2xl p-8 backdrop-blur-xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                          <Rocket className="w-6 h-6 text-green-400" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">Recommended Next Step</h2>
                      </div>

                      <p className="text-white/80 text-base leading-relaxed mb-6">
                        Since users showed <span className="text-green-400 font-bold">high interest in AI features (78%)</span> but
                        only <span className="text-yellow-400 font-bold">10% selected Enterprise pricing</span>, we recommend launching a
                        targeted Pricing Sensitivity Mission to identify the optimal price point that balances AI feature access with market demand.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => navigate('/mission-control')}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                        >
                          <Rocket className="w-5 h-5" />
                          Initialize Pricing Mission
                        </button>

                        <button
                          onClick={() => navigate('/mission-control')}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-bold hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                        >
                          <Sparkles className="w-5 h-5" />
                          Validate AI Features
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <div className={`${
              toast.isGenerating
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 shadow-blue-500/20'
                : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 shadow-green-500/20'
            } border rounded-xl p-4 backdrop-blur-xl shadow-lg flex items-center gap-3 min-w-[300px]`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                toast.isGenerating ? 'bg-blue-500/20' : 'bg-green-500/20'
              }`}>
                {toast.isGenerating ? (
                  <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">{toast.message}</div>
                <div className="text-white/60 text-xs">{toast.subtext}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};
