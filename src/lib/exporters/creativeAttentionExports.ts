/**
 * Pass 23 Bug 23.74 (quickship) — Creative Attention export helpers.
 * Pass 32 X3 — PDF / PPTX / XLSX exporters added. The original CSV +
 * JSON path stays unchanged; the three new exporters are LAZY-IMPORTED
 * so they don't add weight to the /creative-results entry chunk —
 * jspdf, jspdf-autotable, pptxgenjs, and xlsx ride in only when the
 * user actually clicks the matching menu item.
 *
 * Client-side only. JSON dumps the full creative_analysis JSONB; CSV
 * flattens the key metrics into a sectioned spreadsheet shape; PDF /
 * PPTX / XLSX render the same data into branded reports for sharing.
 *
 * Every exporter triggers a browser download via Blob + temp <a>;
 * no fetch, no auth headers, no backend round-trip.
 */

import type {
  CreativeAnalysis,
  PlatformFitItem,
  ChannelBenchmark,
  FrameAnalysis,
} from '../../types/creativeAnalysis';
import { asPlatformFitObject } from '../../types/creativeAnalysis';
import {
  EXPORT_RGB,
  EXPORT_FONTS,
  EXPORT_DISCLOSURES,
  drawJsPdfLogo,
} from './brandTokens';

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

// ── Pass 32 X3 — PDF / PPTX / XLSX (lazy-imported) ────────────────────────────

// Pass 33 W9 — metaRows + topEmotions + BAND_LABEL helpers retired.
// The W9 rebuilds inline their summary-table construction directly so
// each export surface (PDF/PPTX/XLSX) can format values for its own
// rendering primitives without going through a string-only middle
// layer.

/**
 * Pass 33 W9a — Creative Attention PDF rebuild.
 *
 * Pass 32 X3 shipped the format with default jsPDF styling — black-on-
 * white, no logo, generic Arial, ~30% data coverage. The user opened
 * the PDF and called it "basic with wrong branding". W9a rebuilds the
 * pipeline against the shared brandTokens (lime BEF264 + indigo 6366F1
 * accents on white surface), full data coverage (8 summary fields + 7
 * fields per frame_analysis row), VETT logo lockup on cover, and a
 * methodology disclosure page at the end.
 *
 * Layout:
 *   Page 1 — Cover: logo lockup, eyebrow, title, brand metadata, footer
 *   Page 2 — Executive summary: KPI strip + strengths/weaknesses/recs
 *   Page 3 — Attention arc: line chart + emotion peak callouts
 *   Page 4-N — Per-frame analysis (video) or single-image analysis
 *   Page N+1 — Methodology disclosure
 */
