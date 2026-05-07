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

// ── Pass 32 X3 — PDF / PPTX / XLSX (lazy-imported) ────────────────────────────

const BAND_LABEL: Record<string, string> = {
  elite: 'Elite',
  strong: 'Strong',
  average: 'Average',
  weak: 'Weak',
  poor: 'Poor',
};

function metaRows(
  analysis: CreativeAnalysis,
  meta: { missionId?: string; brand?: string | null },
): Array<[string, string]> {
  const eff = analysis.creative_effectiveness;
  const att = analysis.attention;
  const summary = analysis.summary;
  return [
    ['Brand', meta.brand ?? '—'],
    ['Mission ID', meta.missionId ?? '—'],
    ['Generated', new Date().toISOString().slice(0, 10)],
    ['Asset type', analysis.is_video ? `Video (${analysis.total_frames} frames)` : 'Static image'],
    ['Effectiveness score', eff ? `${eff.score}/100 — ${BAND_LABEL[eff.band] ?? eff.band}` : '—'],
    ['Engagement score', summary?.overall_engagement_score != null ? `${summary.overall_engagement_score}/100` : '—'],
    ['Active attention', att?.predicted_active_attention_seconds != null ? `${att.predicted_active_attention_seconds}s` : '—'],
    ['Distinctive brand asset', att?.distinctive_brand_asset_score != null ? `${att.distinctive_brand_asset_score}/100` : '—'],
  ];
}

function topEmotions(analysis: CreativeAnalysis, n = 8): Array<[string, number]> {
  const agg = aggregateEmotions(analysis);
  return Object.entries(agg)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n);
}

/**
 * PDF report. Uses jsPDF + jspdf-autotable so the heavy libs are
 * lazy-loaded only when the user clicks Export PDF. Layout: title
 * page → metadata table → effectiveness components → attention →
 * emotions → platform fit → channel benchmarks → strengths /
 * weaknesses / recommendations bullet lists.
 */
