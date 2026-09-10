/**
 * The public route manifest: ONE list, three consumers.
 *
 *   scripts/prerender.mjs  writes dist/<route>/index.html with these tags
 *   scripts/sitemap.mjs    writes public/sitemap.xml from the same list
 *   npm test               verify-seo-routes.mjs checks it against App.tsx
 *
 * WHY THIS EXISTS. Every public URL on the site served byte-identical head
 * tags, because index.html is a single static shell and the eight marketing
 * pages set no document.title at all. Measured against production on
 * 2026-09-08, /methodologies /help /about /blog /terms /vs/typeform and the
 * homepage all returned:
 *
 *     <title>VETT - AI Market Research in Minutes</title>
 *     <link rel="canonical" href="https://www.vettit.ai/" />
 *     zero <h1>
 *
 * The canonical is the one that actually costs money. A hardcoded
 * self-referencing canonical on the shell means every one of the 24 public
 * URLs tells Google "I am a duplicate of the homepage, index that instead" -
 * including all 16 URLs the sitemap submits. Submitting a URL and then
 * canonicalising it away is a direct instruction to keep it out of the index.
 * No amount of body copy fixes that while the tag is wrong.
 *
 * Titles and descriptions here are written to match what the page actually
 * says - the h1 field is the page's real rendered h1, not a rewrite. Hyphens
 * only, no em or en dashes, per the house copy rule.
 */

export const ORIGIN = 'https://www.vettit.ai';

/** @typedef {{path:string,title:string,description:string,h1:string,intro:string,changefreq:string,priority:string,canonical?:string,sitemap?:boolean}} SeoRoute */

/** @type {SeoRoute[]} */
export const PUBLIC_ROUTES = [
  {
    path: '/',
    title: 'VETT - AI Market Research in Minutes',
    description: 'Run real market research in minutes. VETT generates synthetic respondents to your audience spec, simulates the survey, and delivers insights. No panel, no waiting.',
    h1: 'Stop guessing. VETT it.',
    intro: 'Describe your research question in plain language. VETT builds the survey, simulates your exact audience, and delivers insights in minutes, not weeks.',
    changefreq: 'weekly', priority: '1.0',
  },
  {
    path: '/landing',
    title: 'VETT - AI Market Research in Minutes',
    description: 'Run real market research in minutes. VETT generates synthetic respondents to your audience spec, simulates the survey, and delivers insights. No panel, no waiting.',
    h1: 'Stop guessing. VETT it.',
    intro: 'Describe your research question in plain language. VETT builds the survey, simulates your exact audience, and delivers insights in minutes, not weeks.',
    // Same page as "/" - the router redirects "/" to "/landing" - so it points
    // its canonical at "/" rather than competing with it for the same query.
    // This is the ONLY correct use of a cross-page canonical on the site; every
    // other route is its own canonical, which is exactly what was broken.
    canonical: '/',
    changefreq: 'weekly', priority: '0.1', sitemap: false,
  },
  {
    path: '/methodologies',
    title: 'Research methodologies - VETT',
    description: 'Every VETT mission runs an industry-standard research framework: Van Westendorp pricing, MaxDiff and Kano feature prioritisation, NPS, sequential monadic comparison, brand lift and more.',
    h1: 'Research methodologies',
    intro: 'Every VETT mission runs an industry-standard research framework. The methodologies themselves are peer-reviewed in the academic literature. VETT runs those frameworks on synthetic respondents with deterministic analysis.',
    changefreq: 'monthly', priority: '0.9',
  },
  {
    path: '/methodology',
    title: 'How VETT produces a number - VETT',
    description: 'For people who buy research professionally: how a VETT figure is produced, what the analysis computes deterministically, what the model writes, and where each number stops being reliable.',
    h1: 'How VETT produces a number',
    intro: 'For people who buy research professionally. What the analysis computes deterministically, what the model writes, and where each number stops being reliable.',
    changefreq: 'monthly', priority: '0.9',
  },
  {
    path: '/help',
    title: 'Help Center - VETT',
    description: 'How a VETT mission is priced, how long a study takes, what a synthetic respondent is, what the results contain, and how refunds and delivery work.',
    h1: 'Help Center',
    intro: 'How a mission is priced, how long a study takes, what a synthetic respondent is, and what you get back.',
    changefreq: 'monthly', priority: '0.7',
  },
  {
    path: '/about',
    title: 'About VETT',
    description: 'VETT exists to replace the gut feeling with a number you can defend. Who we are and why we built simulated respondent research.',
    h1: "We are killing the 'Gut Feeling'.",
    intro: 'VETT exists to replace the gut feeling with a number you can defend.',
    changefreq: 'monthly', priority: '0.7',
  },
  {
    path: '/careers',
    title: 'Careers at VETT',
    description: 'Open roles at VETT. Build the infrastructure that replaces guesswork with evidence in product, brand and pricing decisions.',
    h1: 'Build the OS for Truth.',
    intro: 'Open roles at VETT.',
    changefreq: 'monthly', priority: '0.5',
  },
  {
    path: '/contact',
    title: 'Contact VETT',
    description: 'Talk to the VETT team about a study, a managed engagement above the self-serve size, or anything else.',
    h1: "Let's Talk Truth.",
    intro: 'Talk to us about a study, a managed engagement, or anything else.',
    changefreq: 'monthly', priority: '0.5',
  },
  {
    path: '/blog',
    title: 'Insights and Research - VETT',
    description: 'Writing on synthetic respondent research: what it is good for, where it fails, and how it compares to panel work.',
    h1: 'Insights and Research',
    intro: 'Writing on synthetic respondent research: what it is good for, where it fails, and how it compares to panel work.',
    changefreq: 'weekly', priority: '0.6',
  },
  {
    path: '/api',
    title: 'VETT API',
    description: 'There is no public VETT API today. What exists, what is planned, and how to reach us if you need programmatic access.',
    h1: 'VETT API',
    intro: 'There is no public API today. Here is what exists and how to reach us if you need programmatic access.',
    changefreq: 'monthly', priority: '0.4',
  },
  {
    path: '/terms',
    title: 'Terms of Service - VETT',
    description: 'The VETT terms of service, including the full mission price table, payment terms, and the delivery and refund policy.',
    h1: 'Terms of Service',
    intro: 'The agreement that governs your use of VETT, including pricing, payment and delivery.',
    changefreq: 'monthly', priority: '0.3',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy - VETT',
    description: 'What data VETT collects, how it is used, how long it is kept, and your rights over it.',
    h1: 'Privacy Policy',
    intro: 'What we collect, how we use it, how long we keep it, and your rights over it.',
    changefreq: 'monthly', priority: '0.3',
  },
  {
    path: '/refunds',
    title: 'Refund Policy - VETT',
    description: 'When a VETT mission is refundable, what happens if a study fails to deliver, and how to raise a claim.',
    h1: 'Refund Policy',
    intro: 'When a mission is refundable, what happens if a study fails to deliver, and how to raise a claim.',
    changefreq: 'monthly', priority: '0.3',
  },
];

