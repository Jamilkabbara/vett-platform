/**
 * The avatar initials a signed-in user sees are the ones we intend.
 *
 * Replaces src/lib/__tests__/initials.test.ts, which was written for a test
 * runner this repo does not install, and so had never run. Same cases, executed.
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'initials-'));
const failures = [];

try {
  const out = join(dir, 'initials.mjs');
  await build({
    entryPoints: [join(ROOT, 'src/lib/initials.ts')],
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
  });
  const { computeInitials } = await import(pathToFileURL(out).href);

  const cases = [
    ['jk@example.com', 'JK'],
    ['jamil.kabbara@example.com', 'JA'],
    ['a@b.co', 'A'],
    ['', ''],
    [null, ''],
    [undefined, ''],
  ];
  for (const [input, expected] of cases) {
    const got = computeInitials(input);
    if (got !== expected) failures.push(`computeInitials(${JSON.stringify(input)}) -> ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`);
  }

  if (failures.length) {
    console.error('verify-initials FAILED:');
    for (const f of failures) console.error('  ' + f);
    process.exit(1);
  }
  console.log(`verify-initials ok: ${cases.length} cases`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
