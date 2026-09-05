#!/usr/bin/env node
/*
 * verify-no-orphan-session-handoff.mjs
 * ---------------------------------------------------------------------------
 * The landing page used to hand a brief attachment to Mission Setup through
 * sessionStorage['vett_landing_attachment']. Nothing in the codebase ever read
 * that key. The write looked harmless, but it sat behind a paperclip button
 * that uploaded the user's file into the `vett-uploads` storage bucket first,
 * so every use of the affordance left a blob in storage that no code path
 * would ever reference again, and promised the user their file mattered.
 *
 * Neither typecheck nor lint can see this: an orphan sessionStorage write is
 * perfectly valid TypeScript. That is exactly why it survived from Pass 17.
 *
 * INVARIANT ENFORCED HERE
 *   Every sessionStorage key WRITTEN anywhere under src/ must be READ
 *   somewhere under src/. A cross-page handoff with no reader is a promise
 *   the product does not keep.
 *
 * Plain node script, matching the verify-markdown-rendering.mjs /
 * verify-question-metadata-roundtrip.mjs convention, because this repo has no
 * React test runner (see the note in src/data/__tests__/comingSoon.sync.test.ts).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) failures += 1;
};

/** Every .ts/.tsx file under src/, as { path, source }. */
function collectSources(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectSources(full, out);
    else if (/\.tsx?$/.test(entry)) out.push({ path: full, source: readFileSync(full, 'utf8') });
  }
  return out;
}

/*
 * Key resolution. A call site is either a string literal
 *   sessionStorage.setItem('vett_landing_goal', ...)
 * or a module constant
 *   sessionStorage.setItem(PREFILL_KEY, ...)
 * Constants are resolved from their `const NAME = '...'` declaration so the
 * two spellings compare equal. An identifier we cannot resolve falls back to
 * its own name, which still pairs a writer with a reader that spells it the
 * same way.
 */
function buildConstMap(files) {
  const map = new Map();
  const decl = /\bconst\s+([A-Z][A-Z0-9_]*)\s*=\s*['"]([^'"]+)['"]/g;
  for (const { source } of files) {
    for (const m of source.matchAll(decl)) map.set(m[1], m[2]);
  }
  return map;
}

function keysFor(files, method, constMap) {
  const call = new RegExp(`sessionStorage\\.${method}\\(\\s*(?:['"]([^'"]+)['"]|([A-Za-z_$][\\w$]*))`, 'g');
  const found = new Map(); // key -> [file, ...]
  for (const { path, source } of files) {
    for (const m of source.matchAll(call)) {
      const key = m[1] ?? (constMap.get(m[2]) ?? m[2]);
      if (!found.has(key)) found.set(key, []);
      found.get(key).push(path);
    }
  }
  return found;
}

function orphans(files) {
  const constMap = buildConstMap(files);
  const writes = keysFor(files, 'setItem', constMap);
  const reads  = keysFor(files, 'getItem', constMap);
  return [...writes.entries()]
    .filter(([key]) => !reads.has(key))
    .map(([key, paths]) => `${key} (written in ${[...new Set(paths)].join(', ')})`);
}

console.log('sessionStorage handoff keys');

const files = collectSources('src');
check('found source files to scan', files.length > 0, `(${files.length} files)`);

const live = orphans(files);
check('every sessionStorage key written under src/ is also read under src/',
  live.length === 0,
  live.length ? `orphans: ${live.join('; ')}` : '');

/*
 * MUTATION CHECK (positive control). Re-run the SAME detector against a copy
 * of the tree with the removed write put back. If this does not flag it, the
 * assertion above is vacuous and proves nothing.
 */
const mutated = [
  ...files,
  {
    path: 'src/pages/__mutation__.tsx',
    source: "sessionStorage.setItem('vett_landing_attachment', JSON.stringify(attachment));",
  },
];
const mutatedOrphans = orphans(mutated);
check('the detector DOES flag the removed write when it is put back',
  mutatedOrphans.some((o) => o.startsWith('vett_landing_attachment')),
  '(guards against a vacuous pass)');

/*
 * The affordance itself: nothing under src/ should upload into the landing
 * attachment folder any more. This is the storage half of the same defect -
 * an orphan write costs nothing, an orphan BLOB costs storage forever.
 */
const uploaders = files.filter((f) => /landing-attachments/.test(f.source)).map((f) => f.path);
check('no code path uploads into the orphan `landing-attachments` folder',
  uploaders.length === 0,
  uploaders.length ? `still uploading: ${uploaders.join(', ')}` : '');

console.log(failures === 0 ? '\nOK' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
