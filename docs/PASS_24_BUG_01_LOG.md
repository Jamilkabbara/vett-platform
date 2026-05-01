# Pass 24 Bug 24.01 — Creative Attention v2 (DAIVID + Amplified depth)

**Branch:** `pass-24-bug-01-creative-attention-v2`
**Owner files:**
- `vettit-backend/src/services/ai/creativeAttention.js` (AI prompt + JSONB schema)
- `src/pages/CreativeAttentionResultsPage.tsx` (new visual sections)
- New: `src/components/results/` additions for CA-specific charts (or `src/components/creative-attention/` if scope justifies separation)

**Dependencies / coordination:**
- Builds independently of Pass 23 Bug 23.60 (Agent 1's redesign branch). When 23.60 merges, rebase 24.01 on top — minor merge expected at the Best Platform Fit section since both edit it.
- Pass 23 Agent 2 (`pass-23-bug-74-ca-exports`) drops the export menu inside the `// {Agent2-EXPORTS-START} ... // {Agent2-EXPORTS-END}` markers. 24.01 doesn't touch that slot.

---

## Spec summary (from Pass 24 prompt)

DAIVID provides:
- 39-emotion framework (we expand 8 → 24, fitting the AI scale)
- Predicted active attention (% + seconds)
- Brand recall lift prediction
- Purchase intent prediction
- Industry norms / benchmarks (sneaker, beauty, auto, etc.)
- Composite Creative Effectiveness Score (0-100)
- Second-by-second emotional arc for video

Amplified Intelligence provides:
- Active vs Passive attention split
- Platform/format attention norms (Instagram Feed = 1.2s avg active, etc.)
- Distinctive Brand Asset score (the "1.5 second rule")
- Cross-channel benchmarks (TV vs social vs OOH vs CTV)
- In-flight optimization signals

Current state of `creative_analysis` JSONB on shipped missions:
- ✓ 8 emotions (Plutchik base)
- ✓ 4 brand-strength scores (engagement, resonance, clarity, memory)
- ✓ 5 platform recommendations with rationale (Bug 23.73 shape)
- ✓ Strengths / weaknesses / recommendations text arrays
- ✓ Attention hotspots (text descriptions)
- ✗ No predicted attention seconds
- ✗ No active vs passive split
- ✗ No DBA score / 1.5s read
- ✗ No platform norms (expected vs predicted comparison)
- ✗ No cross-channel benchmarks (TV vs social vs OOH attention curves)
- ✗ No composite Creative Effectiveness Score
- ✗ Only 8 emotions

---

## Chunk plan

| # | Title | Layer | Risk | Est |
|---|---|---|---|---|
| B1 | Lock JSONB schema (frontend types) | frontend (types-only) | none | 1h |
| B2 | Backend AI prompt + schema update | backend | high (prompt reliability) | 2h |
| B3 | Backend composite score calculator | backend | low | 0.5h |
| B4 | Backend push + Railway /version verify | ops | low | 0.25h |
| F1 | Frontend types + backwards-compat fallback | frontend | low | 0.5h |
| F2 | Effectiveness Score dial in hero | frontend | medium | 1h |
| F3 | Attention block (active/passive + DBA + decay) | frontend | medium | 1.5h |
| F4 | 24-emotion radar chart | frontend | medium | 1h |
| F5 | Cross-Channel Benchmarks (paired bars) | frontend | medium | 1h |
| F6 | Platform Fit upgrade with norm bars | frontend | low | 0.75h |
| V  | Fresh CA mission verify + DB row + Chrome | verification | n/a | 0.5h |

**Total:** 9-11h. Each chunk independently committable. Backend chunks (B2/B3/B4) ship together since the AI prompt and composite calc are coupled.

---

## JSONB schema target (v2)

Backwards-compat: ALL new fields are additive. Old missions without these fields render with graceful fallback (frontend hides the new sections rather than crashing). No DB migration required (`creative_analysis` is JSONB).

```ts
interface CreativeAnalysisV2 {
  // V1 fields (preserved exactly)
  frame_analyses: FrameAnalysisV2[];   // emotions Record now ≤ 24 keys
  summary: CreativeSummaryV2;
  total_frames: number;
  is_video: boolean;
  generated_at: string;

  // V2 additions
  attention?: AttentionPrediction;
  channel_benchmarks?: ChannelBenchmark[];
  creative_effectiveness?: EffectivenessScore;
  schema_version?: 'v2';
}

interface AttentionPrediction {
  predicted_active_attention_seconds: number;
  predicted_passive_attention_seconds: number;
  active_attention_pct: number;       // 0-100
  passive_attention_pct: number;      // 0-100
  non_attention_pct: number;          // 0-100  (sums to 100 with the two above)
  distinctive_brand_asset_score: number; // 0-100  ("1.5s rule")
  dba_read_seconds: number;           // how fast brand is identifiable
  attention_decay_curve: Array<{ second: number; active_pct: number }>;
  // For static images: single point at second=0.
  // For video: bucketed every 1s up to mission duration (max 30 entries).
}

interface ChannelBenchmark {
  channel: string;                    // "TV (30s spot)", "Social Feed (paid)", etc.
  category_avg_attention_seconds: number;
  predicted_for_this_creative: number | null;  // null when channel doesn't apply (e.g. TV for static image)
  fit_assessment: string;             // 1-2 sentence assessment
}

interface EffectivenessScore {
  score: number;                      // 0-100 composite
  components: {
    attention: number;
    emotion_intensity: number;
    brand_clarity: number;
    audience_resonance: number;
    platform_fit: number;
  };
  weights: {
    attention: number;
    emotion_intensity: number;
    brand_clarity: number;
    audience_resonance: number;
    platform_fit: number;
  };
  band: 'elite' | 'strong' | 'average' | 'weak' | 'poor';
  band_explanation: string;
}

interface FrameAnalysisV2 extends FrameAnalysis {
  emotions: Record<string, number>;   // up to 24 keys (Plutchik 8 + 16 nuanced)
}

interface CreativeSummaryV2 extends CreativeSummary {
  // existing: overall_engagement_score, emotion_peaks, attention_arc,
  // strengths, weaknesses, recommendations, vs_benchmark, best_platform_fit
  best_platform_fit: PlatformFitV2[];  // shape change — see below
}

interface PlatformFitV2 {
  platform: string;
  rationale: string;
  // V2 additions:
  platform_norm_active_attention_seconds?: number;
  predicted_creative_attention_seconds?: number;
  delta_vs_norm_pct?: number;
  fit_score?: number;                 // 0-100
}
```

---

## Backend prompt strategy

Single Anthropic Vision call per frame (existing pattern from Bug 23.79). The prompt now requests:
1. 24 emotion scores (existing 8 + 16 new)
2. Frame-level engagement / clarity / resonance (existing)
3. Brief description (existing)
4. Attention hotspots (existing)

After all frames analyzed, a SECOND Anthropic call (text-only) synthesizes:
- Overall engagement, peaks, arc, strengths/weaknesses/recs (existing)
- Attention prediction block (NEW)
- Channel benchmarks (NEW)
- Creative Effectiveness Score (NEW — also computed deterministically as a sanity check)
- Best Platform Fit with norm comparisons (UPGRADED)

This two-pass split keeps each prompt focused and the JSON shape predictable.

DAIVID/Amplified norms baked into the synthesis prompt as reference points so the model isn't inventing benchmarks:
- Instagram Feed: 1.2s active, 1.4s passive
- TikTok Feed: 1.4s active
- YouTube Pre-roll: 1.8s active
- Pinterest: 1.5s
- OOH (digital billboard): 0.8s active, 4-6s passive
- CTV (15s): 4.5s active
- Print (luxury): 2-3s
- Programmatic Display: 0.4s
- TV (30s): 12s avg

---

## Verification paths (must pass before merge)

1. Fresh image CA mission (e.g. WebP) → DB row has full v2 shape populated, all top-level fields present.
2. Fresh video CA mission → same, plus `attention_decay_curve` has multiple entries.
3. Old mission (e.g. mission `25343ca8`) → renders WITHOUT new sections, no crash. Backwards-compat fallback works.
4. Cross-Channel Benchmarks render: 5 channels with paired bars (norm vs predicted), color-coded above/at/below norm.
5. 24-emotion radar shows top 8 highlighted; "Show all emotions" toggle reveals full ring.
6. Effectiveness Score dial shows correct band (elite/strong/average/weak/poor).
7. Platform Fit pills upgraded: each platform has norm bar, predicted bar, delta % chip.
8. Attention block: active/passive split renders correctly (sums to 100 with non-attention).
9. DBA score callout shows "Brand identifiable in X.Xs".
10. For images: decay curve renders as a single point. For video: line chart over duration.

---

## Tick-off log

### 2026-05-01 — branch created + plan locked

- ✓ Branched off main (no Pass 23 deferred work merged yet — 24.01 builds independently).
- ✓ Wrote this log + JSONB schema target.
- → **Next: Chunk B1 — define frontend types as the contract source of truth.**
