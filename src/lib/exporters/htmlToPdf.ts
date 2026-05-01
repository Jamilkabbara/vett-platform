// Pass 23 Bug 23.62 — HTML-to-PDF Option B.
// Rasterizes a DOM element via html2canvas, then paginates the bitmap
// across PDF pages using jsPDF. Sidesteps pdfkit's Latin-1 font limit:
// the browser has already rendered the right glyphs (Arabic, accented),
// so capturing the rendered pixels preserves them.
//
// Trade-off: the output PDF is image-based, so text isn't selectable or
// searchable. That's acceptable for a results report; users who need
// raw data can use the CSV / XLSX / JSON exports.

import jsPDF from 'jspdf';

interface ExportPdfOptions {
  filename: string;
  // Background colour painted between page-break splits and below the
  // last-page residue. Defaults to the VETT near-black so the dark page
  // doesn't get a white sliver at the bottom.
  backgroundColor?: string;
  // Page format passed straight to jsPDF.
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  // Inner padding (mm) on each PDF page.
  marginMm?: number;
  // Multiplier for html2canvas. Higher = sharper, larger file. 2 is the
  // pragmatic sweet spot for a screenshot-grade report.
  scale?: number;
}

export async function exportElementToPdf(
  element: HTMLElement,
  opts: ExportPdfOptions,
): Promise<void> {
  // Lazy-load html2canvas to keep it out of the initial bundle.
  const html2canvas = (await import('html2canvas')).default;

  const bg = opts.backgroundColor || '#0B0C15';
  const scale = opts.scale ?? 2;
  const margin = opts.marginMm ?? 8;
  const format = opts.format ?? 'a4';
  const orientation = opts.orientation ?? 'portrait';

  const canvas = await html2canvas(element, {
    backgroundColor: bg,
    scale,
    useCORS: true,
    logging: false,
    // Capture the whole element even if it scrolls.
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({ orientation, unit: 'mm', format });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  // Convert canvas to image; scale to usableWidth, paginate vertically.
  const imgWidthMm = usableWidth;
  const pxPerMm = canvas.width / imgWidthMm;
  const pageHeightPx = usableHeight * pxPerMm;

  let yOffsetPx = 0;
  let pageIndex = 0;

  while (yOffsetPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - yOffsetPx);

    // Paint each slice onto a temp canvas at native resolution, then
    // convert to PNG. This avoids one giant base64 string in memory.
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = sliceHeightPx;
    const ctx = slice.getContext('2d');
    if (!ctx) throw new Error('htmlToPdf: 2D context unavailable');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(
      canvas,
      0, yOffsetPx, canvas.width, sliceHeightPx,
      0, 0, canvas.width, sliceHeightPx,
    );

    if (pageIndex > 0) pdf.addPage(format, orientation);

    // Paint the page background in case the slice doesn't fill the
    // full usable area (last page sliver).
    pdf.setFillColor(bg);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    const sliceHeightMm = sliceHeightPx / pxPerMm;
    pdf.addImage(
      slice.toDataURL('image/png'),
      'PNG',
      margin,
      margin,
      imgWidthMm,
      sliceHeightMm,
      undefined,
      'FAST',
    );

    yOffsetPx += sliceHeightPx;
    pageIndex += 1;
  }

  pdf.save(opts.filename);
}
