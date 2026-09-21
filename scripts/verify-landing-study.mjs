/**
 * verify-landing-study - the landing page may present exactly one set of
 * figures as real research, they must come from landingStudy.ts, and every
 * other demo must say on screen that it is an example.
 *
 * Why this exists: the page's demo panels were invented figures that read as
 * findings ("Purchase intent 85%", "Top barrier: Halal certification"). The
 * real study that replaced them reports 78% purchase intent, and the study it
 * came from had to be re-run first because its panel repeated the same people.
 * A reader cannot tell a real figure from a shape unless the page says which
 * is which, every time.
 *
 * Checks:
 *   1. landingStudy.ts holds the attribution, the base and the stats.
 *   2. The real scenario reads its stats from landingStudy.ts, never inline.
 *   3. Every other scenario carries source: { kind: 'illustrative' }, and the
 *      panel renders a visible "Illustrative" marker for it.
 *   4. The Creative Attention demo is marked illustrative and its one real
 *      number is the published placement norm from landingStudy.ts.
 *   5. Figures retired with the old run do not come back: 85% purchase intent,
 *      the 79% barrier, and the barrier question's own percentages.
 *   6. Customer copy uses hyphens, not em or en dashes.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const failures = [];
const fail = (m) => failures.push(m);

const study = read('src/components/landing-v2/landingStudy.ts');
const live = read('src/components/landing-v2/LiveMission.tsx');
const panels = read('src/components/landing-v2/panels.tsx');

// 1. The single source of truth.
for (const needle of ['attribution:', 'basis:', 'stats:', 'TIKTOK_FEED_NORM_SECONDS']) {
  if (!study.includes(needle)) fail(`landingStudy.ts is missing ${needle}`);
}
if (!/A VETT study, \d{1,2} \w+/.test(study)) fail('landingStudy.ts has no "A VETT study, <date>" attribution');
if (!/80 respondents/.test(study)) fail('landingStudy.ts does not state the study base');

// 2. The real scenario reads from the module.
if (!live.includes("from './landingStudy'")) fail('LiveMission does not import the study module');
if (!live.includes('LANDING_STUDY.stats.map')) fail('LiveMission does not read its real stats from LANDING_STUDY');
if (!live.includes('LANDING_STUDY.question')) fail('LiveMission does not read the real question from LANDING_STUDY');

// 3. Labels. One study scenario, and every other scenario illustrative.
// Count the DATA, not the type declaration: a scenario's marker ends in a
// comma, the union members in the interface end in a semicolon or a brace.
const studySources = (live.match(/kind: 'study',/g) || []).length;
const illustrativeSources = (live.match(/source: \{ kind: 'illustrative' \}/g) || []).length;
if (studySources !== 1) fail(`expected exactly 1 scenario sourced to the study, found ${studySources}`);
if (illustrativeSources < 1) fail('no scenario is marked illustrative');
const chips = (live.match(/^\s{4}chip: /gm) || []).length;
if (chips !== studySources + illustrativeSources) {
  fail(`${chips} scenarios but only ${studySources + illustrativeSources} carry a source label`);
}
if (!/>\s*Illustrative\s*</.test(live)) fail('LiveMission never renders a visible "Illustrative" marker');
if (!/>\s*Real study\s*</.test(live)) fail('LiveMission never renders a visible "Real study" marker');

// 4. Creative Attention: illustrative, scored against the published norm.
if (!/>\s*Illustrative\s*</.test(panels)) fail('the Creative Attention panel has no visible "Illustrative" marker');
if (!panels.includes('TIKTOK_FEED_NORM_SECONDS')) fail('the Creative Attention panel does not cite the published placement norm');
if (/Engagement score/.test(panels)) fail('the Creative Attention panel still shows an invented engagement score');

// 5. Retired figures must not return, anywhere in the landing surface.
const surface = [
  ['LiveMission.tsx', live],
  ['panels.tsx', panels],
  ['LandingV2Page.tsx', read('src/pages/LandingV2Page.tsx')],
  ['landingStudy.ts', study],
];
const BANNED = [
  [/\b85%/, 'the old run\'s 85% purchase intent'],
  [/\b79%/, 'the old run\'s 79% barrier figure'],
  [/\b78%/, 'the 20 September run\'s purchase intent, superseded by the clean re-run'],
  [/halal/i, 'a barrier figure or barrier claim from the study'],
  [/iced coffee/i, 'the iced-coffee study, which is excluded entirely'],
  [/four thousand/i, 'the "four thousand answers" claim'],
  [/modelled first|modeled first/i, 'the "MENA modelled first" claim'],
];
/**
 * Comments are stripped before the banned-figure scan: a comment that says
 * "the 20 September run reported 78%, which is why it must not appear" is the
 * documentation that keeps it out, not a reappearance of it. Only what renders
 * is scanned.
 */
const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

for (const [name, raw] of surface) {
  const text = stripComments(raw);
  for (const [re, what] of BANNED) {
    if (re.test(text)) fail(`${name} contains ${what}`);
  }
  if (/[—–]/.test(text)) {
    fail(`${name} uses an em or en dash in copy; customer copy uses hyphens`);
  }
}

// 6. The study's own figures must match the module, so a stale number cannot
//    drift into the page.
for (const [label, value] of [['Purchase intent', '88%'], ['Chose that price', '51%']]) {
  if (!study.includes(`label: '${label}', value: '${value}'`)) {
    fail(`landingStudy.ts no longer states ${label} as ${value}; if the study changed, change the page with it`);
  }
}

if (failures.length) {
  console.error('\nverify-landing-study FAILED\n');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('verify-landing-study ok: one real study, sourced from landingStudy.ts and labelled; every other demo marked illustrative');
