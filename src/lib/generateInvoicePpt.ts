/**
 * VETT — PPT Invoice Generator.
 * Uses pptxgenjs v4 to produce a branded .pptx invoice
 * that mirrors the PDF design: dark bg, lime accents, PAID badge.
 *
 * Run client-side (no server needed) — the .pptx is written directly
 * to disk via pptxgenjs writeFile().
 */

import pptxgen from 'pptxgenjs';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvoiceMissionPpt {
  id: string;
  title: string;
  total_price_usd: number;
  base_cost_usd?: number;
  targeting_surcharge_usd?: number;
  extra_questions_cost_usd?: number;
  discount_usd?: number;
  promo_code?: string | null;
  respondent_count: number;
  paid_at: string;
  goal_type?: string;
}

export interface InvoiceProfilePpt {
  displayName: string;
  email: string;
  companyName?: string | null;
}

// ── Color palette ─────────────────────────────────────────────────────────────

const C = {
  bg:    '0B0C15',
  bg2:   '111827',
  bg3:   '1A2233',
  lime:  'BEF264',
  t1:    'E5E7EB',
  t2:    '9CA3AF',
  t3:    '6B7280',
  grn:   '4ADE80',
} as const;

// ── Main function ─────────────────────────────────────────────────────────────

export async function generateInvoicePpt(
  mission: InvoiceMissionPpt,
  profile: InvoiceProfilePpt,
  cardLast4 = '',
): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 in

  const slide = pptx.addSlide();
  slide.background = { color: C.bg };

  const invoiceRef = `INV-${mission.id.slice(0, 8).toUpperCase()}`;
  const paidDate = new Date(mission.paid_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── Header band ────────────────────────────────────────────────────────────

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 1.25,
    fill: { color: C.bg2 },
    line: { color: C.bg2, width: 0 },
  });

  // Lightning bolt square (lime)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.45, y: 0.3, w: 0.65, h: 0.65,
    fill: { color: C.lime },
    line: { color: C.lime, width: 0 },
    rectRadius: 0.08,
  });
  slide.addText('⚡', {
    x: 0.45, y: 0.28, w: 0.65, h: 0.65,
    fontSize: 26, bold: true, color: C.bg,
    align: 'center', valign: 'middle',
  });

  // VETT wordmark
  slide.addText('VETT', {
    x: 1.25, y: 0.22, w: 2.5, h: 0.55,
    fontSize: 34, bold: true, color: C.t1, fontFace: 'Arial',
  });
  slide.addText('AI CONSUMER RESEARCH', {
    x: 1.25, y: 0.76, w: 3.2, h: 0.25,
    fontSize: 8, color: C.t2, fontFace: 'Arial',
  });

  // INVOICE title (right-aligned)
  slide.addText('INVOICE', {
    x: 9.5, y: 0.15, w: 3.3, h: 0.55,
    fontSize: 38, bold: true, color: C.lime, fontFace: 'Arial',
    align: 'right',
  });
  slide.addText(invoiceRef, {
    x: 9.5, y: 0.70, w: 3.3, h: 0.25,
    fontSize: 11, color: C.t2, align: 'right',
  });
  slide.addText(paidDate, {
    x: 9.5, y: 0.94, w: 3.3, h: 0.22,
    fontSize: 10, color: C.t3, align: 'right',
  });

  // ── Billed to ──────────────────────────────────────────────────────────────

  slide.addText('BILLED TO', {
    x: 0.5, y: 1.55, w: 2, h: 0.28,
    fontSize: 9, bold: true, color: C.t3,
  });
  slide.addText(profile.displayName || 'Customer', {
    x: 0.5, y: 1.83, w: 5.5, h: 0.45,
    fontSize: 18, bold: true, color: C.t1, fontFace: 'Arial',
  });
  const billedLines = [profile.companyName, profile.email].filter(Boolean).join('\n');
  if (billedLines) {
    slide.addText(billedLines, {
      x: 0.5, y: 2.28, w: 5.5, h: 0.7,
      fontSize: 11, color: C.t2,
    });
  }

  // PAID badge
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 11.55, y: 1.55, w: 1.3, h: 0.48,
    fill: { color: C.grn },
    line: { color: C.grn, width: 0 },
    rectRadius: 0.06,
  });
  slide.addText('PAID', {
    x: 11.55, y: 1.55, w: 1.3, h: 0.48,
    fontSize: 16, bold: true, color: C.bg,
    align: 'center', valign: 'middle',
  });

  // ── Line items table ───────────────────────────────────────────────────────

  const baseCost       = mission.base_cost_usd       ?? mission.total_price_usd;
  const targeting      = mission.targeting_surcharge_usd  ?? 0;
  const extraQuestions = mission.extra_questions_cost_usd ?? 0;
  const discount       = mission.discount_usd             ?? 0;
  const subtotal       = baseCost + targeting + extraQuestions;
  const unitPrice      = (baseCost / Math.max(mission.respondent_count, 1)).toFixed(2);
  const goalLabel      = (mission.goal_type ?? '').replace(/_/g, ' ');

  type TableCellOpts = {
    text: string;
    options?: {
      bold?: boolean;
      color?: string;
      fill?: { color: string };
      align?: 'left' | 'center' | 'right';
      fontSize?: number;
    };
  };

  const rows: TableCellOpts[][] = [
    // Header
    [
      { text: 'Description',  options: { bold: true, color: C.lime, fill: { color: C.bg2 }, fontSize: 11 } },
      { text: 'Respondents',  options: { bold: true, color: C.lime, fill: { color: C.bg2 }, fontSize: 11, align: 'center' } },
      { text: 'Unit Price',   options: { bold: true, color: C.lime, fill: { color: C.bg2 }, fontSize: 11, align: 'right' } },
      { text: 'Total',        options: { bold: true, color: C.lime, fill: { color: C.bg2 }, fontSize: 11, align: 'right' } },
    ],
    // Mission row
    [
      { text: `${mission.title}${goalLabel ? `\n${goalLabel}` : ''}`, options: { color: C.t1, fill: { color: C.bg3 }, fontSize: 11 } },
      { text: String(mission.respondent_count), options: { color: C.t1, fill: { color: C.bg3 }, fontSize: 11, align: 'center' } },
      { text: `$${unitPrice}`,                  options: { color: C.t1, fill: { color: C.bg3 }, fontSize: 11, align: 'right' } },
      { text: `$${baseCost.toFixed(2)}`,        options: { color: C.t1, fill: { color: C.bg3 }, fontSize: 11, align: 'right', bold: true } },
    ],
  ];

  if (targeting > 0) {
    rows.push([
      { text: 'Advanced targeting surcharge', options: { color: C.t1, fill: { color: C.bg2 }, fontSize: 11 } },
      { text: '—', options: { color: C.t2, fill: { color: C.bg2 }, fontSize: 11, align: 'center' } },
      { text: '—', options: { color: C.t2, fill: { color: C.bg2 }, fontSize: 11, align: 'right' } },
      { text: `$${targeting.toFixed(2)}`, options: { color: C.t1, fill: { color: C.bg2 }, fontSize: 11, align: 'right', bold: true } },
    ]);
  }
  if (extraQuestions > 0) {
    rows.push([
      { text: 'Additional questions', options: { color: C.t1, fill: { color: C.bg3 }, fontSize: 11 } },
      { text: '—', options: { color: C.t2, fill: { color: C.bg3 }, fontSize: 11, align: 'center' } },
      { text: '—', options: { color: C.t2, fill: { color: C.bg3 }, fontSize: 11, align: 'right' } },
      { text: `$${extraQuestions.toFixed(2)}`, options: { color: C.t1, fill: { color: C.bg3 }, fontSize: 11, align: 'right', bold: true } },
    ]);
  }

  slide.addTable(rows, {
    x: 0.5, y: 3.2, w: 12.3,
    colW: [7.2, 1.7, 1.7, 1.7],
    rowH: 0.52,
    border: { pt: 0.5, color: C.bg },
    fontFace: 'Arial',
  });

  // ── Summary block (right side) ─────────────────────────────────────────────

  const tableBottom = 3.2 + rows.length * 0.52 + 0.2;

  slide.addText('Subtotal', {
    x: 8.5, y: tableBottom, w: 2.5, h: 0.3, fontSize: 11, color: C.t2,
  });
  slide.addText(`$${subtotal.toFixed(2)}`, {
    x: 11.5, y: tableBottom, w: 1.3, h: 0.3, fontSize: 11, color: C.t1, align: 'right',
  });

  let summaryY = tableBottom + 0.35;

  if (discount > 0) {
    const promoLabel = mission.promo_code ? `Promo (${mission.promo_code})` : 'Discount';
    slide.addText(promoLabel, { x: 8.5, y: summaryY, w: 2.5, h: 0.3, fontSize: 11, color: C.t2 });
    slide.addText(`-$${discount.toFixed(2)}`, { x: 11.5, y: summaryY, w: 1.3, h: 0.3, fontSize: 11, color: C.grn, align: 'right' });
    summaryY += 0.35;
  }

  // Total bar (lime border, dark fill)
  slide.addShape(pptx.ShapeType.rect, {
    x: 8.5, y: summaryY + 0.1, w: 4.3, h: 0.65,
    fill: { color: C.bg },
    line: { color: C.lime, width: 1 },
  });
  slide.addText('TOTAL PAID', {
    x: 8.7, y: summaryY + 0.1, w: 1.5, h: 0.65,
    fontSize: 10, bold: true, color: C.t2, valign: 'middle',
  });
  slide.addText(`$${mission.total_price_usd.toFixed(2)}`, {
    x: 10.3, y: summaryY + 0.1, w: 2.4, h: 0.65,
    fontSize: 24, bold: true, color: C.lime, fontFace: 'Arial',
    align: 'right', valign: 'middle',
  });

  // ── Footer ─────────────────────────────────────────────────────────────────

  const footerY = 7.1;
  const payText = cardLast4 ? `Paid via Stripe · Card ending ${cardLast4}` : 'Paid via Stripe';
  slide.addText(payText, { x: 0.5, y: footerY, w: 5, h: 0.28, fontSize: 9, color: C.t3 });
  slide.addText('Thank you for using VETT', {
    x: 5.5, y: footerY, w: 2.8, h: 0.28, fontSize: 9, color: C.t2, align: 'center',
  });
  slide.addText('hello@vettit.ai · Dubai, UAE', {
    x: 8.8, y: footerY, w: 4.3, h: 0.28, fontSize: 9, color: C.t3, align: 'right',
  });

  // ── Write ──────────────────────────────────────────────────────────────────

  await pptx.writeFile({ fileName: `VETT-Invoice-${invoiceRef}.pptx` });
}
