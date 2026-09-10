/**
 * Apply a route's SEO manifest entry to the live document.
 *
 * The static HTML that scripts/prerender.mjs writes is correct on FIRST load,
 * which is what a crawler and a social scraper see. It goes stale the moment
 * the user navigates inside the SPA, because nothing reloads the document. So
 * the title, description and canonical need a client-side write too.
 *
 * The point of this hook is that both writes read the SAME manifest. Before it,
 * the five /vs pages that bothered to set a title each hard-coded their own
 * string ("VETT vs Typeform: Which Is Right for You?"), the shared template
 * hard-coded a different pattern ("VETT vs Typeform: honest comparison"), and
 * six /vs pages set nothing at all and inherited whatever the previous route
 * had left behind. Three spellings of one title is how the prerendered head and
 * the rendered tab end up disagreeing.
 */
import { useEffect } from 'react';
// scripts/ is outside src/ but inside the Vite project root, so this resolves
// at build time and the manifest ships in the bundle. Keeping it there means
// the Node build scripts can import it without a TypeScript toolchain.
import { PUBLIC_ROUTES, canonicalFor, type SeoRoute } from '../../scripts/seo-routes.mjs';

const BY_PATH = new Map<string, SeoRoute>(PUBLIC_ROUTES.map((r) => [r.path, r]));

function upsert<T extends Element>(selector: string, create: () => T): T {
  const found = document.querySelector<T>(selector);
  if (found) return found;
  const el = create();
  document.head.appendChild(el);
  return el;
}

/**
 * Write the manifest entry for `path` into the document, restoring whatever was
 * there on unmount so a route without an entry does not inherit this one's tags.
 */
export function useRouteSeo(path: string): void {
  useEffect(() => {
    const route = BY_PATH.get(path);
    if (!route) return;

    const desc = upsert('meta[name="description"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      return m;
    });
    const canonical = upsert('link[rel="canonical"]', () => {
      const l = document.createElement('link');
      l.setAttribute('rel', 'canonical');
      return l;
    });

    const prev = {
      title: document.title,
      desc: desc.getAttribute('content') ?? '',
      canonical: canonical.getAttribute('href') ?? '',
    };

    document.title = route.title;
    desc.setAttribute('content', route.description);
    canonical.setAttribute('href', canonicalFor(route));

    return () => {
      document.title = prev.title;
      desc.setAttribute('content', prev.desc);
      canonical.setAttribute('href', prev.canonical);
    };
  }, [path]);
}
