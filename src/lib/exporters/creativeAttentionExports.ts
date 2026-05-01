/**
 * Pass 23 Bug 23.74 (quickship) — Creative Attention export helpers.
 *
 * Client-side exporters for /creative-results. JSON dumps the full
 * `creative_analysis` JSONB; CSV flattens the key metrics into a
 * spreadsheet-readable shape. PDF/PPTX/XLSX are deferred to a
 * follow-up that needs backend HTML-to-PDF infrastructure (Bug
 * 23.62 Option B); we ship JSON + CSV today so users have a real
 * download path off `/creative-results`.
 *
 * Both functions trigger a browser download via Blob + temp <a>;
 * no fetch, no auth headers, no backend round-trip.
 */

import type {
  CreativeAnalysis,
  PlatformFitItem,
  ChannelBenchmark,
} from '../../types/creativeAnalysis';
import { asPlatformFitObject } from '../../types/creativeAnalysis';

// ── Filename helpers ──────────────────────────────────────────────────────────

function safeFilename(brand: string | null | undefined, suffix: string): string {
  const base = (brand || 'creative_attention').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 60);
  const stamp = new Date().toISOString().slice(0, 10);
  return `${base}_${stamp}.${suffix}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── JSON ─────────────────────────────────────────────────────────────────────

/**
 * Full `creative_analysis` JSONB plus a wrapper with mission metadata
 * (id, brand, generation timestamp). Pretty-printed with 2-space
 * indent so it's human-readable when opened in a code editor or
 * pasted into Notion / Slack.
 */
export function downloadCreativeAnalysisJson(
  analysis: CreativeAnalysis,
  meta: { missionId?: string; brand?: string | null },
): void {
  const payload = {
    mission_id: meta.missionId ?? null,
    brand: meta.brand ?? null,
    exported_at: new Date().toISOString(),
    creative_analysis: analysis,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  downloadBlob(blob, safeFilename(meta.brand, 'json'));
}

// ── CSV ──────────────────────────────────────────────────────────────────────

/**
 * RFC-4180 CSV cell quoting. Wraps every value in double quotes and
 * escapes embedded quotes by doubling them. Returns empty string for
 * null / undefined.
 */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '""';
  const s = String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}

const PLATFORM_HEADERS = [
  'platform',
  'fit_score',
  'platform_norm_active_attention_seconds',
  'predicted_creative_attention_seconds',
  'delta_vs_norm_pct',
  'rationale',
];

const CHANNEL_HEADERS = [
  'channel',
  'category_avg_attention_seconds',
  'predicted_for_this_creative',
  'fit_assessment',
];

/**
 * Flattens the v2 creative_analysis into a sectioned CSV. Each
 * logical section is a header line ("# SECTION_NAME") followed by
 * rows. Empty line between sections. Excel + Numbers + Google Sheets
 * all open this cleanly; the section comments degrade to a row of
 * bold-looking cells without breaking parsing.
 *
 * Sections:
 *   - SUMMARY            — overall scores, attention block, effectiveness
 *   - EMOTIONS           — averaged across frames, all 24 (or all present)
 *   - PLATFORM_FIT       — per-platform norm vs predicted vs delta
 *   - CHANNEL_BENCHMARKS — per-channel norm vs predicted vs assessment
 *   - STRENGTHS          — array dump
 *   - WEAKNESSES         — array dump
 *   - RECOMMENDATIONS    — array dump
 *   - FRAME_ANALYSES     — per-frame raw scores (only for video missions)
 *
 * Prepends the UTF-8 BOM so Excel for Mac auto-detects encoding
 * (matches Pass 23 Bug 23.62 partial fix on the /results CSV path).
 */
export function downloadCreativeAnalysisCsv(
  analysis: CreativeAnalysis,
  meta: { missionId?: string; brand?: string | null },
): void {
  const lines: string[] = [];
  const summary = analysis.summary;
  const eff = analysis.creative_effectiveness;
  const att = analysis.attention;

  // ── SUMMARY ─────────────────────────────────────────────────────────
  lines.push('# SUMMARY');
  lines.push(csvRow(['mission_id', meta.missionId ?? '']));
  lines.push(csvRow(['brand', meta.brand ?? '']));
  lines.push(csvRow(['exported_at', new Date().toISOString()]));
  lines.push(csvRow(['schema_version', analysis.schema_version ?? 'v1']));
  lines.push(csvRow(['is_video', analysis.is_video]));
  lines.push(csvRow(['total_frames', analysis.total_frames]));
  lines.push(csvRow(['overall_engagement_score', summary?.overall_engagement_score ?? '']));
  lines.push(csvRow(['attention_arc', summary?.attention_arc ?? '']));
  lines.push(csvRow(['vs_benchmark', summary?.vs_benchmark ?? '']));

  if (eff) {
    lines.push('');
    lines.push('# CREATIVE_EFFECTIVENESS');
    lines.push(csvRow(['composite_score', eff.score]));
    lines.push(csvRow(['band', eff.band]));
    lines.push(csvRow(['band_explanation', eff.band_explanation]));
    if (eff.components) {
      lines.push(csvRow(['component_attention', eff.components.attention]));
      lines.push(csvRow(['component_emotion_intensity', eff.components.emotion_intensity]));
      lines.push(csvRow(['component_brand_clarity', eff.components.brand_clarity]));
      lines.push(csvRow(['component_audience_resonance', eff.components.audience_resonance]));
      lines.push(csvRow(['component_platform_fit', eff.components.platform_fit]));
    }
  }

  if (att) {
    lines.push('');
    lines.push('# ATTENTION');
    lines.push(csvRow(['predicted_active_attention_seconds', att.predicted_active_attention_seconds]));
    lines.push(csvRow(['predicted_passive_attention_seconds', att.predicted_passive_attention_seconds]));
    lines.push(csvRow(['active_attention_pct', att.active_attention_pct]));
    lines.push(csvRow(['passive_attention_pct', att.passive_attention_pct]));
    lines.push(csvRow(['non_attention_pct', att.non_attention_pct]));
    lines.push(csvRow(['distinctive_brand_asset_score', att.distinctive_brand_asset_score]));
    lines.push(csvRow(['dba_read_seconds', att.dba_read_seconds]));
  }

  // ── EMOTIONS (averaged) ────────────────────────────────────────────
  const emotionAvgs = aggregateEmotions(analysis);
  if (Object.keys(emotionAvgs).length > 0) {
    lines.push('');
    lines.push('# EMOTIONS (averaged across frames)');
    lines.push(csvRow(['emotion', 'avg_score']));
    Object.entries(emotionAvgs)
      .sort(([, a], [, b]) => b - a)
      .forEach(([emotion, score]) => {
        lines.push(csvRow([emotion, score]));
      });
  }

  // ── PLATFORM_FIT ───────────────────────────────────────────────────
  const platformItems = summary?.best_platform_fit ?? [];
  if (platformItems.length > 0) {
    lines.push('');
    lines.push('# PLATFORM_FIT');
    lines.push(csvRow(PLATFORM_HEADERS));
    platformItems.forEach((p: PlatformFitItem) => {
      const obj = asPlatformFitObject(p);
      const platform = typeof p === 'string' ? p : (obj?.platform ?? '');
      lines.push(
        csvRow([
          platform,
          obj?.fit_score ?? '',
          obj?.platform_norm_active_attention_seconds ?? '',
          obj?.predicted_creative_attention_seconds ?? '',
          obj?.delta_vs_norm_pct ?? '',
          obj?.rationale ?? '',
        ]),
      );
    });
  }

  // ── CHANNEL_BENCHMARKS ─────────────────────────────────────────────
  if (analysis.channel_benchmarks && analysis.channel_benchmarks.length > 0) {
    lines.push('');
    lines.push('# CHANNEL_BENCHMARKS');
    lines.push(csvRow(CHANNEL_HEADERS));
    analysis.channel_benchmarks.forEach((c: ChannelBenchmark) => {
      lines.push(
        csvRow([
          c.channel,
          c.category_avg_attention_seconds,
          c.predicted_for_this_creative,
          c.fit_assessment,
        ]),
      );
    });
  }

  // ── Text array dumps ───────────────────────────────────────────────
  const dumpArray = (header: string, arr: string[] | undefined) => {
    if (!arr || arr.length === 0) return;
    lines.push('');
    lines.push(`# ${header}`);
    arr.forEach((item, i) => lines.push(csvRow([i + 1, item])));
  };
  dumpArray('STRENGTHS', summary?.strengths);
  dumpArray('WEAKNESSES', summary?.weaknesses);
  dumpArray('RECOMMENDATIONS', summary?.recommendations);

  // ── FRAME_ANALYSES (video only) ────────────────────────────────────
  if (analysis.is_video && analysis.frame_analyses && analysis.frame_analyses.length > 1) {
    lines.push('');
    lines.push('# FRAME_ANALYSES');
    const allEmotions = new Set<string>();
    analysis.frame_analyses.forEach((f) => {
      Object.keys(f.emotions || {}).forEach((e) => allEmotions.add(e));
    });
    const emotionCols = Array.from(allEmotions);
    lines.push(
      csvRow([
        'timestamp',
        'engagement_score',
        'message_clarity',
        'audience_resonance',
        ...emotionCols,
        'brief_description',
      ]),
    );
    analysis.frame_analyses.forEach((f) => {
      lines.push(
        csvRow([
          f.timestamp,
          f.engagement_score,
          f.message_clarity,
          f.audience_resonance,
          ...emotionCols.map((e) => f.emotions?.[e] ?? 0),
          f.brief_description,
        ]),
      );
    });
  }

  // RFC-4180 line endings + UTF-8 BOM (Excel Mac mojibake fix from
  // Pass 23 Bug 23.62 partial — same pattern here).
  const csv = '﻿' + lines.join('\r\n') + '\r\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, safeFilename(meta.brand, 'csv'));
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function aggregateEmotions(analysis: CreativeAnalysis): Record<string, number> {
  const out: Record<string, number> = {};
  const frames = analysis.frame_analyses ?? [];
  if (frames.length === 0) return out;
  const counts: Record<string, number> = {};
  for (const f of frames) {
    for (const [emotion, score] of Object.entries(f.emotions || {})) {
      const v = Number(score);
      if (!Number.isFinite(v)) continue;
      out[emotion] = (out[emotion] ?? 0) + v;
      counts[emotion] = (counts[emotion] ?? 0) + 1;
    }
  }
  for (const e of Object.keys(out)) {
    out[e] = Math.round(out[e] / (counts[e] || 1));
  }
  return out;
}
