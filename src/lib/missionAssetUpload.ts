import { supabase } from './supabase';
import type { MissionAsset, MissionAssetMediaType } from '../types/missionAssets';

/**
 * Upload a single user-selected File to the public `vettit-uploads` bucket
 * under `<userId>/<timestamp>-<safeName>` and return a ready-to-persist
 * MissionAsset record.
 *
 * Why the path shape matters:
 *   - The storage RLS policy (see migration `vettit_uploads_storage_policies`)
 *     gates INSERT/UPDATE/DELETE on `(storage.foldername(name))[1] = auth.uid()`
 *     so the first path segment MUST be the current user's UUID. Anything else
 *     returns a 403 from PostgREST and the upload fails silently for the user.
 *   - The timestamp prefix avoids collisions between two files named the same
 *     (e.g. two IMG_1234.jpg from different drafts) without reaching for a UUID
 *     library we don't need.
 *
 * Size guard: 100 MB hard cap, matching what the Storage service will accept
 * on the default Supabase plan and well above realistic ad creative. We reject
 * on the client so the user gets a clean error instead of the opaque 413 the
 * storage endpoint would otherwise return.
 */
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

export class MissionAssetUploadError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'too_large'
      | 'bad_type'
      | 'no_session'
      | 'upload_failed',
  ) {
    super(message);
    this.name = 'MissionAssetUploadError';
  }
}

function inferMediaType(mime: string): MissionAssetMediaType | null {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return null;
}

/** Strip characters the storage path can't carry, collapse whitespace, cap length. */
function sanitiseFilename(name: string): string {
  const stripped = name
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return stripped.slice(0, 80) || 'asset';
}

export async function uploadMissionAsset(
  file: File,
  userId: string,
): Promise<MissionAsset> {
  if (!userId) {
    throw new MissionAssetUploadError(
      'You need to be signed in to upload an asset.',
      'no_session',
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new MissionAssetUploadError(
      `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — max is 100 MB.`,
      'too_large',
    );
  }

  const mediaType = inferMediaType(file.type);
  if (!mediaType) {
    throw new MissionAssetUploadError(
      'Only image or video files are accepted here.',
      'bad_type',
    );
  }

  const safeName = sanitiseFilename(file.name);
  const path = `${userId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('vettit-uploads')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    // Don't leak raw storage error messages — they're not user-friendly and
    // sometimes include internal URLs.  The caller toasts a single line.
    console.error('[missionAssetUpload] storage upload failed', uploadError);
    throw new MissionAssetUploadError(
      'Upload failed — check your connection and try again.',
      'upload_failed',
    );
  }

  const { data: urlData } = supabase.storage
    .from('vettit-uploads')
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    path,
    type: mediaType,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Best-effort deletion of an orphan asset (user cleared the file after upload
 * but before submitting). Non-throwing: we never want a failed cleanup to
 * block the UI.
 */
export async function removeMissionAsset(path: string): Promise<void> {
  if (!path) return;
  try {
    const { error } = await supabase.storage
      .from('vettit-uploads')
      .remove([path]);
    if (error) {
      console.warn('[missionAssetUpload] storage cleanup failed', error);
    }
  } catch (err) {
    console.warn('[missionAssetUpload] storage cleanup threw', err);
  }
}
