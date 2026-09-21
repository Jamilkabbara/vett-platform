/**
 * verify-storage-uploads-valid - an upload must go to a bucket that exists, at
 * a path row level security will accept.
 *
 * Three setup flows uploaded to a bucket named `mission-assets`, which has
 * never existed on this project (the buckets are vett-creatives, vett-uploads
 * and vettit-uploads). Every concept image, ad creative and brand-lift creative
 * a customer attached in those flows failed. Live evidence: 32 concept and
 * ad-testing missions exist and NOT ONE has media attached.
 *
 * They were also building paths as `<category>/<userId>/...`, while every
 * storage policy on this project requires the FIRST folder to be the user's id
 * ((storage.foldername(name))[1] = auth.uid()). So even against a real bucket,
 * the upload would have been refused.
 *
 * This fails if either mistake comes back.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const KNOWN_BUCKETS = ['vett-creatives', 'vett-uploads', 'vettit-uploads'];
const failures = [];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

for (const file of walk(join(ROOT, 'src'))) {
  const rel = file.slice(ROOT.length);
  const src = stripComments(readFileSync(file, 'utf8'));

  for (const m of src.matchAll(/storage\s*\n?\s*\.from\(\s*'([^']+)'\s*\)/g)) {
    if (!KNOWN_BUCKETS.includes(m[1])) {
      failures.push(`${rel} uploads to "${m[1]}", which is not a bucket on this project (${KNOWN_BUCKETS.join(', ')})`);
    }
  }

  // A path handed to .upload() must start with the user's id.
  for (const m of src.matchAll(/const path = `([^`]+)`/g)) {
    const template = m[1];
    if (!/^\$\{(userId|user\.id)\}/.test(template)) {
      failures.push(`${rel} builds an upload path starting "${template.slice(0, 40)}"; storage policies require the user id as the first folder`);
    }
  }
}

if (failures.length) {
  console.error('\nverify-storage-uploads-valid FAILED\n');
  for (const f of [...new Set(failures)]) console.error('  - ' + f);
  process.exit(1);
}
console.log(`verify-storage-uploads-valid ok: every upload targets a real bucket at a user-owned path`);
