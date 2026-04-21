import { Question } from '../components/dashboard/QuestionEngine';
import { api } from '../lib/apiClient';
import type { MissionAsset } from '../types/missionAssets';

/**
 * Survey generation — Phase 10.5.
 *
 * Two shapes matter here:
 *   1. The outbound request to the backend. We now send:
 *        - goal (legacy, kept for backward compat with the old prompt)
 *        - goal_type (the canonical id from missionGoals.ts — all 14)
 *        - description (brief)
 *        - mission_assets (array of { url, type, filename, ... } when the
 *          user uploaded one on the setup page)
 *      The backend is expected to key its system prompt off `goal_type`
 *      and, when `mission_assets` is non-empty, add an asset-context line
 *      so generated questions reference "this ad / video / image".
 *
 *   2. The local fallback when the backend is unreachable (or returns an
 *      empty shape). The fallback used to cover only 7 goals; Phase 10.5
 *      expands it to all 14 so every goal tile on /setup gets
 *      goal-appropriate questions even with zero backend.
 */

interface GenerateSurveyParams {
  goal: string;
  subject: string;
  objective: string;
  /** Optional: assets uploaded on /setup (image/video) that the questions should reference. */
  assets?: MissionAsset[];
}

interface SurveyGenerationResult {
  questions: Question[];
  missionObjective: string;
  suggestedRespondentCount?: number;
  targetingSuggestions?: {
    countries: string[];
    ageRanges: string[];
    genders: string[];
    reasoning: string;
  };
}

// Map Claude's types to the frontend's supported types
const VALID_TYPES = ['single', 'multi', 'rating', 'opinion', 'text'];
const TYPE_MAP: Record<string, string> = {
  single_choice: 'single',
  multiple_choice: 'multi',
  nps: 'rating',
  yesno: 'single',
  likert: 'opinion',
  open: 'text',
  open_ended: 'text',
};

function mapType(rawType: string): string {
  const mapped = TYPE_MAP[rawType] || rawType;
  return VALID_TYPES.includes(mapped) ? mapped : 'single';
}

function mapQuestion(q: any, i: number): Question {
  const type = mapType(q.type);
  let options = q.options || [];

  // Ensure yesno gets proper options
  if (q.type === 'yesno' && options.length === 0) {
    options = ['Yes', 'No'];
  }
  // Opinion needs at least 3 options
  if (type === 'opinion' && options.length === 0) {
    options = ['Yes', 'No', 'Maybe'];
  }

  return {
    id: q.id || `q${i + 1}`,
    text: q.text || '',
    type: type as any,
    options,
    isScreening: q.isScreening || false,
    qualifyingAnswer: q.qualifyingAnswer,
    aiRefined: true,
    hasPIIError: false,
  };
}

/**
 * Refine a single question via backend AI.
 *
 * POSTs `{ text, goal, context? }` to /api/ai/refine-description and
 * expects `{ text: string, type?: string, options?: string[] }` back.
 * On any error (network, 404 if the endpoint isn't deployed yet, bad
 * shape) we fall back to a tiny local heuristic — same shape the old
 * QuestionEngine used — so the UI always gets a usable improvement
 * and never ends up stuck on a spinner.
 */
export interface RefineQuestionResult {
  text: string;
  type?: Question['type'];
  options?: string[];
}

export const refineQuestion = async (
  question: Question,
  goal: string | null,
  context?: string,
): Promise<RefineQuestionResult> => {
  try {
    const resp = (await api.post('/api/ai/refine-description', {
      text: question.text,
      type: question.type,
      options: question.options,
      goal,
      context,
    })) as Partial<RefineQuestionResult> | null;

    const refinedText =
      typeof resp?.text === 'string' && resp.text.trim().length > 0
        ? resp.text.trim()
        : null;
    if (refinedText) {
      const mappedType =
        resp?.type && VALID_TYPES.includes(mapType(String(resp.type)))
          ? (mapType(String(resp.type)) as Question['type'])
          : undefined;
      const mappedOptions = Array.isArray(resp?.options)
        ? resp.options.map(String)
        : undefined;
      return { text: refinedText, type: mappedType, options: mappedOptions };
    }
  } catch (err) {
    console.warn('[refineQuestion] backend unavailable, using local fallback', err);
  }

  // ── Local heuristic fallback ──────────────────────────────────────
  const current = question.text.trim();
  if (!current) {
    return { text: 'What is your primary question?' };
  }
  const lower = current.toLowerCase();
  if (
    !lower.startsWith('do ') &&
    !lower.startsWith('are ') &&
    !lower.startsWith('how ') &&
    !lower.startsWith('what ') &&
    !lower.startsWith('which ') &&
    !lower.startsWith('why ') &&
    !lower.startsWith('when ') &&
    !lower.startsWith('would ')
  ) {
    const stripped = current.replace(/\?+$/, '');
    return { text: `How would you describe ${stripped.toLowerCase()}?` };
  }
  if (!current.endsWith('?')) {
    return { text: `${current}?` };
  }
  // Already a question — nudge it to be more specific.
  return { text: current.replace(/\?$/, ' — and why?') };
};

