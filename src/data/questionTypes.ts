import { PieChart, BarChart3, TrendingUp, Gauge, FileText } from 'lucide-react';

export const QUESTION_TYPES = {
  SINGLE: {
    id: 'single',
    label: 'Single Choice',
    visual: 'DonutChart',
    icon: PieChart,
    description: 'Select one option from a list',
    requiresOptions: true,
    minOptions: 2,
    maxOptions: 6,
  },
  MULTI: {
    id: 'multi',
    label: 'Multiple Choice',
    visual: 'BarChart',
    icon: BarChart3,
    description: 'Select multiple options from a list',
    requiresOptions: true,
    minOptions: 2,
    maxOptions: 6,
  },
  RATING: {
    id: 'rating',
    label: 'Rating Scale (1-5)',
    visual: 'Histogram',
    icon: TrendingUp,
    description: 'Rate on a scale from 1 to 5',
    requiresOptions: false,
    autoOptions: ['1', '2', '3', '4', '5'],
  },
  OPINION: {
    id: 'opinion',
    label: 'Opinion Scale',
    visual: 'GaugeChart',
    icon: Gauge,
    description: 'Agree/Disagree sentiment scale',
    requiresOptions: false,
    autoOptions: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  },
  TEXT: {
    id: 'text',
    label: 'Open Text',
    visual: 'WordCloud',
    icon: FileText,
    description: 'Free-form text response',
    requiresOptions: false,
  },
};

export type QuestionTypeId = 'single' | 'multi' | 'rating' | 'opinion' | 'text';

export const getQuestionTypeConfig = (typeId: QuestionTypeId) => {
  switch (typeId) {
    case 'single':
      return QUESTION_TYPES.SINGLE;
    case 'multi':
      return QUESTION_TYPES.MULTI;
    case 'rating':
      return QUESTION_TYPES.RATING;
    case 'opinion':
      return QUESTION_TYPES.OPINION;
    case 'text':
      return QUESTION_TYPES.TEXT;
    default:
      return QUESTION_TYPES.SINGLE;
  }
};
