/**
 * Facts the site states about VETT, each stated once.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2026-09-14 the site gave four different figures for market coverage and
 * three for the number of research types, across the homepage, the help page,
 * the Terms and the comparison pages. A reader, or a model summarising the
 * site, that meets four values for one fact trusts none of them.
 *
 * These are literals rather than imports of the underlying lists so the
 * homepage does not pull the full country and city data into its bundle.
 * scripts/verify-site-facts.mjs recounts both from their sources at build
 * time and fails if either literal no longer matches:
 *   COUNTRY_COVERAGE_FLOOR  the targetable country list in
 *                           src/data/targetingOptions.ts (193), rounded down
 *                           to the nearest ten
 *   RESEARCH_TYPE_COUNT     the live goal types in src/data/missionGoals.ts
 *
 * "Research types", not "frameworks" or "methodologies": /methodologies lists
 * the thirteen with a named framework, and General Research is the fourteenth
 * type, which has none. Calling fourteen things "frameworks" would contradict
 * that page.
 */
import { CA_FIXED_RESPONDENT_COUNT } from './pricingEngine';

export const COUNTRY_COVERAGE_FLOOR = 190;
/** "190+ countries" */
export const COUNTRY_COVERAGE = `${COUNTRY_COVERAGE_FLOOR}+ countries`;

export const RESEARCH_TYPE_COUNT = 14;
/** "14 research types" */
export const RESEARCH_TYPES_LABEL = `${RESEARCH_TYPE_COUNT} research types`;

/** How Creative Attention is billed, in the words /llms.txt and the pricing section use. */
export const CREATIVE_ATTENTION_BILLING =
  `Billed per creative asset. The respondent count is fixed at ${CA_FIXED_RESPONDENT_COUNT} and is not a pricing lever.`;
