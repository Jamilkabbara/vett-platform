/**
 * Guard: the centerpiece must fall back to key_findings when an adapter
 * resolves to nothing, and the emptiness test must inspect the ScalarSlot.
 *
 * The marketing adapter reads `analysis.funnel.*`. Those paths are correct, but
 * `computeMarketing` keys off `question.funnel_stage` metadata, and a mission
 * whose questions were never tagged gets every funnel stage null. The adapter
 * then renders three em-dashes and no rows, while that same mission's
 * key_findings carries six populated metrics the outgoing results page shows.
 * Blanking a page that currently has content is the worst outcome of the
 * results cutover, so the fallback is what makes the cutover safe.
 *
 * THE TRAP, because I fell in it. A Cell's `value` is a ScalarSlot OBJECT and
 * toScalarSlot ALWAYS returns one - it is never null. So `c.value == null` is
 * always false, and an emptiness test written that way is a silent no-op: it
 * type-checks, it ships, and the blank page stays blank. The condition has to
 * be the one primitives.tsx renders an em-dash for, which is scalar == null
 * AND note == null.
 *
 * Source-level because this repo has no component test runner and the fixtures
 * are TypeScript, which a plain Node guard cannot import. It pins the two
 * things that actually broke.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/**
 * Comments are stripped before any of this is matched. The first version of
 * this guard failed on the CORRECT code, because the comment beside the fix
 * quotes the broken expression in order to explain it.
 */
const stripComments = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const src = stripComments(readFileSync(join(ROOT, 'src', 'components', 'results-v2', 'centerpiece.ts'), 'utf8'));
const fail = [];

if (!/function isEmptyView/.test(src)) {
  fail.push('isEmptyView is gone - an adapter that resolves to nothing will render a blank hero again');
}

const body = src.slice(src.indexOf('function isEmptyView'), src.indexOf('function isEmptyView') + 600);

if (/c\.value\s*==\s*null/.test(body)) {
  fail.push('isEmptyView tests `c.value == null`. A Cell value is a ScalarSlot object and is never null, so that test never fires. Check `c.value.scalar` and `c.value.note` instead.');
}
if (!/value\.scalar\s*==\s*null/.test(body) || !/value\.note\s*==\s*null/.test(body)) {
  fail.push('isEmptyView must test BOTH value.scalar and value.note - a cell with only a demoted note is not blank');
}

// The fallback has to be wired, not merely defined.
const entry = src.slice(src.indexOf('export function buildCenterpiece'));
if (!/isEmptyView\(view\)/.test(entry)) {
  fail.push('buildCenterpiece never calls isEmptyView, so the fallback is dead code');
}
if (!/generic\(findings\)/.test(entry)) {
  fail.push('buildCenterpiece no longer falls back to generic(findings)');
}

if (fail.length) {
  console.error('verify-centerpiece-fallback: FAILED');
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log('verify-centerpiece-fallback: OK');