export const generateSurvey = async (
  params: GenerateSurveyParams
): Promise<SurveyGenerationResult> => {
  const { goal, subject, objective, assets } = params;
  const hasAssets = !!(assets && assets.length > 0);
  const assetType = hasAssets ? assets![0].type : null;

  // Try real Claude AI via backend first
  try {
    const description = objective
      ? `${subject}. ${objective}`
      : subject;

    // Phase 10.5: send goal_type + mission_assets so the backend prompt
    // can (a) key off the canonical goal id for template selection and
    // (b) anchor questions to the uploaded creative when one is present.
    // Legacy `goal` is retained so older backend versions still match.
    const surveyBody: Record<string, unknown> = {
      goal,
      goal_type: goal,
      description,
    };
    if (hasAssets) {
      surveyBody.mission_assets = assets;
    }

    // Run survey generation and targeting suggestions in parallel
    const [surveyResult, targetingResult] = await Promise.allSettled([
      api.post('/api/ai/generate-survey', surveyBody),
      api.post('/api/ai/suggest-targeting', { description, goal }),
    ]);

    const survey = surveyResult.status === 'fulfilled' ? surveyResult.value : null;
    const targeting = targetingResult.status === 'fulfilled' ? targetingResult.value : null;

    if (survey?.questions?.length) {
      return {
        questions: survey.questions.map(mapQuestion),
        missionObjective: survey.missionStatement || `To understand ${subject}.`,
        suggestedRespondentCount: survey.suggestedRespondentCount,
        targetingSuggestions: targeting ? {
          countries: targeting.geography?.recommendedCountries || [],
          ageRanges: targeting.demographics?.ageRanges || [],
          genders: targeting.demographics?.genders || [],
          reasoning: targeting.geography?.reasoning || '',
        } : undefined,
      };
    }
  } catch (err) {
    console.warn('Backend AI unavailable, falling back to local generation:', err);
  }

  // ── Local fallback ─────────────────────────────────────────────────
  // Simulate latency so UI transitions feel consistent across backend /
  // no-backend paths. 2s matches the skeleton timing the clarify step
  // assumes.
  await new Promise(resolve => setTimeout(resolve, 2000));

  const ctx: TemplateCtx = {
    subject,
    objective,
    shortSubject: extractSubjectName(subject),
    hasAssets,
    assetType,
  };

  let questions: Question[] = [];
  let missionObjective = '';

  switch (goal) {
    case 'validate':
      questions = generateValidateIdea(ctx);
      missionObjective = `Help us validate ${ctx.shortSubject} with your feedback.`;
      break;

    case 'compare':
      questions = generateCompare(ctx);
      missionObjective = `Help us compare options for ${ctx.shortSubject}. Share your preferences.`;
      break;

    case 'marketing':
      questions = generateTestMarketing(ctx);
      missionObjective = hasAssets
        ? `Help us test the ${assetType === 'video' ? 'video ad' : 'ad'} for ${ctx.shortSubject}.`
        : `Help us test marketing materials for ${ctx.shortSubject}.`;
      break;

    case 'satisfaction':
      questions = generateSatisfaction(ctx);
      missionObjective = `Share your experience with ${ctx.shortSubject}.`;
      break;

    case 'pricing':
      questions = generatePricing(ctx);
      missionObjective = `Help us understand your pricing expectations for ${ctx.shortSubject}.`;
      break;

    case 'roadmap':
      questions = generateRoadmap(ctx);
      missionObjective = `Help us prioritize features for ${ctx.shortSubject}.`;
      break;

    case 'research':
      questions = generateResearch(ctx);
      missionObjective = `Share your insights about ${ctx.shortSubject}.`;
      break;

    case 'competitor':
      questions = generateCompetitor(ctx);
      missionObjective = `Help us benchmark ${ctx.shortSubject} against alternatives you know.`;
      break;

    case 'audience_profiling':
      questions = generateAudienceProfiling(ctx);
      missionObjective = `Tell us about yourself so we can understand who really uses ${ctx.shortSubject}.`;
      break;

    case 'naming_messaging':
      questions = generateNamingMessaging(ctx);
      missionObjective = `Help us pick the name and message that lands best for ${ctx.shortSubject}.`;
      break;

    case 'market_entry':
      questions = generateMarketEntry(ctx);
      missionObjective = `Help us understand local demand for ${ctx.shortSubject}.`;
      break;

    case 'churn_research':
      questions = generateChurnResearch(ctx);
      missionObjective = `Tell us why you stopped using ${ctx.shortSubject} — and what could bring you back.`;
      break;

    case 'brand_lift':
      questions = generateBrandLift(ctx);
      missionObjective = hasAssets
        ? `Help us measure how ${ctx.shortSubject}'s ${assetType === 'video' ? 'campaign video' : 'campaign creative'} changes what you know and feel about the brand.`
        : `Help us measure how ${ctx.shortSubject}'s campaign changes what you know and feel about the brand.`;
      break;

    case 'creative_attention':
      questions = generateCreativeAttention(ctx);
      missionObjective = hasAssets
        ? `Watch the ${assetType === 'video' ? 'video' : 'image'} and tell us what caught your attention.`
        : `Share what grabs your attention about ${ctx.shortSubject}.`;
      break;

    default:
      questions = generateValidateIdea(ctx);
      missionObjective = `Help us understand your preferences about ${ctx.shortSubject}.`;
  }

  return { questions, missionObjective };
};

