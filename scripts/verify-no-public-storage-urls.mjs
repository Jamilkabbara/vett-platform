/**
 * verify-no-public-storage-urls - a customer's file is reached through a URL
 * minted for the viewer, never through a public one.
 *
 * Both storage buckets used to be public. A public bucket bypasses row level
 * security on read, so the link WAS the authorisation: an anonymous GET of a
 * file belonging to another account returned 200 and the bytes. Both buckets
 * are private now, and this fails if any code path composes a public URL again
 * or hardcodes one.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const failures = [];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|mjs|js)$/.test(entry)) out.push(full);
  }
  return out;
}

const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

for (const file of walk(join(ROOT, 'src'))) {
  const rel = file.slice(ROOT.length);
  const src = stripComments(readFileSync(file, 'utf8'));
  src.split('\n').forEach((line, i) => {
    if (/\.getPublicUrl\s*\(/.test(line)) {
      failures.push(`${rel}:${i + 1} composes a public storage URL; sign it for the viewer instead`);
    }
    if (/storage\/v1\/object\/public\//.test(line)) {
      failures.push(`${rel}:${i + 1} hardcodes a public storage URL`);
    }
  });
}

if (failures.length) {
  console.error('\nverify-no-public-storage-urls FAILED\n');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('verify-no-public-storage-urls ok: every stored file is reached through a signed URL');