/**
 * The eleven comparison pages.
 *
 * `h1` is the string the page ACTUALLY renders, not a rewrite of it. Two
 * different components are in play and they word it differently: six pages go
 * through VsPageTemplate, whose h1 is `VETT vs {competitorName}`, and five are
 * standalone with their own `VETT vs X: Which Is Right for You?`. Copying the
 * real strings here is what keeps the prerendered h1 honest; inventing a
 * tidier one would put text in front of a crawler that no visitor ever sees.
 * scripts/verify-seo-routes.mjs checks each one against its source file.
 *
 * NOTE for the owner: /vs/traditional and /vs/traditional-research are two
 * separate live pages about the same comparison, both in the sitemap. They
 * will compete with each other. Worth merging one into the other.
 */
const VS = [
  // slug, competitor as it appears in copy, what they are, the page's real h1
  ['surveymonkey',         'SurveyMonkey',       'survey tooling with a bring-your-own audience',   'VETT vs SurveyMonkey: Which Is Right for You?'],
  ['typeform',             'Typeform',           'form building with a bring-your-own audience',    'VETT vs Typeform: Which Is Right for You?'],
  ['usertesting',          'UserTesting',        'moderated and unmoderated usability testing',     'VETT vs UserTesting: Which Is Right for You?'],
  ['pollfish',             'Pollfish',           'a mobile-first consumer panel',                   'VETT vs Pollfish: Which Is Right for You?'],
  ['traditional',          'traditional research', 'the classic panel and agency model',            'VETT vs Traditional Research: Which Is Right for You?'],
  ['conjointly',           'Conjointly',         'conjoint and pricing research on a real panel',   'VETT vs Conjointly'],
  ['yabble',               'Yabble',             'AI-generated respondents and insight synthesis',  'VETT vs Yabble'],
  ['synthetic-users',      'Synthetic Users',    'AI-generated qualitative interviews',             'VETT vs Synthetic Users'],
  ['aaru',                 'Aaru',               'agent-based population simulation',               'VETT vs Aaru'],
  ['quantilope',           'Quantilope',         'an automated research platform on a real panel',  'VETT vs Quantilope'],
  // Its own nav label and its sibling page both call this one "agencies";
  // only the competitorName prop it passes to the template says "traditional
  // research", which is why its rendered h1 reads the way it does. The title
  // uses the agency framing so this page and /vs/traditional are telling a
  // crawler two different things, which is the truth: they are two pages.
  ['traditional-research', 'traditional research agencies', 'full-service custom research', 'VETT vs traditional research'],
];

for (const [slug, name, what, h1] of VS) {
  PUBLIC_ROUTES.push({
    path: `/vs/${slug}`,
    title: `VETT vs ${name} - an honest comparison`,
    description: `${name} is ${what}. VETT simulates respondents to your audience spec and returns a study in minutes. Where each one wins, and where each one does not.`,
    h1,
    intro: `${name} is ${what}. This page sets out where each approach wins and where it does not, without pretending the answer is always VETT.`,
    changefreq: 'monthly', priority: '0.6',
  });
}

/** Absolute canonical URL for a route, honouring an explicit cross-page canonical. */
export function canonicalFor(route) {
  const p = typeof route === 'string' ? route : (route.canonical || route.path);
  return p === '/' ? `${ORIGIN}/` : `${ORIGIN}${p}`;
}

/** Routes that belong in sitemap.xml: everything that is its own canonical. */
export const SITEMAP_ROUTES = PUBLIC_ROUTES.filter((r) => r.sitemap !== false && !r.canonical);
