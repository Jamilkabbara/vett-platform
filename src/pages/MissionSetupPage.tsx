import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Target, ArrowRight, Rocket, Scale, Megaphone, Star, Brain, DollarSign, Map, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/layout/AuthModal';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { generateSurvey } from '../services/aiService';
import { api } from '../lib/apiClient';

const MISSION_GOALS = [
  { id: 'validate', label: 'Validate Product', icon: Rocket, emoji: '🚀' },
  { id: 'compare', label: 'Compare Concepts', icon: Scale, emoji: '⚖️' },
  { id: 'marketing', label: 'Test Marketing/Ads', icon: Megaphone, emoji: '📢' },
  { id: 'satisfaction', label: 'Customer Satisfaction', icon: Star, emoji: '⭐' },
  { id: 'pricing', label: 'Pricing Research', icon: DollarSign, emoji: '💰' },
  { id: 'roadmap', label: 'Feature Roadmap', icon: Map, emoji: '🗺️' },
  { id: 'research', label: 'General Research', icon: Brain, emoji: '🧠' },
  { id: 'competitor', label: 'Competitor Analysis', icon: Search, emoji: '🔍' },
];

const INSPIRATION_EXAMPLES = [
  {
    emoji: '🍕',
    label: 'Consumer Product',
    text: 'I want to validate a meal prep subscription box ($45/week) for busy parents. I need to know if they prefer organic ingredients or time-saving convenience, and what price point makes them switch from grocery shopping.'
  },
  {
    emoji: '📱',
    label: 'SaaS App',
    text: 'I want to test a project management tool for remote teams ($15/user/month). I need to understand if they value real-time collaboration features more than detailed reporting, and if they would switch from their current solution.'
  },
  {
    emoji: '☕',
    label: 'Local Service',
    text: 'I want to validate a mobile car detailing service in suburban neighborhoods ($120/visit). I need to know if customers care more about eco-friendly products or same-day booking, and how often they would use the service.'
  },
  {
    emoji: '🏢',
    label: 'B2B Enterprise',
    text: 'I want to validate a cybersecurity compliance tool for mid-sized banks ($500/month per location). I need to understand if they prioritize automated reporting or real-time threat detection, and what integration capabilities are deal-breakers for their IT teams.'
  },
  {
    emoji: '🎥',
    label: 'Content/Media',
    text: 'I want to test titles and thumbnails for a new YouTube channel about personal finance for millennials. I need to know which content angles resonate most: debt payoff stories, investment basics, or side hustle ideas, and what tone makes them click.'
  }
];

const getPlaceholderForGoal = (goalId: string) => {
  switch (goalId) {
    case 'validate':
      return 'e.g., I want to validate a subscription service for premium coffee beans ($25/mo) targeting remote workers. I need to know if they care more about Fair Trade sourcing or Fast Delivery.';
    case 'compare':
      return 'e.g., I have two logo designs for my fitness app and need to know which one appeals more to Gen Z users and why they prefer it.';
    case 'marketing':
      return 'e.g., I want to test a new Instagram ad campaign for sustainable sneakers targeting millennials. I need to understand which messaging resonates better: eco-friendly materials or stylish design.';
    case 'satisfaction':
      return 'e.g., I want to measure how satisfied current users are with our mobile app onboarding experience and identify the biggest pain points in the first 3 screens.';
    case 'pricing':
      return 'e.g., I want to test pricing tiers for my SaaS platform ($29/$79/$149/mo) with small business owners. I need to know which features justify premium pricing and what price point feels too expensive.';
    case 'roadmap':
      return 'e.g., I want to prioritize features for my fitness app (social sharing, meal plans, or workout videos) by understanding what my target users would pay extra for and what they consider essential.';
    case 'research':
      return 'e.g., I want to understand remote workers\' productivity habits, specifically what time of day they\'re most focused and what tools they use for deep work sessions.';
    case 'competitor':
      return 'e.g., I want to compare my project management tool to Asana and Monday.com. I need to understand what features users value most and where my competitors are falling short for small agencies.';
    default:
      return 'Describe your idea, your target audience, and exactly what you want to learn. The AI will extract the details automatically.';
  }
};

