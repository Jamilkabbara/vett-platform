/**
 * Pass 42 C1 — barrel export for the chart components extracted from
 * src/pages/ResultsPage.tsx. Consumers in C2/C3/C4 import from
 * '@/components/results/charts' instead of reaching into individual
 * files.
 */
export { COLORS, SENTIMENT_COLORS } from './chartColors';
export { CustomPieTooltip } from './CustomPieTooltip';
export { DistributionPieChart } from './DistributionPieChart';
export { DistributionBarChart } from './DistributionBarChart';
export { DistributionBarList } from './DistributionBarList';
export { RatingHistogram } from './RatingHistogram';
