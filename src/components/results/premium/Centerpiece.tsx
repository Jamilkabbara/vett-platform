import type { CanonicalReport } from '../report/useCanonicalReport';

/*
 * WO Section B — per-type SIGNATURE hero. The shared shell (PremiumResults)
 * owns finding/synthesis/questions/recs; this owns the methodology's signature
 * visual, read from the one canonical source (report.centerpiece.data = the
 * deterministic analysis). Each type leads with the read its buyer came for —
 * NPS/CSAT/CES for satisfaction, exposed-vs-control lift for brand_lift,
 * head-to-head for compare, the acceptable-price band for pricing, intent for
 * validate — instead of a generic distribution dump. Reuses the .premium CSS.
 */

const round = (v: unknown, dp = 1) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const f = 10 ** dp;
  return String(Math.round(n * f) / f);
};
const pctNum = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n) : 0; };

function SectionHead({ n, title, meta }: { n: string; title: string; meta?: string }) {
  return <div className="sec-h rv"><span className="n serif">{n}</span><h2>{title}</h2>{meta && <span className="meta mono">{meta}</span>}</div>;
}

function MetricStrip({ items }: { items: Array<{ value: string; label: string; lime?: boolean }> }) {
  return (
    <div className="metrics rv">
      {items.map((m, i) => (
        <div className="metric" key={i}>
          <div className={`mv${m.lime ? ' lime' : ''}`}>{m.value}</div>
          <div className="mu"><span className="k">{m.label}</span></div>
        </div>
      ))}
    </div>
  );
}

