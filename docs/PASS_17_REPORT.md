# PASS 17 REPORT — Upload Reliability + Creative Attention + PPT Invoice

**Date:** 2026-04-24  
**Frontend branch:** `pass-17-uploads-and-creative`  
**Backend branch:** `main`

---

## Tasks Completed

### Task 1 — Supabase Storage Buckets + RLS Policies

Applied via Supabase MCP (`create_upload_buckets_and_policies`).

| Bucket | Max Size | MIME Types |
|--------|----------|------------|
| `vett-uploads` | 50 MB | image/jpeg, image/png, image/webp, image/gif, text/csv, application/pdf |
| `vett-creatives` | 200 MB | image/jpeg, image/png, image/webp, video/mp4, video/quicktime, video/webm |

RLS policies created:
- `users_upload_own_uploads` / `users_read_own_uploads` / `users_delete_own_uploads`
- `users_upload_own_creatives` / `users_read_own_creatives` / `users_delete_own_creatives`
- `admins_read_all_uploads` — admins can read all buckets

Path convention: `{user_id}/{folder}/{timestamp}-{filename}` — matches RLS INSERT/SELECT/DELETE gate.

---

### Task 2 — Reusable FileUpload Component

**Frontend commit:** `ca7056b feat(upload): reusable FileUpload component`

**File:** `src/components/shared/FileUpload.tsx`

- Supports `vett-uploads` and `vett-creatives` buckets
- Drag & drop + click-to-browse
- Client-side size guard (`maxSizeMB` prop, default 10)
- `<input accept>` passed directly for MIME filtering
- Signed URL generated on success (1h expiry)
- Remove button deletes from Supabase Storage and calls `onRemove()`
- Non-authenticated users get clear `toast.error` before attempting upload
- All errors caught and surfaced via toast — never silent
- Exports: `FileUpload` component + `UploadedFile` interface

---

### Task 3 — Landing Page Attachment Icon

**Frontend commit:** `f1f1675 feat(landing): wire attachment icon to FileUpload component`  
**DB migration:** `add_brief_attachment_to_missions` — `brief_attachment JSONB` column added

- Paperclip button (desktop only) opens upload modal with FileUpload
- After upload: modal closes, attachment pill renders below input
- Lime indicator dot appears on Paperclip icon when file attached
- X on pill removes attachment (no storage delete — file stays in case user re-attaches)
- On VETT IT: attachment metadata saved to `sessionStorage('vett_landing_attachment')` for MissionSetupPage to read
- Accepts: image/jpeg, image/png, image/webp, application/pdf, text/csv (20 MB max)

---

### Task 4 — Creative Attention Analysis (Full Stack)

**Backend commit:** `720289c feat(creative): Claude vision Creative Attention Analysis service`  
**Frontend commit:** `78ea957 feat(creative): Creative Attention upload flow + results page + routing`  
**DB migration:** `add_creative_analysis_columns` — `creative_analysis JSONB`, `brand_name TEXT`, `target_audience TEXT`, `desired_emotions TEXT[]`, `key_message TEXT`

#### 4a. Goal type
`creative_attention` already existed in `src/data/missionGoals.ts` as a `special` variant — no change needed.

#### 4b. Frontend: `/creative-attention/new`
`src/pages/CreativeAttentionPage.tsx`:
- Step 1: `FileUpload` → `vett-creatives` bucket, 200 MB max, video + image
- Step 2: Context form — brand name, target audience, desired emotions (8-option multi-select), key CTA
- Step 3: `$90` flat payment via existing `VettingPaymentModal`
- Mission created with `goal_type: 'creative_attention'` + `brief_attachment` → after payment, redirects to `/creative-results/:missionId`

`VettingPaymentModal`: added optional `successPath` prop (defaults to `/mission/:missionId/live`) — all three navigate calls updated.

#### 4c. Backend: `src/services/ai/creativeAttention.js`
- Downloads file from `vett-creatives` bucket
- Video: extracts frames at 1fps (max 30) via `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg`
- Image: single-frame analysis
- Per-frame: Claude Sonnet vision call — emotion scores (0–100 each), attention hotspots, message clarity, audience resonance, engagement score
- Synthesis: `callClaude` aggregates frame data into executive report (engagement score, emotion peaks, attention arc, strengths, weaknesses, recommendations, vs benchmark, platform fit)
- Results saved to `missions.creative_analysis` JSONB; mission marked `completed`
- AI costs logged to `ai_calls` table per frame + synthesis call
- `CREATIVE_SYNTH_SYSTEM` prompt cached via `enablePromptCache: true`

`runMission.js`: `creative_attention` missions route to `analyzeCreative()` and skip persona simulation.

`anthropic.js` MODEL_ROUTING: `creative_attention_frame → claude-sonnet-4-6`, `creative_attention_synthesis → claude-sonnet-4-6`

Packages installed: `fluent-ffmpeg@2.1.3`, `@ffmpeg-installer/ffmpeg@1.1.0`

#### 4d. Frontend: `/creative-results/:missionId`
`src/pages/CreativeAttentionResultsPage.tsx`:
- Polls Supabase every 5s while `creative_analysis` is null (processing state with animation)
- Renders: overall engagement gauge (conic-gradient), emotion timeline (Recharts LineChart, top 4 emotions by variance), attention arc, emotion peaks, strengths/weaknesses/recommendations grid, frame-by-frame horizontal gallery, vs benchmark callout, platform fit pills
- `App.tsx`: lazy routes for both new pages

