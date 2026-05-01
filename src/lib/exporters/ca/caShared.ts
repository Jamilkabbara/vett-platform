import type { CAExportFormat, CAExportMission } from './caTypes';

const EXTENSIONS: Record<CAExportFormat, string> = {
  pdf: 'pdf',
  pptx: 'pptx',
  xlsx: 'xlsx',
  csv: 'csv',
  json: 'json',
};

export function exportFilename(mission: { id?: string | null; title?: string | null }, format: CAExportFormat): string {
  const idShort = (mission.id || 'mission').slice(0, 8);
  const slug = (mission.title || 'creative-attention')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'creative-attention';
  const date = new Date().toISOString().slice(0, 10);
  return `vett-${slug}-${idShort}-${date}.${EXTENSIONS[format]}`;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// CSV escape per RFC 4180. Wraps the field in quotes if it contains
// comma, double-quote, CR, or LF; doubles internal quotes.
export function csvField(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function csvRow(fields: unknown[]): string {
  return fields.map(csvField).join(',');
}

// Bug 23.62 audit fix: UTF-8 BOM + CRLF for Excel-Mac compatibility.
export const CSV_BOM = '﻿';
export const CSV_EOL = '\r\n';

export function platformFitLabel(p: unknown): string {
  if (typeof p === 'string') return p;
  if (p && typeof p === 'object' && 'platform' in p) {
    const obj = p as { platform?: string };
    return obj.platform || '';
  }
  return '';
}

export function fetchExportFromBackend(
  missionId: string,
  format: 'pptx' | 'xlsx',
  authToken: string,
  apiBase: string,
): Promise<Blob> {
  const url = `${apiBase.replace(/\/$/, '')}/api/results/${encodeURIComponent(missionId)}/export/ca/${format}`;
  return fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Export failed (${res.status}): ${body || res.statusText}`);
    }
    return res.blob();
  });
}

export type { CAExportFormat, CAExportMission };
