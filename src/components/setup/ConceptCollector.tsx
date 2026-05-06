import { useRef, useState } from 'react';
import { Upload, X, FileImage, FileVideo, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Pass 30 B1 — single-concept input collector for Validate Product
 * missions. Concept = product idea, ad copy, packaging, value prop,
 * etc. — anything you want to test for appeal / relevance / intent.
 *
 * Required: concept type + description (>= 50 chars).
 * Optional: image / video upload, price point, use-occasion text.
 *
 * Multi-concept comparison is a separate flow (Pass 30 B3).
 */

const MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED_TYPES = /^(image|video)\//;

export type ConceptMediaType = 'text' | 'image' | 'video';

export interface ConceptCollectorState {
  mediaType: ConceptMediaType;
  description: string;
  mediaUrl: string | null;
  mediaPath: string | null;
  priceUsd: string;
  useOccasion: string;
}

export const CONCEPT_DEFAULT_STATE: ConceptCollectorState = {
  mediaType: 'text',
  description: '',
  mediaUrl: null,
  mediaPath: null,
  priceUsd: '',
  useOccasion: '',
};

const TYPE_OPTIONS: Array<{ id: ConceptMediaType; label: string; hint: string }> = [
  { id: 'text',  label: 'Text only',  hint: 'Description of the concept' },
  { id: 'image', label: 'Image',      hint: 'Photo / mockup / packaging' },
  { id: 'video', label: 'Video',      hint: 'Demo / ad / explainer' },
];

interface Props {
  userId: string;
  state: ConceptCollectorState;
  onChange: (next: ConceptCollectorState) => void;
}

export function ConceptCollector({ userId, state, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const update = (patch: Partial<ConceptCollectorState>) =>
    onChange({ ...state, ...patch });

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (!ALLOWED_TYPES.test(file.type)) {
      setUploadError('Only image or video files are accepted.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('File exceeds 100 MB. Compress or shorten.');
      return;
    }
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]+/g, '_');
    const path = `validate-concepts/${userId}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage
      .from('mission-assets')
      .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
    if (upErr) {
      setUploadError(upErr.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('mission-assets').getPublicUrl(path);
    update({
      mediaUrl: urlData.publicUrl,
      mediaPath: path,
      mediaType: file.type.startsWith('video/') ? 'video' : 'image',
    });
    setUploading(false);
  };

  const clearMedia = () => {
    if (state.mediaPath) {
      void supabase.storage.from('mission-assets').remove([state.mediaPath]);
    }
    update({ mediaUrl: null, mediaPath: null, mediaType: 'text' });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Concept</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          We&apos;ll run a 9-question concept test (appeal, relevance,
          uniqueness, believability, purchase intent, plus open-text
          diagnostics).
        </p>
      </div>

      {/* Concept type picker */}
      <div>
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Concept type *
        </span>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ mediaType: t.id })}
              className={[
                'rounded-lg border px-3 py-2 text-left transition-colors',
                state.mediaType === t.id
                  ? 'bg-[var(--lime)]/10 border-[var(--lime)]'
                  : 'bg-[var(--bg3)] border-[var(--b1)] hover:border-[var(--t3)]',
              ].join(' ')}
            >
              <div className={[
                'text-[12px] font-display font-bold',
                state.mediaType === t.id ? 'text-[var(--lime)]' : 'text-[var(--t1)]',
              ].join(' ')}>
                {t.label}
              </div>
              <div className="text-[10px] text-[var(--t4)] mt-0.5">{t.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Concept description *
        </span>
        <textarea
          value={state.description}
          onChange={(e) => update({ description: e.target.value.slice(0, 800) })}
          placeholder="What's the concept? Features, value prop, target use case. Min 50 characters."
          rows={4}
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60 resize-y"
        />
        <p className="text-[10px] text-[var(--t4)] mt-1">
          {state.description.length} / 800 chars · Minimum 50.
        </p>
      </label>

      {/* Media upload (when image / video) */}
      {state.mediaType !== 'text' && (
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            {state.mediaType === 'image' ? 'Concept image' : 'Concept video'} (optional)
          </span>
          <input
            ref={fileRef}
            type="file"
            accept={state.mediaType === 'image' ? 'image/*' : 'video/*'}
            onChange={onPick}
            className="hidden"
            aria-hidden
          />
          {!state.mediaUrl ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 w-full border-2 border-dashed border-[var(--b1)] rounded-xl p-6 text-center hover:border-[var(--lime)] transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[var(--lime)]" />
                  <p className="mt-2 text-xs text-[var(--t3)]">Uploading…</p>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mx-auto text-[var(--t2)]" />
                  <p className="mt-2 text-xs text-[var(--t1)]">
                    Click to upload {state.mediaType === 'image' ? 'image' : 'video'}
                  </p>
                  <p className="text-[10px] text-[var(--t3)] mt-1">Max 100 MB</p>
                </>
              )}
            </button>
          ) : (
            <div className="mt-1.5 rounded-xl overflow-hidden bg-black relative">
              {state.mediaType === 'image' ? (
                <img src={state.mediaUrl} alt="" className="max-h-56 mx-auto" />
              ) : (
                <video src={state.mediaUrl} controls className="max-h-56 w-full" />
              )}
              <button
                type="button"
                onClick={clearMedia}
                className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                aria-label="Remove media"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="bg-[var(--bg3)] px-3 py-2 text-[10px] text-[var(--t3)] flex items-center gap-2">
                {state.mediaType === 'image' ? (
                  <FileImage className="w-3 h-3" />
                ) : (
                  <FileVideo className="w-3 h-3" />
                )}
                Concept media uploaded
              </div>
            </div>
          )}
          {uploadError && (
            <p className="mt-1.5 text-[11px] text-red-400">{uploadError}</p>
          )}
        </div>
      )}

      {/* Price + use occasion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Price point (optional, USD)
          </span>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs text-[var(--t3)] tabular-nums shrink-0">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={state.priceUsd}
              onChange={(e) => update({ priceUsd: e.target.value })}
              placeholder="e.g. 29.99"
              className="w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
            />
          </div>
          <p className="text-[10px] text-[var(--t4)] mt-1">
            Adds a price-fairness question to the survey.
          </p>
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
            Use occasion (optional)
          </span>
          <input
            type="text"
            value={state.useOccasion}
            onChange={(e) => update({ useOccasion: e.target.value.slice(0, 120) })}
            placeholder="e.g. weekday morning, weekend brunch, on the commute"
            className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60"
          />
          <p className="text-[10px] text-[var(--t4)] mt-1">
            Helps the AI tune the screener to category context.
          </p>
        </label>
      </div>
    </div>
  );
}

export function validateConceptCollector(state: ConceptCollectorState): string[] {
  const missing: string[] = [];
  if (state.description.trim().length < 50) {
    missing.push('a 50+ char concept description');
  }
  if (!state.mediaType) missing.push('a concept type');
  return missing;
}

export default ConceptCollector;