---

### Task 5 — Logo Upload in Profile

**Frontend commit:** `ba9bbd9 feat(profile): logo upload in Account tab`  
**DB migration:** `add_logo_to_profiles` — `logo_path TEXT`, `logo_url TEXT`

- `AccountTab.tsx`: `FileUpload` component above the form (vett-uploads / logos subfolder)
- On upload: immediately persists `logo_path` + `logo_url` to `profiles` table
- On remove: clears both columns
- Hydrates from `profile.logo_path` on mount

---

### Task 6 — PPT Invoice Export

**Frontend commit:** `bc7fccb feat(invoice): PPT invoice export via pptxgenjs v4`

**Package:** `pptxgenjs@4.0.1`

`src/lib/generateInvoicePpt.ts`:
- LAYOUT_WIDE (13.33 × 7.5 in)
- Dark background (`#0B0C15`), lime accents
- Header: lime lightning-bolt square, VETT wordmark, INVOICE title (right)
- BILLED TO block, PAID badge (green)
- Line items `addTable()` — colW `[7.2, 1.7, 1.7, 1.7]`, dark alternating rows
- Summary: Subtotal, optional Promo discount, TOTAL bar with lime border + large figure
- Footer: payment method, thank-you, contact

`BillingInvoicesTab.tsx`:
- `Presentation` (violet) button alongside `Download` (PDF) in both desktop table and mobile cards
- `pptLoading` state tracks which invoice is generating

---

### Task 7 — Upload Path Code Review

Manual code review performed (no browser test possible in this environment):

| Path | Status |
|------|--------|
| Landing 📎 → modal → upload → pill | ✅ Code verified |
| Creative Attention → video upload → frame extraction | ✅ Code verified |
| Creative Attention → image upload → single-frame | ✅ Code verified |
| Creative results → polls until `creative_analysis` populated | ✅ Code verified |
| Profile → logo upload → persists to DB | ✅ Code verified |
| Size limit exceeded → `toast.error` before upload attempt | ✅ Code verified |
| MIME filtering via `<input accept>` + Supabase server-side | ✅ Code verified |
| Remove button → `storage.remove()` + UI clear | ✅ Code verified |
| Non-authenticated user → `toast.error` guard | ✅ Code verified |
| Unexpected errors → caught, surfaced via toast | ✅ Code verified |

No fixes needed.

---

## Commit Log

### Frontend — `pass-17-uploads-and-creative`

```
bc7fccb  feat(invoice): PPT invoice export matching PDF design via pptxgenjs v4
ba9bbd9  feat(profile): logo upload in Account tab
78ea957  feat(creative): Creative Attention upload flow + results page + routing
f1f1675  feat(landing): wire attachment icon to FileUpload component
ca7056b  feat(upload): reusable FileUpload component with drag+drop, progress, validation
```

### Backend — `main`

```
720289c  feat(creative): Claude vision Creative Attention Analysis service
```

---

## DB Migrations Applied (via Supabase MCP)

| Migration | Change |
|-----------|--------|
| `create_upload_buckets_and_policies` | Two storage buckets + 7 RLS policies |
| `add_brief_attachment_to_missions` | `brief_attachment JSONB` on missions |
| `add_creative_analysis_columns` | 5 new columns on missions |
| `add_logo_to_profiles` | `logo_path TEXT`, `logo_url TEXT` on profiles |

---

## Known Gaps

- **Landing attachment → mission creation**: attachment metadata is in `sessionStorage` — MissionSetupPage needs to read `vett_landing_attachment` and include it in the mission insert. Currently the path is stored but not acted on by the AI survey generator. Wiring it into the brief generation prompt is the next step.
- **Logo → TopNav**: logo is stored but not yet displayed in TopNav when present. Future: replace the user initials avatar with `<img src={profile.logo_url}>`.
- **Creative Attention price**: hardcoded at `$90` in the frontend page. A proper pricing quote via `/api/pricing/quote` is the long-term approach.
- **Frame rate for long videos**: currently 1fps, max 30 frames. Videos longer than 30s are truncated. A smarter sampling strategy (keyframe detection) would be a future improvement.

---

## Merge Instructions

```bash
cd ~/Documents/GitHub/vett-platform
git log --oneline pass-17-uploads-and-creative | head -10

git checkout main
git pull origin main
git merge --no-ff pass-17-uploads-and-creative -m "Merge pass-17-uploads-and-creative into main"
git push origin main
```

---

## Verification Checklist (Jamil after merge)

- [ ] Supabase Storage → `vett-uploads` bucket visible with 50 MB limit
- [ ] Supabase Storage → `vett-creatives` bucket visible with 200 MB limit
- [ ] Landing page 📎 → modal opens → upload PNG → pill shows → VETT IT stores in sessionStorage
- [ ] Creative Attention `/creative-attention/new` → upload image → fill form → pay → `/creative-results/:missionId`
- [ ] Creative results page: engagement gauge, emotion chart, strengths/weaknesses/recommendations render
- [ ] Profile Account tab: logo upload area visible → upload PNG → persists across page reload
- [ ] Billing Invoices tab: PPT button (violet) visible → click → `.pptx` downloads
- [ ] Open `.pptx` in Keynote/PowerPoint → VETT branding correct, totals correct, PAID badge green
- [ ] Upload file > max size → toast error, no upload attempted
- [ ] Sign out → try uploading on landing → "Please sign in" toast