export async function downloadCreativeAnalysisPdf(
  analysis: CreativeAnalysis,
  meta: { missionId?: string; brand?: string | null },
): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = (autoTableModule as { default: (doc: unknown, opts: unknown) => void }).default;

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;

  // Cover
  doc.setFillColor(11, 12, 21); // VETT dark
  doc.rect(0, 0, pageW, 140, 'F');
  doc.setTextColor(190, 242, 100); // VETT lime
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('VETT — Creative Attention', margin, 70);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(meta.brand ?? 'Untitled creative', margin, 100);
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 200);
  doc.text(`Generated ${new Date().toISOString().slice(0, 10)}`, margin, 120);

  doc.setTextColor(0, 0, 0);

  // Metadata table
  autoTable(doc, {
    startY: 170,
    head: [['Metric', 'Value']],
    body: metaRows(analysis, meta),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: margin, right: margin },
  });

  // Effectiveness components
  const eff = analysis.creative_effectiveness;
  if (eff?.components) {
    const c = eff.components;
    autoTable(doc, {
      head: [['Component', 'Score (0–100)']],
      body: [
        ['Attention', String(c.attention)],
        ['Emotion intensity', String(c.emotion_intensity)],
        ['Brand clarity', String(c.brand_clarity)],
        ['Audience resonance', String(c.audience_resonance)],
        ['Platform fit', String(c.platform_fit)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 6 },
      margin: { left: margin, right: margin },
    });
  }

  // Attention
  const att = analysis.attention;
  if (att) {
    autoTable(doc, {
      head: [['Attention metric', 'Value']],
      body: [
        ['Active attention (sec)', String(att.predicted_active_attention_seconds ?? '—')],
        ['Passive attention (sec)', String(att.predicted_passive_attention_seconds ?? '—')],
        ['Active %', `${att.active_attention_pct ?? '—'}%`],
        ['Passive %', `${att.passive_attention_pct ?? '—'}%`],
        ['Non-attention %', `${att.non_attention_pct ?? '—'}%`],
        ['Distinctive brand asset score', String(att.distinctive_brand_asset_score ?? '—')],
        ['DBA read time (sec)', String(att.dba_read_seconds ?? '—')],
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 6 },
      margin: { left: margin, right: margin },
    });
  }

  // Emotions
  const emos = topEmotions(analysis, 12);
  if (emos.length > 0) {
    autoTable(doc, {
      head: [['Emotion (top 12, averaged)', 'Score']],
      body: emos.map(([e, s]) => [e, String(s)]),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 6 },
      margin: { left: margin, right: margin },
    });
  }

  // Platform Fit
  const platforms = analysis.summary?.best_platform_fit ?? [];
  if (platforms.length > 0) {
    autoTable(doc, {
      head: [['Platform', 'Fit', 'Norm', 'Predicted', 'Δ vs norm']],
      body: platforms.map((p) => {
        const obj = asPlatformFitObject(p);
        const platform = typeof p === 'string' ? p : (obj?.platform ?? '');
        return [
          platform,
          obj?.fit_score != null ? String(obj.fit_score) : '—',
          obj?.platform_norm_active_attention_seconds != null
            ? `${obj.platform_norm_active_attention_seconds}s`
            : '—',
          obj?.predicted_creative_attention_seconds != null
            ? `${obj.predicted_creative_attention_seconds}s`
            : '—',
          obj?.delta_vs_norm_pct != null ? `${obj.delta_vs_norm_pct}%` : '—',
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 5 },
      margin: { left: margin, right: margin },
    });
  }

  // Channel Benchmarks
  if (analysis.channel_benchmarks && analysis.channel_benchmarks.length > 0) {
    autoTable(doc, {
      head: [['Channel', 'Category avg', 'Predicted', 'Assessment']],
      body: analysis.channel_benchmarks.map((c) => [
        c.channel,
        `${c.category_avg_attention_seconds}s`,
        c.predicted_for_this_creative != null ? `${c.predicted_for_this_creative}s` : '—',
        c.fit_assessment,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 3: { cellWidth: 200 } },
      margin: { left: margin, right: margin },
    });
  }

  // Strengths / Weaknesses / Recommendations
  const lists: Array<[string, string[] | undefined]> = [
    ['Strengths', analysis.summary?.strengths],
    ['Weaknesses', analysis.summary?.weaknesses],
    ['Recommendations', analysis.summary?.recommendations],
  ];
  for (const [title, arr] of lists) {
    if (!arr || arr.length === 0) continue;
    autoTable(doc, {
      head: [[title]],
      body: arr.map((s, i) => [`${i + 1}. ${s}`]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 6 },
      margin: { left: margin, right: margin },
    });
  }

  doc.save(safeFilename(meta.brand, 'pdf'));
}

/**
 * PowerPoint deck. pptxgenjs lazy-loads on first call. Slide order
 * mirrors the PDF: title → effectiveness → attention → top emotions
 * (bar chart) → platform fit → channel benchmarks → strengths /
 * weaknesses / recommendations text slides.
 */
export async function downloadCreativeAnalysisPptx(
  analysis: CreativeAnalysis,
  meta: { missionId?: string; brand?: string | null },
): Promise<void> {
  const PptxGenModule = await import('pptxgenjs');
  const PptxGen = PptxGenModule.default;

  const pptx = new PptxGen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = `${meta.brand ?? 'Creative Attention'} — VETT report`;

  const DARK = '0B0C15';
  const LIME = 'BEF264';
  const INDIGO = '6366F1';
  const WHITE = 'FFFFFF';
  const SOFT = 'C7CAD1';

  // Title slide
  const s1 = pptx.addSlide();
  s1.background = { color: DARK };
  s1.addText('Creative Attention', {
    x: 0.5, y: 1.2, w: 12, h: 0.8,
    fontSize: 44, bold: true, color: LIME, fontFace: 'Calibri',
  });
  s1.addText(meta.brand ?? 'Untitled creative', {
    x: 0.5, y: 2.1, w: 12, h: 0.6,
    fontSize: 24, color: WHITE, fontFace: 'Calibri',
  });
  const eff = analysis.creative_effectiveness;
  if (eff) {
    s1.addText(`Effectiveness ${eff.score}/100 — ${BAND_LABEL[eff.band] ?? eff.band}`, {
      x: 0.5, y: 2.9, w: 12, h: 0.5,
      fontSize: 18, color: SOFT, fontFace: 'Calibri',
    });
  }
  s1.addText(`Generated ${new Date().toISOString().slice(0, 10)} — VETT`, {
    x: 0.5, y: 6.5, w: 12, h: 0.4,
    fontSize: 11, color: SOFT, fontFace: 'Calibri',
  });

  // Helper: standard content slide with header
  const contentSlide = (title: string) => {
    const s = pptx.addSlide();
    s.background = { color: DARK };
    s.addText(title, {
      x: 0.5, y: 0.3, w: 12, h: 0.5,
      fontSize: 24, bold: true, color: LIME, fontFace: 'Calibri',
    });
    return s;
  };

  // Effectiveness components
  if (eff?.components) {
    const s = contentSlide('Effectiveness components');
    const c = eff.components;
    s.addTable(
      [
        [
          { text: 'Component', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
          { text: 'Score', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
        ],
        [{ text: 'Attention', options: { color: WHITE } }, { text: String(c.attention), options: { color: WHITE } }],
        [{ text: 'Emotion intensity', options: { color: WHITE } }, { text: String(c.emotion_intensity), options: { color: WHITE } }],
        [{ text: 'Brand clarity', options: { color: WHITE } }, { text: String(c.brand_clarity), options: { color: WHITE } }],
        [{ text: 'Audience resonance', options: { color: WHITE } }, { text: String(c.audience_resonance), options: { color: WHITE } }],
        [{ text: 'Platform fit', options: { color: WHITE } }, { text: String(c.platform_fit), options: { color: WHITE } }],
      ],
      { x: 0.5, y: 1.0, w: 8, fontSize: 14, fontFace: 'Calibri' },
    );
  }

  // Attention
  const att = analysis.attention;
  if (att) {
    const s = contentSlide('Attention');
    s.addTable(
      [
        [
          { text: 'Metric', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
          { text: 'Value', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
        ],
        [{ text: 'Active attention (sec)', options: { color: WHITE } }, { text: String(att.predicted_active_attention_seconds ?? '—'), options: { color: WHITE } }],
        [{ text: 'Passive attention (sec)', options: { color: WHITE } }, { text: String(att.predicted_passive_attention_seconds ?? '—'), options: { color: WHITE } }],
        [{ text: 'Active %', options: { color: WHITE } }, { text: `${att.active_attention_pct ?? '—'}%`, options: { color: WHITE } }],
        [{ text: 'Passive %', options: { color: WHITE } }, { text: `${att.passive_attention_pct ?? '—'}%`, options: { color: WHITE } }],
        [{ text: 'Non-attention %', options: { color: WHITE } }, { text: `${att.non_attention_pct ?? '—'}%`, options: { color: WHITE } }],
        [{ text: 'Distinctive brand asset', options: { color: WHITE } }, { text: String(att.distinctive_brand_asset_score ?? '—'), options: { color: WHITE } }],
        [{ text: 'DBA read time (sec)', options: { color: WHITE } }, { text: String(att.dba_read_seconds ?? '—'), options: { color: WHITE } }],
      ],
      { x: 0.5, y: 1.0, w: 8, fontSize: 14, fontFace: 'Calibri' },
    );
  }

  // Emotions — bar chart
  const emos = topEmotions(analysis, 10);
  if (emos.length > 0) {
    const s = contentSlide('Top emotions (averaged)');
    s.addChart('bar' as unknown as Parameters<typeof s.addChart>[0], [
      {
        name: 'Score',
        labels: emos.map(([e]) => e),
        values: emos.map(([, v]) => v),
      },
    ], {
      x: 0.5, y: 1.0, w: 12, h: 5.5,
      barDir: 'bar',
      catAxisLabelColor: WHITE,
      valAxisLabelColor: WHITE,
      chartColors: [LIME],
      showLegend: false,
    });
  }

  // Platform Fit
  const platforms = analysis.summary?.best_platform_fit ?? [];
  if (platforms.length > 0) {
    const s = contentSlide('Platform fit');
    const rows: { text: string; options: Record<string, unknown> }[][] = [
      [
        { text: 'Platform', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
        { text: 'Fit', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
        { text: 'Norm', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
        { text: 'Predicted', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
        { text: 'Δ vs norm', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      ],
    ];
    platforms.forEach((p) => {
      const obj = asPlatformFitObject(p);
      const platform = typeof p === 'string' ? p : (obj?.platform ?? '');
      rows.push([
        { text: platform, options: { color: WHITE } },
        { text: obj?.fit_score != null ? String(obj.fit_score) : '—', options: { color: WHITE } },
        { text: obj?.platform_norm_active_attention_seconds != null ? `${obj.platform_norm_active_attention_seconds}s` : '—', options: { color: WHITE } },
        { text: obj?.predicted_creative_attention_seconds != null ? `${obj.predicted_creative_attention_seconds}s` : '—', options: { color: WHITE } },
        { text: obj?.delta_vs_norm_pct != null ? `${obj.delta_vs_norm_pct}%` : '—', options: { color: WHITE } },
      ]);
    });
    s.addTable(rows, { x: 0.3, y: 1.0, w: 12.5, fontSize: 12, fontFace: 'Calibri' });
  }

  // Channel Benchmarks
  if (analysis.channel_benchmarks && analysis.channel_benchmarks.length > 0) {
    const s = contentSlide('Channel benchmarks');
    const rows: { text: string; options: Record<string, unknown> }[][] = [
      [
        { text: 'Channel', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
        { text: 'Category avg', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
        { text: 'Predicted', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
        { text: 'Assessment', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      ],
    ];
    analysis.channel_benchmarks.forEach((c) => {
      rows.push([
        { text: c.channel, options: { color: WHITE } },
        { text: `${c.category_avg_attention_seconds}s`, options: { color: WHITE } },
        { text: c.predicted_for_this_creative != null ? `${c.predicted_for_this_creative}s` : '—', options: { color: WHITE } },
        { text: c.fit_assessment, options: { color: WHITE } },
      ]);
    });
    s.addTable(rows, { x: 0.3, y: 1.0, w: 12.5, fontSize: 11, fontFace: 'Calibri' });
  }

  // Strengths / Weaknesses / Recommendations
  const lists: Array<[string, string[] | undefined]> = [
    ['Strengths', analysis.summary?.strengths],
    ['Weaknesses', analysis.summary?.weaknesses],
    ['Recommendations', analysis.summary?.recommendations],
  ];
  for (const [title, arr] of lists) {
    if (!arr || arr.length === 0) continue;
    const s = contentSlide(title);
    s.addText(
      arr.map((item) => ({ text: item, options: { bullet: true, color: WHITE, fontSize: 14 } })),
      { x: 0.5, y: 1.0, w: 12, h: 5.5, fontFace: 'Calibri' },
    );
  }

  // pptxgenjs writeFile triggers the download directly
  await pptx.writeFile({ fileName: safeFilename(meta.brand, 'pptx') });
}

/**
 * Excel workbook. Multi-sheet structure: Summary, Effectiveness,
 * Attention, Emotions, Platform Fit, Channel Benchmarks, Strengths,
 * Weaknesses, Recommendations, Frame Analyses (video only). Uses the
 * SheetJS xlsx library (lazy-loaded).
 */
export async function downloadCreativeAnalysisXlsx(
  analysis: CreativeAnalysis,
  meta: { missionId?: string; brand?: string | null },
): Promise<void> {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // Summary
  const summaryRows: Array<Array<string | number>> = [
    ['Field', 'Value'],
    ...metaRows(analysis, meta),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');

  // Effectiveness components
  const eff = analysis.creative_effectiveness;
  if (eff) {
    const c = eff.components;
    const rows: Array<Array<string | number>> = [
      ['Component', 'Score', 'Weight'],
      ['Attention', c.attention, eff.weights.attention],
      ['Emotion intensity', c.emotion_intensity, eff.weights.emotion_intensity],
      ['Brand clarity', c.brand_clarity, eff.weights.brand_clarity],
      ['Audience resonance', c.audience_resonance, eff.weights.audience_resonance],
      ['Platform fit', c.platform_fit, eff.weights.platform_fit],
      [],
      ['Composite', eff.score, ''],
      ['Band', eff.band, ''],
      ['Band explanation', eff.band_explanation, ''],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Effectiveness');
  }

  // Attention
  const att = analysis.attention;
  if (att) {
    const rows: Array<Array<string | number>> = [
      ['Metric', 'Value'],
      ['Active attention (sec)', att.predicted_active_attention_seconds ?? ''],
      ['Passive attention (sec)', att.predicted_passive_attention_seconds ?? ''],
      ['Active %', att.active_attention_pct ?? ''],
      ['Passive %', att.passive_attention_pct ?? ''],
      ['Non-attention %', att.non_attention_pct ?? ''],
      ['Distinctive brand asset score', att.distinctive_brand_asset_score ?? ''],
      ['DBA read time (sec)', att.dba_read_seconds ?? ''],
    ];
    if (att.attention_decay_curve && att.attention_decay_curve.length > 0) {
      rows.push([], ['Decay curve — second', 'Active %']);
      att.attention_decay_curve.forEach((d) => rows.push([d.second, d.active_pct]));
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Attention');
  }

  // Emotions
  const emoRows: Array<Array<string | number>> = [['Emotion', 'Score']];
  topEmotions(analysis, 24).forEach(([e, s]) => emoRows.push([e, s]));
  if (emoRows.length > 1) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(emoRows), 'Emotions');
  }

  // Platform Fit
  const platforms = analysis.summary?.best_platform_fit ?? [];
  if (platforms.length > 0) {
    const rows: Array<Array<string | number>> = [
      ['Platform', 'Fit score', 'Norm (sec)', 'Predicted (sec)', 'Δ vs norm %', 'Rationale'],
    ];
    platforms.forEach((p) => {
      const obj = asPlatformFitObject(p);
      const platform = typeof p === 'string' ? p : (obj?.platform ?? '');
      rows.push([
        platform,
        obj?.fit_score ?? '',
        obj?.platform_norm_active_attention_seconds ?? '',
        obj?.predicted_creative_attention_seconds ?? '',
        obj?.delta_vs_norm_pct ?? '',
        obj?.rationale ?? '',
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Platform Fit');
  }

  // Channel Benchmarks
  if (analysis.channel_benchmarks && analysis.channel_benchmarks.length > 0) {
    const rows: Array<Array<string | number>> = [
      ['Channel', 'Category avg (sec)', 'Predicted (sec)', 'Assessment'],
    ];
    analysis.channel_benchmarks.forEach((c) => {
      rows.push([
        c.channel,
        c.category_avg_attention_seconds,
        c.predicted_for_this_creative ?? '',
        c.fit_assessment,
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Channel Benchmarks');
  }

  // Strengths / Weaknesses / Recommendations
  const sheets: Array<[string, string[] | undefined]> = [
    ['Strengths', analysis.summary?.strengths],
    ['Weaknesses', analysis.summary?.weaknesses],
    ['Recommendations', analysis.summary?.recommendations],
  ];
  for (const [name, arr] of sheets) {
    if (!arr || arr.length === 0) continue;
    const rows: Array<Array<string | number>> = [['#', name]];
    arr.forEach((item, i) => rows.push([i + 1, item]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  }

  // Frame Analyses (video only)
  if (analysis.is_video && analysis.frame_analyses && analysis.frame_analyses.length > 1) {
    const allEmotions = new Set<string>();
    analysis.frame_analyses.forEach((f) => {
      Object.keys(f.emotions || {}).forEach((e) => allEmotions.add(e));
    });
    const emotionCols = Array.from(allEmotions);
    const rows: Array<Array<string | number>> = [
      [
        'Timestamp',
        'Engagement',
        'Message clarity',
        'Audience resonance',
        ...emotionCols,
        'Description',
      ],
    ];
    analysis.frame_analyses.forEach((f) => {
      rows.push([
        f.timestamp,
        f.engagement_score,
        f.message_clarity,
        f.audience_resonance,
        ...emotionCols.map((e) => f.emotions?.[e] ?? 0),
        f.brief_description,
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Frame Analyses');
  }

  XLSX.writeFile(wb, safeFilename(meta.brand, 'xlsx'));
}
