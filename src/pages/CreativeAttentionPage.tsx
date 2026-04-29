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

  const canProceed = creative && brandName.trim().length > 0 && description.trim().length > 0;

  const handleCreateMission = async () => {
    if (!user) {
      navigate('/signin?redirect=/creative-attention/new');
      return;
    }
    if (!creative) { toast.error('Please upload a creative file first'); return; }
    if (!brandName.trim()) { toast.error('Please enter your brand name'); return; }
    if (!description.trim()) { toast.error('Please describe your creative'); return; }

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
          title:            `Creative Attention — ${brandName.trim()}`,
          brief:            description.trim(),
          goal_type:        'creative_attention',
          status:           'draft',
          respondent_count: 1,   // creative missions don't use respondent count
          price_estimated:  tierPrice,
          // Pass 23 Bug 23.61 — REQUIRED columns for backend pricing.
          tier:             tierId,
          media_type:       tierId,  // image or video
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
        toast.error('Could not create mission — please try again');
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
          {/* Hero */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <Film className="w-3.5 h-3.5" />
              Creative Attention Analysis
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--t1)] leading-tight">
              Upload your creative.
              <br />
              <span className="text-purple-400">AI maps attention frame by frame.</span>
            </h1>
            <p className="mt-3 text-[var(--t2)] text-sm leading-relaxed max-w-lg">
              Upload a video or image. Our AI analyzes every frame for emotion,
              attention hotspots, and engagement — then synthesizes executive insights.
            </p>
          </div>

          {/* Step 1 — Upload */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-[var(--t2)] uppercase tracking-wider mb-3">
              Step 1 — Upload Your Creative
            </h2>
            <FileUpload
              bucket="vett-creatives"
              folder="creative-attention"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
              maxSizeMB={200}
              label="Drop video or image here"
              hint="MP4, MOV, WebM (up to 200 MB) · JPG, PNG, WebP (up to 200 MB)"
              current={creative}
              onUpload={(f) => setCreative(f)}
              onRemove={() => setCreative(null)}
            />
          </section>

          {/* Step 2 — Context form (shown once file is uploaded) */}
          {creative && (
            <section className="mb-8 space-y-5">
              <h2 className="text-sm font-semibold text-[var(--t2)] uppercase tracking-wider">
                Step 2 — Give the AI Context
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

              {/* Description */}
              <div>
                <label className="block text-xs text-[var(--t3)] mb-1.5 font-medium">
                  What is this creative for? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. A 30-second launch video for our new meal kit service. We want to understand where attention drops and whether the brand reveal at the end lands."
                  rows={3}
                  className="w-full bg-[var(--bg2)] border border-[var(--b1)] rounded-xl px-4 py-3 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-purple-500/60 transition-colors resize-none"
                />
              </div>

              {/* Desired emotions */}
              <div>
                <label className="block text-xs text-[var(--t3)] mb-2 font-medium">
                  Emotions you want to evoke (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOTION_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => toggleEmotion(e)}
                      className={[
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selectedEmotions.has(e)
                          ? 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                          : 'bg-[var(--bg2)] border-[var(--b1)] text-[var(--t2)] hover:border-[var(--b2)]',
                      ].join(' ')}
                    >
                      {e}
                    </button>
                  ))}
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
                  `Pay $${tierPrice} & Analyse — ${tierName}`
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