export const MissionSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [missionGoal, setMissionGoal] = useState('validate');
  const [missionDescription, setMissionDescription] = useState(location.state?.inputText || location.state?.prefill || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [role, setRole] = useState('');
  const [stage, setStage] = useState('');

  const [showErrors, setShowErrors] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (location.state?.prefill) {
      setMissionDescription(location.state.prefill);
      setMissionGoal('validate');
    }

    if (location.state?.intent) {
      const intentToGoalMap: Record<string, string> = {
        'pricing': 'validate',
        'features': 'validate',
        'marketing': 'marketing',
        'satisfaction': 'satisfaction'
      };
      const mappedGoal = intentToGoalMap[location.state.intent] || 'validate';
      setMissionGoal(mappedGoal);
    }

    const saved = localStorage.getItem('missionSetupDraft');
    if (saved && !location.state?.inputText && !location.state?.prefill) {
      try {
        const draft = JSON.parse(saved);
        setMissionGoal(draft.missionGoal || 'validate');
        setMissionDescription(draft.missionDescription || '');
        setRole(draft.role || '');
        setStage(draft.stage || '');
        console.log('Restored draft from localStorage');
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (missionDescription || role || stage) {
      const draft = {
        missionGoal,
        missionDescription,
        role,
        stage,
        timestamp: Date.now()
      };
      localStorage.setItem('missionSetupDraft', JSON.stringify(draft));
    }
  }, [missionGoal, missionDescription, role, stage]);

  useEffect(() => {
    console.log('Auth State:', { loading, user: user?.id });
  }, [loading, user]);

  const isValid = missionDescription.trim().length >= 5;

  const refineDescription = async () => {
    if (!missionDescription.trim()) return;
    setIsRefining(true);
    try {
      const selectedGoal = MISSION_GOALS.find(g => g.id === missionGoal);
      const result = await api.post('/api/ai/refine-description', {
        rawDescription: missionDescription.trim(),
        goal: selectedGoal?.label || missionGoal,
      });
      if (result?.refined) {
        setMissionDescription(result.refined);
        toast.success('Description refined by AI!');
      }
    } catch (err) {
      // Fallback to simple formatting if backend unavailable
      const text = missionDescription.trim();
      let refined = text.charAt(0).toUpperCase() + text.slice(1);
      if (!refined.endsWith('.')) refined += '.';
      setMissionDescription(refined);
    } finally {
      setIsRefining(false);
    }
  };

  const handleInspirationClick = (text: string) => {
    setMissionDescription(text);
    setDescriptionTouched(true);
  };

  const handleInitialize = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isValid) {
      setShowErrors(true);
      setDescriptionTouched(true);
      toast.error('Please provide a detailed mission description');
      return;
    }

    setIsSubmitting(true);

    const selectedGoal = MISSION_GOALS.find(g => g.id === missionGoal);
    const aiContext = `${selectedGoal?.label || 'Research'}: ${missionDescription}`;
    const subject = missionDescription;
    const objective = selectedGoal?.label || missionGoal;
    const targetAudience = 'General Audience';

    try {
      // Step 1: Generate AI questions NOW while user is authenticated
      let aiResult: Awaited<ReturnType<typeof generateSurvey>> | null = null;
      try {
        aiResult = await generateSurvey({ goal: missionGoal, subject, objective });
      } catch (aiErr) {
        console.warn('AI generation failed, will use defaults:', aiErr);
      }

      // Step 2: Create mission in database
      const { data, error } = await supabase
        .from('missions')
        .insert([{
          user_id: user?.id || 'anonymous',
          context: aiContext,
          target: targetAudience,
          question: objective,
          respondent_count: aiResult?.suggestedRespondentCount || 100,
          estimated_price: 99,
          role: role,
          stage: stage,
          status: 'DRAFT',
          mission_type: missionGoal,
          visualization_type: 'RATING',
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      const missionData = data || {
        id: `temp-${Date.now()}`,
        context: aiContext,
        target: targetAudience,
        question: objective,
        respondent_count: aiResult?.suggestedRespondentCount || 100,
        estimated_price: 99,
        status: 'DRAFT',
        mission_type: missionGoal,
        visualization_type: 'RATING',
      };

      if (error) console.error('Database error (continuing anyway):', error);

      localStorage.removeItem('missionSetupDraft');

      // Step 3: Navigate with pre-generated questions so dashboard is instant
      navigate(`/dashboard/${missionData.id}`, {
        state: {
          missionData,
          fromSetup: true,
          generatedQuestions: aiResult?.questions || null,
          missionObjective: aiResult?.missionObjective || '',
          targetingSuggestions: aiResult?.targetingSuggestions || null,
          suggestedRespondentCount: aiResult?.suggestedRespondentCount || null,
          aiParams: { goal: missionGoal, subject, objective },
        }
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout>
        <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900">

        <div className="pt-6 md:pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white mb-2 sm:mb-4">
              What do you want to{' '}
              <span className="text-neon-lime">VETT?</span>
            </h1>
            <p className="text-white/60 text-base md:text-lg">Just describe your idea in your own words. AI does the rest.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-xl space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-neon-lime" />
                Mission Brief
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  1. Mission Goal (Select One)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MISSION_GOALS.map((goal) => {
                    const Icon = goal.icon;
                    return (
                      <button
                        key={goal.id}
                        onClick={() => setMissionGoal(goal.id)}
                        className={`h-full min-h-[60px] flex flex-col items-center justify-center text-center px-2 gap-1.5 rounded-xl text-sm font-semibold transition-all ${
                          missionGoal === goal.id
                            ? 'bg-neon-lime text-gray-900 shadow-lg shadow-neon-lime/30'
                            : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                        }`}
                      >
                        <span className="text-xl">{goal.emoji}</span>
                        <span className="leading-tight">{goal.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  2. What do you want to VETT?
                </label>
                <div className="relative">
                  <textarea
                    value={missionDescription}
                    onChange={(e) => setMissionDescription(e.target.value)}
                    onBlur={() => setDescriptionTouched(true)}
                    className={`w-full bg-black/40 border rounded-lg p-4 pb-14 text-white focus:ring-2 focus:ring-neon-lime outline-none resize-none placeholder-white/40 transition-all ${
                      (showErrors || descriptionTouched) && missionDescription.trim().length < 5
                        ? 'border-red-500'
                        : 'border-white/10'
                    }`}
                    placeholder={getPlaceholderForGoal(missionGoal)}
                    rows={6}
                    style={{ minHeight: '160px' }}
                    disabled={isRefining}
                  />
                  <button
                    type="button"
                    onClick={refineDescription}
                    disabled={!missionDescription || missionDescription.trim().length === 0 || isRefining}
                    className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border disabled:cursor-not-allowed ${
                      !missionDescription || missionDescription.trim().length === 0
                        ? 'bg-purple-500/10 text-purple-400/40 border-purple-500/20 opacity-40'
                        : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 hover:scale-105 border-purple-500/40 shadow-lg shadow-purple-500/20'
                    }`}
                  >
                    {isRefining ? (
                      <>
                        <div className="w-3 h-3 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                        <span>Refining...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Refine</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Describe your idea, your target audience, and exactly what you want to learn. The AI will extract the details automatically.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/50">Need inspiration? Try:</span>
                  {INSPIRATION_EXAMPLES.map((example, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleInspirationClick(example.text)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all"
                    >
                      <span>{example.emoji}</span>
                      <span>{example.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-white mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  What happens next?
                </h2>
                <p className="text-xs sm:text-sm text-white/60 mt-2">
                  <span className="font-bold">AI generates 5 survey questions</span> using your description.
                </p>
                <p className="text-xs sm:text-sm text-white/60 mt-1">
                  Then you refine targeting, adjust budget, and launch your mission.
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs sm:text-sm text-white/60">Starting at</div>
                <div className="text-3xl sm:text-4xl font-black text-neon-lime">$15</div>
                <div className="text-xs text-white/40 mt-1">10 respondents</div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-5xl mx-auto mt-6 md:mt-8 mb-10 md:mb-16 px-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-2">Tell us about you</h2>
                <p className="text-xs sm:text-sm text-gray-400">Help the AI calibrate your strategy.</p>
              </div>

              <div className="space-y-6 sm:space-y-8">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white mb-3 sm:mb-4">Your Role</label>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {['Founder / Solopreneur', 'Product Manager', 'Agency Owner / Consultant', 'Software Engineer', 'UX / UI Designer', 'Growth Marketer', 'Investor / VC', 'Academic / Researcher', 'Corporate Innovator', 'Other'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`px-4 py-2 md:px-6 md:py-2.5 text-sm font-medium rounded-full border transition-all duration-200 ${
                          role === r
                            ? 'bg-[#CCFF00] text-black border-[#CCFF00] font-bold shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-[#CCFF00] hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white mb-3 sm:mb-4">Project Stage</label>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {['Napkin Idea', 'Prototype / MVP', 'Pre-Launch', 'Live Product', 'Scaling / Growth'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStage(s)}
                        className={`px-4 py-2 md:px-6 md:py-2.5 text-sm font-medium rounded-full border transition-all duration-200 ${
                          stage === s
                            ? 'bg-[#CCFF00] text-black border-[#CCFF00] font-bold shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-[#CCFF00] hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInitialize}
            disabled={isSubmitting || !isValid}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform ${
              isSubmitting || !isValid
                ? 'bg-white/5 text-white/30 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-neon-lime to-primary text-gray-900 hover:shadow-2xl hover:shadow-neon-lime/50 hover:scale-[1.01]'
            }`}
          >
            {isSubmitting ? (
                // show spinner + message while AI generates
              <>
                <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                AI is crafting your mission...
              </>
            ) : !isValid ? (
              "Describe your mission to continue"
            ) : (
              <>
                Initialize Mission <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
        </div>
        </div>
      </DashboardLayout>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};
