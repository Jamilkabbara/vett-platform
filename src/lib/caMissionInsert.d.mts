export interface CaPlacementOption {
  id: string;
  label: string;
  norm_active_seconds: number;
  formats: ('image' | 'video')[];
}

export const CA_AUDIENCE_MAX_LENGTH: number;

export function placementsForUpload(placements: CaPlacementOption[] | null | undefined, mediaType: string): CaPlacementOption[];

export function buildCaMissionInsert(args: {
  userId: string;
  brandName: string;
  description: string;
  respondentCount: number;
  tier: { id: string; packagePrice: number };
  mediaType: 'image' | 'video';
  mediaUrl: string | null;
  targetAudience: string;
  placementId: string | null;
  marketCode: string | null;
  desiredEmotions: string[] | null;
  keyMessage: string;
  briefAttachment: { path: string; mimeType: string; originalName: string; sizeBytes: number };
  placements: CaPlacementOption[];
}): Record<string, unknown>;
