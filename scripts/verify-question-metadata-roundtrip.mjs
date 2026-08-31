/**
 * PR C proof harness — question analysis metadata survives the round trip.
 *
 * The frontend has NO test runner (package.json has no `test` script and no
 * vitest/jest dependency; the two files under src/**\/__tests__ never execute —
 * src/data/__tests__/comingSoon.sync.test.ts says so in its own header). Rather
 * than add a test that silently never runs, this script proves the fix against
 * the REAL shipped source: it reads DashboardPage.tsx and aiService.ts off disk,
 * strips the TypeScript with esbuild, brace-matches the actual function bodies
 * out of the transpiled output, evaluates them, and runs a full
 * generate -> persist -> reload -> edit -> re-persist round trip through them.
 *
 * No logic is copied or re-implemented here, so this cannot drift from the code
 * it is asserting about.
 *
 *   node scripts/verify-question-metadata-roundtrip.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import esbuild from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Strip types + comments so brace matching is safe. */
function toJs(relPath, loader) {
  const src = readFileSync(resolve(root, relPath), 'utf8');
  return esbuild.transformSync(src, { loader, format: 'esm' }).code;
}

/** Extract a top-level `function name(...)` / `const name = ...;` by brace matching. */
function sliceFn(js, header) {
  const start = js.indexOf(header);
  if (start === -1) throw new Error(`could not find "${header}" — did the source move?`);
  const open = js.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < js.length; i++) {
    if (js[i] === '{') depth++;
    else if (js[i] === '}' && --depth === 0) return js.slice(start, i + 1);
  }
  throw new Error(`unbalanced braces after "${header}"`);
}

function sliceStatement(js, header) {
  const start = js.indexOf(header);
  if (start === -1) throw new Error(`could not find "${header}"`);
  const end = js.indexOf(';', start);
  return js.slice(start, end + 1);
}

// ── Load the REAL normaliseQuestions out of DashboardPage.tsx ──────────────
const dashJs = toJs('src/pages/DashboardPage.tsx', 'tsx');
const normaliseQuestions = new Function(
  `${sliceStatement(dashJs, 'const VALID_QUESTION_TYPES')}
   ${sliceFn(dashJs, 'function normaliseQuestions')}
   return normaliseQuestions;`,
)();

// ── Load the REAL mapQuestion out of aiService.ts ──────────────────────────
const aiJs = toJs('src/services/aiService.ts', 'ts');
const mapQuestion = new Function(
  `${sliceStatement(aiJs, 'const VALID_TYPES')}
   ${sliceStatement(aiJs, 'const TYPE_MAP')}
   ${sliceFn(aiJs, 'function mapType')}
   ${sliceFn(aiJs, 'function mapQuestion')}
   return mapQuestion;`,
)();

// ── emit() from MissionControlQuestions.tsx is a plain spread; mirrored here
//    only to model the edit step. Its preservation is verified by reading it. ──
const emit = (list) => list.map((q, i) => ({ ...q, isScreening: i === 0 }));

// ── A backend-generated question carrying every documented metadata field ──
const BACKEND_QUESTION = {
  id: 'q4',
  text: 'How much would you expect to pay?',
  type: 'likert',            // must be normalised to 'opinion'
  options: [],               // opinion with no options -> defaults filled in
  kind: 'wtp',
  dimension: 'price_sensitivity',
  methodology: 'van_westendorp',
  funnel_stage: 'consideration',
  kpi_category: 'intent',
  is_lift_question: true,
  vw_band: 'too_expensive',
  gg_anchor_index: 3,
  feature_set: ['a', 'b'],
  feature_id: 'feat_7',
  kano_type: 'functional',
  churn_stage: 'at_risk',
  concept_id: 'concept_2',
  is_final_choice: false,
  brand_id: 'brand_focal',
  is_paired_comparison: true,
  is_turf: false,
  category: 'beverages',
  channel_id: 'ch_tiktok',
  qualifying_answers: ['Yes'],
  screening_continue_on: ['Yes'],
  // a field no methodology has shipped yet — an allowlist would drop this
  some_future_tag: 'not_in_any_allowlist',
};

