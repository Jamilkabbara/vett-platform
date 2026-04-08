import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { ResultsEngine } from '../components/dashboard/ResultsEngine';
import { QuestionEngine, Question } from '../components/dashboard/QuestionEngine';
import TargetingEngine, { TargetingConfig } from '../components/dashboard/TargetingEngine';
import { StickyActionFooter } from '../components/dashboard/StickyActionFooter';
import { MobileDashboardNav } from '../components/dashboard/MobileDashboardNav';
import { MobilePriceSummary } from '../components/dashboard/MobilePriceSummary';
import { SurveyPreview } from '../components/dashboard/SurveyPreview';
import { PricingReceipt } from '../components/dashboard/PricingReceipt';
import { SkeletonLoader } from '../components/dashboard/SkeletonLoader';
import { QuestionSkeleton } from '../components/dashboard/QuestionSkeleton';
import { VettingPaymentModal } from '../components/dashboard/VettingPaymentModal';
import { AuthModal } from '../components/layout/AuthModal';
import { Zap, AlertCircle, Eye, X, MapPin, Users, Pencil, Sparkles, Check, ArrowRight, User, Target, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/apiClient';
import { calculatePricing } from '../utils/pricingEngine';
import { calculateTimeEstimate } from '../utils/timeEstimation';
import { generateSurvey } from '../services/aiService';

interface MissionData {
  id?: string;
  context: string;
  target: string;
  question: string;
  mission_type: string;
  visualization_type: string;
  respondent_count: number;
  estimated_price: number;
  status: string;
  role?: string;
  industry?: string;
  stage?: string;
  created_at?: string;
}

export const DashboardPage = () => {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [mobileView, setMobileView] = useState<'mission' | 'targeting' | 'preview'>('mission');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVettingModal, setShowVettingModal] = useState(false);
  const [backendMissionId, setBackendMissionId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const targetingMatrixRef = useRef<HTMLDivElement>(null);
  const [respondentCount, setRespondentCount] = useState(50);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: '', type: 'rating', options: [], aiRefined: false }
  ]);
  const [targetingConfig, setTargetingConfig] = useState<TargetingConfig>({
    geography: { countries: [], cities: [], cityEnabled: false },
    demographics: { ageRanges: [], genders: [], education: [], marital: [], parental: [], employment: [] },
    professional: { industries: [], roles: [], companySizes: [] },
    financials: { incomeRanges: [] },
    behaviors: [],
    technographics: { devices: ['No Preference'] },
    retargeting: { pixelPlatform: '', pixelId: '' },
  });
  const [missionObjective, setMissionObjective] = useState('');
  const [isScreeningActive, setIsScreeningActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);

  // Studio Header States
  const [missionTitle, setMissionTitle] = useState('');
  const [missionContext, setMissionContext] = useState('');
  const [smartSubject, setSmartSubject] = useState('this concept');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempContext, setTempContext] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  const isGibberish = (text: string): boolean => {
    if (!text || text.trim().length === 0) return true;
    const trimmedText = text.trim();
    return trimmedText.length > 15 && !trimmedText.includes(' ');
  };

  const getSmartSubject = (context: string): string => {
    if (isGibberish(context)) {
      return 'this concept';
    }

    const lower = context.toLowerCase();

    if (lower.includes('saas') || lower.includes('software')) return 'this SaaS platform';
    if (lower.includes('mobile app') || lower.includes('app')) return 'this mobile app';
    if (lower.includes('pizza')) return 'this pizza concept';
    if (lower.includes('restaurant') || lower.includes('dining')) return 'this dining concept';
    if (lower.includes('dentist') || lower.includes('dental')) return 'this dental tool';
    if (lower.includes('coffee') || lower.includes('cafe')) return 'this coffee shop';
    if (lower.includes('bakery') || lower.includes('pastry')) return 'this bakery';
    if (lower.includes('food delivery') || lower.includes('meal kit')) return 'this food service';
    if (lower.includes('fitness') || lower.includes('gym')) return 'this fitness service';
    if (lower.includes('web app') || lower.includes('webapp')) return 'this web application';
    if (lower.includes('marketplace') || lower.includes('platform')) return 'this platform';
    if (lower.includes('service')) return 'this service';
    if (lower.includes('product')) return 'this product';

    if (context.length > 20) return 'this concept';

    return context;
  };

  const pricingBreakdown = useMemo(() => {
    return calculatePricing(respondentCount, questions, targetingConfig, isScreeningActive);
  }, [respondentCount, questions, targetingConfig, isScreeningActive]);

  const timeEstimate = useMemo(() => {
    return calculateTimeEstimate(respondentCount, targetingConfig);
  }, [respondentCount, targetingConfig]);

  const displayTitle = useMemo(() => {
    if (!missionData?.context || isGibberish(missionData.context)) return 'New Validation Mission';

    const lowerContext = missionData.context.toLowerCase();

    // Smart extraction based on content - Food & Beverage
    if (lowerContext.includes('pizza')) return 'Pizza Delivery Concept';
    if (lowerContext.includes('coffee') || lowerContext.includes('cafe')) return 'Coffee Shop Concept';
    if (lowerContext.includes('restaurant') || lowerContext.includes('dining')) return 'Restaurant Concept';
    if (lowerContext.includes('food delivery') || lowerContext.includes('meal kit')) return 'Food Delivery Service';
    if (lowerContext.includes('bakery') || lowerContext.includes('pastry')) return 'Bakery Concept';

    // Tech & Software
    if (lowerContext.includes('saas') || lowerContext.includes('software')) return 'SaaS Product Validation';
    if (lowerContext.includes('mobile app') || lowerContext.includes('app')) return 'Mobile App Validation';
    if (lowerContext.includes('web app') || lowerContext.includes('webapp')) return 'Web Application';
    if (lowerContext.includes('ai') || lowerContext.includes('artificial intelligence')) return 'AI Product Validation';
    if (lowerContext.includes('platform')) return 'Platform Validation';

    // Services
    if (lowerContext.includes('subscription')) return 'Subscription Service';
    if (lowerContext.includes('marketplace')) return 'Marketplace Platform';
    if (lowerContext.includes('booking') || lowerContext.includes('reservation')) return 'Booking Service';
    if (lowerContext.includes('fitness') || lowerContext.includes('gym')) return 'Fitness Service';
    if (lowerContext.includes('wellness') || lowerContext.includes('health')) return 'Wellness Service';
    if (lowerContext.includes('education') || lowerContext.includes('learning') || lowerContext.includes('course')) return 'Education Platform';
    if (lowerContext.includes('consulting') || lowerContext.includes('advisory')) return 'Consulting Service';

    // E-commerce & Retail
    if (lowerContext.includes('ecommerce') || lowerContext.includes('e-commerce') || lowerContext.includes('online store')) return 'E-Commerce Concept';
    if (lowerContext.includes('retail') || lowerContext.includes('shop')) return 'Retail Concept';
    if (lowerContext.includes('fashion') || lowerContext.includes('clothing')) return 'Fashion Brand';
    if (lowerContext.includes('beauty') || lowerContext.includes('cosmetics')) return 'Beauty Product';

    // Transportation & Logistics
    if (lowerContext.includes('delivery') || lowerContext.includes('courier')) return 'Delivery Service';
    if (lowerContext.includes('ride') || lowerContext.includes('transport')) return 'Transportation Service';

    // Real Estate & Property
    if (lowerContext.includes('real estate') || lowerContext.includes('property')) return 'Real Estate Service';
    if (lowerContext.includes('rental') || lowerContext.includes('lease')) return 'Rental Service';

    // Fallback: Take first 4-5 meaningful words
    const words = missionData.context
      .split(' ')
      .filter(word => word.length > 2) // Filter out short words like 'I', 'am', 'a'
      .slice(0, 4)
      .join(' ');

    return words.length > 40 ? words.substring(0, 40) : words;
  }, [missionData]);

  const dynamicTargetText = useMemo(() => {
    const summaryParts: string[] = [];

    if (targetingConfig.geography.cities && targetingConfig.geography.cities.length > 0) {
      summaryParts.push(targetingConfig.geography.cities[0]);
    } else if (targetingConfig.geography.countries && targetingConfig.geography.countries.length > 0) {
      summaryParts.push(targetingConfig.geography.countries[0]);
    }

    if (targetingConfig.demographics.genders.length > 0 && targetingConfig.demographics.genders.length < 3) {
      summaryParts.push(targetingConfig.demographics.genders.join('/'));
    }

    if (targetingConfig.demographics.ageRanges.length === 1) {
      summaryParts.push('Ages ' + targetingConfig.demographics.ageRanges[0]);
    } else if (targetingConfig.demographics.ageRanges.length > 1) {
      summaryParts.push('Multiple age groups');
    }

    if (targetingConfig.professional.industries.length === 1) {
      summaryParts.push(targetingConfig.professional.industries[0]);
    } else if (targetingConfig.professional.industries.length > 1) {
      summaryParts.push('Multiple industries');
    }

    if (summaryParts.length === 0) {
      return 'US audience, all demographics';
    }

    const baseText = summaryParts.slice(0, 3).join(' • ');
    const additionalFilters =
      targetingConfig.demographics.education.length +
      targetingConfig.demographics.marital.length +
      targetingConfig.demographics.parental.length +
      targetingConfig.demographics.employment.length +
      targetingConfig.professional.roles.length +
      targetingConfig.professional.companySizes.length +
      targetingConfig.financials.incomeRanges.length +
      targetingConfig.behaviors.length +
      Math.max(0, targetingConfig.demographics.ageRanges.length - 1) +
      Math.max(0, targetingConfig.professional.industries.length - 1) +
      Math.max(0, (targetingConfig.geography.countries?.length || 0) - 1) +
      Math.max(0, (targetingConfig.geography.cities?.length || 0) - 1);

    if (additionalFilters > 0) {
      return `${baseText} • +${additionalFilters} more filters`;
    }

    return baseText;
  }, [targetingConfig, missionData]);

  const allTags = useMemo(() => {
    const tags: Array<{ text: string; icon?: any; colorClasses: string; category: string; value: string }> = [];

    // Show countries first
    if (targetingConfig.geography.countries && targetingConfig.geography.countries.length > 0) {
      targetingConfig.geography.countries.forEach(countryCode => {
        tags.push({ text: countryCode, icon: MapPin, colorClasses: 'bg-[#ccff00]/10 border-[#ccff00]/20 text-[#ccff00]', category: 'countries', value: countryCode });
      });
    }

    // Then show cities (stack with countries)
    if (targetingConfig.geography.cities && targetingConfig.geography.cities.length > 0) {
      targetingConfig.geography.cities.forEach(city => {
        tags.push({ text: city, icon: MapPin, colorClasses: 'bg-[#ccff00]/10 border-[#ccff00]/20 text-[#ccff00]', category: 'cities', value: city });
      });
    }

    targetingConfig.demographics.genders.forEach(gender => {
      tags.push({ text: gender, icon: Users, colorClasses: 'bg-blue-500/10 border-blue-500/20 text-blue-400', category: 'genders', value: gender });
    });

    targetingConfig.demographics.ageRanges.forEach(age => {
      tags.push({ text: `Ages ${age}`, icon: Users, colorClasses: 'bg-blue-500/10 border-blue-500/20 text-blue-400', category: 'ageRanges', value: age });
    });

    targetingConfig.demographics.education.forEach(edu => {
      tags.push({ text: edu, colorClasses: 'bg-blue-500/10 border-blue-500/20 text-blue-400', category: 'education', value: edu });
    });

    targetingConfig.demographics.marital.forEach(status => {
      tags.push({ text: status, colorClasses: 'bg-blue-500/10 border-blue-500/20 text-blue-400', category: 'marital', value: status });
    });

    targetingConfig.demographics.parental.forEach(status => {
      tags.push({ text: status, colorClasses: 'bg-blue-500/10 border-blue-500/20 text-blue-400', category: 'parental', value: status });
    });

    targetingConfig.demographics.employment.forEach(status => {
      tags.push({ text: status, colorClasses: 'bg-blue-500/10 border-blue-500/20 text-blue-400', category: 'employment', value: status });
    });

    targetingConfig.professional.industries.forEach(industry => {
      tags.push({ text: industry, colorClasses: 'bg-amber-900/20 border-amber-500/30 text-amber-400', category: 'industries', value: industry });
    });

    targetingConfig.professional.roles.forEach(role => {
      tags.push({ text: role, colorClasses: 'bg-amber-900/20 border-amber-500/30 text-amber-400', category: 'roles', value: role });
    });

    targetingConfig.professional.companySizes.forEach(size => {
      tags.push({ text: size, colorClasses: 'bg-amber-900/20 border-amber-500/30 text-amber-400', category: 'companySizes', value: size });
    });

    targetingConfig.financials.incomeRanges.forEach(income => {
      tags.push({ text: income, colorClasses: 'bg-purple-900/20 border-purple-500/30 text-purple-400', category: 'incomeRanges', value: income });
    });

    targetingConfig.behaviors.forEach(behavior => {
      tags.push({ text: behavior, colorClasses: 'bg-purple-900/20 border-purple-500/30 text-purple-400', category: 'behaviors', value: behavior });
    });

    return tags;
  }, [targetingConfig]);

  const removeFilter = (category: string, value: string) => {
    const newConfig = { ...targetingConfig };

    switch (category) {
      case 'cities':
        newConfig.geography.cities = newConfig.geography.cities.filter(c => c !== value);
        break;
      case 'countries':
        newConfig.geography.countries = newConfig.geography.countries.filter(c => c !== value);
        break;
      case 'genders':
        newConfig.demographics.genders = newConfig.demographics.genders.filter(g => g !== value);
        break;
      case 'ageRanges':
        newConfig.demographics.ageRanges = newConfig.demographics.ageRanges.filter(a => a !== value);
        break;
      case 'education':
        newConfig.demographics.education = newConfig.demographics.education.filter(e => e !== value);
        break;
      case 'marital':
        newConfig.demographics.marital = newConfig.demographics.marital.filter(m => m !== value);
        break;
      case 'parental':
        newConfig.demographics.parental = newConfig.demographics.parental.filter(p => p !== value);
        break;
      case 'employment':
        newConfig.demographics.employment = newConfig.demographics.employment.filter(e => e !== value);
        break;
      case 'industries':
        newConfig.professional.industries = newConfig.professional.industries.filter(i => i !== value);
        break;
      case 'roles':
        newConfig.professional.roles = newConfig.professional.roles.filter(r => r !== value);
        break;
      case 'companySizes':
        newConfig.professional.companySizes = newConfig.professional.companySizes.filter(s => s !== value);
        break;
      case 'incomeRanges':
        newConfig.financials.incomeRanges = newConfig.financials.incomeRanges.filter(i => i !== value);
        break;
      case 'behaviors':
        newConfig.behaviors = newConfig.behaviors.filter(b => b !== value);
        break;
    }

    setTargetingConfig(newConfig);
  };

  // Studio Header Edit Handlers
  const handleStartEditTitle = () => {
    setTempTitle(missionTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      setMissionTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setTempTitle('');
  };

  const handleStartEditContext = () => {
    setTempContext(missionContext);
    setIsEditingContext(true);
  };

  const handleSaveContext = () => {
    if (tempContext.trim()) {
      setMissionContext(tempContext.trim());
    }
    setIsEditingContext(false);
  };

  const handleCancelEditContext = () => {
    setIsEditingContext(false);
    setTempContext('');
  };

  const handleAIRefine = async () => {
    if (isRefining || !missionContext.trim()) return;

    setIsRefining(true);
    try {
      const result = await api.post('/api/ai/refine-description', {
        rawDescription: missionContext,
        goal: missionData?.mission_type || 'validate',
      });
      if (result?.refined) {
        setMissionContext(result.refined);
      }
    } catch (err) {
      console.warn('Refine failed:', err);
      // Fallback: simple formatting
      const refinedText = `Concept Validation: ${missionContext}. Target Audience: High-intent buyers.`;
      setMissionContext(refinedText);
    } finally {
      setIsRefining(false);
    }
  };

  const parseTargetingFromContext = (context: string) => {
    const lowerDesc = context.toLowerCase();
    let parsedRespondentCount = 50;
    let parsedTargeting: Partial<TargetingConfig> = {};

    // 1. Auto-Set Respondents based on location intent
    const hasSpecificCity = lowerDesc.includes('dubai') || lowerDesc.includes('london') || lowerDesc.includes('new york') ||
        lowerDesc.includes('los angeles') || lowerDesc.includes('chicago') || lowerDesc.includes('tokyo') ||
        lowerDesc.includes('paris') || lowerDesc.includes('berlin') || lowerDesc.includes('sydney') ||
        lowerDesc.includes('toronto') || lowerDesc.includes('singapore') || lowerDesc.includes('mumbai') ||
        lowerDesc.includes('hong kong') || lowerDesc.includes('barcelona') || lowerDesc.includes('amsterdam');

    if (hasSpecificCity) {
      parsedRespondentCount = 100; // Local mission needs more data
    }

    // 2. Auto-Set Gender
    const genders: string[] = [];
    if (lowerDesc.includes('women') || lowerDesc.includes('female') || lowerDesc.includes('ladies')) {
      genders.push('Female');
    }
    if (lowerDesc.includes('men') || lowerDesc.includes('male') || lowerDesc.includes('guys')) {
      genders.push('Male');
    }

    // 3. Auto-Set Location
    const cities: string[] = [];
    if (lowerDesc.includes('dubai')) cities.push('Dubai, UAE');
    if (lowerDesc.includes('london')) cities.push('London, UK');
    if (lowerDesc.includes('new york') || lowerDesc.includes('nyc')) cities.push('New York, USA');
    if (lowerDesc.includes('los angeles') || lowerDesc.includes('la ')) cities.push('Los Angeles, USA');
    if (lowerDesc.includes('san francisco')) cities.push('San Francisco, USA');
    if (lowerDesc.includes('chicago')) cities.push('Chicago, USA');
    if (lowerDesc.includes('tokyo')) cities.push('Tokyo, Japan');
    if (lowerDesc.includes('paris')) cities.push('Paris, France');
    if (lowerDesc.includes('berlin')) cities.push('Berlin, Germany');
    if (lowerDesc.includes('sydney')) cities.push('Sydney, Australia');
    if (lowerDesc.includes('toronto')) cities.push('Toronto, Canada');
    if (lowerDesc.includes('singapore')) cities.push('Singapore');
    if (lowerDesc.includes('mumbai')) cities.push('Mumbai, India');
    if (lowerDesc.includes('hong kong')) cities.push('Hong Kong');
    if (lowerDesc.includes('barcelona')) cities.push('Barcelona, Spain');
    if (lowerDesc.includes('amsterdam')) cities.push('Amsterdam, Netherlands');

    // 4. Auto-Set Age Ranges
    const ageRanges: string[] = [];
    if (lowerDesc.includes('gen z') || lowerDesc.includes('genz') || lowerDesc.includes('gen-z')) ageRanges.push('18-24');
    if (lowerDesc.includes('millennial') || lowerDesc.includes('young adult') || lowerDesc.includes('young professional')) {
      ageRanges.push('25-34');
      ageRanges.push('35-44');
    }
    if (lowerDesc.includes('teenager') || lowerDesc.includes('teen') || lowerDesc.includes('adolescent')) ageRanges.push('13-17');
    if (lowerDesc.includes('senior') || lowerDesc.includes('elderly') || lowerDesc.includes('retired')) ageRanges.push('65+');
    if (lowerDesc.includes('middle-age') || lowerDesc.includes('middle age')) ageRanges.push('45-54', '55-64');
    if (lowerDesc.includes('parent') || lowerDesc.includes('mom') || lowerDesc.includes('dad')) {
      // Parents are typically 25-54
      if (!ageRanges.includes('25-34')) ageRanges.push('25-34');
      if (!ageRanges.includes('35-44')) ageRanges.push('35-44');
      if (!ageRanges.includes('45-54')) ageRanges.push('45-54');
    }

    // 5. Auto-Set Industries
    const industries: string[] = [];
    if (lowerDesc.includes('tech') || lowerDesc.includes('software') || lowerDesc.includes('developer')) industries.push('Technology');
    if (lowerDesc.includes('finance') || lowerDesc.includes('banking') || lowerDesc.includes('investment')) industries.push('Finance');
    if (lowerDesc.includes('healthcare') || lowerDesc.includes('medical') || lowerDesc.includes('hospital')) industries.push('Healthcare');
    if (lowerDesc.includes('education') || lowerDesc.includes('teacher') || lowerDesc.includes('student')) industries.push('Education');
    if (lowerDesc.includes('retail') || lowerDesc.includes('ecommerce') || lowerDesc.includes('e-commerce')) industries.push('Retail');
    if (lowerDesc.includes('marketing') || lowerDesc.includes('advertising')) industries.push('Marketing');
    if (lowerDesc.includes('real estate') || lowerDesc.includes('property')) industries.push('Real Estate');

    // 6. Auto-Set Roles
    const roles: string[] = [];
    if (lowerDesc.includes('founder') || lowerDesc.includes('entrepreneur') || lowerDesc.includes('ceo')) roles.push('Founder / CEO');
    if (lowerDesc.includes('manager') || lowerDesc.includes('director')) roles.push('Manager / Director');
    if (lowerDesc.includes('developer') || lowerDesc.includes('engineer')) roles.push('Developer / Engineer');
    if (lowerDesc.includes('designer')) roles.push('Designer');
    if (lowerDesc.includes('marketer') || lowerDesc.includes('marketing')) roles.push('Marketer');

    // Build targeting config
    if (genders.length > 0 || ageRanges.length > 0) {
      parsedTargeting.demographics = {
        genders,
        ageRanges,
        education: [],
        marital: [],
        parental: [],
        employment: []
      };
    }

    if (cities.length > 0) {
      parsedTargeting.geography = {
        countries: cities.length > 0 ? [] : ['global'],
        cities
      };
    }

    if (industries.length > 0 || roles.length > 0) {
      parsedTargeting.professional = {
        industries,
        roles,
        companySizes: []
      };
    }

    return { parsedRespondentCount, parsedTargeting };
  };

  const generateSmartQuestion = (context: string, targetingCities: string[] = []): Question => {
    const lowerContext = context.toLowerCase();
    const smartSubject = getSmartSubject(context);

    if (targetingCities.length > 0) {
      const cityName = targetingCities[0].split(',')[0];
      return {
        id: '1',
        text: `Do you currently live in ${cityName}?`,
        type: 'single_choice',
        options: ['Yes', 'No'],
        aiRefined: true,
        isScreening: false,
        qualifyingAnswer: 'Yes'
      };
    }

    if (lowerContext.includes('pizza') || lowerContext.includes('food') || lowerContext.includes('restaurant')) {
      return {
        id: '1',
        text: 'Are you interested in trying new food products?',
        type: 'single_choice',
        options: ['Yes', 'No', 'Maybe'],
        aiRefined: true,
        isScreening: false,
        qualifyingAnswer: 'Yes'
      };
    }

    if (lowerContext.includes('app') || lowerContext.includes('tech') || lowerContext.includes('software') || lowerContext.includes('saas')) {
      return {
        id: '1',
        text: 'How often do you use productivity tools like this?',
        type: 'single_choice',
        options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'],
        aiRefined: true,
        isScreening: false,
        qualifyingAnswer: 'Daily'
      };
    }

    if (lowerContext.includes('dog') || lowerContext.includes('pet')) {
      return {
        id: '1',
        text: 'Do you own a dog?',
        type: 'single_choice',
        options: ['Yes', 'No'],
        aiRefined: true,
        isScreening: false,
        qualifyingAnswer: 'Yes'
      };
    }

    if (lowerContext.includes('car') || lowerContext.includes('vehicle') || lowerContext.includes('automotive')) {
      return {
        id: '1',
        text: 'Do you own a car?',
        type: 'single_choice',
        options: ['Yes', 'No'],
        aiRefined: true,
        isScreening: false,
        qualifyingAnswer: 'Yes'
      };
    }

    return {
      id: '1',
      text: `How valuable is ${smartSubject} to you?`,
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false
    };
  };

  const generateQuestions = (text: string, subject: string): Question[] => {
    const lower = text.toLowerCase();

    return [
      {
        id: '1',
        text: `Are you interested in ${subject}?`,
        type: 'single_choice',
        options: ['Yes', 'No', 'Maybe'],
        aiRefined: true,
        isScreening: false
      },
      {
        id: '2',
        text: `How likely are you to use ${subject}?`,
        type: 'rating',
        options: [],
        aiRefined: true,
        isScreening: false
      },
      {
        id: '3',
        text: 'What matters most to you when making a purchase decision?',
        type: 'multiple_choice',
        options: ['Price', 'Quality', 'Speed/Convenience', 'Brand Trust', 'Customer Support'],
        aiRefined: true,
        isScreening: false
      }
    ];
  };

  // ADVANCED HEURISTIC PARSER - Runs ONCE on mount
  useEffect(() => {
    if (hasInitializedRef.current || !missionData?.context) return;
    hasInitializedRef.current = true;

    const missionDescription = missionData.context;

    // 1. CLEAN INPUT (Remove prefixes)
    const cleanText = missionDescription
      .replace(/^(validate|verify|check)\s+(product|idea|concept)?:?\s*/i, '')
      .trim();
    const lower = cleanText.toLowerCase();

    setMissionContext(cleanText);

    // 2. SMART SUBJECT EXTRACTION (Crucial for Grammar)
    let smartSubject = "this concept";

    // Pattern Matching for common sentence structures
    const patterns = [
      /launching\s+(?:a|an)\s+([^.,]+)/i,
      /building\s+(?:a|an)\s+([^.,]+)/i,
      /opening\s+(?:a|an)\s+([^.,]+)/i,
      /validate\s+(?:a|an)\s+([^.,]+)/i,
      /starting\s+(?:a|an)\s+([^.,]+)/i,
      /creating\s+(?:a|an)\s+([^.,]+)/i
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].split(' ').slice(0, 4).join(' ');
        smartSubject = "this " + extracted;
        break;
      }
    }

    // Fallback: Keyword detection if sentence parsing fails
    if (smartSubject === "this concept") {
      if (lower.includes('cat') || lower.includes('pet')) smartSubject = "this pet service";
      else if (lower.includes('food') || lower.includes('pizza')) smartSubject = "this food concept";
      else if (lower.includes('app') || lower.includes('saas')) smartSubject = "this app";
      else if (lower.includes('grooming')) smartSubject = "this grooming service";
      else if (lower.includes('restaurant')) smartSubject = "this restaurant";
    }

    setSmartSubject(smartSubject);

    // 3. TARGETING ENGINE (Toronto Fix)
    const newTargeting = { ...targetingConfig };
    let locFound = false;

    // North America
    if (lower.includes('toronto') || lower.includes('ontario') || lower.includes('canada')) {
      newTargeting.geography = {
        ...newTargeting.geography,
        cities: ['Toronto, Canada'],
        countries: []
      };
      locFound = true;
    } else if (lower.includes('ny') || lower.includes('york') || lower.includes('usa')) {
      newTargeting.geography = {
        ...newTargeting.geography,
        cities: ['New York, USA'],
        countries: []
      };
      locFound = true;
    }
    // Europe/Middle East
    else if (lower.includes('london') || lower.includes('uk')) {
      newTargeting.geography = {
        ...newTargeting.geography,
        cities: ['London, UK'],
        countries: []
      };
      locFound = true;
    } else if (lower.includes('dubai') || lower.includes('uae')) {
      newTargeting.geography = {
        ...newTargeting.geography,
        cities: ['Dubai, UAE'],
        countries: []
      };
      locFound = true;
    }

    // 4. TITLE GENERATION
    let title = "PRODUCT VALIDATION";
    if (lower.includes('cat') || lower.includes('grooming')) title = "PET GROOMING SERVICE";
    else if (lower.includes('pizza') || lower.includes('restaurant')) title = "RESTAURANT CONCEPT";
    else if (lower.includes('saas') || lower.includes('software')) title = "SAAS PLATFORM";

    // 5. APPLY ALL UPDATES
    setMissionTitle(title);
    if (locFound) {
      setTargetingConfig(newTargeting);
      setRespondentCount(100);
    }

    // 6. Check for AI-generated questions from location state
    const locationState = location.state as {
      missionData?: MissionData;
      generatedQuestions?: Question[];
      missionObjective?: string;
      targetingSuggestions?: { countries: string[]; ageRanges: string[]; genders: string[] } | null;
      suggestedRespondentCount?: number | null;
      aiParams?: { goal: string; subject: string; objective: string };
      fromSetup?: boolean;
    } | null;

    if (locationState?.generatedQuestions && locationState.generatedQuestions.length > 0) {
      // Questions already generated on setup page — use them directly
      setQuestions(locationState.generatedQuestions);

      if (locationState.missionObjective) {
        setMissionObjective(locationState.missionObjective);
      }

      if (locationState.targetingSuggestions) {
        const ts = locationState.targetingSuggestions;
        setTargetingConfig(prev => ({
          ...prev,
          geography: {
            ...prev.geography,
            countries: ts.countries?.length > 0 ? ts.countries : prev.geography.countries,
          },
          demographics: {
            ...prev.demographics,
            ageRanges: ts.ageRanges?.length > 0 ? ts.ageRanges : prev.demographics.ageRanges,
            genders: ts.genders?.length > 0 ? ts.genders : prev.demographics.genders,
          },
        }));
      }

      if (locationState.suggestedRespondentCount) {
        setRespondentCount(Math.min(Math.max(locationState.suggestedRespondentCount, 10), 2000));
      }
    } else if (questions[0].text === '') {
      // REGENERATE QUESTIONS with the clean subject
      setQuestions(generateQuestions(cleanText, smartSubject));
    }

    // 7. Set Mission Objective
    if (locationState?.missionObjective) {
      setMissionObjective(locationState.missionObjective);
    } else if (missionObjective === '') {
      setMissionObjective(title);
    }
  }, [missionData]);

  const handleTargetClick = () => {
    if (targetingMatrixRef.current) {
      targetingMatrixRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetingMatrixRef.current.classList.add('highlight-flash');
      setTimeout(() => {
        targetingMatrixRef.current?.classList.remove('highlight-flash');
      }, 1500);
    }
  };

  const loadMockData = () => {
    const mockMission: MissionData = {
      id: 'mock-001',
      context: 'Vegan Soda Concept - Zero Sugar, Natural Flavors',
      target: 'Health-Conscious Millennials (Ages 25-34)',
      question: 'Validate purchase intent and pricing sensitivity for premium vegan soda',
      mission_type: 'pulse_check',
      visualization_type: 'RATING',
      respondent_count: 100,
      estimated_price: 99,
      status: 'DRAFT',
      role: 'Founder',
      industry: 'Consumer Goods (CPG)',
      stage: 'MVP (Pre-Revenue)',
      created_at: new Date().toISOString(),
    };
    setMissionData(mockMission);
    setLoading(false);
  };

  // Scroll to top when mobile tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [mobileView]);

  // Handle click outside mobile profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileProfileRef.current && !mobileProfileRef.current.contains(event.target as Node)) {
        setShowMobileProfileMenu(false);
      }
    };

    if (showMobileProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileProfileMenu]);

  useEffect(() => {
    const initialContext = (location.state as any)?.initialContext;
    if (initialContext && !missionContext) {
      setMissionContext(initialContext);
    }
  }, [location.state]);

  useEffect(() => {
    if (missionData && !loading) {
      return;
    }

    const locationState = location.state as { missionData?: MissionData; fromSetup?: boolean } | null;

    if (locationState?.missionData && locationState?.fromSetup) {
      const mData = locationState.missionData as MissionData;
      setMissionData(mData);
      setLoading(false);
      return;
    }

    if (authLoading) {
      return;
    }

    if (!missionId) {
      loadMockData();
      return;
    }

    if (!user) {
      loadMockData();
      return;
    }

    const fetchMission = async () => {
      try {
        const { data, error } = await supabase
          .from('missions')
          .select('*')
          .eq('id', missionId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching mission:', error);
          loadMockData();
          return;
        }

        if (!data) {
          console.warn('No mission data found, loading mock data');
          loadMockData();
          return;
        }

        setMissionData(data);
        setLoading(false);
      } catch (error) {
        console.error('Unexpected error:', error);
        loadMockData();
      }
    };

    fetchMission();
  }, [missionId, user, authLoading, navigate, location.state]);

  const handleLaunch = async () => {
    console.log("🎯 handleLaunch called", { user: !!user, questions: questions.length });

    const hasErrors = questions.some(q => q.hasPIIError);
    if (hasErrors) {
      console.log("❌ PII errors detected");
      setValidationError('Please remove questions with PII violations before launching');
      return;
    }

    // Save mission to backend to get a real missionId before payment
    if (user) {
      try {
        const payload = {
          goal: missionData?.mission_type || 'validate',
          missionStatement: missionObjective || missionTitle || missionData?.context || '',
          subject: missionData?.context || missionTitle || '',
          objective: missionData?.question || '',
          questions,
          targetingConfig,
          respondentCount,
          missionType: missionData?.mission_type || 'validate',
        };

        let savedMission;
        const existingId = backendMissionId || missionData?.id;
        if (existingId) {
          savedMission = await api.patch(`/api/missions/${existingId}`, payload);
        } else {
          savedMission = await api.post('/api/missions', payload);
        }

        if (savedMission?.id) {
          setBackendMissionId(savedMission.id);
        }
      } catch (err) {
        console.warn('Could not save mission to backend before launch:', err);
      }
    }

    console.log("✅ Opening vetting modal");
    setShowVettingModal(true);
  };

  const handleVettingComplete = async () => {
    console.log("🎉 handleVettingComplete called - Payment successful!");
    setIsLaunching(true);
    setShowVettingModal(false);

    setTimeout(async () => {
      try {
        if (missionData?.id && user) {
          console.log("💾 Updating mission in database...", missionData.id);
          await supabase.from('missions').update({
            status: 'ACTIVE',
            questions: questions,
            targeting_config: targetingConfig,
            respondent_count: respondentCount,
          }).eq('id', missionData.id);
        }
        setIsLaunching(false);

        console.log("🚀 Navigating to /mission-active");
        navigate('/mission-active', {
          state: {
            missionData: {
              id: missionData?.id,
              context: missionData?.context || missionTitle,
              target: dynamicTargetText,
              questions: questions,
              respondent_count: respondentCount,
              targeting_config: targetingConfig
            }
          }
        });
      } catch (error) {
        console.error('Unexpected launch error:', error);
        setIsLaunching(false);
        navigate('/mission-active', {
          state: {
            missionData: {
              context: missionTitle,
              questions: questions,
              respondent_count: respondentCount
            }
          }
        });
      }
    }, 500);
  };

  const getScopeTier = useMemo(() => {
    const count = respondentCount;
    if (count <= 100) {
      return {
        label: 'Rapid Pilot',
        emoji: '⚡️',
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-500/20',
      };
    }
    if (count <= 500) {
      return {
        label: 'Robust Data',
        emoji: '📊',
        color: 'text-[#ccff00]',
        bg: 'bg-[#ccff00]/10',
        border: 'border-[#ccff00]/20',
      };
    }
    return {
      label: 'Deep Reach',
      emoji: '🌍',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-500/20',
    };
  }, [respondentCount]);

  if (authLoading || loading) {
    return <SkeletonLoader />;
  }

  if (!missionData) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-4">No Mission Found</h2>
          <p className="text-white/60 mb-6">Create your first mission to get started.</p>
          <button
            onClick={() => navigate('/setup')}
            className="px-6 py-3 bg-[#ccff00] hover:bg-[#b3e600] rounded-xl font-bold text-black transition-colors"
          >
            Create Mission
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[100dvh] bg-[#020617] font-display text-white pt-16 md:pt-20 pb-52 md:pb-40 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
    >
      {/* DESKTOP NAVBAR - Hidden on Mobile */}
      <div className="hidden md:block">
        <Navbar
          onSignInClick={() => setShowAuthModal(true)}
          missionStatus={missionData.status}
          showPreviewButton={missionData.status === 'DRAFT'}
          onPreviewClick={() => setShowPreviewModal(true)}
        />
      </div>

      {/* MOBILE HEADER - Hidden on Desktop */}
      <div className="block md:hidden fixed top-0 left-0 right-0 z-[9998] bg-[#020617]/95 backdrop-blur-xl border-b border-gray-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/landing')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-[#ccff00] rounded-lg flex items-center justify-center shadow-lg shadow-[#ccff00]/20">
              <Zap className="text-black w-5 h-5" fill="currentColor" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">VETT</h1>
          </button>
          <div className="relative" ref={mobileProfileRef}>
            <button
              onClick={() => setShowMobileProfileMenu(!showMobileProfileMenu)}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#ccff00] to-[#b3e600] flex items-center justify-center text-black font-black text-xs shadow-lg hover:scale-105 transition-transform"
              aria-label="Profile Menu"
            >
              {user?.email ? user.email.substring(0, 2).toUpperCase() : 'JM'}
            </button>

            {showMobileProfileMenu && (
              <div className="absolute top-12 right-0 w-64 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-bold text-white">
                    {user?.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : 'User'}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email || 'user@vettit.ai'}</p>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowMobileProfileMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileProfileMenu(false);
                      navigate('/missions');
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Target className="w-4 h-4" />
                    <span className="text-sm font-medium">My Missions</span>
                  </button>
                </div>

                <div className="border-t border-white/10 py-2">
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setShowMobileProfileMenu(false);
                      navigate('/');
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {missionData.status === 'DRAFT' ? (
        <>
          {/* MISSION CONTROL HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative mb-6 md:mb-10 lg:mb-12 pt-6 sm:pt-8 md:pt-8 lg:pt-10 pb-6 sm:pb-8 md:pb-10 lg:pb-12 border-b border-gray-800 bg-[#020617] overflow-hidden"
          >
            {/* Background Grid & Glow Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ccff00]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ccff00]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 md:px-10 lg:px-12">
              {/* 1. EYEBROW LABEL */}
              <div className="flex items-center gap-2 mb-4 md:mb-3">
                <span className="text-gray-500 font-mono text-[10px] sm:text-xs uppercase tracking-widest">
                  // MISSION CONTROL
                </span>
                <span className="animate-pulse bg-red-500/20 text-red-500 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/50 uppercase tracking-wider">
                  ● LIVE
                </span>
              </div>

              {/* 2. MAIN TITLE (EDITABLE) */}
              <div className="mb-5 sm:mb-6 md:mb-8 lg:mb-10">
                {!isEditingTitle ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-[#b3e600] uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(204,255,0,0.3)] break-words leading-tight">
                      {missionTitle}
                    </h1>
                    <button
                      onClick={handleStartEditTitle}
                      className="flex items-center gap-1.5 md:gap-2 bg-[#ccff00]/10 border border-[#ccff00]/50 text-[#ccff00] px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider hover:bg-[#ccff00] hover:text-black transition-all shadow-[0_0_10px_rgba(204,255,0,0.2)] whitespace-nowrap"
                    >
                      <Pencil className="w-3 md:w-4 h-3 md:h-4" />
                      <span className="hidden sm:inline">Edit Title</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 w-full">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') handleCancelEditTitle();
                      }}
                      className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-[#9eff00] uppercase tracking-tighter leading-none bg-transparent border-b-2 border-[#ccff00] focus:outline-none break-words w-full"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveTitle}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#ccff00] text-black rounded-lg hover:bg-[#b3e600] transition-colors font-bold text-sm"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEditTitle}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors font-bold text-sm"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. INTELLIGENT BRIEF BOX */}
              <div className="mb-5 sm:mb-6 md:mb-8 relative max-w-3xl group">
                {!isEditingContext ? (
                  <div className="relative">
                    <div className={`relative bg-[#0f172a] border-l-4 p-4 sm:p-5 md:p-6 lg:p-8 pb-16 sm:pb-18 md:pb-20 lg:pb-22 rounded-r-xl shadow-inner transition-all ${isRefining ? 'border-[#ccff00] animate-pulse' : 'border-[#ccff00]'}`}>
                      <p className="text-sm sm:text-base md:text-base lg:text-lg font-mono text-gray-300 leading-relaxed break-words">
                        {missionContext}
                      </p>
                    </div>
                    <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 flex items-center gap-2 md:gap-3 flex-wrap justify-end">
                      <span className="text-gray-500 text-xs font-mono uppercase tracking-widest hidden lg:block">
                        {isRefining ? '// Processing...' : '// AI Assistance Ready'}
                      </span>
                      <button
                        onClick={handleStartEditContext}
                        disabled={isRefining}
                        className="flex items-center gap-1.5 md:gap-2 bg-gray-800/80 border border-gray-600 text-gray-300 px-3 md:px-4 py-2 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider hover:bg-gray-700 hover:border-[#ccff00]/50 hover:text-[#ccff00] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Pencil className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={handleAIRefine}
                        disabled={isRefining}
                        className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-[#ccff00] to-lime-400 text-black font-black text-[10px] md:text-xs uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 rounded-full shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:scale-105 hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <Sparkles className={`w-3.5 md:w-4 h-3.5 md:h-4 ${isRefining ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{isRefining ? 'Optimizing...' : 'Refine'}</span>
                        <span className="sm:hidden">{isRefining ? '...' : 'AI'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      value={tempContext}
                      onChange={(e) => setTempContext(e.target.value)}
                      className="w-full bg-[#0f172a] border-l-4 border-[#ccff00] p-4 md:p-6 pb-16 md:pb-20 text-sm md:text-lg font-mono text-gray-300 focus:bg-[#1e293b] focus:outline-none transition-colors rounded-r-xl shadow-inner resize-none"
                      rows={4}
                      autoFocus
                    />
                    <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 flex gap-2">
                      <button
                        onClick={handleSaveContext}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-[#ccff00] text-black rounded-full text-[10px] md:text-xs font-black uppercase hover:bg-[#b3e600] transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEditContext}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-800 text-gray-400 rounded-full text-[10px] md:text-xs font-black uppercase hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                      >
                        <X className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. REMOVABLE TAGS */}
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {allTags.slice(0, 6).map((tag, i) => (
                  <div key={i} className={`flex items-center gap-1.5 border px-3 sm:px-4 py-2 sm:py-2.5 rounded text-xs font-bold uppercase tracking-wide group hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-colors cursor-pointer ${tag.colorClasses}`}>
                    {tag.icon && <tag.icon className="w-3.5 h-3.5" />}
                    <span>{tag.text}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFilter(tag.category, tag.value);
                      }}
                      className="ml-1 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {allTags.length > 6 && (
                  <div className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded text-xs font-bold text-gray-400 border border-gray-700 bg-gray-800/50">
                    +{allTags.length - 6} MORE
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* 2-COLUMN GRID - Desktop Only */}
          <div className="hidden md:block">
            <div className="max-w-7xl mx-auto px-8 md:px-10 lg:px-12 py-8 md:py-10 grid grid-cols-12 gap-8 md:gap-10 lg:gap-12 min-h-[calc(100vh-200px)]">
              {/* LEFT COLUMN: Question Engine */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="col-span-12 lg:col-span-7 flex flex-col gap-8"
              >
                {loadingQuestions ? (
                  <QuestionSkeleton />
                ) : (
                  <QuestionEngine
                    initialQuestion={missionData.question}
                    questions={questions}
                    onQuestionsChange={setQuestions}
                    onScreeningChange={setIsScreeningActive}
                  />
                )}
              </motion.div>

              {/* RIGHT COLUMN: Targeting & Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                ref={targetingMatrixRef}
                className="col-span-12 lg:col-span-5 flex flex-col gap-8"
              >
                {/* Mission Scope Card - Unified */}
                <div className={`bg-[#0f172a] border ${getScopeTier.border} rounded-xl p-6 md:p-7 lg:p-8`}>
                  {/* Header: Title + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white">Mission Scope</h3>
                    <span className={`${getScopeTier.bg} ${getScopeTier.color} text-xs font-medium px-3 py-1.5 rounded-full border ${getScopeTier.border} flex items-center gap-1.5`}>
                      <span>{getScopeTier.emoji}</span>
                      <span>{getScopeTier.label}</span>
                    </span>
                  </div>

                  {/* The Number */}
                  <div className="text-center mb-3">
                    <div className="text-5xl font-black text-white mb-1">
                      {respondentCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Respondents</div>
                  </div>

                  {/* The Slider */}
                  <input
                    type="range"
                    min="10"
                    max="2000"
                    step="10"
                    value={respondentCount}
                    onChange={(e) => setRespondentCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#ccff00] hover:accent-[#b3e600] transition-all mb-4 drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                  />
                  <div className="flex justify-between text-xs text-white/40">
                    <span>10</span>
                    <span>2,000</span>
                  </div>
                </div>

                {/* Targeting Engine */}
                <TargetingEngine
                  config={targetingConfig}
                  onChange={setTargetingConfig}
                  respondentCount={respondentCount}
                />
              </motion.div>
            </div>
          </div>

          {/* MOBILE TABBED VIEW - Hidden on Desktop */}
          <div className="block md:hidden max-w-7xl mx-auto px-5 sm:px-6 pt-6 pb-48">
            {mobileView === 'mission' && (
              <motion.div
                key="mission"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {loadingQuestions ? (
                  <QuestionSkeleton />
                ) : (
                  <QuestionEngine
                    initialQuestion={missionData.question}
                    questions={questions}
                    onQuestionsChange={setQuestions}
                    onScreeningChange={setIsScreeningActive}
                  />
                )}
              </motion.div>
            )}

            {mobileView === 'targeting' && (
              <motion.div
                key="targeting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                ref={targetingMatrixRef}
                className="space-y-8"
              >
                {/* Mission Scope Card - Unified (Mobile) */}
                <div className={`bg-[#0f172a] border ${getScopeTier.border} rounded-xl p-6 sm:p-7`}>
                  {/* Header: Title + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white">Mission Scope</h3>
                    <span className={`${getScopeTier.bg} ${getScopeTier.color} text-xs font-medium px-3 py-1.5 rounded-full border ${getScopeTier.border} flex items-center gap-1.5`}>
                      <span>{getScopeTier.emoji}</span>
                      <span>{getScopeTier.label}</span>
                    </span>
                  </div>

                  {/* The Number */}
                  <div className="text-center mb-3">
                    <div className="text-5xl font-black text-white mb-1">
                      {respondentCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Respondents</div>
                  </div>

                  {/* The Slider */}
                  <input
                    type="range"
                    min="10"
                    max="2000"
                    step="10"
                    value={respondentCount}
                    onChange={(e) => setRespondentCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#ccff00] hover:accent-[#b3e600] transition-all mb-4 drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                  />
                  <div className="flex justify-between text-xs text-white/40">
                    <span>10</span>
                    <span>2,000</span>
                  </div>
                </div>

                <TargetingEngine
                  config={targetingConfig}
                  onChange={setTargetingConfig}
                  respondentCount={respondentCount}
                />
              </motion.div>
            )}

            {mobileView === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <SurveyPreview
                  questions={questions}
                  missionObjective={missionTitle || displayTitle}
                />
                <PricingReceipt
                  pricingBreakdown={pricingBreakdown}
                  respondentCount={respondentCount}
                  timeEstimate={timeEstimate}
                />
              </motion.div>
            )}
          </div>

          {/* PREVIEW MODAL */}
          <AnimatePresence>
            {showPreviewModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPreviewModal(false)}
                className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
              >
                {/* Close Button - Positioned relative to overlay */}
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="absolute top-6 right-6 z-50 text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-8 h-8" />
                </button>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto"
                >
                  {/* Preview Content */}
                  <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-black text-[#ccff00] uppercase tracking-tight mb-6 text-center">
                      Mission Preview
                    </h2>
                    <SurveyPreview
                      questions={questions}
                      missionObjective={displayTitle}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-7xl mx-auto px-6 md:px-8 pt-6 pb-52 md:pb-40"
        >
          <div className="bg-[#0f172a]/80 border border-gray-800 rounded-2xl p-6 mb-6">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">
              Mission Brief
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-white/40 text-sm">Context:</span>
                <p className="text-white font-medium">{missionData.context}</p>
              </div>
              <div>
                <span className="text-white/40 text-sm">Target:</span>
                <p className="text-white font-medium">{missionData.target}</p>
              </div>
              <div>
                <span className="text-white/40 text-sm">Question:</span>
                <p className="text-white font-medium">{missionData.question}</p>
              </div>
            </div>
          </div>

          <ResultsEngine missionData={{ ...missionData, questions }} />
        </motion.div>
      )}

      {/* VALIDATION ERROR TOAST */}
      {validationError && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-red-500/90 border border-red-400 rounded-xl p-4 flex items-start gap-3 shadow-2xl backdrop-blur-xl">
            <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-white font-bold mb-1">Validation Error</h4>
              <p className="text-white/90 text-sm">{validationError}</p>
            </div>
            <button
              onClick={() => setValidationError(null)}
              className="text-white hover:text-white/70 transition-colors"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* MOBILE FLOATING ACTION BUTTON - Shows above mobile nav */}
      {missionData.status === 'DRAFT' && (
        <div className="block md:hidden fixed bottom-24 left-0 right-0 z-50 px-6 mb-4">
          <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-2xl">
            <button
              onClick={() => {
                if (mobileView === 'mission') {
                  setMobileView('targeting');
                } else if (mobileView === 'targeting') {
                  setMobileView('preview');
                } else if (mobileView === 'preview') {
                  handleLaunch();
                }
              }}
              className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-gradient-to-r from-blue-600 to-purple-600 text-white border-2 border-white/20 shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] transition-all flex items-center justify-center gap-2"
            >
              {mobileView === 'mission' && (
                <>
                  Next: Define Targeting
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
              {mobileView === 'targeting' && (
                <>
                  Next: Preview Mission
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
              {mobileView === 'preview' && (
                <>
                  🚀 Launch Mission (${pricingBreakdown.total})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STICKY ACTION FOOTER - Desktop */}
      {missionData.status === 'DRAFT' && (
        <>
          <div className="hidden md:block">
            <StickyActionFooter
              pricingBreakdown={pricingBreakdown}
              onLaunch={handleLaunch}
              isLaunching={isLaunching}
              respondentCount={respondentCount}
            />
          </div>

          {/* MOBILE BOTTOM NAV */}
          <div className="block md:hidden">
            <MobileDashboardNav
              activeView={mobileView}
              onViewChange={setMobileView}
            />
          </div>

          {/* MOBILE PRICE SUMMARY */}
          <MobilePriceSummary
            pricingBreakdown={pricingBreakdown}
            onLaunch={handleLaunch}
            isLaunching={isLaunching}
            respondentCount={respondentCount}
          />
        </>
      )}

      <VettingPaymentModal
        isOpen={showVettingModal}
        onClose={() => setShowVettingModal(false)}
        onComplete={handleVettingComplete}
        totalCost={pricingBreakdown.total}
        respondentCount={respondentCount}
        missionId={backendMissionId || missionData?.id}
      />

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </motion.div>
  );
};
