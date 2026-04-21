/**
 * Canonical shape for a user-uploaded mission asset (image or video).
 *
 * Persisted as a jsonb array on `public.missions.mission_assets` so any
 * downstream consumer — the AI survey generator, the MC preview panel,
 * the respondent-facing survey renderer — reads the exact same record.
 *
 * The array is intentionally flexible (multiple assets per mission is a
 * likely Phase 11 feature, e.g. "compare these two ads") but Phase 10.5
 * uploads one file at a time.
 */
export type MissionAssetMediaType = 'image' | 'video';

export interface MissionAsset {
  /** Publicly resolvable URL used by <img>/<video> tags (bucket is public). */
  url: string;
  /** Storage path within the `vettit-uploads` bucket — used for cleanup / resigning. */
  path: string;
  /** Discriminator for rendering (drives <img> vs <video controls>). */
  type: MissionAssetMediaType;
  /** Original file name, preserved for display + AI context. */
  filename: string;
  /** MIME type from the File object (e.g. "image/jpeg", "video/mp4"). */
  mimeType: string;
  /** Bytes — nice-to-have for the MC preview label ("3.2 MB"). */
  sizeBytes: number;
  /** ISO timestamp captured client-side at upload time. */
  uploadedAt: string;
}

/**
 * Narrow a raw jsonb array coming out of Supabase into a typed MissionAsset[].
 *
 * We defensively coerce each field: a malformed row (legacy dashboard, AI
 * generated junk, etc.) should never crash the dashboard — it should just
 * render zero assets. Items missing `url` or `type` are dropped.
 */
export function normaliseMissionAssets(raw: unknown): MissionAsset[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((input: unknown): MissionAsset | null => {
      if (!input || typeof input !== 'object') return null;
      const r = input as Record<string, unknown>;
      const url = typeof r.url === 'string' ? r.url : null;
      const rawType = typeof r.type === 'string' ? r.type.toLowerCase() : '';
      const type: MissionAssetMediaType | null =
        rawType === 'image' || rawType === 'video' ? rawType : null;
      if (!url || !type) return null;
      return {
        url,
        path: typeof r.path === 'string' ? r.path : '',
        type,
        filename: typeof r.filename === 'string' ? r.filename : 'asset',
        mimeType: typeof r.mimeType === 'string' ? r.mimeType : '',
        sizeBytes: typeof r.sizeBytes === 'number' ? r.sizeBytes : 0,
        uploadedAt:
          typeof r.uploadedAt === 'string' ? r.uploadedAt : new Date().toISOString(),
      };
    })
    .filter((x): x is MissionAsset => x !== null);
}