export async function downloadCreativeAnalysisPdf(
  analysis: CreativeAnalysis,
  meta: { missionId?: string; brand?: string | null },
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;

  const summary = analysis.summary;
  const eff = analysis.creative_effectiveness;
  const att = analysis.attention;
  const frames = analysis.frame_analyses ?? [];

  // ── Page 1 — Cover ──────────────────────────────────────────────
  drawJsPdfLogo(doc, margin, margin, 32, { withWordmark: true });

  // Eyebrow
  doc.setFont(EXPORT_FONTS.body.jsPdf, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...EXPORT_RGB.indigo);
  doc.text('CREATIVE ATTENTION ANALYSIS', margin, pageH * 0.42);

  // Title
  doc.setFont(EXPORT_FONTS.heading.jsPdf, 'bold');
  doc.setFontSize(40);
  doc.setTextColor(...EXPORT_RGB.ink);
  doc.text(meta.brand ?? 'Untitled creative', margin, pageH * 0.5);

  // Body summary
  doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...EXPORT_RGB.gray);
  const coverLines = [
    `Mission ID: ${meta.missionId ?? '—'}`,
    `Asset: ${analysis.is_video ? `Video (${analysis.total_frames} frames)` : 'Static image'}`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
  ];
  let coverY = pageH * 0.55;
  for (const line of coverLines) {
    doc.text(line, margin, coverY);
    coverY += 16;
  }

  // Lime divider
  doc.setDrawColor(...EXPORT_RGB.lime);
  doc.setLineWidth(2);
  doc.line(margin, pageH * 0.65, margin + 80, pageH * 0.65);

  drawPageFooter(doc, pageW, pageH, margin, 1);

  // ── Page 2 — Executive summary ──────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, margin, 'Executive summary');

  // KPI strip (3 cards horizontal)
  const kpiTop = margin + 60;
  const kpiW = (pageW - 2 * margin - 24) / 3;
  const kpiH = 90;

  // KPI 1: Engagement / effectiveness score
  drawKpiCard(doc, margin, kpiTop, kpiW, kpiH,
    'OVERALL ENGAGEMENT',
    summary?.overall_engagement_score != null
      ? `${summary.overall_engagement_score}/100`
      : (eff?.score != null ? `${eff.score}/100` : '—'),
    eff?.band ? eff.band.toUpperCase() : (summary?.attention_arc ? 'directional' : ''),
  );

  // KPI 2: Best platform fit
  const topPlatform = (summary?.best_platform_fit ?? [])[0];
  let platformLabelText = '—';
  let platformSubText = '';
  if (topPlatform) {
    const obj = asPlatformFitObject(topPlatform);
    platformLabelText = typeof topPlatform === 'string' ? topPlatform : (obj?.platform ?? '—');
    platformSubText = obj?.fit_score != null ? `Fit ${obj.fit_score}/100` : '';
  }
  drawKpiCard(doc, margin + kpiW + 12, kpiTop, kpiW, kpiH,
    'BEST PLATFORM FIT',
    platformLabelText,
    platformSubText,
  );

  // KPI 3: vs benchmark
  drawKpiCard(doc, margin + 2 * (kpiW + 12), kpiTop, kpiW, kpiH,
    'VS CATEGORY BENCHMARK',
    summary?.vs_benchmark ? truncate(summary.vs_benchmark, 30) : '—',
    summary?.attention_arc ? truncate(summary.attention_arc, 40) : '',
  );

  // Strengths / Weaknesses / Recommendations panels
  let panelY = kpiTop + kpiH + 30;
  panelY = drawListPanel(doc, margin, panelY, pageW - 2 * margin, 'STRENGTHS',
    summary?.strengths ?? [], EXPORT_RGB.lime);
  panelY = drawListPanel(doc, margin, panelY + 14, pageW - 2 * margin, 'WEAKNESSES',
    summary?.weaknesses ?? [], EXPORT_RGB.red);
  panelY = drawListPanel(doc, margin, panelY + 14, pageW - 2 * margin, 'RECOMMENDATIONS',
    summary?.recommendations ?? [], EXPORT_RGB.indigo);

  drawPageFooter(doc, pageW, pageH, margin, 2);

  // ── Page 3 — Attention arc ──────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, margin, 'Attention arc');
  let pageNum = 3;

  // Description prose
  if (summary?.attention_arc) {
    doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...EXPORT_RGB.ink);
    const lines = doc.splitTextToSize(summary.attention_arc, pageW - 2 * margin);
    doc.text(lines, margin, margin + 56);
  }

  // Engagement-per-frame line chart
  if (frames.length > 0) {
    const chartY = margin + 130;
    const chartH = 200;
    drawEngagementLineChart(doc, margin, chartY, pageW - 2 * margin, chartH, frames);
  }

  // Attention block (active vs passive vs non) if v2 schema present
  if (att) {
    const attY = margin + 360;
    doc.setFont(EXPORT_FONTS.heading.jsPdf, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...EXPORT_RGB.ink);
    doc.text('Attention prediction', margin, attY);

    doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
    doc.setFontSize(10);
    const attRows = [
      [`Active`, `${att.predicted_active_attention_seconds ?? '—'}s · ${att.active_attention_pct ?? '—'}%`],
      [`Passive`, `${att.predicted_passive_attention_seconds ?? '—'}s · ${att.passive_attention_pct ?? '—'}%`],
      [`Non-attention`, `${att.non_attention_pct ?? '—'}%`],
      [`Distinctive brand asset`, `${att.distinctive_brand_asset_score ?? '—'}/100 · reads in ${att.dba_read_seconds ?? '—'}s`],
    ];
    let attRowY = attY + 16;
    for (const [k, v] of attRows) {
      doc.setTextColor(...EXPORT_RGB.gray);
      doc.text(k, margin, attRowY);
      doc.setTextColor(...EXPORT_RGB.ink);
      doc.text(v, margin + 160, attRowY);
      attRowY += 16;
    }
  }

  drawPageFooter(doc, pageW, pageH, margin, pageNum);

  // ── Pages 4-N — Per-frame analysis ──────────────────────────────
  for (const frame of frames) {
    doc.addPage();
    pageNum += 1;
    drawPageHeader(doc, margin,
      analysis.is_video ? `Frame at ${formatTimestamp(frame.timestamp)}` : 'Static image analysis');

    // Donut top-right + brief description top-left
    drawScoreDonut(doc, pageW - margin - 70, margin + 60, 30, frame.engagement_score ?? 0);

    doc.setFont(EXPORT_FONTS.heading.jsPdf, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...EXPORT_RGB.indigo);
    doc.text("WHAT'S HAPPENING", margin, margin + 60);

    doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...EXPORT_RGB.ink);
    const descLines = doc.splitTextToSize(frame.brief_description || '—', pageW - 2 * margin - 90);
    doc.text(descLines, margin, margin + 76);

    // Emotion bars
    const emotionBarY = margin + 170;
    doc.setFont(EXPORT_FONTS.heading.jsPdf, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...EXPORT_RGB.indigo);
    doc.text('EMOTION INTENSITY', margin, emotionBarY);

    drawEmotionBars(doc, margin, emotionBarY + 14, pageW - 2 * margin, 200, frame.emotions || {});

    // Hotspots
    const hotspotY = margin + 410;
    doc.setFont(EXPORT_FONTS.heading.jsPdf, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...EXPORT_RGB.indigo);
    doc.text('ATTENTION HOTSPOTS', margin, hotspotY);

    doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...EXPORT_RGB.ink);
    const hotspots = frame.attention_hotspots ?? [];
    if (hotspots.length === 0) {
      doc.setTextColor(...EXPORT_RGB.gray);
      doc.text('No specific regions detected.', margin, hotspotY + 16);
    } else {
      let hY = hotspotY + 16;
      for (const h of hotspots.slice(0, 6)) {
        const hLines = doc.splitTextToSize(`• ${h}`, pageW - 2 * margin);
        doc.text(hLines, margin, hY);
        hY += hLines.length * 12 + 2;
      }
    }

    // Audience resonance + message clarity
    const resoY = pageH - margin - 80;
    doc.setFont(EXPORT_FONTS.body.jsPdf, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...EXPORT_RGB.gray);
    doc.text('AUDIENCE RESONANCE', margin, resoY);
    doc.text('MESSAGE CLARITY', margin + (pageW - 2 * margin) / 2, resoY);

    doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...EXPORT_RGB.ink);
    doc.text(String(frame.audience_resonance ?? '—'), margin, resoY + 14);
    doc.text(`${frame.message_clarity ?? '—'}/5`, margin + (pageW - 2 * margin) / 2, resoY + 14);

    drawPageFooter(doc, pageW, pageH, margin, pageNum);
  }

  // ── Final page — Methodology disclosure ─────────────────────────
  doc.addPage();
  pageNum += 1;
  drawPageHeader(doc, margin, 'Methodology');

  doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...EXPORT_RGB.ink);
  const methLines = doc.splitTextToSize(
    EXPORT_DISCLOSURES.creativeAttentionMethodology,
    pageW - 2 * margin,
  );
  doc.text(methLines, margin, margin + 60);

  doc.setFontSize(9);
  doc.setTextColor(...EXPORT_RGB.gray);
  doc.text(
    `Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC.`,
    margin, margin + 60 + methLines.length * 14 + 20,
  );

  drawPageFooter(doc, pageW, pageH, margin, pageNum);

  doc.save(safeFilename(meta.brand, 'pdf'));
}

