/**
 * Types for the plain-ESM SEO manifest. It lives in scripts/ as .mjs so the
 * Node build scripts (prerender, sitemap, the verify guard) can import it with
 * no TypeScript toolchain, while the app still gets checked types here.
 */
declare module '*/scripts/seo-routes.mjs' {
  export interface SeoRoute {
    path: string;
    title: string;
    description: string;
    h1: string;
    intro: string;
    changefreq: string;
    priority: string;
    canonical?: string;
    sitemap?: boolean;
  }
  export const ORIGIN: string;
  export const PUBLIC_ROUTES: SeoRoute[];
  export const SITEMAP_ROUTES: SeoRoute[];
  export function canonicalFor(route: SeoRoute | string): string;
}