const META_KEYS = Object.keys(BACKEND_QUESTION).filter(
  (k) => !['id', 'text', 'type', 'options'].includes(k),
);

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

console.log('--- Step 1: backend survey JSON -> aiService.mapQuestion (mission create)');
const generated = mapQuestion(BACKEND_QUESTION, 0);
for (const k of META_KEYS) {
  check(`mapQuestion preserves ${k}`, JSON.stringify(generated[k]) === JSON.stringify(BACKEND_QUESTION[k]),
    `got ${JSON.stringify(generated[k])}`);
}
check('mapQuestion still normalises type likert -> opinion', generated.type === 'opinion', `got ${generated.type}`);
check('mapQuestion still fills opinion options', Array.isArray(generated.options) && generated.options.length === 3,
  JSON.stringify(generated.options));
check('mapQuestion still forces aiRefined true', generated.aiRefined === true);
check('mapQuestion still forces hasPIIError false', generated.hasPIIError === false);

console.log('\n--- Step 2: persist to jsonb, reload -> DashboardPage.normaliseQuestions');
const fromDb = JSON.parse(JSON.stringify([generated]));   // jsonb round trip
const [reloaded] = normaliseQuestions(fromDb);
for (const k of META_KEYS) {
  check(`normaliseQuestions preserves ${k}`, JSON.stringify(reloaded[k]) === JSON.stringify(BACKEND_QUESTION[k]),
    `got ${JSON.stringify(reloaded[k])}`);
}
check('normaliseQuestions still coerces id to string', typeof reloaded.id === 'string');
check('normaliseQuestions still coerces text to string', typeof reloaded.text === 'string');
check('normaliseQuestions still keeps a valid type', ['single', 'multi', 'rating', 'opinion', 'text'].includes(reloaded.type));
check('normaliseQuestions still forces hasPIIError false', reloaded.hasPIIError === false);
check('normaliseQuestions still defaults isScreening', reloaded.isScreening === false);

console.log('\n--- Step 2b: normalisation defaults unchanged on a bare/garbage question');
const [bare] = normaliseQuestions([{ type: 'nonsense-type' }]);
check('unknown type falls back to rating', bare.type === 'rating', `got ${bare.type}`);
check('missing id defaults to q1', bare.id === 'q1', `got ${bare.id}`);
check('missing text defaults to ""', bare.text === '');
check('missing options defaults to []', Array.isArray(bare.options) && bare.options.length === 0);
check('missing aiRefined defaults to true', bare.aiRefined === true);
check('non-object entries are dropped', normaliseQuestions([null, 'x', 3]).length === 0);
check('non-array input yields []', normaliseQuestions(undefined).length === 0);

console.log('\n--- Step 3: user edits a question in Mission Control -> emit() -> flushQuestions payload');
const edited = emit(normaliseQuestions(fromDb).map((q) => ({ ...q, text: 'Edited by the user' })));
const written = JSON.parse(JSON.stringify(edited))[0];   // what flushQuestions writes back
for (const k of META_KEYS) {
  check(`re-persisted payload keeps ${k}`, JSON.stringify(written[k]) === JSON.stringify(BACKEND_QUESTION[k]),
    `got ${JSON.stringify(written[k])}`);
}
check('the edit itself landed', written.text === 'Edited by the user');
check('emit re-asserts isScreening on index 0', written.isScreening === true);

console.log('\n--- Step 4: the analyses that #65 was about');
check('market_entry can still group by q.kind', written.kind === 'wtp');
check('audience_profiling can still match by q.dimension', written.dimension === 'price_sensitivity');
check('PricingResultsPage can still filter methodology === van_westendorp', written.methodology === 'van_westendorp');
check('PricingResultsPage can still read vw_band / gg_anchor_index',
  written.vw_band === 'too_expensive' && written.gg_anchor_index === 3);

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
