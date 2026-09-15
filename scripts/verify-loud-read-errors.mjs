/**
 * verify-loud-read-errors - a failed read on the website shows an error,
 * never data that looks real. Executed rather than assumed.
 */
import { readFileSync } from 'node:fs';
import { settleInvoices, settleSegment, parseChatFrame } from '../src/lib/loadOutcome.mjs';

const failures = [];
const check = (c, m) => { if (!c) failures.push(m); };
const fail = Promise.reject(Object.assign(new Error('Service Unavailable'), { status: 503 }));
fail.catch(() => {});

// Invoices: failure is an error, not an empty list; success still works.
const inv = await settleInvoices(Promise.reject(new Error('503')));
check(inv.invoices === null && typeof inv.error === 'string', `failed invoice load became ${JSON.stringify(inv)}`);
const inv2 = await settleInvoices(Promise.resolve([]));
check(Array.isArray(inv2.invoices) && inv2.error === null, 'a real empty invoice list must still load as empty');

// Segment: failure resets to all respondents and says so.
const sg = await settleSegment('age_25_34', Promise.reject(new Error('503')));
check(sg.seg === 'all' && sg.active === null && typeof sg.error === 'string', `failed segment left ${JSON.stringify(sg)}`);
const sg2 = await settleSegment('age_25_34', Promise.resolve({ report: { id: 'r' } }));
check(sg2.seg === 'age_25_34' && sg2.active && sg2.error === null, 'a loaded segment must stay selected');

// Chat: the server's error frame is an error, not a malformed frame.
const f = parseChatFrame(JSON.stringify({ error: "Could not load this mission's results right now. Please try again." }));
check(f.type === 'error' && /Could not load/.test(f.error), `error frame parsed as ${JSON.stringify(f)}`);
check(parseChatFrame('not json').type === 'malformed', 'a non-JSON frame is malformed');
check(parseChatFrame(JSON.stringify({ delta: 'Hi' })).type === 'delta', 'delta frame');

// The components use them, and the silent patterns are gone.
const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
const tab = read('components/profile/BillingInvoicesTab.tsx');
check(/settleInvoices[<(]/.test(tab) && /if \(loadError\)/.test(tab), 'BillingInvoicesTab does not render the load error');
check(!/fail silently/.test(tab), 'BillingInvoicesTab still fails silently');
const results = read('pages/ResultsV2Page.tsx');
check(/settleSegment/.test(results) && /segError &&/.test(results), 'SegmentExplorer does not surface a failed segment read');
const chat = read('components/chat/ChatWidget.tsx');
check(/parseChatFrame\(/.test(chat) && /if \(streamError\)/.test(chat), 'ChatWidget does not surface the stream error frame');
check(!/throw new Error\(obj\.error\)/.test(chat), 'ChatWidget still throws the error frame inside the malformed-frame catch');

if (failures.length) {
  console.error('\nverify-loud-read-errors FAILED\n');
  for (const x of failures) console.error('  - ' + x);
  process.exit(1);
}
console.log('verify-loud-read-errors ok: failed invoice, segment and chat reads surface as errors; real empty results still load');
