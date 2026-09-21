/**
 * Loads src/components/landing-v2/landingPrices.ts - the module the landing
 * page prices itself with - by bundling it with esbuild, so the checks run the
 * page's real pricing code rather than a copy of it.
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function loadLandingPrices() {
  const dir = mkdtempSync(join(tmpdir(), 'landing-prices-'));
  const out = join(dir, 'landingPrices.mjs');
  try {
    await build({
      entryPoints: [fileURLToPath(new URL('../../src/components/landing-v2/landingPrices.ts', import.meta.url))],
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
