// Pass 23 Bug 23.74 — Creative Attention export types.
// Mirrors the runtime shape of mission.creative_analysis JSONB (populated by
// vettit-backend/src/services/ai/creativeAttention.js). Kept in this file so
// the exporter modules don't depend on CreativeAttentionResultsPage.tsx.

export interface FrameAnalysis {
  timestamp: number;
  emotions: Record<string, number>;
  attention_hotspots: string[];
  message_clarity: number;
  audience_resonance: number;
  engagement_score: number;
  brief_description: string;
}

export interface EmotionPeak {
  emotion: string;
  peak_timestamp: number;
  peak_value: number;
  interpretation: string;
}

export type PlatformFit = string | { platform: string; rationale?: string };

export interface CreativeSummary {
  overall_engagement_score: number;
  emotion_peaks: EmotionPeak[];
  attention_arc: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  vs_benchmark: string;
  best_platform_fit: PlatformFit[];
}

export interface CreativeAnalysis {
  frame_analyses: FrameAnalysis[];
  summary: CreativeSummary;
  total_frames: number;
  is_video: boolean;
  generated_at: string;
}

export interface CAExportMission {
  id: string;
  title?: string | null;
  brief?: string | null;
  mission_statement?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  completed_at?: string | null;
  creative_analysis: CreativeAnalysis;
}

export type CAExportFormat = 'pdf' | 'pptx' | 'xlsx' | 'csv' | 'json';
