import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, FileVideo, FileImage, FileAudio, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ALLOWED_TYPES = /^(image|video|audio)\//;
const MAX_BYTES = 100 * 1024 * 1024;

export interface CreativeMetadata {
  url: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  uploadedAt: string;
}

interface Props {
  userId: string;
  missionId?: string;
  value: CreativeMetadata | null;
  onChange: (next: CreativeMetadata | null) => void;
}

/**
 * Pass 25 Phase 1C — mandatory creative upload for Brand Lift Studies.
 * Stores in Supabase Storage `brand-lift-creatives/{userId}/{missionId}/{filename}`.
 * Inline preview for image/video/audio. Saves missions.creative_metadata.
 */
export function CreativeUploader({ userId, missionId, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.test(file.type)) {
      setError('Only image, video, or audio files are accepted.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('File exceeds 100 MB. Please trim or compress.');
      return;
    }
    const folder = missionId || `draft-${Date.now()}`;
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]+/g, '_');
    const path = `brand-lift-creatives/${userId}/${folder}/${safeName}`;
    setUploading(true);
    const { error: upErr } = await supabase.storage
      .from('mission-assets')
      .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('mission-assets').getPublicUrl(path);
    onChange({
      url: urlData.publicUrl,
      path,
      mimeType: file.type,
      sizeBytes: file.size,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    });
    setUploading(false);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const isImage = value?.mimeType.startsWith('image/');
  const isVideo = value?.mimeType.startsWith('video/');
  const isAudio = value?.mimeType.startsWith('audio/');

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--t1)]">Campaign Creative</h3>
          <p className="text-xs text-[var(--t3)] mt-0.5">Required · image, video, or audio · max 100 MB</p>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-[var(--t3)] hover:text-[var(--t1)] flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Replace
          </button>
        )}
      </div>

      {!value ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-[var(--b1)] rounded-xl p-8 text-center hover:border-[var(--lime)] transition-colors disabled:opacity-50"
        >
          {uploading
            ? <><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--lime)]" /><p className="mt-2 text-xs text-[var(--t3)]">Uploading…</p></>
            : <><Upload className="w-6 h-6 mx-auto text-[var(--t2)]" /><p className="mt-2 text-sm text-[var(--t1)]">Click to upload campaign creative</p><p className="text-[11px] text-[var(--t3)] mt-1">PNG · JPG · MP4 · MOV · MP3 · WAV</p></>}
        </button>
      ) : (
        <div className="rounded-xl overflow-hidden bg-black">
          {isImage && <img src={value.url} alt={value.originalName} className="max-h-64 mx-auto" />}
          {isVideo && <video src={value.url} controls className="max-h-64 w-full" />}
          {isAudio && (
            <div className="p-6 flex items-center gap-3">
              <FileAudio className="w-8 h-8 text-[var(--lime)]" />
              <audio src={value.url} controls className="flex-1" />
            </div>
          )}
          <div className="bg-[var(--bg3)] px-3 py-2 text-[11px] text-[var(--t3)] flex items-center gap-2">
            {isImage ? <FileImage className="w-3.5 h-3.5" /> : isVideo ? <FileVideo className="w-3.5 h-3.5" /> : <FileAudio className="w-3.5 h-3.5" />}
            {value.originalName} · {(value.sizeBytes / (1024 * 1024)).toFixed(1)} MB
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {!value && !uploading && !error && (
        <p className="mt-3 text-xs text-[var(--t3)]">
          A creative is required for Brand Lift Studies — upload your campaign creative to measure lift accurately.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}

export default CreativeUploader;
