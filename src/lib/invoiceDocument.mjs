/**
 * Turn one invoice from GET /api/profile/invoices into what the PDF and PPT
 * invoice generators draw. Plain .mjs so scripts/verify-invoice-document.mjs
 * can execute it.
 *
 * The API sends the charged total and the stored cost lines (see
 * vettit-backend src/services/invoices/buildInvoice.js). This used to read flat
 * base_cost_usd / discount_usd / promo_code / goal_type fields the API never
 * sent, so every invoice showed base = total with nothing else.
 *
 * Refunds: `total` is what was charged, `refunded` what Stripe gave back and
 * `net` what was kept. A refunded invoice must never read PAID: 21 of 22
 * Stripe charges were refunded and every invoice said PAID.
 */

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Charged, refunded and net, from an API invoice (older responses have no refund fields). */
export function refundFigures(inv) {
  const total = money(typeof inv.total === 'number' ? inv.total : inv.amount);
  const refunded = Math.min(money(inv.refunded), total);
  const net = money(typeof inv.net === 'number' ? inv.net : total - refunded);
  const status = refunded === 0 ? 'paid' : net === 0 ? 'refunded' : 'partially_refunded';
  return { total, refunded, net, status };
}

/** The badge on the invoice list, PDF and PPT. */
export function statusLabel(status) {
  if (status === 'refunded') return { text: 'Refunded', badge: 'REFUNDED', tone: 'refunded' };
  if (status === 'partially_refunded') return { text: 'Partly refunded', badge: 'PART REFUNDED', tone: 'partial' };
  return { text: 'Paid', badge: 'PAID', tone: 'paid' };
}

/** The payment line printed at the foot of the invoice. */
export function paymentNote(inv) {
  const { status } = refundFigures(inv);
  switch (inv.paidVia) {
    case 'stripe': return status === 'refunded' ? 'Paid by card via Stripe, refunded in full'
      : status === 'partially_refunded' ? 'Paid by card via Stripe, partly refunded'
        : 'Paid by card via Stripe';
    case 'promo':  return inv.total === 0
      ? `Covered in full by promo code ${inv.promoCode}`
      : `Paid with promo code ${inv.promoCode}`;
    case 'admin':  return 'Provided by VETT; no card payment was taken';
    default:       return inv.total > 0 ? 'Payment method not recorded' : 'No payment recorded';
  }
}

export function toInvoiceMission(inv) {
  const lines = inv.lines || { base: inv.amount || 0, targetingSurcharge: 0, extraQuestionsCost: 0, discount: 0 };
  const { total, refunded, net, status } = refundFigures(inv);
  const label = statusLabel(status);
  return {
    id:                       inv.missionId,
    title:                    inv.missionStatement || 'Market Research Mission',
    total_price_usd:          total,
    base_cost_usd:            lines.base,
    targeting_surcharge_usd:  lines.targetingSurcharge,
    extra_questions_cost_usd: lines.extraQuestionsCost,
    discount_usd:             lines.discount,
    promo_code:               inv.promoCode ?? null,
    respondent_count:         inv.respondentCount || 0,
    paid_at:                  inv.date,
    goal_type:                inv.goalType || '',
    payment_note:             paymentNote({ ...inv, total }),
    refunded_usd:             refunded,
    net_usd:                  net,
    status,
    badge:                    label.badge,
    total_label:              refunded > 0 ? 'NET PAID' : 'TOTAL PAID',
  };
}
