import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoiceMission {
  id: string;
  title: string;
  total_price_usd: number;
  base_cost_usd: number;
  targeting_surcharge_usd: number;
  extra_questions_cost_usd: number;
  discount_usd: number;
  promo_code: string | null;
  respondent_count: number;
  paid_at: string;
  goal_type: string;
}

export interface InvoiceProfile {
  displayName: string;
  email: string;
  companyName: string | null;
}

export function generateInvoicePdf(
  mission: InvoiceMission,
  profile: InvoiceProfile,
  cardLast4 = '',
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // ── Dark header bar ──────────────────────────────────────────────────
  doc.setFillColor(11, 12, 21);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Lime accent square (logo placeholder)
  doc.setFillColor(190, 242, 100);
  doc.roundedRect(margin, 20, 40, 40, 6, 6, 'F');

  // ⚡ Lightning bolt
  doc.setTextColor(11, 12, 21);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('\u26A1', margin + 10, 48);

  // VETT wordmark
  doc.setTextColor(229, 231, 235);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('VETT', margin + 55, 46);

  // Tagline
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text('AI CONSUMER RESEARCH', margin + 55, 58);

  // INVOICE title (right)
  doc.setFontSize(28);
  doc.setTextColor(190, 242, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, 46, { align: 'right' });

  // Invoice number + date (right)
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `INV-${mission.id.slice(0, 8).toUpperCase()}`,
    pageWidth - margin,
    60,
    { align: 'right' },
  );
  doc.text(
    new Date(mission.paid_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    pageWidth - margin,
    72,
    { align: 'right' },
  );

  // ── Billed To block ───────────────────────────────────────────────────
  let y = 120;

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO', margin, y);

  y += 18;
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.displayName || 'Customer', margin, y);

  y += 16;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  if (profile.companyName) {
    doc.text(profile.companyName, margin, y);
    y += 14;
  }
  doc.text(profile.email, margin, y);

  // PAID badge (right side, aligned with billed-to)
  const badgeY = 116;
  doc.setFillColor(74, 222, 128);
  doc.roundedRect(pageWidth - margin - 80, badgeY, 80, 24, 4, 4, 'F');
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', pageWidth - margin - 40, badgeY + 15, { align: 'center' });

  // ── Line items table ──────────────────────────────────────────────────
  const tableStartY = Math.max(y + 30, 220);

  const rows: (string | number)[][] = [
    [
      `${mission.title}\n${(mission.goal_type ?? '').replace(/_/g, ' ') || 'Research mission'}`,
      String(mission.respondent_count),
      `$${(mission.base_cost_usd / Math.max(mission.respondent_count, 1)).toFixed(2)}`,
      `$${(mission.base_cost_usd || 0).toFixed(2)}`,
    ],
  ];

  if ((mission.targeting_surcharge_usd || 0) > 0) {
    rows.push([
      'Advanced targeting surcharge',
      '—',
      '—',
      `$${mission.targeting_surcharge_usd.toFixed(2)}`,
    ]);
  }
  if ((mission.extra_questions_cost_usd || 0) > 0) {
    rows.push([
      'Additional questions',
      '—',
      '—',
      `$${mission.extra_questions_cost_usd.toFixed(2)}`,
    ]);
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Respondents', 'Unit Price', 'Total']],
    body: rows,
    theme: 'plain',
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [190, 242, 100],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 10,
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 10,
      textColor: [17, 24, 39],
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 70 },
      2: { halign: 'right', cellWidth: 80 },
      3: { halign: 'right', cellWidth: 80, fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  // ── Summary / Totals box ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterTable = (doc as any).lastAutoTable.finalY + 20;
  const subtotal =
    (mission.base_cost_usd || 0) +
    (mission.targeting_surcharge_usd || 0) +
    (mission.extra_questions_cost_usd || 0);
  const summaryX = pageWidth - margin - 200;
  const summaryWidth = 200;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Subtotal', summaryX, afterTable);
  doc.setTextColor(17, 24, 39);
  doc.text(`$${subtotal.toFixed(2)}`, summaryX + summaryWidth, afterTable, {
    align: 'right',
  });

  let summaryY = afterTable + 18;
  if ((mission.discount_usd || 0) > 0) {
    doc.setTextColor(107, 114, 128);
    doc.text(`Promo (${mission.promo_code || 'discount'})`, summaryX, summaryY);
    doc.setTextColor(74, 222, 128);
    doc.text(
      `-$${mission.discount_usd.toFixed(2)}`,
      summaryX + summaryWidth,
      summaryY,
      { align: 'right' },
    );
    summaryY += 18;
  }

  // Total bar
  doc.setFillColor(11, 12, 21);
  doc.rect(summaryX, summaryY + 4, summaryWidth, 36, 'F');
  doc.setFontSize(10);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAID', summaryX + 14, summaryY + 26);
  doc.setFontSize(16);
  doc.setTextColor(190, 242, 100);
  doc.text(
    `$${mission.total_price_usd.toFixed(2)}`,
    summaryX + summaryWidth - 14,
    summaryY + 26,
    { align: 'right' },
  );

  // ── Footer ────────────────────────────────────────────────────────────
  const footerY = pageHeight - 60;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, footerY - 20, pageWidth - margin, footerY - 20);

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  if (cardLast4) {
    doc.text(`Paid via Stripe · Card ending ${cardLast4}`, margin, footerY);
  } else {
    doc.text('Paid via Stripe', margin, footerY);
  }
  doc.text(
    'hello@vettit.ai · Dubai, UAE',
    pageWidth - margin,
    footerY,
    { align: 'right' },
  );

  doc.setFontSize(8);
  doc.text(
    'Thank you for using VETT — AI Consumer Research',
    pageWidth / 2,
    footerY + 16,
    { align: 'center' },
  );

  // ── Save ──────────────────────────────────────────────────────────────
  doc.save(`VETT-Invoice-${mission.id.slice(0, 8).toUpperCase()}.pdf`);
}