// ── jsPDF rendering helpers (Pass 33 W9a) ────────────────────────────

function drawPageHeader(doc: import('jspdf').jsPDF, margin: number, title: string): void {
  drawJsPdfLogo(doc, margin, margin - 10, 18, { withWordmark: false });
  doc.setFont(EXPORT_FONTS.heading.jsPdf, 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...EXPORT_RGB.ink);
  doc.text(title, margin + 30, margin + 4);
  // Lime divider under heading
  doc.setDrawColor(...EXPORT_RGB.lime);
  doc.setLineWidth(1);
  doc.line(margin, margin + 28, doc.internal.pageSize.getWidth() - margin, margin + 28);
}

function drawPageFooter(
  doc: import('jspdf').jsPDF,
  pageW: number,
  pageH: number,
  margin: number,
  pageNum: number,
): void {
  doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...EXPORT_RGB.gray);
  doc.text(EXPORT_DISCLOSURES.pageFooter, margin, pageH - margin / 2);
  doc.text(String(pageNum), pageW - margin, pageH - margin / 2, { align: 'right' });
}

function drawKpiCard(
  doc: import('jspdf').jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, value: string, sub: string,
): void {
  // Soft background
  doc.setFillColor(250, 250, 250);
  if (typeof (doc as { roundedRect?: unknown }).roundedRect === 'function') {
    doc.roundedRect(x, y, w, h, 8, 8, 'F');
  } else {
    doc.rect(x, y, w, h, 'F');
  }
  // Lime accent strip on left
  doc.setFillColor(...EXPORT_RGB.lime);
  doc.rect(x, y, 4, h, 'F');

  doc.setFont(EXPORT_FONTS.body.jsPdf, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...EXPORT_RGB.gray);
  doc.text(label, x + 14, y + 18);

  doc.setFont(EXPORT_FONTS.heading.jsPdf, 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...EXPORT_RGB.ink);
  const valLines = doc.splitTextToSize(value, w - 22);
  doc.text(valLines.slice(0, 1), x + 14, y + 44);

  if (sub) {
    doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...EXPORT_RGB.gray);
    const subLines = doc.splitTextToSize(sub, w - 22);
    doc.text(subLines.slice(0, 2), x + 14, y + 64);
  }
}

function drawListPanel(
  doc: import('jspdf').jsPDF,
  x: number, y: number, w: number,
  label: string, items: string[],
  accentRgb: [number, number, number],
): number {
  if (items.length === 0) {
    return y;
  }
  // Title
  doc.setFont(EXPORT_FONTS.heading.jsPdf, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...accentRgb);
  doc.text(label, x, y);

  // Lime/accent dot
  doc.setFillColor(...accentRgb);
  doc.circle(x - 6, y - 3, 2, 'F');

  // Items
  doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...EXPORT_RGB.ink);
  let cursorY = y + 18;
  for (const item of items.slice(0, 5)) {
    const lines = doc.splitTextToSize(`• ${item}`, w);
    doc.text(lines, x, cursorY);
    cursorY += lines.length * 12 + 2;
  }
  return cursorY;
}

function drawEngagementLineChart(
  doc: import('jspdf').jsPDF,
  x: number, y: number, w: number, h: number,
  frames: FrameAnalysis[],
): void {
  if (frames.length === 0) return;
  // Frame x-positions normalized to chart width
  const xs = frames.map((_, i) =>
    frames.length === 1 ? x + w / 2 : x + (i / (frames.length - 1)) * w
  );
  const ys = frames.map((f) => {
    const score = Number(f.engagement_score ?? 0);
    const clamped = Math.min(100, Math.max(0, score));
    return y + h - (clamped / 100) * (h - 12);
  });

  // Y-axis baseline + 50/100 grid lines
  doc.setDrawColor(...EXPORT_RGB.graySoft);
  doc.setLineWidth(0.5);
  for (const pct of [0, 50, 100]) {
    const yy = y + h - (pct / 100) * (h - 12);
    doc.line(x, yy, x + w, yy);
    doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...EXPORT_RGB.gray);
    doc.text(String(pct), x - 14, yy + 2);
  }

  // Plot line (lime)
  doc.setDrawColor(...EXPORT_RGB.lime);
  doc.setLineWidth(2);
  for (let i = 1; i < xs.length; i++) {
    doc.line(xs[i - 1]!, ys[i - 1]!, xs[i]!, ys[i]!);
  }

  // Plot points (indigo)
  doc.setFillColor(...EXPORT_RGB.indigo);
  for (let i = 0; i < xs.length; i++) {
    doc.circle(xs[i]!, ys[i]!, 2.5, 'F');
  }

  // X-axis label
  doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...EXPORT_RGB.gray);
  doc.text('Engagement score per frame', x, y + h + 16);
}

