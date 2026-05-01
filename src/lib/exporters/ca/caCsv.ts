import type { CAExportMission } from './caTypes';
import {
  CSV_BOM, CSV_EOL, csvRow, exportFilename, platformFitLabel, triggerDownload,
} from './caShared';

// Builds a multi-section CSV. Sections are separated by a blank line
// and a row holding the section name in column A, so a single sheet is
// readable in Excel without splitting.
//
// Sections:
//   1. META         — mission id, title, brief, generated_at, total_frames, is_video
//   2. SUMMARY      — engagement, attention_arc, vs_benchmark, platform_fit
//   3. EMOTION_PEAKS
//   4. STRENGTHS / WEAKNESSES / RECOMMENDATIONS
//   5. FRAMES       — one row per frame: timestamp, scores, hotspots, brief_description
//   6. EMOTION_TIMELINE — wide format, one column per emotion present in any frame
export function exportCreativeAttentionCsv(mission: CAExportMission): void {
  const a = mission.creative_analysis;
  const summary = a.summary;
  const lines: string[] = [];

  // 1. META
  lines.push(csvRow(['SECTION', 'META']));
  lines.push(csvRow(['Field', 'Value']));
  lines.push(csvRow(['Mission ID', mission.id]));
  lines.push(csvRow(['Title', mission.title ?? '']));
  lines.push(csvRow(['Brief', mission.brief ?? mission.mission_statement ?? '']));
  lines.push(csvRow(['Media URL', mission.media_url ?? '']));
  lines.push(csvRow(['Media Type', mission.media_type ?? (a.is_video ? 'video' : 'image')]));
  lines.push(csvRow(['Total Frames', a.total_frames]));
  lines.push(csvRow(['Generated At', a.generated_at ?? '']));
  lines.push(csvRow(['Exported At', new Date().toISOString()]));
  lines.push('');

  // 2. SUMMARY
  lines.push(csvRow(['SECTION', 'SUMMARY']));
  lines.push(csvRow(['Field', 'Value']));
  lines.push(csvRow(['Overall Engagement Score', summary.overall_engagement_score]));
  lines.push(csvRow(['Attention Arc', summary.attention_arc]));
  lines.push(csvRow(['vs Benchmark', summary.vs_benchmark]));
  lines.push(csvRow(['Best Platform Fit', (summary.best_platform_fit || []).map(platformFitLabel).join('; ')]));
  lines.push('');

  // 3. EMOTION_PEAKS
  lines.push(csvRow(['SECTION', 'EMOTION_PEAKS']));
  lines.push(csvRow(['Emotion', 'Peak Timestamp (s)', 'Peak Value', 'Interpretation']));
  for (const p of summary.emotion_peaks || []) {
    lines.push(csvRow([p.emotion, p.peak_timestamp, p.peak_value, p.interpretation]));
  }
  lines.push('');

  // 4. STRENGTHS / WEAKNESSES / RECOMMENDATIONS
  for (const [label, items] of [
    ['STRENGTHS', summary.strengths],
    ['WEAKNESSES', summary.weaknesses],
    ['RECOMMENDATIONS', summary.recommendations],
  ] as const) {
    lines.push(csvRow(['SECTION', label]));
    lines.push(csvRow(['#', 'Text']));
    (items || []).forEach((t, i) => lines.push(csvRow([i + 1, t])));
    lines.push('');
  }

  // 5. FRAMES
  lines.push(csvRow(['SECTION', 'FRAMES']));
  lines.push(csvRow([
    'Timestamp (s)', 'Engagement', 'Audience Resonance', 'Message Clarity',
    'Attention Hotspots', 'Brief Description',
  ]));
  for (const f of a.frame_analyses || []) {
    lines.push(csvRow([
      f.timestamp,
      f.engagement_score,
      f.audience_resonance,
      f.message_clarity,
      (f.attention_hotspots || []).join('; '),
      f.brief_description,
    ]));
  }
  lines.push('');

  // 6. EMOTION_TIMELINE — collect union of emotion keys across frames
  const emotionKeys = new Set<string>();
  for (const f of a.frame_analyses || []) {
    for (const k of Object.keys(f.emotions || {})) emotionKeys.add(k);
  }
  const sortedEmotions = [...emotionKeys].sort();
  lines.push(csvRow(['SECTION', 'EMOTION_TIMELINE']));
  lines.push(csvRow(['Timestamp (s)', ...sortedEmotions]));
  for (const f of a.frame_analyses || []) {
    lines.push(csvRow([f.timestamp, ...sortedEmotions.map((k) => f.emotions?.[k] ?? '')]));
  }

  const csv = CSV_BOM + lines.join(CSV_EOL) + CSV_EOL;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, exportFilename(mission, 'csv'));
}
