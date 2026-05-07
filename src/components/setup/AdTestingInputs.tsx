import { useRef, useState } from 'react';
import { Upload, X, FileImage, FileVideo, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Pass 30 B5 — Test Marketing / Ads input collector. Backs the
 * Ad Effectiveness backend question generator (Kantar Link / ASI
 * tradition).
 *
 * Required: creative upload (image OR video), channel, format,
 * objective. Brand from UniversalMissionInputs.
 *
 * Optional: intended message text (drives the message-match question
 * q12; if omitted the survey skips q12 and ships 12 Qs instead of 13).
 */

const MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED_TYPES = /^(image|video)\//;

export type CampaignChannel = 'tv' | 'social' | 'ooh' | 'digital_video' | 'audio' | 'print';
export type CampaignFormat = '6s' | '15s' | '30s' | '60s' | 'static_image' | 'carousel' | 'audio_30s';
export type CampaignObjective = 'awareness' | 'consideration' | 'purchase' | 'loyalty';
export type CreativeMediaType = 'image' | 'video';

export interface AdTestingState {
  creativeUrl: string | null;
  creativePath: string | null;
  creativeMediaType: CreativeMediaType;
  channel: CampaignChannel;
  format: CampaignFormat;
  objective: CampaignObjective;
  intendedMessage: string;
}

export const AD_TESTING_DEFAULT_STATE: AdTestingState = {
  creativeUrl: null,
  creativePath: null,
  creativeMediaType: 'image',
  channel: 'social',
  format: 'static_image',
  objective: 'awareness',
  intendedMessage: '',
};

const CHANNELS: Array<{ id: CampaignChannel; label: string }> = [
  { id: 'tv',            label: 'TV (linear)' },
  { id: 'social',        label: 'Social ads' },
  { id: 'digital_video', label: 'Digital video' },
  { id: 'ooh',           label: 'OOH / DOOH' },
  { id: 'audio',         label: 'Audio / Radio' },
  { id: 'print',         label: 'Print' },
];

const FORMATS: Array<{ id: CampaignFormat; label: string }> = [
  { id: '6s',           label: '6s video' },
  { id: '15s',          label: '15s video' },
  { id: '30s',          label: '30s video' },
  { id: '60s',          label: '60s video' },
  { id: 'static_image', label: 'Static image' },
  { id: 'carousel',     label: 'Carousel' },
  { id: 'audio_30s',    label: '30s audio' },
];

const OBJECTIVES: Array<{ id: CampaignObjective; label: string; verb: string }> = [
  { id: 'awareness',     label: 'Awareness',     verb: 'consider <brand>' },
  { id: 'consideration', label: 'Consideration', verb: 'consider <brand>' },
  { id: 'purchase',      label: 'Purchase',      verb: 'purchase <brand>' },
  { id: 'loyalty',       label: 'Loyalty',       verb: 'stick with <brand>' },
];

interface Props {
  userId: string;
  state: AdTestingState;
  onChange: (next: AdTestingState) => void;
}

export function AdTestingInputs({ userId, state, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const update = (patch: Partial<AdTestingState>) =>
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
      setUploadError('File exceeds 100 MB.');
      return;
    }
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]+/g, '_');
    const path = `marketing-creatives/${userId}/${Date.now()}_${safeName}`;
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
      creativeUrl: urlData.publicUrl,
      creativePath: path,
      creativeMediaType: file.type.startsWith('video/') ? 'video' : 'image',
    });
    setUploading(false);
  };

  const clearCreative = () => {
    if (state.creativePath) {
      void supabase.storage.from('mission-assets').remove([state.creativePath]);
    }
    update({ creativeUrl: null, creativePath: null });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Ad Testing</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">
          We&apos;ll run an ad effectiveness study (Kantar Link tradition):
          recall, brand attribution, message takeaway, likeability,
          stopping power, distinctiveness, emotional response, persuasion shift.
        </p>
      </div>

      {/* Creative upload */}
      <div>
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Creative * (image or video, max 100 MB)
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={onPick}
          className="hidden"
        />
        {!state.creativeUrl ? (
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
                <p className="mt-2 text-xs text-[var(--t1)]">Click to upload creative</p>
                <p className="text-[10px] text-[var(--t3)] mt-1">Image or video. Max 100 MB.</p>
              </>
            )}
          </button>
        ) : (
          <div className="mt-1.5 rounded-xl overflow-hidden bg-black relative">
            {state.creativeMediaType === 'image' ? (
              <img src={state.creativeUrl} alt="" className="max-h-56 mx-auto" />
            ) : (
              <video src={state.creativeUrl} controls className="max-h-56 w-full" />
            )}
            <button
              type="button"
              onClick={clearCreative}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black"
              aria-label="Remove creative"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="bg-[var(--bg3)] px-3 py-2 text-[10px] text-[var(--t3)] flex items-center gap-2">
              {state.creativeMediaType === 'image' ? <FileImage className="w-3 h-3" /> : <FileVideo className="w-3 h-3" />}
              Creative uploaded
            </div>
          </div>
        )}
        {uploadError && <p className="mt-1.5 text-[11px] text-red-400">{uploadError}</p>}
      </div>

      {/* Channel + format */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">Channel *</span>
          <select
            value={state.channel}
            onChange={(e) => update({ channel: e.target.value as CampaignChannel })}
            className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[14px] text-[var(--t1)] focus:outline-none focus:border-[var(--lime)]/60"
          >
            {CHANNELS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">Format *</span>
          <select
            value={state.format}
            onChange={(e) => update({ format: e.target.value as CampaignFormat })}
            className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[14px] text-[var(--t1)] focus:outline-none focus:border-[var(--lime)]/60"
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Objective */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">Campaign objective *</span>
        <select
          value={state.objective}
          onChange={(e) => update({ objective: e.target.value as CampaignObjective })}
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3 py-2.5 text-[14px] text-[var(--t1)] focus:outline-none focus:border-[var(--lime)]/60"
        >
          {OBJECTIVES.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <p className="text-[10px] text-[var(--t4)] mt-1">
          Drives the persuasion question: &quot;…more or less likely to {OBJECTIVES.find((o) => o.id === state.objective)?.verb || ''}?&quot;
        </p>
      </label>

      {/* Intended message */}
      <label className="block">
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
          Intended message (optional)
        </span>
        <textarea
          value={state.intendedMessage}
          onChange={(e) => update({ intendedMessage: e.target.value.slice(0, 200) })}
          placeholder="What you want the ad to communicate. e.g. 'we are the most affordable option' or 'best for serious athletes'"
          rows={2}
          className="mt-1.5 w-full rounded-xl bg-[var(--bg3)] border border-[var(--b1)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none focus:border-[var(--lime)]/60 resize-y"
        />
        <p className="text-[10px] text-[var(--t4)] mt-1">
          Adds a message-match question (q12) so we can measure whether takeaways match intent.
        </p>
      </label>
    </div>
  );
}

export function validateAdTesting(state: AdTestingState): string[] {
  const missing: string[] = [];
  if (!state.creativeUrl) missing.push('a creative upload');
  if (!state.channel) missing.push('a channel');
  if (!state.format) missing.push('a format');
  if (!state.objective) missing.push('a campaign objective');
  return missing;
}

export default AdTestingInputs;