function drawEmotionBars(
  doc: import('jspdf').jsPDF,
  x: number, y: number, w: number, maxH: number,
  emotions: Record<string, number>,
): void {
  const entries = Object.entries(emotions)
    .filter(([, v]) => Number.isFinite(Number(v)))
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 12);
  if (entries.length === 0) {
    doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...EXPORT_RGB.gray);
    doc.text('No emotion data.', x, y + 16);
    return;
  }

  const labelW = 110;
  const maxBarW = w - labelW - 50;
  const rowH = Math.min(18, maxH / entries.length);
  doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
  doc.setFontSize(9);

  entries.forEach(([emotion, score], idx) => {
    const rowY = y + idx * rowH;
    const v = Math.min(100, Math.max(0, Number(score) || 0));
    // Label
    doc.setTextColor(...EXPORT_RGB.ink);
    doc.text(emotion, x, rowY + rowH * 0.7);
    // Bar background
    doc.setFillColor(...EXPORT_RGB.graySoft);
    doc.rect(x + labelW, rowY + 2, maxBarW, rowH - 6, 'F');
    // Bar fill (lime for high, indigo for low; simple heuristic)
    const fillW = (v / 100) * maxBarW;
    if (v >= 50) doc.setFillColor(...EXPORT_RGB.lime);
    else doc.setFillColor(...EXPORT_RGB.indigo);
    doc.rect(x + labelW, rowY + 2, fillW, rowH - 6, 'F');
    // Score
    doc.setTextColor(...EXPORT_RGB.gray);
    doc.text(`${Math.round(v)}`, x + labelW + maxBarW + 8, rowY + rowH * 0.7);
  });
}

function drawScoreDonut(
  doc: import('jspdf').jsPDF,
  cx: number, cy: number, r: number,
  score: number,
): void {
  // Simplified "donut" — outer lime ring with score text in the center.
  // jsPDF doesn't have native arc primitives, so we render a filled
  // circle with a smaller white circle inside.
  const v = Math.min(100, Math.max(0, Number(score) || 0));
  doc.setFillColor(...EXPORT_RGB.lime);
  doc.circle(cx, cy, r, 'F');
  doc.setFillColor(...EXPORT_RGB.paper);
  doc.circle(cx, cy, r * 0.72, 'F');

  doc.setFont(EXPORT_FONTS.heading.jsPdf, 'bold');
  doc.setFontSize(r * 0.55);
  doc.setTextColor(...EXPORT_RGB.ink);
  const txt = `${Math.round(v)}`;
  const txtW = doc.getTextWidth(txt);
  doc.text(txt, cx - txtW / 2, cy + r * 0.18);

  doc.setFont(EXPORT_FONTS.body.jsPdf, 'normal');
  doc.setFontSize(r * 0.22);
  doc.setTextColor(...EXPORT_RGB.gray);
  const sub = '/100';
  const subW = doc.getTextWidth(sub);
  doc.text(sub, cx - subW / 2, cy + r * 0.45);
}

