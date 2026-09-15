/**
 * Turn one invoice from GET /api/profile/invoices into what the PDF and PPT
 * invoice generators draw. Plain .mjs so scripts/verify-invoice-document.mjs
 * can execute it.
 *
 * The API sends the charged total and the stored cost lines (see
 * vettit-backend src/services/invoices/buildInvoice.js). This used to read flat
 * base_cost_usd / discount_usd / promo_code / goal_type fields the API never
 * sent, so every invoice showed base = total with nothing else.
 */

/** The payment line printed at the foot of the invoice. */
export function paymentNote(inv) {
  switch (inv.paidVia) {
    case 'stripe': return 'Paid by card via Stripe';
    case 'promo':  return inv.total === 0
      ? `Covered in full by promo code ${inv.promoCode}`
      : `Paid with promo code ${inv.promoCode}`;
    case 'admin':  return 'Provided by VETT; no card payment was taken';
    default:       return inv.total > 0 ? 'Payment method not recorded' : 'No payment recorded';
  }
}

export function toInvoiceMission(inv) {
  const lines = inv.lines || { base: inv.amount || 0, targetingSurcharge: 0, extraQuestionsCost: 0, discount: 0 };
  const total = typeof inv.total === 'number' ? inv.total : (inv.amount || 0);
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
  };
}
