/**
 * Pass 48 Phase 4 — methodology-tailored starter prompts for the
 * results-page copilot. The copilot is grounded in the same
 * CanonicalReport the page renders, so these questions resolve against
 * real figures the user is looking at.
 */
const SUGGESTIONS: Record<string, string[]> = {
  satisfaction: [
    'Why is the NPS what it is?',
    'Which issue drove the most dissatisfaction?',
    'What should I fix first to lift CSAT?',
  ],
  brand_lift: [
    'Was the lift statistically significant?',
    'Which funnel stage moved most from exposure?',
    'Where did the campaign leak?',
  ],
  pricing: [
    'What price should I launch at and why?',
    'How much demand do I capture at the optimal price?',
    'What is the acceptable price range?',
  ],
  roadmap: [
    'Which feature should I build first?',
    'Which features are must-haves vs nice-to-haves?',
    'What did respondents rank lowest?',
  ],
  compare: [
    'Which concept won and on what?',
    'Where did the losing concept actually beat the winner?',
    'What is the gap on purchase intent?',
  ],
  competitor: [
    'Where do we lead and where do we trail?',
    'What is the biggest attribute gap to close?',
    'Who has the highest share of preference?',
  ],
  naming: [
    'Which name won and why?',
    'How much did the winner beat the runner-up?',
    'Which name tested weakest?',
  ],
  churn_research: [
    'What is the #1 reason people churn?',
    'How many churned customers are winnable?',
    'What would bring them back?',
  ],
  marketing: [
    'Did the ad land its message?',
    'Where is the ad strong vs weak?',
    'What should I change before spending on media?',
  ],
  validate: [
    'Is there real demand for this concept?',
    'What is the top barrier to adoption?',
    'How does purchase intent compare to the norm?',
  ],
  research: [
    'What is the single most important finding?',
    'What surprised the respondents?',
    'What should I study next?',
  ],
};

const DEFAULT = [
  'What is the headline finding?',
  'What should I do next based on this?',
  'How reliable is this at the current sample size?',
];

export function resultsChatSuggestions(goalType: string | null | undefined): string[] {
  if (!goalType) return DEFAULT;
  return SUGGESTIONS[goalType] || DEFAULT;
}