function formatTimestamp(ts: number | string | undefined): string {
  if (ts == null) return '—';
  const n = Number(ts);
  if (!Number.isFinite(n)) return String(ts);
  if (n < 60) return `${n.toFixed(1)}s`;
  const m = Math.floor(n / 60);
  const s = Math.round(n - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/**
 * Pass 33 W9b — Creative Attention PPTX rebuild.
 *
 * White slide surface (was dark mode), VETT lime square logo top-left
 * + slide number bottom-right on every slide, native pptxgenjs charts
 * so PowerPoint users can edit them. Same data coverage as the PDF
 * rebuild: cover → exec summary → attention arc (engagement chart) →
 * per-frame slides (donut + emotion bar chart + hotspots + clarity) →
 * methodology disclosure.
 */
export async function downloadCreativeAnalysisPptx(
  analysis: CreativeAnalysis,
  meta: { missionId?: string; brand?: string | null },
): Promise<void> {
  const PptxGenModule = await import('pptxgenjs');
  const PptxGen = PptxGenModule.default;

  // Brand tokens — pptxgenjs takes 6-char hex strings (no #).
  const INK    = '0B0C15';
  const PAPER  = 'FFFFFF';
  const SOFT   = 'FAFAFA';
  const LIME   = 'BEF264';
  const INDIGO = '6366F1';
  const GRAY   = '9CA3AF';

  const pptx = new PptxGen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = `${meta.brand ?? 'Creative Attention'} — VETT report`;

  // Slide-master with the lime square logo + footer.
  pptx.defineSlideMaster({
    title: 'VETT_MASTER',
    background: { color: PAPER },
    objects: [
      // Lime logo square top-left
      { rect: { x: 0.4, y: 0.3, w: 0.45, h: 0.45, fill: { color: LIME }, line: { color: LIME, width: 0 } } },
      // VETT wordmark
      { text: {
          text: 'VETT',
          options: { x: 0.95, y: 0.3, w: 1.0, h: 0.45, color: INK, fontSize: 18, bold: true, fontFace: 'Calibri', valign: 'middle' },
        } },
      // vettit.ai mark top-right
      { text: {
          text: 'vettit.ai',
          options: { x: 11.0, y: 0.3, w: 2.0, h: 0.45, color: GRAY, fontSize: 12, fontFace: 'Calibri', align: 'right', valign: 'middle' },
        } },
      // Page footer
      { text: {
          text: EXPORT_DISCLOSURES.pageFooter,
          options: { x: 0.4, y: 7.0, w: 11.5, h: 0.3, color: GRAY, fontSize: 9, fontFace: 'Calibri' },
        } },
    ],
    slideNumber: { x: 12.7, y: 7.0, w: 0.5, h: 0.3, color: GRAY, fontSize: 9, fontFace: 'Calibri', align: 'right' },
  });

  const summary = analysis.summary;
  const eff = analysis.creative_effectiveness;
  const att = analysis.attention;
  const frames = analysis.frame_analyses ?? [];

  // ── Slide 1 — Cover ───────────────────────────────────────────
  const s1 = pptx.addSlide({ masterName: 'VETT_MASTER' });
  s1.addText('CREATIVE ATTENTION ANALYSIS', {
    x: 0.5, y: 2.6, w: 12, h: 0.4,
    fontSize: 14, bold: true, color: INDIGO, fontFace: 'Calibri',
  });
  s1.addText(meta.brand ?? 'Untitled creative', {
    x: 0.5, y: 3.1, w: 12, h: 1.0,
    fontSize: 48, bold: true, color: INK, fontFace: 'Calibri',
  });
  s1.addText([
    { text: `Mission ID: ${meta.missionId ?? '—'}\n` },
    { text: `Asset: ${analysis.is_video ? `Video (${analysis.total_frames} frames)` : 'Static image'}\n` },
    { text: `Generated: ${new Date().toISOString().slice(0, 10)}` },
  ], {
    x: 0.5, y: 4.4, w: 12, h: 1.5,
    fontSize: 14, color: GRAY, fontFace: 'Calibri',
  });
  // Lime divider
  s1.addShape('line', {
    x: 0.5, y: 5.6, w: 1.0, h: 0,
    line: { color: LIME, width: 4 },
  });

  // ── Slide 2 — Executive summary ───────────────────────────────
  const s2 = pptx.addSlide({ masterName: 'VETT_MASTER' });
  s2.addText('Executive summary', {
    x: 0.5, y: 1.0, w: 12, h: 0.6,
    fontSize: 28, bold: true, color: INK, fontFace: 'Calibri',
  });
  s2.addShape('line', {
    x: 0.5, y: 1.7, w: 12, h: 0,
    line: { color: LIME, width: 1 },
  });

  // KPI strip — 3 cards
  const kpiTop = 2.0;
  const kpiW = 4.0;
  const kpiH = 1.4;
  const kpis = [
    {
      label: 'OVERALL ENGAGEMENT',
      value: summary?.overall_engagement_score != null
        ? `${summary.overall_engagement_score}/100`
        : (eff?.score != null ? `${eff.score}/100` : '—'),
      sub: eff?.band ? eff.band.toUpperCase() : '',
    },
    {
      label: 'BEST PLATFORM FIT',
      value: (() => {
        const p = (summary?.best_platform_fit ?? [])[0];
        if (!p) return '—';
        const obj = asPlatformFitObject(p);
        return typeof p === 'string' ? p : (obj?.platform ?? '—');
      })(),
      sub: (() => {
        const p = (summary?.best_platform_fit ?? [])[0];
        if (!p || typeof p === 'string') return '';
        const obj = asPlatformFitObject(p);
        return obj?.fit_score != null ? `Fit ${obj.fit_score}/100` : '';
      })(),
    },
    {
      label: 'VS CATEGORY BENCHMARK',
      value: summary?.vs_benchmark ? truncate(summary.vs_benchmark, 28) : '—',
      sub: summary?.attention_arc ? truncate(summary.attention_arc, 36) : '',
    },
  ];
  kpis.forEach((kpi, i) => {
    const x = 0.5 + i * (kpiW + 0.25);
    s2.addShape('rect', {
      x, y: kpiTop, w: kpiW, h: kpiH,
      fill: { color: SOFT }, line: { color: SOFT, width: 0 },
    });
    s2.addShape('rect', {
      x, y: kpiTop, w: 0.08, h: kpiH,
      fill: { color: LIME }, line: { color: LIME, width: 0 },
    });
    s2.addText(kpi.label, {
      x: x + 0.2, y: kpiTop + 0.1, w: kpiW - 0.3, h: 0.3,
      fontSize: 9, bold: true, color: GRAY, fontFace: 'Calibri',
    });
    s2.addText(kpi.value, {
      x: x + 0.2, y: kpiTop + 0.4, w: kpiW - 0.3, h: 0.6,
      fontSize: 22, bold: true, color: INK, fontFace: 'Calibri',
    });
    if (kpi.sub) {
      s2.addText(kpi.sub, {
        x: x + 0.2, y: kpiTop + 1.0, w: kpiW - 0.3, h: 0.3,
        fontSize: 10, color: GRAY, fontFace: 'Calibri',
      });
    }
  });

  // S/W/Reco panels stacked
  const lists: Array<[string, string[] | undefined, string]> = [
    ['STRENGTHS', summary?.strengths, LIME],
    ['WEAKNESSES', summary?.weaknesses, 'EF4444'],
    ['RECOMMENDATIONS', summary?.recommendations, INDIGO],
  ];
  let panelY = kpiTop + kpiH + 0.4;
  for (const [label, items, accent] of lists) {
    if (!items || items.length === 0) continue;
    s2.addText(label, {
      x: 0.5, y: panelY, w: 12, h: 0.3,
      fontSize: 11, bold: true, color: accent, fontFace: 'Calibri',
    });
    s2.addText(
      items.slice(0, 4).map((item) => ({ text: item, options: { bullet: true, color: INK, fontSize: 11 } })),
      { x: 0.6, y: panelY + 0.32, w: 12, h: 0.7, fontFace: 'Calibri' },
    );
    panelY += 1.1;
  }

  // ── Slide 3 — Attention arc ───────────────────────────────────
  const s3 = pptx.addSlide({ masterName: 'VETT_MASTER' });
  s3.addText('Attention arc', {
    x: 0.5, y: 1.0, w: 12, h: 0.6,
    fontSize: 28, bold: true, color: INK, fontFace: 'Calibri',
  });
  s3.addShape('line', {
    x: 0.5, y: 1.7, w: 12, h: 0,
    line: { color: LIME, width: 1 },
  });
  if (summary?.attention_arc) {
    s3.addText(summary.attention_arc, {
      x: 0.5, y: 1.9, w: 12, h: 0.8,
      fontSize: 11, color: INK, fontFace: 'Calibri',
    });
  }
  if (frames.length > 0) {
    s3.addChart('line' as unknown as Parameters<typeof s3.addChart>[0], [
      {
        name: 'Engagement',
        labels: frames.map((f) => formatTimestamp(f.timestamp)),
        values: frames.map((f) => Number(f.engagement_score ?? 0)),
      },
    ], {
      x: 0.5, y: 2.9, w: 12, h: 4.0,
      chartColors: [LIME.replace('#', '')],
      catAxisLabelColor: INK,
      valAxisLabelColor: INK,
      showLegend: false,
      lineDataSymbol: 'circle',
      lineDataSymbolSize: 8,
    });
  }
  if (att) {
    s3.addText([
      { text: 'Active ', options: { color: GRAY } },
      { text: `${att.predicted_active_attention_seconds ?? '—'}s · ${att.active_attention_pct ?? '—'}%`, options: { color: INK, bold: true } },
      { text: '   Passive ', options: { color: GRAY } },
      { text: `${att.predicted_passive_attention_seconds ?? '—'}s · ${att.passive_attention_pct ?? '—'}%`, options: { color: INK, bold: true } },
      { text: '   DBA ', options: { color: GRAY } },
      { text: `${att.distinctive_brand_asset_score ?? '—'}/100`, options: { color: INK, bold: true } },
    ], {
      x: 0.5, y: 6.6, w: 12, h: 0.3,
      fontSize: 11, fontFace: 'Calibri',
    });
  }

  // ── Per-frame slides ──────────────────────────────────────────
  for (const frame of frames) {
    const sf = pptx.addSlide({ masterName: 'VETT_MASTER' });
    sf.addText(
      analysis.is_video ? `Frame at ${formatTimestamp(frame.timestamp)}` : 'Static image analysis',
      {
        x: 0.5, y: 1.0, w: 12, h: 0.6,
        fontSize: 28, bold: true, color: INK, fontFace: 'Calibri',
      },
    );
    sf.addShape('line', {
      x: 0.5, y: 1.7, w: 12, h: 0,
      line: { color: LIME, width: 1 },
    });

    // Donut score (top right)
    const score = Math.min(100, Math.max(0, Number(frame.engagement_score ?? 0)));
    sf.addChart(
      'doughnut' as unknown as Parameters<typeof sf.addChart>[0],
      [
        {
          name: 'Score',
          labels: ['Engagement', 'Remaining'],
          values: [score, Math.max(0, 100 - score)],
        },
      ],
      {
        x: 10.5, y: 1.9, w: 2.5, h: 2.5,
        chartColors: [LIME.replace('#', ''), 'E5E7EB'],
        showLegend: false,
        showTitle: false,
        showValue: false,
        holeSize: 70,
      },
    );
    sf.addText(`${Math.round(score)}`, {
      x: 10.5, y: 2.7, w: 2.5, h: 0.5,
      fontSize: 24, bold: true, color: INK, fontFace: 'Calibri', align: 'center',
    });
    sf.addText('/100', {
      x: 10.5, y: 3.15, w: 2.5, h: 0.3,
      fontSize: 10, color: GRAY, fontFace: 'Calibri', align: 'center',
    });

    // What's happening (top-left text block)
    sf.addText("WHAT'S HAPPENING", {
      x: 0.5, y: 1.9, w: 9.5, h: 0.3,
      fontSize: 11, bold: true, color: INDIGO, fontFace: 'Calibri',
    });
    sf.addText(frame.brief_description || '—', {
      x: 0.5, y: 2.2, w: 9.5, h: 1.5,
      fontSize: 12, color: INK, fontFace: 'Calibri',
    });

    // Emotion intensity bar chart
    sf.addText('EMOTION INTENSITY', {
      x: 0.5, y: 3.9, w: 12, h: 0.3,
      fontSize: 11, bold: true, color: INDIGO, fontFace: 'Calibri',
    });
    const emos = Object.entries(frame.emotions || {})
      .filter(([, v]) => Number.isFinite(Number(v)))
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 12);
    if (emos.length > 0) {
      sf.addChart('bar' as unknown as Parameters<typeof sf.addChart>[0], [
        {
          name: 'Intensity',
          labels: emos.map(([e]) => e),
          values: emos.map(([, v]) => Number(v) || 0),
        },
      ], {
        x: 0.5, y: 4.2, w: 7.5, h: 2.6,
        barDir: 'bar',
        chartColors: [LIME.replace('#', '')],
        catAxisLabelColor: INK,
        valAxisLabelColor: INK,
        showLegend: false,
      });
    }

    // Hotspots (right column)
    sf.addText('ATTENTION HOTSPOTS', {
      x: 8.2, y: 4.2, w: 4.6, h: 0.3,
      fontSize: 11, bold: true, color: INDIGO, fontFace: 'Calibri',
    });
    const hotspots = (frame.attention_hotspots ?? []).slice(0, 5);
    if (hotspots.length > 0) {
      sf.addText(
        hotspots.map((h) => ({ text: h, options: { bullet: true, color: INK, fontSize: 11 } })),
        { x: 8.3, y: 4.5, w: 4.5, h: 2.3, fontFace: 'Calibri' },
      );
    } else {
      sf.addText('No specific regions detected.', {
        x: 8.3, y: 4.5, w: 4.5, h: 0.4,
        fontSize: 10, color: GRAY, fontFace: 'Calibri',
      });
    }

    // Audience resonance + message clarity (bottom strip)
    sf.addText([
      { text: 'AUDIENCE RESONANCE  ', options: { bold: true, color: GRAY } },
      { text: String(frame.audience_resonance ?? '—'), options: { color: INK } },
      { text: '   ·   MESSAGE CLARITY  ', options: { bold: true, color: GRAY } },
      { text: `${frame.message_clarity ?? '—'}/5`, options: { color: INK, bold: true } },
    ], {
      x: 0.5, y: 6.6, w: 12, h: 0.3,
      fontSize: 11, fontFace: 'Calibri',
    });
  }

  // ── Final slide — Methodology ─────────────────────────────────
  const sM = pptx.addSlide({ masterName: 'VETT_MASTER' });
  sM.addText('Methodology', {
    x: 0.5, y: 1.0, w: 12, h: 0.6,
    fontSize: 28, bold: true, color: INK, fontFace: 'Calibri',
  });
  sM.addShape('line', {
    x: 0.5, y: 1.7, w: 12, h: 0,
    line: { color: LIME, width: 1 },
  });
  sM.addText(EXPORT_DISCLOSURES.creativeAttentionMethodology, {
    x: 0.5, y: 2.0, w: 12, h: 4.5,
    fontSize: 14, color: INK, fontFace: 'Calibri',
  });
  sM.addText(
    `Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC.`,
    { x: 0.5, y: 6.5, w: 12, h: 0.3, fontSize: 10, color: GRAY, fontFace: 'Calibri' },
  );

  await pptx.writeFile({ fileName: safeFilename(meta.brand, 'pptx') });
}

/**
 * Pass 33 W9b — Creative Attention XLSX rebuild.
 *
 * 6-sheet workbook: Summary / Attention arc / Emotions /
 * Hotspots / Recommendations / Methodology. Header row is lime-fill
 * + bold-black + frozen on every sheet. Frame_analyses go into the
 * Attention arc + Emotions sheets so analysts can drop them straight
 * into pivot tables.
 */
export async function downloadCreativeAnalysisXlsx(
  analysis: CreativeAnalysis,
  meta: { missionId?: string; brand?: string | null },
): Promise<void> {
  const XLSX = await import('xlsx');

  const summary = analysis.summary;
  const eff = analysis.creative_effectiveness;
  const att = analysis.attention;
  const frames = analysis.frame_analyses ?? [];

  const wb = XLSX.utils.book_new();

  // ── Sheet 1 — Summary ─────────────────────────────────────────
  const summaryRows: Array<Array<string | number>> = [
    ['Field', 'Value'],
    ['Brand', meta.brand ?? '—'],
    ['Mission ID', meta.missionId ?? '—'],
    ['Generated', new Date().toISOString().slice(0, 10)],
    ['Asset type', analysis.is_video ? `Video (${analysis.total_frames} frames)` : 'Static image'],
    [],
    ['KPI', 'Value'],
    ['Overall engagement score',
      summary?.overall_engagement_score != null
        ? `${summary.overall_engagement_score}/100`
        : (eff?.score != null ? `${eff.score}/100` : '—')],
    ['Effectiveness band', eff?.band ?? '—'],
    ['Best platform fit',
      (() => {
        const p = (summary?.best_platform_fit ?? [])[0];
        if (!p) return '—';
        const obj = asPlatformFitObject(p);
        return typeof p === 'string' ? p : (obj?.platform ?? '—');
      })()],
    ['Vs benchmark', summary?.vs_benchmark ?? '—'],
    ['Attention arc summary', summary?.attention_arc ?? '—'],
  ];
  if (summary?.strengths && summary.strengths.length > 0) {
    summaryRows.push([], ['#', 'Strength']);
    summary.strengths.forEach((s, i) => summaryRows.push([i + 1, s]));
  }
  if (summary?.weaknesses && summary.weaknesses.length > 0) {
    summaryRows.push([], ['#', 'Weakness']);
    summary.weaknesses.forEach((s, i) => summaryRows.push([i + 1, s]));
  }
  if (att) {
    summaryRows.push([],
      ['Attention metric', 'Value'],
      ['Active attention (sec)', att.predicted_active_attention_seconds ?? ''],
      ['Passive attention (sec)', att.predicted_passive_attention_seconds ?? ''],
      ['Active %', att.active_attention_pct ?? ''],
      ['Passive %', att.passive_attention_pct ?? ''],
      ['Non-attention %', att.non_attention_pct ?? ''],
      ['Distinctive brand asset score', att.distinctive_brand_asset_score ?? ''],
      ['DBA read time (sec)', att.dba_read_seconds ?? ''],
    );
  }
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  applyXlsxBranding(XLSX, summarySheet);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // ── Sheet 2 — Attention arc (per-frame core metrics) ──────────
  const arcRows: Array<Array<string | number>> = [
    ['Timestamp', 'Engagement', 'Message clarity', 'Audience resonance', 'Description'],
  ];
  for (const f of frames) {
    arcRows.push([
      f.timestamp,
      f.engagement_score ?? 0,
      f.message_clarity ?? 0,
      typeof f.audience_resonance === 'string' || typeof f.audience_resonance === 'number'
        ? f.audience_resonance
        : '',
      f.brief_description ?? '',
    ]);
  }
  const arcSheet = XLSX.utils.aoa_to_sheet(arcRows);
  applyXlsxBranding(XLSX, arcSheet);
  arcSheet['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 36 }, { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, arcSheet, 'Attention arc');

  // ── Sheet 3 — Emotions (timestamp × emotion pivot) ───────────
  const allEmotions = new Set<string>();
  for (const f of frames) {
    Object.keys(f.emotions || {}).forEach((e) => allEmotions.add(e));
  }
  const emotionCols = Array.from(allEmotions);
  const emotionRows: Array<Array<string | number>> = [
    ['Timestamp', ...emotionCols],
  ];
  for (const f of frames) {
    emotionRows.push([
      f.timestamp,
      ...emotionCols.map((e) => Number(f.emotions?.[e] ?? 0)),
    ]);
  }
  // Always include the averaged row at the top of body
  if (frames.length > 0) {
    emotionRows.push([
      'AVERAGE',
      ...emotionCols.map((e) => {
        const vals = frames
          .map((f) => Number(f.emotions?.[e] ?? 0))
          .filter((v) => Number.isFinite(v));
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      }),
    ]);
  }
  const emotionSheet = XLSX.utils.aoa_to_sheet(emotionRows);
  applyXlsxBranding(XLSX, emotionSheet);
  XLSX.utils.book_append_sheet(wb, emotionSheet, 'Emotions');

  // ── Sheet 4 — Hotspots (per-frame regions) ───────────────────
  const hotspotRows: Array<Array<string | number>> = [
    ['Timestamp', '#', 'Hotspot region'],
  ];
  for (const f of frames) {
    const list = f.attention_hotspots ?? [];
    if (list.length === 0) {
      hotspotRows.push([f.timestamp, 0, '—']);
      continue;
    }
    list.forEach((h, i) => hotspotRows.push([f.timestamp, i + 1, h]));
  }
  const hotspotSheet = XLSX.utils.aoa_to_sheet(hotspotRows);
  applyXlsxBranding(XLSX, hotspotSheet);
  hotspotSheet['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, hotspotSheet, 'Hotspots');

  // ── Sheet 5 — Recommendations (priority ranked) ──────────────
  const recRows: Array<Array<string | number>> = [
    ['Priority', 'Recommendation'],
  ];
  (summary?.recommendations ?? []).forEach((r, i) => recRows.push([i + 1, r]));
  if (recRows.length === 1) recRows.push(['—', 'No recommendations generated for this analysis.']);
  const recSheet = XLSX.utils.aoa_to_sheet(recRows);
  applyXlsxBranding(XLSX, recSheet);
  recSheet['!cols'] = [{ wch: 10 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(wb, recSheet, 'Recommendations');

  // ── Sheet 6 — Methodology disclosure ─────────────────────────
  const methSheet = XLSX.utils.aoa_to_sheet([
    ['Methodology'],
    [EXPORT_DISCLOSURES.creativeAttentionMethodology],
    [],
    [`Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC.`],
  ]);
  applyXlsxBranding(XLSX, methSheet);
  methSheet['!cols'] = [{ wch: 120 }];
  XLSX.utils.book_append_sheet(wb, methSheet, 'Methodology');

  XLSX.writeFile(wb, safeFilename(meta.brand, 'xlsx'));
}

/**
 * Apply VETT lime header fill + bold + frozen first row to a SheetJS
 * worksheet. SheetJS Community Edition has limited cell-style support
 * — fills work in `xlsx` style mode but require !cols + !ref to
 * survive the writeFile. We apply a freeze pane unconditionally so
 * the header row stays visible while scrolling the data body.
 */
function applyXlsxBranding(
  XLSX: typeof import('xlsx'),
  sheet: import('xlsx').WorkSheet,
): void {
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');
  // Freeze top row — works across all SheetJS variants.
  sheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };
  // Style every header-row cell (best-effort; CE may strip fills,
  // but bold + horizontal alignment usually survive).
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    const cell = sheet[addr];
    if (!cell) continue;
    cell.s = {
      fill: { fgColor: { rgb: 'BEF264' } },
      font: { bold: true, color: { rgb: '0B0C15' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    };
  }
}
