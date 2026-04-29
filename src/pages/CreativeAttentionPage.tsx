/**
 * VETT — Creative Attention Analysis: Upload + Context + Payment Flow.
 *
 * Steps:
 *   1. Upload video or image to vett-creatives bucket
 *   2. Fill in brand context form
 *   3. Pay (Image $19 / Video $39) — mission created + Stripe Checkout redirect
 *   4. Stripe Checkout returns to /payment-success which polls and then
 *      navigates the user to /creative-results/:missionId once paid.
 *
 * Pass 23 Bug 23.0e v2 — was an inline VettingPaymentModal. The Bali
 * Safari forensic forced a full migration to redirect-based Stripe
 * Checkout, so the "Analyse This Creative" CTA now creates the mission,
 * spins up a Checkout Session, and bounces the browser to Stripe.
 *
 * Pass 23 Bug 23.61 — INSERT now stamps `tier` + `media_type` derived
 * from the uploaded asset's mimeType so the backend's pricing engine
 * routes to the Creative Attention ladder ($19 / $39 / $79 / $249) and
 * not the default Volume ladder Sniff Test rate ($1.80). The forensic:
 * mission a24d3776 paid $1.80 instead of $19 because the INSERT was
 * leaving tier+media_type NULL and the backend was reading
 * respondent_count=1 against the default ladder.
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Film,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { FileUpload, type UploadedFile } from '../components/shared/FileUpload';
import { api } from '../lib/apiClient';
import { logPaymentError } from '../lib/paymentErrorLogger';

// ── Constants ─────────────────────────────────────────────────────────────────

// Pass 23 Bug 23.51 + 23.61 — Creative Attention tier prices live as the
// canonical source of truth in src/utils/pricingEngine.ts::CREATIVE_ATTENTION_TIERS.
// Mirroring the image/video flat prices here so the UI doesn't import a
// constant just to display the badge — frontend is the only caller.
const CA_PRICE_IMAGE_USD = 19;
const CA_PRICE_VIDEO_USD = 39;

const EMOTION_OPTIONS = [
  'Joy', 'Trust', 'Surprise', 'Anticipation',
  'Fear', 'Sadness', 'Disgust', 'Anger',
] as const;

type Emotion = (typeof EMOTION_OPTIONS)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export function CreativeAttentionPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  // Pass 23 Bug 23.63 — clear the landing-side goal cookie on mount so a
  // stale 'creative_attention' value doesn't bleed into the next visit
  // after the user finishes here. URL ?goal= is also benign on this
  // route — we don't read it (this page is implicitly the
  // creative_attention destination).
  useEffect(() => {
    try { sessionStorage.removeItem('vett_landing_goal'); } catch { /* no-op */ }
  }, []);

  // Step 1 — Upload
  const [creative, setCreative] = useState<UploadedFile | null>(null);

  // Step 2 — Context form
  const [brandName,       setBrandName]       = useState('');
  const [targetAudience,  setTargetAudience]  = useState('');
  const [description,     setDescription]     = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<Set<Emotion>>(new Set());
  const [keyMessage,      setKeyMessage]      = useState('');

  // Step 3 — Payment (Pass 23 Bug 23.0e v2: redirect to Stripe Checkout)
  const [creating,        setCreating]         = useState(false);

  // step 1 = upload, 2 = context form, 3 = checkout in flight (creating
  // is true once the user hits the CTA; we never come back from Stripe
  // Checkout to step 3 inline — the success URL handles that).
  const step = !creative ? 1 : creating ? 3 : 2;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const toggleEmotion = (e: Emotion) => {
    setSelectedEmotions((prev) => {
      const next = new Set(prev);
      if (next.has(e)) next.delete(e);
      else next.add(e);
      return next;
    });
  };

  // Pass 23 Bug 23.79 — magic-byte sniff before mission creation. Backend
  // already does this + auto-refunds, but rejecting upfront avoids a dead
  // 30s checkout round-trip when a user uploads e.g. a renamed .heic.
  // file.type and file extensions can lie; bytes don't.
  const isValidImageMagic = (buf: ArrayBuffer): boolean => {
    if (buf.byteLength < 12) return false;
    const b = new Uint8Array(buf);
    // JPEG: FF D8 FF ??
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;
    // PNG: 89 50 4E 47
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return true;
    // GIF: 47 49 46 38
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return true;
    // WebP: "RIFF" .... "WEBP"
    if (
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
    ) return true;
    return false;
  };

  const handleUploadedFile = async (f: UploadedFile) => {
    const mime = (f.mimeType || '').toLowerCase();
    const name = (f.originalName || '').toLowerCase();
    const isVideo =
      mime.startsWith('video/') ||
      /\.(mp4|mov|webm)$/i.test(name);

    if (isVideo) {
      setCreative(f);
      return;
    }

    try {
      const url = f.publicUrl;
      if (!url) {
        toast.error('Upload could not be verified - please try again');
        await supabase.storage.from('vett-creatives').remove([f.path]).catch(() => {});
        return;
      }
      const resp = await fetch(url);
      const buf = await resp.arrayBuffer();
      if (!isValidImageMagic(buf)) {
        toast.error("This image format isn't supported. Please upload JPG, PNG, WebP, or GIF.");
        await supabase.storage.from('vett-creatives').remove([f.path]).catch(() => {});
        return;
      }
    } catch (err) {
      console.error('[CreativeAttention] magic-byte check failed', err);
      toast.error('Could not verify image - please try a different file');
      await supabase.storage.from('vett-creatives').remove([f.path]).catch(() => {});
      return;
    }

    setCreative(f);
  };

  // Pass 23 Bug 23.76 — brief context textarea is now optional. Brand
  // name still required (AI synthesis needs it for attribution + tone).
  const canProceed = creative && brandName.trim().length > 0;

  const handleCreateMission = async () => {
    if (!user) {
      navigate('/signin?redirect=/creative-attention/new');
      return;
    }
    if (!creative) { toast.error('Please upload a creative file first'); return; }
    if (!brandName.trim()) { toast.error('Please enter your brand name'); return; }
    // Pass 23 Bug 23.76 — description is now optional (replaces the
    // hard-required prompt that confused users into thinking they had
    // to spec a survey for an asset analysis).

    setCreating(true);
    let createdMissionId: string | null = null;
    try {
      // Pass 23 Bug 23.61 — derive tier + media_type from the upload
      // mime so the backend pricing engine routes to the correct
      // Creative Attention ladder ($19 image / $39 video) instead of
      // falling back to Sniff Test ($1.80 × 1 respondent).
      const isVideo = (creative.mimeType || '').toLowerCase().startsWith('video/');
      const tierId: 'image' | 'video' = isVideo ? 'video' : 'image';
      const tierPrice = isVideo ? CA_PRICE_VIDEO_USD : CA_PRICE_IMAGE_USD;

      const { data: mission, error } = await supabase
        .from('missions')
        .insert([{
          user_id:          user.id,
          title:            `Creative Attention: ${brandName.trim()}`,
          brief:            description.trim(),
          goal_type:        'creative_attention',
          status:           'draft',
          respondent_count: 1,   // creative missions don't use respondent count
          price_estimated:  tierPrice,
          // Pass 23 Bug 23.61 — REQUIRED columns for backend pricing.
          tier:             tierId,
          media_type:       tierId,  // image or video
          // Pass 23 Bug 23.75 — persist the asset URL so /creative-results/:id
          // can render the uploaded creative as a hero image (was always
          // NULL before; results pages displayed text descriptions only,
          // never the actual creative). The URL is the signed Supabase
          // Storage URL from FileUpload (1h validity); the storage path
          // lives in brief_attachment so the page can re-sign on demand
          // for views past expiry.
          media_url:        creative.publicUrl || null,
          brand_name:       brandName.trim(),
          target_audience:  targetAudience.trim() || null,
          desired_emotions: selectedEmotions.size > 0
            ? Array.from(selectedEmotions)
            : null,
          key_message:      keyMessage.trim() || null,
          // Store the creative file path so the backend can download it
          brief_attachment: {
            path:         creative.path,
            mimeType:     creative.mimeType,
            originalName: creative.originalName,
            sizeBytes:    creative.sizeBytes,
          },
        }])
        .select()
        .single();

      if (error || !mission) {
        console.error('[CreativeAttention] mission insert failed', error);
        toast.error('Could not create mission - please try again');
        setCreating(false);
        return;
      }

      createdMissionId = mission.id;

      // Pass 23 Bug 23.0e v2 — create a Stripe Checkout Session and redirect.
      // PaymentSuccessPage detects goal_type='creative_attention' and
      // routes the user to /creative-results/:missionId after payment.
      const result = (await api.post('/api/payments/create-checkout-session', {
        missionId: mission.id,
      })) as { url?: string };

      if (!result?.url) {
        throw new Error('Server did not return a checkout URL');
      }

      window.location.href = result.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start checkout.';
      toast.error(msg);
      setCreating(false);
      logPaymentError({
        stage:        'client_checkout_redirect_failed',
        missionId:    createdMissionId,
        errorCode:    'create_session_failed',
        errorMessage: msg,
      });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)] flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--b1)]">
        <Link to="/landing">
          <Logo />
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--t2)] hover:text-[var(--t1)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      {/* Progress breadcrumb */}
      <div className="flex items-center gap-2 px-5 py-3 text-xs text-[var(--t3)]">
        {(['Upload', 'Context', 'Pay'] as const).map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            <span
              className={
                step === i + 1
                  ? 'text-[var(--lime)] font-semibold'
                  : step > i + 1
                  ? 'text-[var(--grn,#4ade80)]'
                  : ''
              }
            >
              {step > i + 1 ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : null}
              {label}
            </span>
          </span>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-5 py-10">
        <div className="w-full max-w-2xl">
          {/* Hero — Pass 23 Bug 23.70: media-aware copy. Pre-upload uses
              neutral language ("we map what holds attention"), post-upload
              adapts to image vs video so users see the right time estimate
              and analysis pitch. All em-dashes replaced with commas. */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <Film className="w-3.5 h-3.5" />
              Creative Attention Analysis
            </div>
            {!creative ? (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--t1)] leading-tight">
                  Upload your creative.
                  <br />
                  <span className="text-purple-400">We map what holds attention.</span>
                </h1>
                <p className="mt-3 text-[var(--t2)] text-sm leading-relaxed max-w-lg">
                  Drop an image or video. Our AI analyzes emotion, attention,
                  and message clarity, then delivers executive insights tied to
                  ad performance benchmarks.
                </p>
              </>
            ) : (creative.mimeType || '').toLowerCase().startsWith('video/') ? (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--t1)] leading-tight">
                  Tell us about your video.
                  <br />
                  <span className="text-purple-400">Then we analyse it frame-by-frame.</span>
                </h1>
                <p className="mt-3 text-[var(--t2)] text-sm leading-relaxed max-w-lg">
                  Our AI is ready to analyse your video frame-by-frame for
                  attention arcs, emotion peaks, and message retention. Add
                  brand context below so the analysis lands in your audience.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--t1)] leading-tight">
                  Tell us about your image.
                  <br />
                  <span className="text-purple-400">Then we map attention hotspots.</span>
                </h1>
                <p className="mt-3 text-[var(--t2)] text-sm leading-relaxed max-w-lg">
                  Our AI is ready to map attention hotspots, emotion peaks, and
                  message clarity across your image. Add brand context below so
                  the analysis lands in your audience.
                </p>
              </>
            )}
          </div>

          {/* Step 1 — Upload. Pass 23 Bug 23.76: hide once file is selected
              so users aren't presented with the upload zone alongside the
              context form (cleaner two-step flow). The Replace button on
              the file chip handles re-upload. */}
          {!creative && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-[var(--t2)] uppercase tracking-wider mb-3">
                Step 1. Upload Your Creative
              </h2>
              <FileUpload
                bucket="vett-creatives"
                folder="creative-attention"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                maxSizeMB={200}
                label="Drop image or video"
                hint="JPG, PNG, WebP, MP4, MOV, WebM (up to 200 MB)"
                current={creative}
                onUpload={handleUploadedFile}
                onRemove={() => setCreative(null)}
              />
            </section>
          )}

          {/* Uploaded-asset chip + replace control for the post-upload state. */}
          {creative && (
            <section className="mb-8 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[var(--b1)] bg-[var(--bg2)]">
              <div className="flex items-center gap-3 min-w-0">
                <Film className="w-5 h-5 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--t1)] truncate">
                    {creative.originalName}
                  </div>
                  <div className="text-xs text-[var(--t3)]">
                    {(creative.mimeType || '').toLowerCase().startsWith('video/') ? 'Video' : 'Image'}
                    {' · '}
                    {Math.round((creative.sizeBytes || 0) / 1024)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreative(null)}
                className="text-xs text-[var(--t3)] hover:text-[var(--t1)] underline whitespace-nowrap"
              >
                Replace
              </button>
            </section>
          )}

          {/* Step 2 — Context form (shown once file is uploaded) */}
          {creative && (
            <section className="mb-8 space-y-5">
              <h2 className="text-sm font-semibold text-[var(--t2)] uppercase tracking-wider">
                Step 2. Give the AI Context
              </h2>

              {/* Brand name */}
              <div>
                <label className="block text-xs text-[var(--t3)] mb-1.5 font-medium">
                  Brand Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Nike, Careem, Noon"
                  className="w-full bg-[var(--bg2)] border border-[var(--b1)] rounded-xl px-4 py-3 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-purple-500/60 transition-colors"
                />
              </div>

              {/* Target audience */}
              <div>
                <label className="block text-xs text-[var(--t3)] mb-1.5 font-medium">
                  Target Audience
                </label>
                <textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Working mothers in UAE aged 28–38, interested in health and convenience"
                  rows={2}
                  className="w-full bg-[var(--bg2)] border border-[var(--b1)] rounded-xl px-4 py-3 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-purple-500/60 transition-colors resize-none"
                />
              </div>

              {/* Description — Pass 23 Bug 23.76: optional brief context.
                  AI synthesis runs fine without it; brand_name + target_audience
                  carry enough signal. Removed the red asterisk + the
                  description.trim() check from canProceed. */}
              <div>
                <label className="block text-xs text-[var(--t3)] mb-1.5 font-medium">
                  Brief context <span className="text-[var(--t3)] font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. A 30-second launch video for our new meal kit service. We want to understand where attention drops and whether the brand reveal at the end lands."
                  rows={3}
                  className="w-full bg-[var(--bg2)] border border-[var(--b1)] rounded-xl px-4 py-3 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-purple-500/60 transition-colors resize-none"
                />
              </div>

              {/* Pass 23 Bug 23.69 — optional desired-emotions picker.
                  Reframed from "what should the creative evoke?" (which
                  primed the user to pre-decide an outcome) to "tell us
                  what you want, optional. We'll measure whether the
                  creative actually delivers." Empty selection skips the
                  alignment-vs-actual analysis and the AI describes all
                  8 emotions descriptively instead. */}
              <div className="rounded-xl border border-[var(--b1)] bg-[var(--bg2)]/50 p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--t1)]">
                    Tell us what you want <span className="text-[var(--t3)] font-normal">(optional)</span>
                  </h3>
                  <p className="text-xs text-[var(--t3)] mt-0.5">
                    We&rsquo;ll measure whether the creative actually delivers.
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-[var(--t3)] mb-2 font-medium">
                    Target emotions (pick up to 3)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EMOTION_OPTIONS.map((e) => {
                      const isSelected = selectedEmotions.has(e);
                      const atCap = !isSelected && selectedEmotions.size >= 3;
                      return (
                        <button
                          key={e}
                          type="button"
                          disabled={atCap}
                          onClick={() => toggleEmotion(e)}
                          className={[
                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                            isSelected
                              ? 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                              : atCap
                                ? 'bg-[var(--bg2)] border-[var(--b1)]/40 text-[var(--t3)]/50 cursor-not-allowed'
                                : 'bg-[var(--bg2)] border-[var(--b1)] text-[var(--t2)] hover:border-[var(--b2)]',
                          ].join(' ')}
                        >
                          {e}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Key CTA / message */}
              <div>
                <label className="block text-xs text-[var(--t3)] mb-1.5 font-medium">
                  Key CTA or message
                </label>
                <input
                  type="text"
                  value={keyMessage}
                  onChange={(e) => setKeyMessage(e.target.value)}
                  placeholder="e.g. 'Order now and get 50% off your first box'"
                  className="w-full bg-[var(--bg2)] border border-[var(--b1)] rounded-xl px-4 py-3 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-purple-500/60 transition-colors"
                />
              </div>
            </section>
          )}

          {/* Pricing + CTA — Pass 23 Bug 23.61: price reflects the
              uploaded asset's mime (image $19 / video $39), driven by
              the Creative Attention tier ladder. */}
          {creative && (() => {
            const isVideo = (creative.mimeType || '').toLowerCase().startsWith('video/');
            const tierName = isVideo ? 'Video' : 'Image';
            const tierPrice = isVideo ? CA_PRICE_VIDEO_USD : CA_PRICE_IMAGE_USD;
            return (
            <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[var(--t2)]">Creative Attention · {tierName} tier</p>
                  <p className="text-2xl font-bold text-[var(--t1)]">
                    ${tierPrice}
                    <span className="text-sm font-normal text-[var(--t3)] ml-1.5">flat</span>
                  </p>
                </div>
                <ul className="text-xs text-[var(--t3)] space-y-1 text-right">
                  <li>✓ {isVideo ? 'Frame-by-frame emotion scoring' : 'Per-image emotion scoring'}</li>
                  <li>✓ Attention {isVideo ? 'arc' : 'hotspots'} analysis</li>
                  <li>✓ Strengths + recommendations</li>
                  <li>✓ Platform fit suggestions</li>
                </ul>
              </div>

              <Button
                variant="gradient"
                size="lg"
                fullWidth
                disabled={!canProceed || creating}
                onClick={handleCreateMission}
              >
                {creating ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating mission…</>
                ) : (
                  `Pay $${tierPrice} & Analyse - ${tierName}`
                )}
              </Button>
              {!canProceed && (
                <p className="text-xs text-[var(--t3)] text-center mt-2">
                  Upload a file and fill in brand name + description to continue
                </p>
              )}
            </section>
            );
          })()}
        </div>
      </main>

      {/* Pass 23 Bug 23.0e v2 — checkout is a redirect to Stripe Checkout,
          so there's no inline modal to render. handleCreateMission above
          drives the full create-mission → create-session → redirect flow. */}
    </div>
  );
}
