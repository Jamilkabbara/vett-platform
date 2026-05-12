#!/usr/bin/env node
/*
 * Pass 38 DEPLOY-3 — generate public/version.json at build time.
 *
 * Doctrine #20 (new in Pass 38): every frontend deploy must expose its
 * source SHA at /version.json so the verification gate is one curl
 * (matches backend /version, which has reported sha+pass since Pass 31).
 *
 * Pass 36 + Pass 37 verification was attempted by inspecting Vercel
 * bundle hashes — useless, because Vite content-hashes assets
 * independently of git SHA. Without a /version.json a deploy that
 * silently skipped (Pass 36, Pass 37) is indistinguishable from a
 * deploy that landed but cached. This script ends that ambiguity.
 *
 * Runs ahead of `vite build` per package.json scripts.build. Reads:
 *   - vettPass: from package.json
 *   - sha:     from `git rev-parse HEAD` (or VERCEL_GIT_COMMIT_SHA fallback)
 *   - builtAt: ISO timestamp at script run
 *
 * Writes public/version.json. Vite copies public/* to dist/ verbatim,
 * so https://vettit.ai/version.json is served as a static file.
 *
 * Behaviour on missing git binary or detached HEAD: prefer the Vercel
 * env var, fall back to "unknown" so the build never fails — a build
 * that fails on git unavailability would block all deploys.
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const pkgPath    = resolve(__dirname, '..', 'package.json');
const outDir     = resolve(__dirname, '..', 'public');
const outPath    = resolve(outDir, 'version.json');

function readGitSha() {
  // Vercel sets this for every deploy; preferred because it's exactly
  // what Vercel built from, even if the working tree drifted.
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  try {
    return execSync('git rev-parse HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  } catch {
    return 'unknown';
  }
}

function readGitBranch() {
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    return process.env.VERCEL_GIT_COMMIT_REF;
  }
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  } catch {
    return 'unknown';
  }
}

function readPass() {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (typeof pkg.vettPass === 'number') return pkg.vettPass;
    // Fall back to a string-parsed value if someone wrote it as a
    // string by accident.
    const n = Number(pkg.vettPass);
    if (Number.isFinite(n)) return n;
  } catch { /* ignore — fall through */ }
  return 0; // 0 is invalid; CI will catch the mismatch
}

const payload = {
  sha:     readGitSha(),
  branch:  readGitBranch(),
  pass:    readPass(),
  builtAt: new Date().toISOString(),
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');

console.log(`[write-version] ${outPath}`);
console.log(`[write-version]   sha    ${payload.sha}`);
console.log(`[write-version]   branch ${payload.branch}`);
console.log(`[write-version]   pass   ${payload.pass}`);
console.log(`[write-version]   built  ${payload.builtAt}`);
