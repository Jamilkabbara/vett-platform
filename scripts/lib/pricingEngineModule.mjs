/**
 * Loads src/utils/pricingEngine.ts - the module the setup panel prices itself
 * with - by bundling it with esbuild, so the checks run the panel's REAL
 * pricing code rather than a transcription of it.
 *
 * scripts/lib/ladder.mjs parses the ladder out of the same file with a regex.
 * That is enough to recompute a published price string, and nothing more: it
 * cannot answer what calculatePricing() returns, which is the number the panel
 * puts on screen. Mirrors scripts/lib/landingPrices.mjs.
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function loadPricingEngine() {
  const dir = mkdtempSync(join(tmpdir(), 'pricing-engine-'));
  const out = join(dir, 'pricingEngine.mjs');
  try {
    await build({
      entryPoints: [fileURLToPath(new URL('../../src/utils/pricingEngine.ts', import.meta.url))],
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile: out,
      logLevel: 'error',
      define: { 'process.env.NODE_ENV': '"production"' },
    });
    return await import(pathToFileURL(out).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** An empty TargetingConfig with every shape calculatePricing reads present. */
export const NO_TARGETING = {
  demographics:   {},
  professional:   { industries: [], roles: [], companySizes: [] },
  technographics: { devices: [] },
  financials:     { incomeRanges: [] },
  geography:      { cities: [] },
  behaviors:      [],
  countries:      [],
};
