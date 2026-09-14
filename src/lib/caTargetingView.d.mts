import type { PlacementBenchmark } from '../types/creativeAnalysis';

export interface CaTargetingPlacementView {
  id: string;
  label: string;
  normSeconds: number;
  predictedSeconds: number | null;
  deltaPct: number | null;
  normLabel: string;
  predictedLabel: string;
  deltaLabel: string;
  sentence: string;
}

export interface CaTargetingView {
  placement: CaTargetingPlacementView | null;
  market: { code: string; name: string } | null;
  marketNoteSections: { key: string; heading: string; items: string[] }[];
  marketNotesUnavailable: boolean;
}

export function placementSentence(pb: PlacementBenchmark): string;
export function caTargetingView(creativeAnalysis: unknown): CaTargetingView | null;