function Bars({ rows }: { rows: Array<{ label: string; pct: number; meta: string; tone?: 'lime' | 'indigo' | 'coral' }> }) {
  return (
    <div className="bars rv">
      {rows.map((r, i) => (
        <div className="bar-row" key={i}>
          <span className="lab" title={r.label}>{r.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, r.pct))}%`, background: r.tone === 'coral' ? 'var(--coral)' : r.tone === 'indigo' ? 'var(--indigo)' : 'var(--lime)' }} /></div>
          <span className="bar-val">{r.meta}</span>
        </div>
      ))}
    </div>
  );
}

/* ── satisfaction: NPS · CSAT · CES + NPS breakdown ── */
function SatisfactionHero({ a }: { a: any }) {
  const seg = a.nps?.segments || {};
  const rows = [
    { label: 'Promoters', pct: pctNum(seg.promoters?.pct), meta: `${pctNum(seg.promoters?.pct)}%`, tone: 'lime' as const },
    { label: 'Passives', pct: pctNum(seg.passives?.pct), meta: `${pctNum(seg.passives?.pct)}%`, tone: 'indigo' as const },
    { label: 'Detractors', pct: pctNum(seg.detractors?.pct), meta: `${pctNum(seg.detractors?.pct)}%`, tone: 'coral' as const },
  ];
  return (
    <>
      <SectionHead n="◆" title="Satisfaction & loyalty" meta="NPS · CSAT · CES" />
      <MetricStrip items={[
        { value: a.nps?.score != null ? String(a.nps.score) : '—', label: 'Net Promoter Score', lime: true },
        { value: a.csat?.top2_pct != null ? `${round(a.csat.top2_pct, 0)}%` : '—', label: 'CSAT (top-2-box)' },
        { value: a.ces?.top2_pct != null ? `${round(a.ces.top2_pct, 0)}%` : '—', label: 'CES (top-2-box)' },
      ]} />
      {(seg.promoters || seg.detractors) && <div style={{ marginTop: 28 }}><Bars rows={rows} /></div>}
    </>
  );
}

/* ── brand_lift: exposed-vs-control lift per funnel stage ── */
function BrandLiftHero({ a }: { a: any }) {
  const stages = (a.funnel || []).filter((f: any) => f && f.lift_abs != null);
  const rows = stages.map((f: any) => {
    const isProp = f.type === 'proportion';
    const lift = isProp ? Math.round(f.lift_abs * 100) : Number(round(f.lift_abs, 1));
    return { label: f.text ? String(f.text).slice(0, 36) : (f.funnel_stage || 'Stage'), pct: Math.max(6, Math.min(100, Math.abs(lift) * (isProp ? 2 : 12))), meta: `+${lift}${isProp ? ' pts' : ''}`, tone: 'lime' as const };
  });
  return (
    <>
      <SectionHead n="◆" title="Campaign lift" meta="exposed vs. control" />
      <MetricStrip items={[
        { value: String(a.summary?.stages_lifted ?? '—'), label: 'Funnel stages lifted', lime: true },
        { value: String(a.summary?.stages_sig95 ?? '—'), label: 'Significant at 95%' },
        { value: a.cells?.exposed?.n != null ? `${a.cells.exposed.n}/${a.cells?.control?.n ?? '?'}` : '—', label: 'Exposed / control n' },
      ]} />
      {rows.length > 0 && <div style={{ marginTop: 28 }}><Bars rows={rows} /></div>}
    </>
  );
}

/* ── compare: head-to-head forced-choice share ── */
function CompareHero({ a }: { a: any }) {
  const winnerId = a.overall_winner?.concept_id;
  const concepts = (a.concepts || []).filter((c: any) => c && c.final_choice_pct);
  const rows = concepts
    .sort((x: any, y: any) => (y.final_choice_pct?.pct || 0) - (x.final_choice_pct?.pct || 0))
    .map((c: any) => ({ label: c.label || c.concept_id, pct: pctNum(c.final_choice_pct?.pct), meta: `${pctNum(c.final_choice_pct?.pct)}%`, tone: (c.concept_id === winnerId ? 'lime' : 'indigo') as const }));
  const winner = concepts.find((c: any) => c.concept_id === winnerId) || concepts[0];
  return (
    <>
      <SectionHead n="◆" title="Head-to-head" meta="forced choice" />
      <MetricStrip items={[
        { value: winner ? (winner.label || winner.concept_id) : '—', label: 'Winning concept', lime: true },
        { value: winner?.final_choice_pct?.pct != null ? `${pctNum(winner.final_choice_pct.pct)}%` : '—', label: 'Forced-choice share' },
        { value: winner?.dimensions?.appeal?.mean != null ? `${round(winner.dimensions.appeal.mean)}` : '—', label: 'Appeal (mean)' },
      ]} />
      {rows.length > 0 && <div style={{ marginTop: 28 }}><Bars rows={rows} /></div>}
    </>
  );
}

/* ── pricing: acceptable-price band + Van Westendorp corners ── */
function PricingHero({ a }: { a: any }) {
  const cur = a.currency || '';
  const range = a.acceptable_range || {};
  const pts = a.van_westendorp?.points || {};
  const opp = pts.opp ?? a.gabor_granger?.optimal_price;
  const lo = Number(range.low), hi = Number(range.high);
  const oppN = Number(opp);
  const oppPos = (Number.isFinite(lo) && Number.isFinite(hi) && hi > lo && Number.isFinite(oppN))
    ? Math.max(0, Math.min(100, ((oppN - lo) / (hi - lo)) * 100)) : null;
  return (
    <>
      <SectionHead n="◆" title="Price sensitivity" meta="Van Westendorp" />
      <MetricStrip items={[
        { value: opp != null ? `${cur}${round(opp, 0)}` : '—', label: 'Optimal price (OPP)', lime: true },
        { value: (range.low != null && range.high != null) ? `${cur}${round(range.low, 0)}–${round(range.high, 0)}` : '—', label: 'Acceptable range' },
        { value: a.wtp_ceiling?.mean != null ? `${cur}${round(a.wtp_ceiling.mean, 0)}` : '—', label: 'WTP ceiling (mean)' },
      ]} />
      {oppPos != null && (
        <div className="rv" style={{ marginTop: 30 }}>
          <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--raise)', marginBottom: 8 }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 4, background: 'linear-gradient(90deg, var(--indigo), var(--lime))', opacity: 0.5 }} />
            <div style={{ position: 'absolute', left: `${oppPos}%`, top: -4, width: 2, height: 16, background: 'var(--lime)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--faint)' }}>
            <span>{cur}{round(range.low, 0)} floor</span><span style={{ color: 'var(--lime)' }}>OPP {cur}{round(opp, 0)}</span><span>{cur}{round(range.high, 0)} ceiling</span>
          </div>
        </div>
      )}
    </>
  );
}

/* ── validate: purchase intent + concept scores ── */
function ValidateHero({ a }: { a: any }) {
  const s = a.scores || {};
  const rows = [
    s.reaction?.mean != null && { label: 'Concept reaction', pct: (Number(s.reaction.mean) / 10) * 100, meta: `${round(s.reaction.mean)}/10`, tone: 'lime' as const },
    s.relevance?.mean != null && { label: 'Relevance', pct: (Number(s.relevance.mean) / 7) * 100, meta: `${round(s.relevance.mean)}/7`, tone: 'indigo' as const },
    s.uniqueness?.mean != null && { label: 'Uniqueness', pct: (Number(s.uniqueness.mean) / 7) * 100, meta: `${round(s.uniqueness.mean)}/7`, tone: 'indigo' as const },
  ].filter(Boolean) as Array<{ label: string; pct: number; meta: string; tone: 'lime' | 'indigo' }>;
  return (
    <>
      <SectionHead n="◆" title="Concept validation" meta="purchase intent" />
      <MetricStrip items={[
        { value: a.intent?.top2_pct != null ? `${round(a.intent.top2_pct, 0)}%` : '—', label: 'Purchase intent (top-2-box)', lime: true },
        { value: s.reaction?.mean != null ? `${round(s.reaction.mean)}/10` : '—', label: 'Concept reaction' },
        { value: s.relevance?.mean != null ? `${round(s.relevance.mean)}/7` : '—', label: 'Relevance' },
      ]} />
      {rows.length > 0 && <div style={{ marginTop: 28 }}><Bars rows={rows} /></div>}
    </>
  );
}

/* ── roadmap: MaxDiff priority + Kano must-haves ── */
function RoadmapHero({ a }: { a: any }) {
  const feats = (a.maxdiff?.features || []).filter((f: any) => f && f.utility != null).slice(0, 6);
  const maxU = Math.max(1, ...feats.map((f: any) => Math.abs(Number(f.utility))));
  const rows = feats.map((f: any) => ({ label: f.label || f.feature_id, pct: (Math.abs(Number(f.utility)) / maxU) * 100, meta: String(round(f.utility, 2)), tone: (Number(f.utility) >= 0 ? 'lime' : 'coral') as const }));
  const mustHaves = (a.kano?.features || []).filter((f: any) => f && f.classification === 'must_be').length;
  return (
    <>
      <SectionHead n="◆" title="Feature priority" meta="MaxDiff · Kano" />
      <MetricStrip items={[
        { value: feats[0] ? (feats[0].label || feats[0].feature_id) : '—', label: 'Top-priority feature', lime: true },
        { value: String((a.maxdiff?.features || []).length), label: 'Features ranked' },
        { value: String(mustHaves), label: 'Kano must-haves' },
      ]} />
      {rows.length > 0 && <div style={{ marginTop: 28 }}><Bars rows={rows} /></div>}
    </>
  );
}

/* ── naming: winning name + appeal ranking ── */
function NamingHero({ a }: { a: any }) {
  const winnerId = a.winner?.candidate_id;
  const useWin = (a.candidates || []).some((c: any) => c.pairwise_win_rate?.pct != null);
  const maxC = Math.max(1, ...(a.candidates || []).map((c: any) => Number(c.composite) || 0));
  const cands = (a.candidates || []).slice().sort((x: any, y: any) => (y.pairwise_win_rate?.pct ?? y.composite ?? 0) - (x.pairwise_win_rate?.pct ?? x.composite ?? 0));
  const winner = cands.find((c: any) => c.candidate_id === winnerId) || cands[0];
  const rows = cands.slice(0, 6).map((c: any) => {
    const hasWin = useWin && c.pairwise_win_rate?.pct != null;
    return { label: c.label || c.candidate_id, pct: hasWin ? pctNum(c.pairwise_win_rate.pct) : Math.round((Number(c.composite) / maxC) * 100), meta: hasWin ? `${pctNum(c.pairwise_win_rate.pct)}%` : `${round(c.composite, 1)}`, tone: (c.candidate_id === winnerId ? 'lime' : 'indigo') as const };
  });
  return (
    <>
      <SectionHead n="◆" title="Name & message" meta={useWin ? 'pairwise win rate' : 'composite appeal'} />
      <MetricStrip items={[
        { value: winner ? (winner.label || winner.candidate_id) : '—', label: 'Winning name', lime: true },
        { value: winner?.pairwise_win_rate?.pct != null ? `${pctNum(winner.pairwise_win_rate.pct)}% win` : (winner?.composite != null ? `${round(winner.composite, 1)}` : '—'), label: useWin ? 'Win rate' : 'Composite appeal' },
        { value: String((a.candidates || []).length), label: 'Names tested' },
      ]} />
      {rows.length > 0 && <div style={{ marginTop: 28 }}><Bars rows={rows} /></div>}
    </>
  );
}

/* ── competitor: share of preference + your standing ── */
function CompetitorHero({ a }: { a: any }) {
  const brands = (a.brands || []).filter((b: any) => b && b.use_pct);
  const rows = brands.slice().sort((x: any, y: any) => (y.use_pct?.pct || 0) - (x.use_pct?.pct || 0)).slice(0, 6)
    .map((b: any) => ({ label: `${b.label}${b.is_focal ? ' (you)' : ''}`, pct: pctNum(b.use_pct?.pct), meta: `${pctNum(b.use_pct?.pct)}%`, tone: (b.is_focal ? 'lime' : 'indigo') as const }));
  const focal = brands.find((b: any) => b.is_focal);
  return (
    <>
      <SectionHead n="◆" title="Competitive position" meta="share of preference" />
      <MetricStrip items={[
        { value: a.focal_brand || '—', label: 'Focal brand', lime: true },
        { value: focal?.use_pct?.pct != null ? `${pctNum(focal.use_pct.pct)}%` : '—', label: 'Your share of preference' },
        { value: focal?.nps?.score != null ? String(focal.nps.score) : '—', label: 'Your NPS' },
      ]} />
      {rows.length > 0 && <div style={{ marginTop: 28 }}><Bars rows={rows} /></div>}
    </>
  );
}

/* ── marketing: ad appeal / persuasion ── */
function MarketingHero({ a }: { a: any }) {
  const f = a.funnel || {};
  const aided = f.recall_aided?.correct_rate ?? f.recall_aided?.positive_rate;
  const rows = ([
    f.likeability?.mean != null && { label: 'Likeability', pct: (Number(f.likeability.mean) / 7) * 100, meta: `${round(f.likeability.mean)}/7`, tone: 'lime' as const },
    f.persuasion?.mean != null && { label: 'Persuasion', pct: (Number(f.persuasion.mean) / 7) * 100, meta: `${round(f.persuasion.mean)}/7`, tone: 'indigo' as const },
    f.stopping_power?.mean != null && { label: 'Stopping power', pct: (Number(f.stopping_power.mean) / 7) * 100, meta: `${round(f.stopping_power.mean)}/7`, tone: 'indigo' as const },
  ].filter(Boolean)) as Array<{ label: string; pct: number; meta: string; tone: 'lime' | 'indigo' }>;
  return (
    <>
      <SectionHead n="◆" title="Ad effectiveness" meta="appeal · persuasion" />
      <MetricStrip items={[
        { value: f.likeability?.mean != null ? `${round(f.likeability.mean)}/7` : '—', label: 'Likeability (mean)', lime: true },
        { value: f.persuasion?.mean != null ? `${round(f.persuasion.mean)}/7` : '—', label: 'Persuasion (mean)' },
        { value: aided != null ? `${Math.round(Number(aided) * 100)}%` : '—', label: 'Aided recall' },
      ]} />
      {rows.length > 0 && <div style={{ marginTop: 28 }}><Bars rows={rows} /></div>}
    </>
  );
}

/* ── churn: top driver + winnable + driver breakdown ── */
function ChurnHero({ a }: { a: any }) {
  const drivers = (a.drivers?.ranked || []).filter((d: any) => d && (d.reason || d.option || d.label));
  const rows = drivers.slice(0, 6).map((d: any) => ({ label: d.reason || d.option || d.label, pct: pctNum(d.pct_of_respondents), meta: `${pctNum(d.pct_of_respondents)}%`, tone: 'coral' as const }));
  const top = drivers[0];
  return (
    <>
      <SectionHead n="◆" title="Why customers leave" meta="churn drivers" />
      <MetricStrip items={[
        { value: top ? (top.reason || top.option || top.label) : '—', label: 'Top churn driver', lime: true },
        { value: top?.pct_of_respondents != null ? `${pctNum(top.pct_of_respondents)}%` : '—', label: 'Cite the top driver' },
        { value: a.winback?.winnable_pct != null ? `${pctNum(a.winback.winnable_pct)}%` : '—', label: 'Winnable (would return)' },
      ]} />
      {rows.length > 0 && <div style={{ marginTop: 28 }}><Bars rows={rows} /></div>}
    </>
  );
}

/* ── audience_profiling: segment map + segment cards ── */
function AudienceProfilingHero({ a }: { a: any }) {
  const segs: any[] = Array.isArray(a.segments) ? a.segments : [];
  const palette = ['#BEF264', '#6366F1', '#E7B45A', '#F2787F'];
  if (a.posture !== 'segmented' || !segs.length) {
    const rows = (a.dimensions || []).map((d: any) => {
      const att = a.aggregate?.attitudes?.[d.key];
      return att && att.mean != null ? { label: d.label, pct: (Number(att.mean) / 7) * 100, meta: `${round(att.mean)}/7`, tone: 'indigo' as const } : null;
    }).filter(Boolean) as Array<{ label: string; pct: number; meta: string; tone: 'indigo' }>;
    return (
      <>
        <SectionHead n="◆" title="Audience profile" meta="aggregate" />
        <MetricStrip items={[{ value: String(a.n ?? '—'), label: 'Respondents profiled', lime: true }]} />
        {rows.length > 0 && <div style={{ marginTop: 28 }}><Bars rows={rows} /></div>}
      </>
    );
  }
  const primary = segs.find((s) => s.is_primary) || segs[0];
  const keyDim = (a.dimensions || []).find((d: any) => d.key === a.key_dimension)?.label || a.key_dimension;
  const maxAbs = Math.max(1, ...segs.map((s) => Math.abs(s.coords?.x ?? 0)), ...segs.map((s) => Math.abs(s.coords?.y ?? 0)));
  return (
    <>
      <SectionHead n="◆" title="Audience segments" meta={`${a.segment_count} segments`} />
      <MetricStrip items={[
        { value: String(a.segment_count), label: 'Segments identified', lime: true },
        { value: primary ? `${pctNum(primary.size_pct)}%` : '—', label: `Primary: ${primary?.name || ''}` },
        { value: keyDim || '—', label: 'Key differentiator' },
      ]} />
      <div className="rv" style={{ marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <svg width="220" height="220" viewBox="-110 -110 220 220" style={{ flex: 'none', background: 'var(--raise)', borderRadius: 12 }} aria-label="Segmentation map">
          <line x1="-100" y1="0" x2="100" y2="0" stroke="var(--hair)" />
          <line x1="0" y1="-100" x2="0" y2="100" stroke="var(--hair)" />
          {segs.map((s, i) => {
            const cx = ((s.coords?.x ?? 0) / maxAbs) * 88;
            const cy = -((s.coords?.y ?? 0) / maxAbs) * 88;
            const r = Math.max(9, Math.min(34, Math.sqrt(Math.max(1, s.size_pct)) * 4));
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill={palette[i % 4]} fillOpacity={s.is_primary ? 0.85 : 0.4} stroke={palette[i % 4]} />
                <text x={cx} y={cy + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0B0C15">{pctNum(s.size_pct)}%</text>
              </g>
            );
          })}
        </svg>
        <div style={{ flex: '1 1 280px', minWidth: 260 }}>
          {segs.map((s, i) => (
            <div key={i} style={{ padding: '11px 0', borderBottom: '1px solid var(--hair)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: palette[i % 4], display: 'inline-block' }} />
                <strong style={{ color: 'var(--text)' }}>{s.name}</strong>
                {s.is_primary && <span className="mono" style={{ fontSize: 9.5, color: 'var(--lime)' }}>PRIMARY</span>}
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--lime)' }}>{pctNum(s.size_pct)}% · n={s.n}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {(s.signature || []).map((sg: any) => `${sg.label} ${sg.mean}/7`).join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── market_entry: per-market demand scorecard + go/no-go signal ── */
function MarketEntryHero({ a }: { a: any }) {
  const markets: any[] = Array.isArray(a.markets) ? a.markets : [];
  const sigColor = (s: string) => (s === 'go' ? 'var(--lime)' : s === 'caution' ? 'var(--amber)' : 'var(--coral)');
  const sigText = (s: string) => (s ? s.replace('_', '-').toUpperCase() : '—');
  return (
    <>
      <SectionHead n="◆" title="Market demand" meta="go · caution · no-go" />
      <MetricStrip items={[
        { value: a.recommended_market || '—', label: 'Recommended market', lime: true },
        { value: a.best_demand_index != null ? `${a.best_demand_index}/100` : '—', label: 'Best demand index' },
        { value: a.top_barrier || '—', label: 'Top barrier' },
      ]} />
      <div className="rv" style={{ marginTop: 24 }}>
        {markets.map((m, i) => (
          <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--hair)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <strong style={{ color: 'var(--text)', fontSize: 15 }}>{m.market}</strong>
              <span className="mono" style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 5, border: `1px solid ${sigColor(m.signal)}`, color: sigColor(m.signal) }}>
                {sigText(m.signal)}{m.directional ? ' · directional' : ''}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 13, color: sigColor(m.signal) }}>{m.demand_index ?? '—'}/100</span>
            </div>
            <div className="bar-track" style={{ marginTop: 8 }}>
              <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, m.demand_index || 0))}%`, background: sigColor(m.signal) }} />
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 8, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
              {m.purchase_intent_pct != null && <span>Intent <b style={{ color: 'var(--text)' }}>{m.purchase_intent_pct}%</b></span>}
              {m.appeal_mean != null && <span>Appeal <b style={{ color: 'var(--text)' }}>{m.appeal_mean}/7</b></span>}
              {m.wtp != null && <span>WTP <b style={{ color: 'var(--text)' }}>{m.wtp}</b></span>}
              {m.barriers?.[0] && <span>Top barrier: <b style={{ color: 'var(--text)' }}>{m.barriers[0].label}</b></span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function heroFor(m: string | null, a: any): JSX.Element | null {
  switch (m) {
    case 'satisfaction': return <SatisfactionHero a={a} />;
    case 'brand_lift': return <BrandLiftHero a={a} />;
    case 'compare': return <CompareHero a={a} />;
    case 'pricing': return <PricingHero a={a} />;
    case 'validate': return <ValidateHero a={a} />;
    case 'roadmap': return <RoadmapHero a={a} />;
    case 'naming': case 'naming_messaging': return <NamingHero a={a} />;
    case 'competitor': return <CompetitorHero a={a} />;
    case 'marketing': return <MarketingHero a={a} />;
    case 'churn': case 'churn_research': return <ChurnHero a={a} />;
    case 'audience_profiling': return <AudienceProfilingHero a={a} />;
    case 'market_entry': return <MarketEntryHero a={a} />;
    default: return null; // research uses the generic KPI hero (its archetype IS the mockup)
  }
}

export function Centerpiece({ report }: { report: CanonicalReport }) {
  const a = report.centerpiece?.data as any;
  const m = report.centerpiece?.methodology || report.header.methodology;
  const gate = report.centerpiece?.gate;
  if (!a || typeof a !== 'object') return null;
  const hero = heroFor(m, a);
  if (!hero) return null;

  // §2.4 — when the sample can't support an authoritative read, lead with the
  // directional banner and (for hard-gated methods like pricing/roadmap) damp
  // the lime headline so the point estimate is never read as confident.
  const directional = gate && gate.posture === 'directional' && gate.note;
  if (!directional) return hero;
  return (
    <div className={gate?.suppress_headline ? 'cp-block cp-damp' : 'cp-block'}>
      <div className="cp-gate rv">
        <span className="cp-gate-tag">Directional</span>
        <span className="cp-gate-note">{gate!.note}{gate!.n ? ` · n=${gate!.n}` : ''}</span>
      </div>
      {hero}
    </div>
  );
}

export default Centerpiece;
