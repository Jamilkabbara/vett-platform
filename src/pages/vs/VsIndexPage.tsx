import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { OverlayPage } from '../../components/layout/OverlayPage';
import { VS_COMPARISONS } from '../../components/marketing/vsComparisons';
import { useRouteSeo } from '../../seo/useRouteSeo';

/**
 * /vs - the list of comparison pages.
 *
 * Added 2026-09-14 so a retired comparison page has somewhere honest to
 * redirect: /vs/pollfish now 301s here. The page makes no claim about any
 * competitor; it only links to the pages that do, each of which sources its
 * claims from the competitor's own site.
 */
export function VsIndexPage() {
  useRouteSeo('/vs');

  return (
    <OverlayPage>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">Honest comparisons</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">VETT comparisons</h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-3xl">
            How VETT compares with survey platforms, research panels, other synthetic-respondent tools and
            traditional research agencies. Every statement about another company on these pages is taken from
            that company&apos;s own site, with the pages and the date it was checked listed at the foot. Each
            page also says plainly where VETT loses.
          </p>
        </div>

        <nav aria-label="Comparison pages" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
          {VS_COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              to={`/vs/${c.slug}`}
              className="glass-panel rounded-2xl border border-white/10 hover:border-white/20 transition-colors px-5 py-4 text-white/80 hover:text-white font-bold flex items-center justify-between"
            >
              VETT vs {c.name}
              <ArrowRight className="w-4 h-4 text-primary opacity-60" aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </OverlayPage>
  );
}
export default VsIndexPage;
