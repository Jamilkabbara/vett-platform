/**
 * verify-invoice-document - invoices are drawn from the API's charged total
 * and cost lines, executed rather than assumed.
 *
 * Fixtures are the shape GET /api/profile/invoices returned from production
 * on 2026-09-15 (vettit-backend buildInvoice.js).
 */
import { readFileSync } from 'node:fs';
import { toInvoiceMission, paymentNote, refundFigures, statusLabel } from '../src/lib/invoiceDocument.mjs';

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };
const sum = (d) => Math.round((d.base_cost_usd + d.targeting_surcharge_usd + d.extra_questions_cost_usd - d.discount_usd) * 100);

const api = (over) => ({ invoiceId: 'VTT-X', missionId: 'm', missionStatement: 'Test', goalType: 'naming_messaging', respondentCount: 5, date: '2026-06-13', status: 'paid', paidVia: 'admin', promoCode: null, itemised: true, lines: { base: 9, targetingSurcharge: 5, extraQuestionsCost: 300, discount: 0 }, total: 314, amount: 314, ...over });

// 1. Every line reaches the document and they sum to the total.
const d = toInvoiceMission(api());
check(d.base_cost_usd === 9 && d.targeting_surcharge_usd === 5 && d.extra_questions_cost_usd === 300, `lines not carried: ${JSON.stringify(d)}`);
check(sum(d) === Math.round(d.total_price_usd * 100), 'targeting + extra questions invoice does not sum to its total');
check(d.goal_type === 'naming_messaging', `goal type lost: ${d.goal_type}`);

// 2. Discount and promo code.
const p = toInvoiceMission(api({ paidVia: 'stripe', promoCode: 'SAVE20', lines: { base: 149, targetingSurcharge: 1.5, extraQuestionsCost: 10, discount: 32.1 }, total: 128.4, amount: 128.4 }));
check(p.discount_usd === 32.1 && p.promo_code === 'SAVE20', `discount/promo not carried: ${JSON.stringify(p)}`);
check(sum(p) === 12840, 'discounted invoice does not sum to what was captured');

// 3. Payment note names Stripe only for Stripe.
check(paymentNote(api({ paidVia: 'stripe' })) === 'Paid by card via Stripe', 'stripe note');
check(!/stripe/i.test(paymentNote(api({ paidVia: 'promo', promoCode: 'VETT100', total: 0 }))), 'a promo-covered invoice mentions Stripe');
check(!/stripe/i.test(paymentNote(api({ paidVia: 'admin' }))), 'a VETT-provided invoice mentions Stripe');
check(toInvoiceMission(api({ paidVia: 'promo', promoCode: 'VETT100', lines: { base: 0, targetingSurcharge: 0, extraQuestionsCost: 0, discount: 0 }, total: 0, amount: 0 })).payment_note === 'Covered in full by promo code VETT100', 'free promo note');

// 4. The tab and both generators use the mapper, not the old flat fields.
const tab = readFileSync(new URL('../src/components/profile/BillingInvoicesTab.tsx', import.meta.url), 'utf8');
check((tab.match(/toInvoiceMission\(/g) || []).length >= 2, 'BillingInvoicesTab does not build both documents with toInvoiceMission');
check(!/inv\.(base_cost_usd|discount_usd|promo_code|goal_type|targeting_surcharge_usd|extra_questions_cost_usd)/.test(tab), 'BillingInvoicesTab still reads flat fields the API does not send');
for (const f of ['generateInvoicePdf.ts', 'generateInvoicePpt.ts']) {
  const s = readFileSync(new URL(`../src/lib/${f}`, import.meta.url), 'utf8');
  check(!/'Paid via Stripe'/.test(s), `${f} still hardcodes 'Paid via Stripe'`);
}

// 5. Refunds. af36a36d as the API sends it after the refund backfill.
const refunded = api({ paidVia: 'stripe', goalType: 'brand_lift', status: 'refunded', lines: { base: 9, targetingSurcharge: 0, extraQuestionsCost: 0, discount: 0 }, total: 9, refunded: 9, net: 0, amount: 9 });
const r = toInvoiceMission(refunded);
check(r.badge === 'REFUNDED' && r.status === 'refunded', `a fully refunded charge is badged ${r.badge}`);
check(r.badge !== 'PAID', 'a fully refunded charge reads PAID');
check(r.refunded_usd === 9 && r.net_usd === 0 && r.total_label === 'NET PAID', `refund lines not carried: ${JSON.stringify(r)}`);
check(sum(r) === 900, 'the charged lines of a refunded invoice no longer sum to what was charged');
check(r.payment_note === 'Paid by card via Stripe, refunded in full', `refunded payment note: ${r.payment_note}`);
const partial = toInvoiceMission(api({ paidVia: 'stripe', lines: { base: 19, targetingSurcharge: 0, extraQuestionsCost: 0, discount: 0 }, total: 19, refunded: 3.6, net: 15.4, amount: 19 }));
check(partial.badge === 'PART REFUNDED' && partial.net_usd === 15.4, `partial refund: ${JSON.stringify(partial)}`);
const kept = toInvoiceMission(api({ paidVia: 'stripe', lines: { base: 9, targetingSurcharge: 0, extraQuestionsCost: 0, discount: 0 }, total: 9, refunded: 0, net: 9, amount: 9 }));
check(kept.badge === 'PAID' && kept.total_label === 'TOTAL PAID' && kept.net_usd === 9, `unrefunded invoice: ${JSON.stringify(kept)}`);
// An older API response without refund fields is still read as paid in full.
check(refundFigures({ total: 9, amount: 9 }).status === 'paid', 'a response without refund fields is not treated as paid');
check(statusLabel('refunded').text === 'Refunded', 'tab label for refunded');

// 6. The tab, PDF and PPT draw the status and net, not a hardcoded PAID and the charged total.
check(!/>\s*Paid\s*</.test(tab), 'BillingInvoicesTab still hardcodes a Paid pill');
check(/refundFigures\(i\)\.net/.test(tab), 'Total Spent is not net of refunds');
check(!/inv\.total \?\? inv\.amount/.test(tab), 'BillingInvoicesTab still shows the charged total as the amount');
for (const f of ['generateInvoicePdf.ts', 'generateInvoicePpt.ts']) {
  const src = readFileSync(new URL(`../src/lib/${f}`, import.meta.url), 'utf8');
  check(!/text\('PAID'/.test(src) && !/addText\('PAID'/.test(src), `${f} still hardcodes the PAID badge`);
  check(/net_usd/.test(src) && /Refunded/.test(src), `${f} does not draw the refund line and net`);
}

if (failures.length) {
  console.error('\nverify-invoice-document FAILED\n');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('verify-invoice-document ok: lines, discount, promo and payment note reach the invoice and sum to the charged total');
