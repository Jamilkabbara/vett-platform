/**
 * verify-invoice-document - invoices are drawn from the API's charged total
 * and cost lines, executed rather than assumed.
 *
 * Fixtures are the shape GET /api/profile/invoices returned from production
 * on 2026-09-15 (vettit-backend buildInvoice.js).
 */
import { readFileSync } from 'node:fs';
import { toInvoiceMission, paymentNote } from '../src/lib/invoiceDocument.mjs';

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

if (failures.length) {
  console.error('\nverify-invoice-document FAILED\n');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('verify-invoice-document ok: lines, discount, promo and payment note reach the invoice and sum to the charged total');
