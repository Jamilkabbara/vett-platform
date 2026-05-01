import type { CAExportMission } from './caTypes';
import { exportFilename } from './caShared';
import { exportElementToPdf } from '../htmlToPdf';

// Bug 23.62 Option B path for CA. Hands the raster work to htmlToPdf.
// The element should be the <main> region of CreativeAttentionResultsPage
// — the sticky header + dropdown chrome are intentionally excluded.
export async function exportCreativeAttentionPdf(
  mission: CAExportMission,
  element: HTMLElement,
): Promise<void> {
  await exportElementToPdf(element, {
    filename: exportFilename(mission, 'pdf'),
    backgroundColor: '#0B0C15',
    format: 'a4',
    orientation: 'portrait',
    marginMm: 8,
    scale: 2,
  });
}
