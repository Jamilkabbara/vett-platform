import type { CAExportFormat, CAExportMission } from './caTypes';
import { exportCreativeAttentionCsv } from './caCsv';
import { exportCreativeAttentionJson } from './caJson';
import { exportCreativeAttentionPdf } from './caPdf';
import { exportFilename, fetchExportFromBackend, triggerDownload } from './caShared';

interface DispatchOptions {
  // Required for `pdf` only — the DOM region to rasterize.
  element?: HTMLElement | null;
  // Required for `pptx` and `xlsx` — backend round-trip needs auth.
  authToken?: string | null;
  apiBase?: string;
}

const DEFAULT_API_BASE =
  // Vite injects import.meta.env.VITE_BACKEND_URL at build time. Falls back
  // to a sane local default; CreativeAttentionResultsPage already reads
  // env vars elsewhere via supabase, so we follow the same pattern.
  (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_BACKEND_URL)
  || 'https://vettit-backend-production.up.railway.app';

export async function exportCreativeAttention(
  format: CAExportFormat,
  mission: CAExportMission,
  options: DispatchOptions = {},
): Promise<void> {
  switch (format) {
    case 'json':
      exportCreativeAttentionJson(mission);
      return;

    case 'csv':
      exportCreativeAttentionCsv(mission);
      return;

    case 'pdf': {
      if (!options.element) {
        throw new Error('PDF export requires the source DOM element.');
      }
      await exportCreativeAttentionPdf(mission, options.element);
      return;
    }

    case 'pptx':
    case 'xlsx': {
      if (!options.authToken) {
        throw new Error(`${format.toUpperCase()} export requires an auth token.`);
      }
      const blob = await fetchExportFromBackend(
        mission.id,
        format,
        options.authToken,
        options.apiBase || DEFAULT_API_BASE,
      );
      triggerDownload(blob, exportFilename(mission, format));
      return;
    }
  }
}

export type { CAExportFormat, CAExportMission };
