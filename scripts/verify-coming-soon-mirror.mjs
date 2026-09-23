/**
 * The frontend's Coming-Soon list matches the backend's, and actually runs.
 *
 * The backend ENFORCES the gate: src/config/comingSoon.js -> COMING_SOON_GOAL_TYPES
 * decides which goal types are refused at mission-create and at Stripe checkout.
 * The frontend only MIRRORS it, so a customer is never offered something that
 * will be refused after they have entered a card, and is never hidden from
 * something they could buy.
 *
 * This invariant already had a test - src/data/__tests__/comingSoon.sync.test.ts -
 * which was written in describe/it form for a runner this repo does not have.
 * It never executed once. Its own comment said so. That file is replaced by this
 * one, which runs inside `npm test` and therefore inside the merge gate.
 *
 * Un-gating a type is a TWO-SIDED edit: change the backend list, then BACKEND_GATED
 * here. If they disagree this check fails and says which side is ahead.
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// Mirror of vettit-backend COMING_SOON_GOAL_TYPES. Empty = every research type
// is sellable. Update this in the same change that edits the backend.
const BACKEND_GATED = [];

const dir = mkdtempSync(join(tmpdir(), 'coming-soon-'));
try {
  const out = join(dir, 'missionGoals.mjs');
  await build({
    entryPoints: [join(ROOT, 'src/data/missionGoals.ts')],
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
    define: { 'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production' }) },
  });
  const { MISSION_GOALS } = await import(pathToFileURL(out).href);

  if (!Array.isArray(MISSION_GOALS) || MISSION_GOALS.length === 0) {
    console.error('verify-coming-soon-mirror FAILED: MISSION_GOALS did not load');
    process.exit(1);
  }

  const frontend = MISSION_GOALS.filter((g) => g.comingSoon).map((g) => g.id).sort();
  const backend = [...BACKEND_GATED].sort();

  const hiddenButSellable = backend.length === 0 ? frontend : frontend.filter((g) => !backend.includes(g));
  const offeredButRefused = backend.filter((g) => !frontend.includes(g));

  if (hiddenButSellable.length || offeredButRefused.length) {
    console.error('verify-coming-soon-mirror FAILED: the two sides disagree.');
    if (offeredButRefused.length) {
      console.error(`  Offered to customers but REFUSED by the backend: ${offeredButRefused.join(', ')}`);
      console.error('  A customer can reach checkout and be turned away after paying attention to a price.');
    }
    if (hiddenButSellable.length) {
      console.error(`  Hidden from customers but SELLABLE by the backend: ${hiddenButSellable.join(', ')}`);
      console.error('  Revenue the product refuses to take.');
    }
    console.error('  Fix BOTH sides: vettit-backend/src/config/comingSoon.js and BACKEND_GATED here.');
    process.exit(1);
  }

  console.log(`verify-coming-soon-mirror ok: ${MISSION_GOALS.length} research types, `
    + `${backend.length} gated on both sides`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
