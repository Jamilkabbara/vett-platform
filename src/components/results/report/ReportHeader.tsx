import type { CanonicalReport } from './useCanonicalReport';

/**
 * Pass 48 — canonical report header. Shows the brief/topic + sample
 * summary the EXPORT already showed but the web page hid. Mounts under
 * the ResultsActionBar, above the headline + centerpiece.
 */
export function ReportHeader({ report }: { report: CanonicalReport }) {
  const { header } = report;
  const s = header.sample;
  const date = s.completed_at
    ? new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const chips = [
    s.n != null ? `n=${s.n}` : null,
    s.posture === 'directional' ? 'directional signal' : null,
    date,
  ].filter(Boolean) as string[];

  return (
    <section className="px-6 pt-5 pb-2 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <span className="inline-flex items-center rounded-full px-2 py-[2px] bg-lime/10 border border-lime/25 text-lime font-display font-bold text-[10px] uppercase tracking-wider">
          {header.methodology_label}
        </span>
        {chips.map((c) => (
          <span key={c} className="font-body text-[11px] text-t3">{c}</span>
        ))}
      </div>
      {header.title && (
        <h1 className="font-display font-black text-t1 text-[22px] md:text-[26px] leading-tight tracking-tight">
          {header.title}
        </h1>
      )}
      {header.brief && (
        <p className="font-body text-[13px] text-t3 mt-1.5 leading-relaxed max-w-3xl">
          <span className="font-semibold text-t2">Brief: </span>{header.brief}
        </p>
      )}
    </section>
  );
}

export default ReportHeader;
