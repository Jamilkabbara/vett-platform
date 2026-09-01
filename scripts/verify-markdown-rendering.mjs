#!/usr/bin/env node
/*
 * verify-markdown-rendering.mjs
 * ---------------------------------------------------------------------------
 * Pass 49. Two markdown dependencies were missing, both silently:
 *
 *  1. @tailwindcss/typography was NOT installed, yet BlogPostPage.tsx applied
 *     about a dozen `prose-*` utilities. Every one was a no-op, so live blog
 *     bodies rendered with Tailwind preflight having reset heading sizes and
 *     list markers. Nothing errored; the styling just did not exist.
 *
 *  2. remark-gfm was NOT installed, so a GFM table rendered as literal pipe
 *     characters. That already shipped to customers once: the Terms of
 *     Service pricing table displayed as `| Mission Type | Price | |---|---|`.
 *
 * Both failures are INVISIBLE to typecheck, lint and build - which is exactly
 * why they survived. This script makes them visible, and runs in `npm test`.
 *
 * It is deliberately a plain node script, matching the existing
 * verify-question-metadata-roundtrip.mjs convention, because this repo has no
 * React test runner and adding one for two assertions would be the larger change.
 */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) failures += 1;
};

const TABLE_MD = [
  '| Mission Type | Price |',
  '|---|---|',
  '| Sniff Test | $9 |',
  '| Scale | $900 |',
].join('\n');

console.log('markdown rendering');

// 1. remark-gfm turns a pipe table into a real <table>.
const withGfm = renderToStaticMarkup(
  createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, TABLE_MD),
);
check('GFM table renders as <table>', withGfm.includes('<table>'));
check('  ...with the header cell', withGfm.includes('Mission Type'));
check('  ...and no literal pipe row leaks', !withGfm.includes('|---|'));

// 2. The built-in mutation check: WITHOUT the plugin the same markdown must
//    NOT produce a table. If this ever passes, the assertion above is vacuous
//    and proves nothing.
const withoutGfm = renderToStaticMarkup(createElement(ReactMarkdown, null, TABLE_MD));
check('without remark-gfm the SAME markdown does NOT make a table',
  !withoutGfm.includes('<table>'),
  '(guards against a vacuous pass)');

// 3. The typography plugin is actually registered. BlogPostPage's prose-*
//    classes are dead weight without it, and nothing else reports that.
const twConfig = readFileSync(new URL('../tailwind.config.js', import.meta.url), 'utf8');
check('@tailwindcss/typography is in tailwind.config.js plugins',
  /plugins:\s*\[[^\]]*@tailwindcss\/typography/s.test(twConfig));

// 4. Anything applying `prose` classes needs the plugin present. Keeping these
//    two facts adjacent is the point: they drifted apart for months.
const blogPage = readFileSync(new URL('../src/pages/BlogPostPage.tsx', import.meta.url), 'utf8');
check('BlogPostPage still relies on prose-* utilities', /className="[^"]*\bprose\b/.test(blogPage));
check('BlogPostPage passes remarkGfm', blogPage.includes('remarkPlugins={[remarkGfm]}'));

const legalPage = readFileSync(new URL('../src/components/legal/LegalPage.tsx', import.meta.url), 'utf8');
check('LegalPage passes remarkGfm', legalPage.includes('remarkPlugins={[remarkGfm]}'));

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
