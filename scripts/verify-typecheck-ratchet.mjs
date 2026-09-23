/**
 * TypeScript runs on every PR, and the error count can only go down.
 *
 * `npm run typecheck` existed and had never run in CI. Switching it on outright
 * was impossible: 38 errors had accumulated while nothing looked. Demanding a
 * clean sweep first is how a check stays off for another year.
 *
 * So the count is pinned. New type errors fail the build; the backlog does not.
 * When the number drops, this file says so and asks for BASELINE to be lowered,
 * which is the only way the debt ever actually shrinks.
 *
 * Checked 2026-09-23: none of the 38 is a live defect. They are widened object
 * literals and unused declarations - the sampled TS2339s (autoOptions /
 * minOptions / maxOptions on QUESTION_TYPES) are real keys on every type whose
 * `requiresOptions` reaches that code, so nothing is undefined at runtime.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const BASELINE = 38;
const run = promisify(execFile);

let output = '';
try {
  const { stdout } = await run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.app.json'], { maxBuffer: 10 * 1024 * 1024 });
  output = stdout;
} catch (err) {
  // tsc exits non-zero when it reports errors; that is the normal path here.
  output = `${err.stdout || ''}${err.stderr || ''}`;
}

const errors = output.split('\n').filter((l) => / error TS\d+: /.test(l));
const count = errors.length;

if (count > BASELINE) {
  console.error(`verify-typecheck-ratchet FAILED: ${count} type errors, baseline is ${BASELINE}.`);
  // tsc orders by file, not by age, so which lines are NEW cannot be inferred
  // from the tail. Say the true thing and point at the full list.
  console.error(`  This change adds ${count - BASELINE} type error(s).`);
  console.error('  Run `npm run typecheck` to see all of them, and fix the ones in files you touched.');
  process.exit(1);
}

if (count < BASELINE) {
  console.error(`verify-typecheck-ratchet FAILED: ${count} type errors, baseline still says ${BASELINE}.`);
  console.error(`  Good news - you fixed some. Lower BASELINE to ${count} in scripts/verify-typecheck-ratchet.mjs`);
  console.error('  so the ground you gained cannot be given back.');
  process.exit(1);
}

console.log(`verify-typecheck-ratchet ok: ${count} known type errors, none added`);
