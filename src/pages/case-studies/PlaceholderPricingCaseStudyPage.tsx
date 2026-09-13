/**
 * PLACEHOLDER. Delete alongside src/data/caseStudies/PLACEHOLDER_exampleStudy.ts
 * when the first real study lands, and remove the route from src/App.tsx, the
 * entry from scripts/seo-routes.mjs and the row from CASE_STUDY_SOURCES in
 * scripts/verify-seo-routes.mjs.
 *
 * The thin page pattern is the /vs/* precedent: the page owns the route and the
 * data, the template owns every pixel.
 */
import { CaseStudyPageTemplate } from '../../components/marketing/CaseStudyPageTemplate';
import { PLACEHOLDER_EXAMPLE_STUDY } from '../../data/caseStudies/PLACEHOLDER_exampleStudy';

export function PlaceholderPricingCaseStudyPage() {
  return <CaseStudyPageTemplate study={PLACEHOLDER_EXAMPLE_STUDY} />;
}

export default PlaceholderPricingCaseStudyPage;
