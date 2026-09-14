/**
 * verify-site-facts - the numbers VETT states about itself must be one number
 * each, and must be true.
 *
 * On 2026-09-14 the site gave four figures for market coverage and three for
 * the number of research types, and quoted a "$9-35" price range with no $35
 * tier. src/utils/siteFacts.ts now states each fact once; this recounts them
 * from their sources and fails the build if the site drifts again.
 *
 *   1. COUNTRY_COVERAGE_FLOOR equals the targetable country list in
 *      src/data/targetingOptions.ts, rounded down to the nearest ten.
 *   2. RESEARCH_TYPE_COUNT equals the live goal types in src/data/missionGoals.ts.
 *   3. The homepage, which is headed "Every type of research", has a card for
 *      every live research type.
 *   4. Files that cannot import siteFacts (public/llms.txt, the Terms) state
 *      the same figures.
 *   5. None of the known-wrong strings appears anywhere in src/ or public/.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const failures = [];
const fail = (m) => failures.push(m);

const facts = read('src/utils/siteFacts.ts');
const num = (name) => Number((facts.match(new RegExp(`export const ${name} = (\\d+);`)) || [])[1]);
const floor = num('COUNTRY_COVERAGE_FLOOR');
const typeCount = num('RESEARCH_TYPE_COUNT');

// 1. countries
const targeting = read('src/data/targetingOptions.ts');
const cStart = targeting.indexOf('export const COUNTRIES');
const countries = (targeting.slice(cStart, targeting.indexOf('];', cStart)).match(/value: '[A-Z]{2}'/g) || []).length;
if (!countries) fail('could not count COUNTRIES in src/data/targetingOptions.ts');
else if (Math.floor(countries / 10) * 10 !== floor) {
  fail(`COUNTRY_COVERAGE_FLOOR is ${floor} but src/data/targetingOptions.ts offers ${countries} countries (floor ${Math.floor(countries / 10) * 10})`);
}

// 2. research types
const goalsSrc = read('src/data/missionGoals.ts');
const gStart = goalsSrc.indexOf('export const MISSION_GOALS');
const goalBlock = goalsSrc.slice(gStart, goalsSrc.indexOf('\n];', gStart));
const goals = [...goalBlock.matchAll(/\{\s*\n\s*id: '([a-z_]+)'([\s\S]*?)\n  \}/g)].map((m) => ({ id: m[1], gated: /comingSoon:\s*true/.test(m[2]) }));
const live = goals.filter((g) => !g.gated).map((g) => g.id);
if (!goals.length) fail('could not read MISSION_GOALS in src/data/missionGoals.ts');
else if (live.length !== typeCount) fail(`RESEARCH_TYPE_COUNT is ${typeCount} but src/data/missionGoals.ts has ${live.length} live goal types`);

// 3. homepage cards
const landing = read('src/pages/LandingV2Page.tsx');
const rStart = landing.indexOf('const RESEARCH_TYPES');
const cards = [...landing.slice(rStart, landing.indexOf('];', rStart)).matchAll(/goalId:\s*'([a-z_]+)'/g)].map((m) => m[1]);
const missingCards = live.filter((id) => !cards.includes(id));
if (missingCards.length) fail(`the homepage research grid ("Every type of research") has no card for: ${missingCards.join(', ')}`);

// 4. files that cannot import siteFacts
const coverage = `${floor}+ countries`;
const typesLabel = `${typeCount} research types`;
const llms = read('public/llms.txt');
if (!llms.includes(coverage)) fail(`public/llms.txt does not state "${coverage}"`);
if (!llms.includes(typesLabel)) fail(`public/llms.txt does not state "${typesLabel}"`);
if (!read('src/content/legal/terms-of-service.md').includes(coverage)) fail(`the Terms do not state "${coverage}"`);

// 5. known-wrong strings, anywhere in src/ or public/
const BANNED = [
  ['150+ markets', 'coverage is 190+ countries'],
  ['160+ countries', 'coverage is 190+ countries'],
  ['193 countries', 'say 190+ countries'],
  ['full ISO', 'the ISO list has 249 entries; VETT targets 193'],
  ['$9-35', 'there is no $35 tier'],
  ['$9-99', 'there is no $99 tier'],
  ['$9-$99', 'there is no $99 tier'],
  ['11 named frameworks', 'there are 14 research types'],
  ['13 research types', 'there are 14 research types'],
  ['charged flat per respondent bracket', 'Creative Attention is billed per creative asset'],
  ['Charged per bracket, not per respondent', 'Creative Attention is billed per creative asset'],
  // Internal repo files and paths do not belong in public copy.
  ['HONEST_CLAIMS.md', 'an internal repo file, not something a reader can open'],
  // Competitor figures that were wrong when checked against their own sites on 2026-09-14.
  ['~$249/month', 'Synthetic Users plans start at $12,500/year'],
  ['low thousands per year', 'Yabble subscriptions start at US$8,900/year'],
  ['election forecasting', 'Aaru no longer describes itself this way'],
  // Stale product promises. The recruit loop can deliver fewer respondents
  // than ordered, and results are a directional read.
  ['no refunds needed', 'VETT can deliver fewer respondents than ordered; do not promise otherwise'],
  ['research-grade insights', 'VETT results are a directional read'],
  // VETT claims removed from the comparison pages on 2026-09-14 because the
  // product or the data does not support them.
  ['$0.78 to $3.50', 'the per-respondent range comes from SELF_SERVE_RATE_RANGE'],
  ['Happydemics', 'VETT does not describe its brand-lift framework this way'],
  ['Same underlying AI', 'implies a model vendor'],
  ['tuned for MENA', 'nothing in persona generation is MENA-specific'],
  ['API on the roadmap', 'the /api page makes no roadmap promise'],
  ['usually directionally identical', 'VETT has no comparison with real panels'],
];
// Historical records that quote the site as it was. Rewriting them would
// falsify the record; they are not published.
const EXEMPT = [/^src\/pages\/__perf__\//];
const TEXT = /\.(tsx?|mjs|jsx?|md|txt|html|json|webmanifest|xml)$/;
function scan(rel) {
  const s = readFileSync(join(ROOT, rel), 'utf8');
  for (const [needle, why] of BANNED) {
    if (s.includes(needle)) {
      const line = s.slice(0, s.indexOf(needle)).split('\n').length;
      fail(`${rel}:${line} contains "${needle}" - ${why}`);
    }
  }
}
function walk(dir) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(ROOT, rel)).isDirectory()) { walk(rel); continue; }
    if (!TEXT.test(name) || EXEMPT.some((re) => re.test(rel))) continue;
    scan(rel);
  }
}
walk('src');
walk('public');
// index.html carries the head every page starts from, including the homepage
// structured data and the share description.
scan('index.html');

if (failures.length) {
  console.error(`\nverify-site-facts FAILED (${failures.length})\n`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`verify-site-facts ok: ${coverage} (${countries} targetable), ${typesLabel} (all with a homepage card), no known-wrong figures in src/ or public/`);
