import type { CanonicalSurveyQuestion } from './useCanonicalReport';

/**
 * Pass 48 — "The full survey" appendix. Renders every question with the
 * CORRECT widget for its `renderer` (assigned by the backend canonical
 * report), so a 0-10 question shows a 0-10 distribution, 1-7 shows 1-7,
 * an attribute battery shows a table — never the 1-5 star fallback that
 * produced "7/5" and "0/5". This is the shared registry the web side
 * consumes; the export builders consume the same canonical data.
 */

function pct(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function Bar({ label, count, total, suffix }: { label: string; count: number; total: number; suffix?: string }) {
  const p = pct(count, total);
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="w-40 shrink-0 truncate text-t2" title={label}>{label}</span>
      <span className="flex-1 h-3 rounded bg-bg3 overflow-hidden">
        <span className="block h-full bg-lime" style={{ width: `${p}%` }} />
      </span>
      <span className="w-24 shrink-0 text-right text-t3 tabular-nums">
        {p}% ({count}{suffix || ''})
      </span>
    </div>
  );
}

/** Numeric scale distribution over the question's TRUE bucket range. */
function ScaleDist({ data }: { data: Record<string, any> }) {
  const dist: Record<string, number> = data.distribution || {};
  const keys = Object.keys(dist).map(Number).sort((a, b) => a - b);
  const total = keys.reduce((s, k) => s + (dist[k] || 0), 0);
  const ci = (data.ci_low != null && data.ci_high != null) ? ` · 95% CI ${data.ci_low}–${data.ci_high}` : '';
  return (
    <div className="space-y-1.5">
      <p className="text-[12px] text-t1 font-display font-bold">
        Average {data.average ?? '—'} <span className="text-t3 font-body font-normal">/ {data.scale_max} (n={data.n}{ci})</span>
      </p>
      <div className="space-y-1">
        {keys.map((k) => <Bar key={k} label={String(k)} count={dist[k] || 0} total={total} />)}
      </div>
    </div>
  );
}

function ChoiceDist({ data }: { data: Record<string, any> }) {
  const dist: Record<string, number> = data.distribution || {};
  const entries = Object.entries(dist).sort((a, b) => (b[1] as number) - (a[1] as number));
  const total = entries.reduce((s, [, v]) => s + (v as number), 0);
  if (entries.length === 0) return <p className="text-[12px] text-t3 italic">No responses recorded.</p>;
  return (
    <div className="space-y-1">
      {entries.map(([opt, count]) => <Bar key={opt} label={opt} count={count as number} total={total} />)}
    </div>
  );
}

function MultiDist({ data }: { data: Record<string, any> }) {
  const dist: Record<string, number> = data.distribution || {};
  const base = data.n_respondents || data.n || 0;
  const entries = Object.entries(dist).sort((a, b) => (b[1] as number) - (a[1] as number));
  if (entries.length === 0) return <p className="text-[12px] text-t3 italic">No selections recorded.</p>;
  return (
    <div className="space-y-1">
      <p className="text-[11px] text-t3">% of {base} respondents (multi-select)</p>
      {entries.map(([opt, count]) => <Bar key={opt} label={opt} count={count as number} total={base} />)}
    </div>
  );
}

function AttributeBattery({ data }: { data: Record<string, any> }) {
  if (data.shape === 'matrix' && Array.isArray(data.per_attribute)) {
    return (
      <div className="space-y-1">
        {data.per_attribute.map((a: any) => (
          <div key={a.attribute} className="flex items-center gap-2 text-[12px]">
            <span className="w-44 shrink-0 truncate text-t2" title={a.attribute}>{a.attribute}</span>
            <span className="flex-1 h-3 rounded bg-bg3 overflow-hidden">
              <span className="block h-full bg-lime" style={{ width: `${Math.min(100, (a.average / 5) * 100)}%` }} />
            </span>
            <span className="w-20 text-right text-t3 tabular-nums">{a.average} (n={a.n})</span>
          </div>
        ))}
      </div>
    );
  }
  return <MultiDist data={data} />;
}

function MaxDiffMini({ data }: { data: Record<string, any> }) {
  const best: Record<string, number> = data.best || {};
  const worst: Record<string, number> = data.worst || {};
  const feats = Array.from(new Set([...Object.keys(best), ...Object.keys(worst)]));
  if (feats.length === 0) return <p className="text-[12px] text-t3 italic">No best/worst picks recorded.</p>;
  return (
    <div className="space-y-1 text-[12px]">
      <div className="flex gap-2 text-t3 font-semibold"><span className="w-44">Feature</span><span className="w-16 text-right">Best</span><span className="w-16 text-right">Worst</span></div>
      {feats.map((f) => (
        <div key={f} className="flex gap-2"><span className="w-44 truncate text-t2" title={f}>{f}</span><span className="w-16 text-right text-lime tabular-nums">{best[f] || 0}</span><span className="w-16 text-right text-t3 tabular-nums">{worst[f] || 0}</span></div>
      ))}
    </div>
  );
}

function Verbatims({ data }: { data: Record<string, any> }) {
  const items: string[] = data.verbatims || [];
  if (items.length === 0) return <p className="text-[12px] text-t3 italic">No open-text responses.</p>;
  const shown = items.slice(0, 8);
  return (
    <div className="space-y-1.5">
      {shown.map((v, i) => (
        <p key={i} className="text-[12px] text-t2 italic border-l-2 border-b2 pl-2.5 leading-snug">“{v}”</p>
      ))}
      {items.length > shown.length && <p className="text-[11px] text-t3">+{items.length - shown.length} more</p>}
    </div>
  );
}

function QuestionBody({ q }: { q: CanonicalSurveyQuestion }) {
  const r = q.renderer;
  if (r.startsWith('scale_')) return <ScaleDist data={q.data} />;
  if (r === 'multi_select') return <MultiDist data={q.data} />;
  if (r === 'attribute_battery') return <AttributeBattery data={q.data} />;
  if (r === 'max_diff') return <MaxDiffMini data={q.data} />;
  if (r === 'open_text_verbatims') return <Verbatims data={q.data} />;
  // single_select / forced_choice / paired_comparison / screener / kano
  return <ChoiceDist data={q.data} />;
}

export function FullSurveySection({ survey }: { survey: CanonicalSurveyQuestion[] }) {
  if (!Array.isArray(survey) || survey.length === 0) return null;
  return (
    <section className="px-6 py-6 max-w-6xl mx-auto w-full">
      <h2 className="font-display font-bold text-t1 text-[15px] mb-1">The full survey</h2>
      <p className="font-body text-[12px] text-t3 mb-4">Every question asked, with its responses. {survey.length} questions.</p>
      <div className="space-y-5">
        {survey.map((q) => (
          <div key={q.id} className="rounded-xl border border-b2 bg-bg2/40 p-4">
            <div className="flex items-start gap-2 mb-2.5">
              <span className="shrink-0 font-display font-bold text-t3 text-[12px] mt-[1px]">Q{q.number}</span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-[13px] text-t1 leading-snug">{q.text}</p>
                {q.isScreening && <span className="text-[10px] text-t3 uppercase tracking-wide">screener</span>}
              </div>
              <span className="shrink-0 rounded-full px-2 py-[1px] bg-bg3 border border-b2 text-t3 font-display text-[9px] uppercase tracking-wide">
                {q.renderer_label}
              </span>
            </div>
            <QuestionBody q={q} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default FullSurveySection;
