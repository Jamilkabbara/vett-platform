/**
 * verify-no-void-supabase-writes - a Supabase query builder only sends its
 * request when it is awaited or .then()ed. `void supabase.from(...)...` sends
 * nothing, silently. The dashboard's targeting seed was written that way and
 * never saved for 74 of 100 missions.
 *
 * Fails on `void supabase.from(` anywhere in src/. (supabase.storage and
 * supabase.removeChannel are ordinary async calls that do run, so they are
 * not matched.)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const hits = [];
(function walk(dir) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(ROOT, rel)).isDirectory()) { walk(rel); continue; }
    if (!/\.(tsx?|jsx?)$/.test(name)) continue;
    const src = readFileSync(join(ROOT, rel), 'utf8');
    const re = /void\s+supabase\s*\.\s*from\s*\(/g;
    let m;
    while ((m = re.exec(src))) hits.push(`${rel}:${src.slice(0, m.index).split('\n').length}`);
  }
})('src');
if (hits.length) {
  console.error('\nverify-no-void-supabase-writes FAILED - these queries never send:\n');
  for (const h of hits) console.error('  - ' + h);
  process.exit(1);
}
console.log('verify-no-void-supabase-writes ok: no fire-and-forget Supabase query builders in src/');
