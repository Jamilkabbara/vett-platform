import { Question } from '../components/dashboard/QuestionEngine';

interface GenerateSurveyParams {
  goal: string;
  subject: string;
  objective: string;
}

interface SurveyGenerationResult {
  questions: Question[];
  missionObjective: string;
}

export const generateSurvey = async (
  params: GenerateSurveyParams
): Promise<SurveyGenerationResult> => {
  const { goal, subject, objective } = params;

  await new Promise(resolve => setTimeout(resolve, 2000));

  let questions: Question[] = [];
  let missionObjective = '';

  const shortSubject = extractSubjectName(subject);

  switch (goal) {
    case 'validate':
      questions = generateValidateIdea(subject, objective);
      missionObjective = `Help us validate ${shortSubject} with your feedback.`;
      break;

    case 'compare':
      questions = generateCompare(subject, objective);
      missionObjective = `Help us compare options for ${shortSubject}. Share your preferences.`;
      break;

    case 'marketing':
      questions = generateTestMarketing(subject, objective);
      missionObjective = `Help us test marketing materials for ${shortSubject}.`;
      break;

    case 'satisfaction':
      questions = generateSatisfaction(subject, objective);
      missionObjective = `Share your experience with ${shortSubject}.`;
      break;

    case 'pricing':
      questions = generatePricing(subject, objective);
      missionObjective = `Help us understand your pricing expectations for ${shortSubject}.`;
      break;

    case 'roadmap':
      questions = generateRoadmap(subject, objective);
      missionObjective = `Help us prioritize features for ${shortSubject}.`;
      break;

    case 'research':
      questions = generateResearch(subject, objective);
      missionObjective = `Share your insights about ${shortSubject}.`;
      break;

    default:
      questions = generateValidateIdea(subject, objective);
      missionObjective = `Help us understand your preferences about ${shortSubject}.`;
  }

  return { questions, missionObjective };
};

const generateValidateIdea = (subject: string, objective: string): Question[] => {
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
        text: isPizzaSpecific ? "How likely are you to order a 'Keto Pizza Bowl'?" : `How likely are you to try ${extractSubjectName(subject)}?`,
        type: 'rating',
        options: [],
        aiRefined: true,
        isScreening: false
      },
      {
        id: '4',
        text: `What is your ideal price point for ${extractSubjectName(subject)}?`,
        type: 'single',
        options: ['Under $10', '$10-$15', '$15-$20', '$20-$30', 'Over $30'],
        aiRefined: true,
        isScreening: false
      },
      {
        id: '5',
        text: `What would make you choose ${extractSubjectName(subject)} over competitors?`,
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

const generateCompare = (subject: string, objective: string): Question[] => {
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
      text: `Which option do you prefer for ${subject}?`,
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

const generateTestMarketing = (subject: string, objective: string): Question[] => {
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
      text: `What is your first impression of this marketing for ${subject}?`,
      type: 'opinion',
      options: [],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '3',
      text: 'Which message resonates most with you?',
      type: 'single',
      options: ['Value/Price', 'Quality/Premium', 'Convenience/Speed', 'Innovation', 'Trust/Reliability'],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '4',
      text: 'How likely are you to click/engage with this ad?',
      type: 'rating',
      options: [],
      aiRefined: true,
      isScreening: false
    },
    {
      id: '5',
      text: 'What would make this marketing more compelling?',
      type: 'text',
      options: [],
      aiRefined: true,
      isScreening: false
    }
  ];
};

const generateSatisfaction = (subject: string, objective: string): Question[] => {
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

const generateResearch = (subject: string, objective: string): Question[] => {
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

const generatePricing = (subject: string, objective: string): Question[] => {
  const screenerQuestion = generateSmartScreener(subject);
  const extractedSubject = extractSubjectName(subject);

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
      text: `What is the maximum you would pay for ${extractedSubject}?`,
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
      text: `Is ${extractedSubject} good value for money?`,
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

const generateRoadmap = (subject: string, objective: string): Question[] => {
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

const extractProblemFromSubject = (subject: string): string => {
  const lowerSubject = subject.toLowerCase();

  if (lowerSubject.includes('track')) return 'track this information manually';
  if (lowerSubject.includes('manage')) return 'manage this on your own';
  if (lowerSubject.includes('organize')) return 'stay organized';
  if (lowerSubject.includes('find')) return 'find what you need';
  if (lowerSubject.includes('save')) return 'save time on this task';

  return 'solve this problem without a dedicated solution';
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