// ─────────────────────────────────────────────────────────────────────
// Local fallback templates
// ─────────────────────────────────────────────────────────────────────
//
// Phase 10.5 expands coverage from 7 → 14 goals and makes every template
// asset-aware. The shared context object keeps phrasing consistent: when
// an image or video is uploaded, `assetNoun()` returns "this ad" / "this
// video" so the screener and open-ended questions naturally refer back
// to the creative instead of the abstract "concept".

interface TemplateCtx {
  subject: string;
  objective: string;
  shortSubject: string;
  hasAssets: boolean;
  assetType: 'image' | 'video' | null;
}

/** Display noun used when a question must reference the uploaded asset. */
function assetNoun(ctx: TemplateCtx, variant: 'generic' | 'ad' = 'generic'): string {
  if (!ctx.hasAssets) return variant === 'ad' ? 'this ad' : 'this concept';
  if (ctx.assetType === 'video') return variant === 'ad' ? 'this video ad' : 'this video';
  return variant === 'ad' ? 'this ad' : 'this image';
}

const generateValidateIdea = (ctx: TemplateCtx): Question[] => {
  const { subject, objective, shortSubject } = ctx;
  const lowerSubject = subject.toLowerCase();
  const lowerObjective = objective.toLowerCase();
  const fullText = `${lowerSubject} ${lowerObjective}`;

  if (fullText.includes('pizza') || fullText.includes('food') || fullText.includes('restaurant') || fullText.includes('meal')) {
    const isPizzaSpecific = fullText.includes('pizza');
    const isDubai = fullText.includes('dubai');

    return [
      {
        id: '1',
        text: isDubai ? 'Do you live in Dubai?' : 'Do you order food delivery regularly?',
        type: 'single',
        options: ['Yes', 'No'],
        aiRefined: true,
        isScreening: true,
        qualifyingAnswer: 'Yes'
      },
      {
        id: '2',
        text: isPizzaSpecific ? 'Which pizza style do you prefer?' : 'What type of cuisine do you prefer?',
        type: 'single',
        options: isPizzaSpecific
          ? ['Deep Dish', 'Thin Crust', 'Stuffed Crust', 'Neapolitan', 'No preference']
          : ['Italian', 'Asian', 'Mexican', 'American', 'Mediterranean'],
        aiRefined: true,
        isScreening: false
      },
      {
        id: '3',
        text: isPizzaSpecific ? "How likely are you to order a 'Keto Pizza Bowl'?" : `How likely are you to try ${shortSubject}?`,
        type: 'rating',
        options: [],
        aiRefined: true,
        isScreening: false
      },
      {
        id: '4',
        text: `What is your ideal price point for ${shortSubject}?`,
        type: 'single',
        options: ['Under $10', '$10-$15', '$15-$20', '$20-$30', 'Over $30'],
        aiRefined: true,
        isScreening: false
      },
      {
        id: '5',
        text: `What would make you choose ${shortSubject} over competitors?`,
        type: 'text',
        options: [],
        aiRefined: true,
        isScreening: false
      }
    ];
  }

  const screenerQuestion = generateSmartScreener(subject);

  return [
    {
      id: '1',
      text: screenerQuestion.text,
      type: 'single',
      options: screenerQuestion.options,
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: screenerQuestion.options[0]
    },
    {
      id: '2',
      text: `How unique is the idea for ${subject}?`,
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '3',
      text: `Would you use ${subject} if it launched today?`,
      type: 'single',
      options: ['Yes', 'No', 'Maybe'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '4',
      text: `What is the main problem ${subject} solves for you?`,
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '5',
      text: `What concerns or hesitations would prevent you from trying ${subject}?`,
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false
    }
  ];
};

const generateCompare = (ctx: TemplateCtx): Question[] => {
  const screenerQuestion = generateSmartScreener(ctx.subject);

  return [
    {
      id: '1',
      text: screenerQuestion.text,
      type: 'single',
      options: screenerQuestion.options,
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: screenerQuestion.options[0]
    },
    {
      id: '2',
      text: `Which option do you prefer for ${ctx.subject}?`,
      type: 'single',
      options: ['Option A', 'Option B', 'Option C', 'No preference'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '3',
      text: 'What factors influenced your choice?',
      type: 'multi',
      options: ['Design/Aesthetics', 'Clarity', 'Trust/Credibility', 'Value', 'Uniqueness'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '4',
      text: 'Rate the overall appeal of your chosen option',
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '5',
      text: 'Any suggestions to improve your chosen option?',
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false
    }
  ];
};

const generateTestMarketing = (ctx: TemplateCtx): Question[] => {
  const screenerQuestion = generateSmartScreener(ctx.subject);
  const noun = assetNoun(ctx, 'ad');
  const viewingVerb = ctx.assetType === 'video' ? 'watching' : 'looking at';

  return [
    {
      id: '1',
      text: screenerQuestion.text,
      type: 'single',
      options: screenerQuestion.options,
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: screenerQuestion.options[0]
    },
    {
      id: '2',
      text: `After ${viewingVerb} ${noun}, which message resonates most with you?`,
      type: 'single',
      options: ['Value/Price', 'Quality/Premium', 'Convenience/Speed', 'Innovation', 'Trust/Reliability'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '3',
      text: `What emotion did ${noun} evoke?`,
      type: 'multi',
      options: ['Excited', 'Curious', 'Inspired', 'Indifferent', 'Skeptical', 'Confused'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '4',
      text: `How likely are you to click or engage with ${noun}?`,
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '5',
      text: `What is the main message you took away from ${noun}?`,
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false
    }
  ];
};

const generateSatisfaction = (ctx: TemplateCtx): Question[] => {
  const { subject } = ctx;
  return [
    {
      id: '1',
      text: `Have you used ${subject} in the past 30 days?`,
      type: 'single',
      options: ['Yes', 'No', 'Not sure'],
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: 'Yes'
    },
    {
      id: '2',
      text: `How satisfied are you with ${subject}?`,
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '3',
      text: 'How likely are you to recommend this to a friend or colleague?',
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '4',
      text: 'What do you like most about your experience?',
      type: 'multi',
      options: ['Easy to use', 'Fast/Efficient', 'Great support', 'Good value', 'Reliable'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '5',
      text: 'What could be improved?',
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false
    }
  ];
};

const generateResearch = (ctx: TemplateCtx): Question[] => {
  const { subject } = ctx;
  const screenerQuestion = generateSmartScreener(subject);

  return [
    {
      id: '1',
      text: screenerQuestion.text,
      type: 'single',
      options: screenerQuestion.options,
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: screenerQuestion.options[0]
    },
    {
      id: '2',
      text: `How familiar are you with ${subject}?`,
      type: 'single',
      options: ['Very familiar', 'Somewhat familiar', 'Neutral', 'Not very familiar', 'Not familiar at all'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '3',
      text: `How important is ${subject} to you?`,
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '4',
      text: `What challenges do you face related to ${subject}?`,
      type: 'multi',
      options: ['Cost', 'Time', 'Complexity', 'Lack of options', 'Don\'t know where to start'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '5',
      text: 'Share any additional thoughts or insights',
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false
    }
  ];
};

const generatePricing = (ctx: TemplateCtx): Question[] => {
  const { subject, shortSubject } = ctx;
  const screenerQuestion = generateSmartScreener(subject);

  return [
    {
      id: '1',
      text: screenerQuestion.text,
      type: 'single',
      options: screenerQuestion.options,
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: screenerQuestion.options[0]
    },
    {
      id: '2',
      text: `What is the maximum you would pay for ${shortSubject}?`,
      type: 'single',
      options: ['$0-$10', '$10-$25', '$25-$50', '$50-$100', '$100-$200', '$200+'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '3',
      text: 'Which price point feels fairest to you?',
      type: 'single',
      options: ['$10', '$15', '$20', '$25', '$30'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '4',
      text: `Is ${shortSubject} good value for money?`,
      type: 'opinion',
      options: [],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '5',
      text: 'What features would justify a higher price?',
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false
    }
  ];
};

const generateRoadmap = (ctx: TemplateCtx): Question[] => {
  const screenerQuestion = generateSmartScreener(ctx.subject);

  return [
    {
      id: '1',
      text: screenerQuestion.text,
      type: 'single',
      options: screenerQuestion.options,
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: screenerQuestion.options[0]
    },
    {
      id: '2',
      text: 'Which feature is most important to you?',
      type: 'single',
      options: ['Feature A: Advanced analytics', 'Feature B: Mobile app', 'Feature C: Team collaboration', 'Feature D: API integrations', 'Feature E: Custom branding'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '3',
      text: 'Which feature is a "Must-Have" for you?',
      type: 'single',
      options: ['Advanced analytics', 'Mobile app', 'Team collaboration', 'API integrations', 'Custom branding'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '4',
      text: 'Which existing solutions do you currently use?',
      type: 'multi',
      options: ['Google Workspace', 'Microsoft 365', 'Slack', 'Asana', 'Trello', 'Other'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '5',
      text: 'What feature is missing from your current solution?',
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false
    }
  ];
};

// ── New (Phase 10.5) ──────────────────────────────────────────────────

const generateCompetitor = (ctx: TemplateCtx): Question[] => {
  const { shortSubject } = ctx;
  return [
    {
      id: '1',
      text: `Have you used ${shortSubject} or a similar product in the past 6 months?`,
      type: 'single',
      options: ['Yes', 'No', 'Not sure'],
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: 'Yes',
    },
    {
      id: '2',
      text: `Which of these do you use most often for the same job as ${shortSubject}?`,
      type: 'single',
      options: ['Competitor A', 'Competitor B', 'Competitor C', shortSubject, 'None of the above'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '3',
      text: `How would you rate ${shortSubject} vs. your current choice?`,
      type: 'opinion',
      options: ['Much better', 'Somewhat better', 'About the same', 'Somewhat worse', 'Much worse'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '4',
      text: 'Where does your current choice fall short?',
      type: 'multi',
      options: ['Price', 'Quality', 'Speed', 'Support', 'Features', 'Reliability'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '5',
      text: `What would make you switch to ${shortSubject}?`,
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
  ];
};

const generateAudienceProfiling = (ctx: TemplateCtx): Question[] => {
  const { shortSubject } = ctx;
  return [
    {
      id: '1',
      text: `Have you purchased or used ${shortSubject} in the last 12 months?`,
      type: 'single',
      options: ['Yes', 'No'],
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: 'Yes',
    },
    {
      id: '2',
      text: 'Which age range best describes you?',
      type: 'single',
      options: ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '3',
      text: 'What is your approximate monthly household income?',
      type: 'single',
      options: ['< $2k', '$2k–$5k', '$5k–$10k', '$10k–$20k', '$20k+', 'Prefer not to say'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '4',
      text: `Where do you typically hear about products like ${shortSubject}?`,
      type: 'multi',
      options: ['Instagram', 'TikTok', 'YouTube', 'Friends / family', 'Search', 'In-store'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '5',
      text: `Describe a time you chose ${shortSubject} over a competitor — what tipped the decision?`,
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
  ];
};

const generateNamingMessaging = (ctx: TemplateCtx): Question[] => {
  return [
    {
      id: '1',
      text: `Would you be in the target audience for ${ctx.shortSubject}?`,
      type: 'single',
      options: ['Yes', 'Maybe', 'No'],
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: 'Yes',
    },
    {
      id: '2',
      text: 'Which name sounds most appealing?',
      type: 'single',
      options: ['Name A', 'Name B', 'Name C', 'None of them'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '3',
      text: 'Which tagline makes you most curious to learn more?',
      type: 'single',
      options: ['Tagline A', 'Tagline B', 'Tagline C'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '4',
      text: 'What first comes to mind when you hear your chosen name?',
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '5',
      text: 'Rate how memorable your chosen name feels (1 = forgettable, 10 = unforgettable)',
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
  ];
};

const generateMarketEntry = (ctx: TemplateCtx): Question[] => {
  const { shortSubject } = ctx;
  return [
    {
      id: '1',
      text: 'Do you live in the market we are researching?',
      type: 'single',
      options: ['Yes', 'No', 'Visit occasionally'],
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: 'Yes',
    },
    {
      id: '2',
      text: `How much demand do you think exists locally for ${shortSubject}?`,
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '3',
      text: `At which price point would you try ${shortSubject}?`,
      type: 'single',
      options: ['Under $5', '$5–$15', '$15–$30', '$30–$75', '$75+'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '4',
      text: 'What is the biggest barrier that would stop you from buying?',
      type: 'multi',
      options: ['Price', 'Delivery time', 'Trust / brand awareness', 'Local alternatives', 'Cultural fit'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '5',
      text: `What would convince you to choose ${shortSubject} over a local alternative?`,
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
  ];
};

const generateChurnResearch = (ctx: TemplateCtx): Question[] => {
  const { shortSubject } = ctx;
  return [
    {
      id: '1',
      text: `Did you stop using ${shortSubject} in the last 12 months?`,
      type: 'single',
      options: ['Yes', 'No, still using', 'Never used'],
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: 'Yes',
    },
    {
      id: '2',
      text: `Why did you stop using ${shortSubject}?`,
      type: 'multi',
      options: ['Too expensive', 'Missing features', 'Bugs / reliability', 'Found a better alternative', 'No longer needed'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '3',
      text: `What almost made you stay with ${shortSubject}?`,
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '4',
      text: 'Which alternative are you using now?',
      type: 'single',
      options: ['Competitor A', 'Competitor B', 'A manual workaround', 'Nothing — I gave up', 'Other'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '5',
      text: `How likely are you to return to ${shortSubject} in the next 6 months?`,
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
  ];
};

const generateBrandLift = (ctx: TemplateCtx): Question[] => {
  const { subject, shortSubject, hasAssets, assetType } = ctx;
  const viewingVerb = assetType === 'video' ? 'watching this video' : 'looking at this image';

  // When an asset is attached we frame questions as POST-exposure (what
  // the user now thinks after seeing the creative). Without an asset we
  // fall back to a pre-campaign baseline phrasing.
  if (hasAssets) {
    return [
      {
        id: '1',
        text: `Before ${viewingVerb}, had you heard of ${shortSubject}?`,
        type: 'single',
        options: ['Yes, very familiar', 'Yes, vaguely', 'No, first time'],
        aiRefined: true,
        isScreening: true,
        qualifyingAnswer: 'Yes, very familiar',
      },
      {
        id: '2',
        text: `After ${viewingVerb}, which brand do you remember?`,
        type: 'single',
        options: [shortSubject, 'A competitor brand', 'Not sure'],
        aiRefined: true,
        isScreening: false,
      },
      {
        id: '3',
        text: `How has your opinion of ${shortSubject} changed after seeing this?`,
        type: 'opinion',
        options: ['Much more positive', 'Slightly more positive', 'No change', 'Slightly more negative', 'Much more negative'],
        aiRefined: true,
        isScreening: false,
      },
      {
        id: '4',
        text: `How likely are you to buy ${shortSubject} in the next 30 days?`,
        type: 'rating',
        options: [],
        aiRefined: true,
        isScreening: false,
      },
      {
        id: '5',
        text: `How likely are you to recommend ${shortSubject} to a friend after seeing this?`,
        type: 'rating',
        options: [],
        aiRefined: true,
        isScreening: false,
      },
    ];
  }

  return [
    {
      id: '1',
      text: `How familiar are you with ${shortSubject}?`,
      type: 'single',
      options: ['Very familiar', 'Somewhat familiar', 'Heard of it', 'Never heard of it'],
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: 'Very familiar',
    },
    {
      id: '2',
      text: `When you think of ${subject}, which brand comes to mind first?`,
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '3',
      text: `What is your overall opinion of ${shortSubject}?`,
      type: 'opinion',
      options: ['Very positive', 'Somewhat positive', 'Neutral', 'Somewhat negative', 'Very negative'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '4',
      text: `How likely are you to buy ${shortSubject} in the next 30 days?`,
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '5',
      text: `How likely are you to recommend ${shortSubject} to a friend?`,
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
  ];
};

const generateCreativeAttention = (ctx: TemplateCtx): Question[] => {
  const noun = assetNoun(ctx, 'ad');
  const viewingVerb = ctx.assetType === 'video' ? 'watching' : 'looking at';

  return [
    {
      id: '1',
      text: `Have you fully finished ${viewingVerb} ${noun}?`,
      type: 'single',
      options: ['Yes', 'No, skipped ahead'],
      aiRefined: true,
      isScreening: true,
      qualifyingAnswer: 'Yes',
    },
    {
      id: '2',
      text: `What caught your eye first in ${noun}?`,
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '3',
      text: `How did ${noun} make you feel?`,
      type: 'multi',
      options: ['Excited', 'Curious', 'Happy', 'Confused', 'Bored', 'Skeptical'],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '4',
      text: `Did ${noun} make you more interested in the product?`,
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
    {
      id: '5',
      text: `What part of ${noun} do you remember most clearly?`,
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false,
    },
  ];
};

// ── Helpers ──────────────────────────────────────────────────────────

const generateSmartScreener = (subject: string): { text: string; options: string[] } => {
  const lowerSubject = subject.toLowerCase();

  if (lowerSubject.includes('dog') || lowerSubject.includes('pet')) {
    return {
      text: 'Do you own a dog?',
      options: ['Yes', 'No']
    };
  }

  if (lowerSubject.includes('vegan') || lowerSubject.includes('plant-based')) {
    return {
      text: 'Do you follow a vegan or plant-based diet?',
      options: ['Yes', 'No', 'Sometimes']
    };
  }

  if (lowerSubject.includes('car') || lowerSubject.includes('vehicle') || lowerSubject.includes('auto')) {
    return {
      text: 'Do you own a car?',
      options: ['Yes', 'No']
    };
  }

  if (lowerSubject.includes('business') || lowerSubject.includes('company') || lowerSubject.includes('startup')) {
    return {
      text: 'Do you own or work for a business?',
      options: ['Yes', 'No']
    };
  }

  if (lowerSubject.includes('parent') || lowerSubject.includes('child') || lowerSubject.includes('kid')) {
    return {
      text: 'Are you a parent or guardian?',
      options: ['Yes', 'No']
    };
  }

  if (lowerSubject.includes('student') || lowerSubject.includes('college') || lowerSubject.includes('university')) {
    return {
      text: 'Are you currently a student?',
      options: ['Yes', 'No']
    };
  }

  if (lowerSubject.includes('fitness') || lowerSubject.includes('gym') || lowerSubject.includes('workout')) {
    return {
      text: 'Do you regularly exercise or work out?',
      options: ['Yes', 'No', 'Sometimes']
    };
  }

  if (lowerSubject.includes('app') || lowerSubject.includes('software') || lowerSubject.includes('saas')) {
    return {
      text: `Do you currently use apps or software for ${extractCategoryFromSubject(subject)}?`,
      options: ['Yes', 'No', 'Not sure']
    };
  }

  return {
    text: `Are you interested in ${subject}?`,
    options: ['Yes', 'No', 'Maybe']
  };
};

const extractCategoryFromSubject = (subject: string): string => {
  const lowerSubject = subject.toLowerCase();

  if (lowerSubject.includes('fitness') || lowerSubject.includes('health')) return 'health and fitness';
  if (lowerSubject.includes('product') || lowerSubject.includes('business')) return 'productivity';
  if (lowerSubject.includes('track')) return 'tracking and monitoring';
  if (lowerSubject.includes('manage')) return 'management';

  return 'this purpose';
};

const extractSubjectName = (subject: string): string => {
  const lower = subject.toLowerCase();

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

  if (subject.length > 20) return 'this concept';

  return subject;
};
