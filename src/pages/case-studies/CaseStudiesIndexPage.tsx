/**
 * /case-studies - the index.
 *
 * A card per registered study, read from src/data/caseStudies/index.ts, which
 * is the same object the study page renders. The card leads with the finding
 * rather than a client name, for the same reason the study page does: the
 * finding is the thing a reader is scanning for.
 *
 * Copy rule: hyphens or the word "to", never an em or en dash.
 */
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, FlaskConical } from 'lucide-react';

import { OverlayPage } from '../../components/layout/OverlayPage';
import { useRouteSeo } from '../../seo/useRouteSeo';
import { CASE_STUDIES } from '../../data/caseStudies';

export function CaseStudiesIndexPage() {
  useRouteSeo('/case-studies');

  return (
    <OverlayPage>
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-primary" />
          <span className="text-xs font-black uppercase tracking-widest text-primary">
            Case studies
          </span>
        </div>

        <h1 className="mb-5 text-4xl font-black tracking-tighter text-white sm:text-5xl md:text-7xl">
          Case studies
        </h1>
        <p className="mb-12 max-w-3xl text-lg text-white/60 sm:text-xl">
          Worked examples of VETT missions: the decision that needed
          making, the study that was run, the numbers it returned, and the
          sample those numbers rest on. Every chart here is drawn by the same
          code that draws the customer results page, so nothing is redrawn for
          marketing.
        </p>

        {CASE_STUDIES.length === 0 ? (
          <p className="py-16 text-center text-white/40">
            No case studies published yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {CASE_STUDIES.map((s) => (
              <Link
                key={s.slug}
                to={s.slug}
                className="group flex min-w-0 flex-col rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition-all duration-300 hover:border-primary/40"
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary/30 bg-primary/[0.06] px-2.5 py-[3px] text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                    {s.eyebrow}
                  </span>
                  {s.placeholder && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber/40 bg-amber/[0.1] px-2.5 py-[3px] text-[11px] font-black uppercase tracking-[0.14em] text-amber">
                      <AlertTriangle className="h-3 w-3" aria-hidden />
                      Placeholder
                    </span>
                  )}
                </div>

                <h2 className="mb-3 flex-1 text-xl font-black leading-tight text-white [overflow-wrap:break-word] transition-colors group-hover:text-primary sm:text-2xl">
                  {s.finding}
                </h2>

                <p className="mb-5 text-[13px] leading-relaxed text-white/50">
                  {s.method.methodology}. n = {s.method.n}. {s.method.markets}.{' '}
                  {s.method.month}.
                </p>

                <span className="mt-auto flex items-center gap-1 text-[13px] font-bold text-lime">
                  Read the study <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-xs text-white/40">
          Every VETT respondent is simulated, not recruited. See{' '}
          <Link to="/methodology" className="underline hover:text-white/70">
            how VETT produces a number
          </Link>{' '}
          for what that means for each figure.
        </p>
      </div>
    </OverlayPage>
  );
}

export default CaseStudiesIndexPage;
