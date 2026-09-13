/**
 * The case study registry.
 *
 * One array, two consumers: /case-studies renders a card per entry, and each
 * /case-studies/<slug> page renders the entry whose slug it owns. A card and
 * the page it links to therefore read the same object and cannot disagree
 * about the finding, the method line or the sample size.
 *
 * ADDING A STUDY is four edits, in this order:
 *   1. a data file next to this one, typed `CaseStudy`;
 *   2. an entry in the array below;
 *   3. a thin page in src/pages/case-studies/ that renders
 *      <CaseStudyPageTemplate study={...} />, plus its route in src/App.tsx;
 *   4. an entry in scripts/seo-routes.mjs (title, description, h1 = the
 *      study finding verbatim, intro, changefreq monthly, priority 0.8) and
 *      the matching row in CASE_STUDY_SOURCES in
 *      scripts/verify-seo-routes.mjs.
 *
 * Step 4 is the one that is easy to skip and expensive to skip: a route that
 * is not in the manifest ships with the homepage title and the homepage
 * canonical, which tells a crawler to index the homepage instead of it.
 */
import type { CaseStudy } from '../../components/marketing/CaseStudyPageTemplate';
import { PLACEHOLDER_EXAMPLE_STUDY } from './PLACEHOLDER_exampleStudy';

/** Newest first. This is the order the index page renders. */
export const CASE_STUDIES: CaseStudy[] = [PLACEHOLDER_EXAMPLE_STUDY];
