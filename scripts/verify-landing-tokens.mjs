/**
 * verify-landing-tokens - the landing page takes every colour, gradient,
 * shadow and font from the lp-* theme tokens (src/styles/landingTokens.mjs).
 *
 * Before the September 2026 redesign the landing files carried about 180
 * hand-typed colour values, a second palette that nothing named. The palette
 * is now named once; this fails if a literal comes back:
 *   - hex colours (#abc, #aabbcc, #aabbccdd)
 *   - rgb()/rgba()/hsl()/hsla() values
 *   - font-['...'] arbitrary families
 * Comments are ignored. White and black at an opacity (white/[0.07]) are
 * Tailwind colour names, not literals, and are allowed.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['src/pages/LandingV2Page.tsx', 'src/styles/landing-v2.css'];
for (const f of readdirSync(join(ROOT, 'src/components/landing-v2'))) FILES.push(`src/components/landing-v2/${f}`);

const RULES = [
  [/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/, 'hex colour'],
  [/\b(?:rgba?|hsla?)\(/, 'rgb/hsl colour'],
  [/font-\[['"]/, 'arbitrary font family'],
];

const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const failures = [];
for (const rel of FILES) {
  const lines = stripComments(readFileSync(join(ROOT, rel), 'utf8')).split('\n');
  lines.forEach((line, i) => {
    for (const [re, what] of RULES) {
      const m = re.exec(line);
      // `#run` style anchors and `&#10003;` entities are not colours.
      if (m && what === 'hex colour' && /(?:href=["'{`]?|&)#/.test(line.slice(Math.max(0, m.index - 7), m.index + 1))) continue;
      if (m) failures.push(`${rel}:${i + 1} ${what} "${m[0]}" - use an lp-* token from src/styles/landingTokens.mjs`);
    }
  });
}

if (failures.length) {
  console.error('\nverify-landing-tokens FAILED\n');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`verify-landing-tokens ok: ${FILES.length} landing files use theme tokens only`);
