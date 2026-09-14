/**
 * Every published comparison page, for the "Other comparisons" links at the
 * foot of each one. scripts/verify-seo-routes.mjs fails the build if a /vs
 * route in the SEO manifest is missing here, or if this lists one that is not
 * in the manifest, so the links cannot point at a page that does not exist.
 */
export const VS_COMPARISONS: ReadonlyArray<{ slug: string; name: string }> = [
  { slug: 'surveymonkey', name: 'SurveyMonkey' },
  { slug: 'typeform', name: 'Typeform' },
  { slug: 'usertesting', name: 'UserTesting' },
  { slug: 'pollfish', name: 'Pollfish' },
  { slug: 'traditional', name: 'Traditional research' },
  { slug: 'qualtrics', name: 'Qualtrics' },
  { slug: 'attest', name: 'Attest' },
  { slug: 'conjointly', name: 'Conjointly' },
  { slug: 'quantilope', name: 'Quantilope' },
  { slug: 'yabble', name: 'Yabble' },
  { slug: 'synthetic-users', name: 'Synthetic Users' },
  { slug: 'aaru', name: 'Aaru' },
];
