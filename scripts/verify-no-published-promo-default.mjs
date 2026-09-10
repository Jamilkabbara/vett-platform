#!/usr/bin/env node
/*
 * verify-no-published-promo-default.mjs
 * ---------------------------------------------------------------------------
 * Two invariants on the revenue path, both source-level, because this repo has
 * no React test runner (npm test is a set of node verify scripts).
 *
 * 1. NO INTERNAL FREE-TYPE PROMO CODE IN RENDERED COPY.
 *    VsPageTemplate.tsx shipped "Promo code VETT100 at checkout" on six live
 *    /vs/* pages. VETT100 is type='free', unlimited uses, no expiry. The copy
 *    invited any visitor to take a paid mission for nothing, directly beneath
 *    the words "Try VETT for $9".
 *
 * 2. PROMO STATE STARTS EMPTY.
 *    A promo must apply only when a user enters one. A hardcoded default would
 *    silently divert every mission down the free-launch path and away from
 *    checkout. This is currently TRUE and this check is a regression guard, not
 *    a fix: the reported "hardcoded VETT100 default" turned out to be comments
 *    and admin UI text. It is worth pinning precisely because it reads as
 *    broken to anyone grepping for VETT100.
 *
 * Comments and the admin PromosPanel are excluded: the panel legitimately names
 * VETT100 in operator-facing text, and comments explaining the free-launch path
 * are documentation, not published copy.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) failures += 1;
};

function collect(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (/\.tsx?$/.test(e)) out.push(full);
  }
  return out;
}

/** Strip // line comments and block comments so only real code/JSX remains. */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const files = collect('src');
check('found source files to scan', files.length > 0, `(${files.length} files)`);

// ── 1. No free-type promo code in rendered copy ────────────────────────────
const FREE_CODES = ['VETT100'];
const published = [];
for (const f of files) {
  if (f.includes('components/admin/')) continue; // operator-facing by design
  const code = stripComments(readFileSync(f, 'utf8'));
  for (const c of FREE_CODES) if (code.includes(c)) published.push(`${c} in ${f}`);
}
check(
  'no internal free-type promo code appears in rendered copy',
  published.length === 0,
  published.length ? `offenders: ${published.join(', ')}` : '',
);

// ── 2. Promo state initialises empty ───────────────────────────────────────
const inits = [];
for (const f of files) {
  const code = stripComments(readFileSync(f, 'utf8'));
  for (const m of code.matchAll(/useState[^(]*\(\s*(['"`])(.*?)\1\s*\)/g)) {
    const idx = m.index ?? 0;
    const decl = code.slice(Math.max(0, idx - 80), idx);
    if (/promo/i.test(decl) && m[2] !== '') inits.push(`${f}: "${m[2]}"`);
  }
}
check(
  'promo code state initialises empty, never with a default',
  inits.length === 0,
  inits.length ? `offenders: ${inits.join(', ')}` : '',
);

// ── 3. The detector is not vacuous ─────────────────────────────────────────
const tmpl = readFileSync('src/components/marketing/VsPageTemplate.tsx', 'utf8');
check(
  'the detector DOES flag a published code when one is put back',
  stripComments(`${tmpl}\nconst x = "VETT100";`).includes('VETT100'),
  '(guards against a vacuous pass)',
);

console.log(failures ? `\n${failures} FAILURE(S)` : '\nOK');
process.exit(failures ? 1 : 0);
