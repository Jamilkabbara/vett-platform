/**
 * verify-no-silent-ai-fallback - when the AI backend fails, the website must
 * say so. It must never invent a survey, reword a question locally, or label
 * anything "AI refined" that no AI produced.
 *
 * On 2026-09-18 the provider refused every call and a customer's mission was
 * created from a local template that pasted the brief into fixed questions
 * ("Are you interested in I want to import honey ...?"), each marked
 * aiRefined: true.
 *
 * This bundles the REAL src/services/aiService.ts with the API client stubbed,
 * then runs it against a backend that (a) cannot be reached, (b) refuses with
 * HTTP 400, and (c) answers with no questions. generateSurvey and
 * refineQuestion must reject with SurveyGenerationError every time. A static
 * pass fails if the setup page goes back to creating the mission anyway.
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const failures = [];
const fail = (m) => failures.push(m);

const dir = mkdtempSync(join(tmpdir(), 'ai-fallback-'));
writeFileSync(join(dir, 'apiClient.ts'), `
export class ApiError extends Error {
  status: number;
  constructor(m: string, s: number) { super(m); this.name = 'ApiError'; this.status = s; }
}
async function respond(path: string) {
  const mode = (globalThis as { __AI_STUB_MODE?: string }).__AI_STUB_MODE;
  if (mode === 'unreachable') throw new TypeError('Failed to fetch');
  if (mode === 'refused') throw new ApiError('You have reached your specified API usage limits.', 400);
  if (path.includes('generate-survey')) return { questions: [] };
  if (path.includes('refine')) return { text: '' };
  return {};
}
export const api = { get: respond, post: respond, patch: respond, delete: respond };
`);
writeFileSync(join(dir, 'supabase.ts'), 'export const supabase = {} as never;');

try {
  const out = join(dir, 'aiService.mjs');
  await build({
    entryPoints: [join(ROOT, 'src/services/aiService.ts')],
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
    define: { 'import.meta.env': JSON.stringify({ VITE_API_URL: '', DEV: false, PROD: true, MODE: 'production' }) },
    plugins: [{
      name: 'stub-client',
      setup(b) {
        b.onResolve({ filter: /lib\/apiClient$/ }, () => ({ path: join(dir, 'apiClient.ts') }));
        b.onResolve({ filter: /lib\/supabase$/ }, () => ({ path: join(dir, 'supabase.ts') }));
      },
    }],
  });
  const ai = await import(pathToFileURL(out).href);
  const brief = 'General Research: I want to import honey from lebanon to sell in the uae';

  for (const mode of ['unreachable', 'refused', 'empty']) {
    globalThis.__AI_STUB_MODE = mode;

    let survey = null; let err = null;
    try { survey = await ai.generateSurvey({ goal: 'research', subject: brief, objective: 'General Research' }); } catch (e) { err = e; }
    if (survey) fail(`generateSurvey returned ${survey.questions?.length ?? 0} questions when the backend was ${mode}; it must throw`);
    else if (!(err instanceof ai.SurveyGenerationError)) fail(`generateSurvey (${mode}) threw ${err?.name}, not SurveyGenerationError`);

    let refined = null; err = null;
    try { refined = await ai.refineQuestion({ id: '1', text: 'Do you buy honey', type: 'single', options: ['Yes', 'No'] }, 'research'); } catch (e) { err = e; }
    if (refined) fail(`refineQuestion returned "${refined.text}" when the backend was ${mode}; it must throw`);
    else if (!(err instanceof ai.SurveyGenerationError)) fail(`refineQuestion (${mode}) threw ${err?.name}, not SurveyGenerationError`);
  }
} catch (e) {
  fail(`could not bundle or run aiService.ts: ${e.message}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// Static: the setup page must stop, not create a mission around a failure.
const setup = readFileSync(join(ROOT, 'src/pages/MissionSetupPage.tsx'), 'utf8');
if (/continuing with defaults/i.test(setup)) fail('MissionSetupPage still continues to create the mission after a generation failure');
if (!/setSurveyError\(message\)/.test(setup)) fail('MissionSetupPage no longer shows the survey-generation error');
const svc = readFileSync(join(ROOT, 'src/services/aiService.ts'), 'utf8');
if (/falling back to local generation|Local heuristic fallback|Local fallback templates/.test(svc)) fail('aiService.ts has a local AI fallback again');

if (failures.length) {
  console.error('\nverify-no-silent-ai-fallback FAILED\n');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('verify-no-silent-ai-fallback ok: an unreachable, refusing or empty backend makes survey generation and question refine fail visibly');
