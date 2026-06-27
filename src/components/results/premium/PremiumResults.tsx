import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './premium-results.css';
import { Centerpiece } from './Centerpiece';
import { api } from '../../../lib/apiClient';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../ui/Toast';
import type { CanonicalReport, CanonicalSurveyQuestion, CanonicalTheme } from '../report/useCanonicalReport';

/*
 * WO §4 — the premium results experience, implemented 1:1 from the approved
 * mockup. Universal: it renders ANY methodology from the canonical report
 * (GET /api/results/:id/report), the one source the exports also read, so web
 * and PDF/PPTX/XLSX cannot drift. Insight-led, every question visualized,
 * honest low-n, no AI-machinery language.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';
const SENT = (s?: string) => (s === 'positive' || s === 'negative' ? s : 'neutral');

/** Parse the leading number out of a value string ("4.4", "100%", "-20") for count-up. */
function parseMetric(value: string): { target: number; dec: number; suf: string; raw: string } | null {
  const m = String(value).match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const dec = m[1].includes('.') ? (m[1].split('.')[1].length) : 0;
  return { target: parseFloat(m[1]), dec, suf: (m[2] || '').trim(), raw: value };
}

function pct(n: number, total: number) { return total > 0 ? Math.round((n / total) * 100) : 0; }

/* ── per-question visuals (mockup classes; data attrs drive the draw-in) ── */

function Histogram({ data }: { data: Record<string, any> }) {
  const dist: Record<string, number> = data.distribution || {};
  const min = Number(data.scale_min), max = Number(data.scale_max);
  const keys: number[] = Number.isFinite(min) && Number.isFinite(max) && max >= min
    ? Array.from({ length: max - min + 1 }, (_, i) => min + i)
    : Object.keys(dist).map(Number).sort((a, b) => a - b);
  const counts = keys.map((k) => dist[k] ?? dist[String(k)] ?? 0);
  const peak = Math.max(1, ...counts);
  return (
    <div className="hist">
      {keys.map((k, i) => (
        <div className="col" key={k}>
          <div className={`colbar${counts[i] === 0 ? ' zero' : ''}`} data-h={`${Math.max(2, Math.round((counts[i] / peak) * 100))}%`} title={`${counts[i]}`} />
          <span className="cl">{k}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ data }: { data: Record<string, any> }) {
  const dist: Record<string, number> = data.distribution || {};
  const entries = Object.entries(dist).sort((a, b) => (b[1] as number) - (a[1] as number));
  const total = entries.reduce((s, [, v]) => s + (v as number), 0);
  if (!entries.length || total === 0) return <p className="q-foot">No responses recorded.</p>;
  const palette = ['#BEF264', '#6366F1', '#E7B45A', '#F2787F', '#8A8DA0', '#a78bfa'];
  let offset = 25; // mockup starts at 25 (rotate -90 baseline)
  const top = entries[0];
  return (
    <div className="donut-wrap">
      <svg width="108" height="108" viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="#171928" strokeWidth="5" />
        {entries.map(([opt, v], i) => {
          const share = (v as number) / total * 100;
          const dash = `${share} ${100 - share}`;
          const el = <circle key={opt} cx="21" cy="21" r="15.9" fill="none" stroke={palette[i % palette.length]} strokeWidth="5" strokeDasharray={dash} strokeDashoffset={offset} transform="rotate(-90 21 21)" />;
          offset = (offset - share + 100) % 100;
          return el;
        })}
        <text x="21" y="20" textAnchor="middle" fontSize="7" fontFamily="Manrope" fontWeight="700" fill="#ECEDF2">{pct(top[1] as number, total)}%</text>
        <text x="21" y="25.5" textAnchor="middle" fontSize="3" fill="#8A8DA0">{String(top[0]).slice(0, 14)}</text>
      </svg>
      <div className="legend">
        {entries.slice(0, 6).map(([opt, v], i) => (
          <div className="li" key={opt}><span className="sw" style={{ background: palette[i % palette.length] }} /><span style={{ overflowWrap: 'anywhere', lineHeight: 1.35 }} title={String(opt)}>{opt}</span><span className="lv">{v as number}</span></div>
        ))}
      </div>
    </div>
  );
}

function RankedBars({ data }: { data: Record<string, any> }) {
  const dist: Record<string, number> = data.distribution || {};
  const base = data.n_respondents || data.n || 0;
  const entries = Object.entries(dist).sort((a, b) => (b[1] as number) - (a[1] as number));
  if (!entries.length) return <p className="q-foot">No selections recorded.</p>;
  return (
    <div className="bars">
      {entries.map(([opt, v], i) => {
        const p = pct(v as number, base);
        return (
          <div className="bar-row" key={opt}>
            <span className="lab" title={opt}>{opt}</span>
            <div className="bar-track"><div className={`bar-fill${i >= 3 ? ' indigo' : ''}`} data-w={`${p}%`} /></div>
            <span className="bar-val">{p}%</span>
          </div>
        );
      })}
    </div>
  );
}

function MatrixBars({ data }: { data: Record<string, any> }) {
  const rows: any[] = Array.isArray(data.per_attribute) ? data.per_attribute : [];
  const max = Number(data.scale_max) || 5;
  if (!rows.length) return <RankedBars data={data} />;
  return (
    <div className="bars">
      {rows.map((a) => {
        const p = Math.min(100, Math.round(((Number(a.average) || 0) / max) * 100));
        return (
          <div className="bar-row" key={a.attribute}>
            <span className="lab" title={a.attribute}>{a.attribute}</span>
            <div className="bar-track"><div className="bar-fill" data-w={`${p}%`} /></div>
            <span className="bar-val">{a.average}</span>
          </div>
        );
      })}
    </div>
  );
}

function QualifiedBase({ q, screening }: { q: CanonicalSurveyQuestion; screening: CanonicalReport['screening'] }) {
  const dist: Record<string, number> = (q.data as any).distribution || {};
  const qualified = (screening && screening.qualified) || Object.values(dist).reduce((s, v) => s + (v as number), 0);
  const conditions = Object.keys(dist).join(' · ');
  return (
    <div className="qbase">
      <span className="qn num">{qualified}</span>
      <span className="qd">qualified respondents set the base for every figure below.{conditions ? <> Screened on: <span style={{ color: 'var(--text)' }}>{conditions}</span>.</> : null}</span>
    </div>
  );
}

function Themes({ data }: { data: Record<string, any> }) {
  const themes: CanonicalTheme[] = Array.isArray(data.themes) ? data.themes : [];
  const verbatims: string[] = Array.isArray(data.verbatims) ? data.verbatims : [];
  if (!themes.length) {
    if (!verbatims.length) return <p className="q-foot">No open-text responses.</p>;
    return <div className="themes">{verbatims.slice(0, 6).map((v, i) => <p className="quote" key={i}>“{v}”</p>)}</div>;
  }
  return (
    <div className="themes">
      {themes.map((t, i) => (
        <div key={i}>
          <div className="theme-top">
            <span className="theme-name">{t.label}</span>
            <span className={`theme-sent sent-${SENT(t.sentiment)}`}>{t.sentiment}</span>
            <span className="theme-count">{t.count} / {data.n || verbatims.length || t.count}</span>
          </div>
          <div className="theme-track"><div className={`theme-fill tf-${SENT(t.sentiment)}`} data-w={`${t.pct}%`} /></div>
          {(t.quotes || []).slice(0, 1).map((qq, j) => <p className="quote" key={j}>“{qq}”</p>)}
        </div>
      ))}
    </div>
  );
}

/* ── question card: insight leads, then the visual, with a chart/table toggle ── */
function QuestionCard({ q, screening }: { q: CanonicalSurveyQuestion; screening: CanonicalReport['screening'] }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const r = q.renderer || '';
  const data = q.data as Record<string, any>;
  const n = Number(data.n) || Number(data.n_respondents) || null;
  const lowN = n != null && n < 5;

  const tag = q.isScreening || r === 'screener' ? 'Screener'
    : r.startsWith('scale_') ? 'Rating'
    : r === 'multi_select' || r === 'attribute_battery' ? 'Multi'
    : r === 'open_text_verbatims' ? 'Open'
    : 'Single';
  const tagClass = tag === 'Screener' ? 'screen' : tag === 'Open' ? 'open' : '';
  const isOpen = r === 'open_text_verbatims';

  let viz: JSX.Element;
  if (r.startsWith('scale_')) viz = <Histogram data={data} />;
  else if (r === 'screener' || q.isScreening) viz = <QualifiedBase q={q} screening={screening} />;
  else if (r === 'multi_select' || r === 'attribute_battery') viz = data.shape === 'matrix' ? <MatrixBars data={data} /> : <RankedBars data={data} />;
  else if (isOpen) viz = <Themes data={data} />;
  else viz = <Donut data={data} />;

  // data table (toggle target)
  const tableRows: Array<[string, string]> = [];
  if (r.startsWith('scale_')) {
    const dist = data.distribution || {};
    Object.keys(dist).map(Number).sort((a, b) => a - b).forEach((k) => tableRows.push([String(k), String(dist[k] || 0)]));
  } else if (isOpen) {
    (Array.isArray(data.themes) ? data.themes : []).forEach((t: CanonicalTheme) => tableRows.push([t.label, `${t.count} · ${t.sentiment}`]));
  } else {
    const dist = data.distribution || {};
    const base = data.n_respondents || Object.values(dist).reduce((s: number, v) => s + (v as number), 0);
    Object.entries(dist).sort((a, b) => (b[1] as number) - (a[1] as number)).forEach(([o, v]) => tableRows.push([o, `${v} · ${pct(v as number, base as number)}%`]));
  }

  return (
    <div className={`q rv${lowN ? ' lown' : ''}`}>
      <div className="q-head">
        <span className={`q-tag ${tagClass}`}>{tag}</span>
        <div style={{ minWidth: 0 }}>
          <div className="q-title">{q.text}</div>
          <div className="q-sub">{q.renderer_label}{n != null ? ` · n=${n}` : ''}</div>
        </div>
        <div className="q-toggle">
          <button className={view === 'chart' ? 'on' : ''} onClick={() => setView('chart')}>{isOpen ? 'Themes' : 'Chart'}</button>
          <button className={view === 'table' ? 'on' : ''} onClick={() => setView('table')}>{isOpen ? 'Verbatims' : 'Data'}</button>
        </div>
      </div>
      {q.insight && (
        <div className="insight"><span className="spark">✦</span><span className="ir"><span className="il">VETT read</span>{q.insight}</span></div>
      )}
      {view === 'chart'
        ? <div className="q-viz">{viz}</div>
        : (
          <table className="dtable">
            <thead><tr><th>{isOpen ? 'Theme' : 'Response'}</th><th>{isOpen ? 'Count · sentiment' : 'Count · share'}</th></tr></thead>
            <tbody>{tableRows.map(([a, b], i) => <tr key={i}><td>{a}</td><td className="num">{b}</td></tr>)}</tbody>
          </table>
        )}
      {lowN && <div className="q-foot">⚠ n={n} — directional; read ranking and consensus, not point magnitudes.</div>}
    </div>
  );
}

/* ── segment explorer (recomputes server-side, low-n gated) ── */
function SegmentExplorer({ missionId, baseReport }: { missionId: string; baseReport: CanonicalReport }) {
  const segments = baseReport.segments || [];
  const [seg, setSeg] = useState('all');
  const [active, setActive] = useState<CanonicalReport | null>(null);
  const [loading, setLoading] = useState(false);
  if (!segments.length) return null;

  const onChange = async (key: string) => {
    setSeg(key);
    if (key === 'all') { setActive(null); return; }
    setLoading(true);
    try {
      const res = await api.get(`/api/results/${missionId}/report?segment=${encodeURIComponent(key)}`);
      setActive(res.report || null);
    } catch { setActive(null); } finally { setLoading(false); }
  };

  const shown = active || baseReport;
  const n = active?.active_segment?.n ?? baseReport.header.sample.n;
  const lowN = (n ?? 0) < 3;
  const topKpi = (shown.key_findings || [])[0] as any;

  return (
    <>
      <div className="sec-h rv"><span className="n serif">02</span><h2>Explore by segment</h2><span className="meta mono">recomputes live · web only</span></div>
      <div className="segbar rv">
        <span className="lbl">Segment</span>
        <select value={seg} onChange={(e) => onChange(e.target.value)}>
          <option value="all">All respondents · n={baseReport.header.sample.n}</option>
          {segments.map((s) => <option key={s.key} value={s.key}>{s.label} · n={s.n}</option>)}
        </select>
        {lowN && seg !== 'all' && <span className="lown-flag">⚠ sub-sample too small — directional only</span>}
        <span className="res">{loading ? 'recomputing…' : <>n <b>{n}</b></>}</span>
      </div>
      <div className="q rv" style={{ borderBottom: 'none' }}>
        <div className="insight"><span className="spark">✦</span><span className="ir"><span className="il">VETT read</span>Pick a segment and every figure recomputes from the actual responses. When a slice gets too small to trust, VETT <span className="hl">flags it rather than faking a number</span>.</span></div>
        {topKpi && <div className="q-foot" style={{ fontSize: 13, color: 'var(--text)' }}>{topKpi.label}: <b style={{ color: 'var(--lime)' }}>{lowN && seg !== 'all' ? '—' : topKpi.value}</b></div>}
      </div>
    </>
  );
}

/* ── main ── */
export function PremiumResults({ missionId }: { missionId: string }) {
  const [report, setReport] = useState<CanonicalReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { const res = await api.get(`/api/results/${missionId}/report`); if (!cancelled) setReport(res.report || null); }
      catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load report'); }
    })();
    return () => { cancelled = true; };
  }, [missionId]);

  // Ported mockup draw/count-up/reveal — runs after the report renders.
  useEffect(() => {
    if (!report || !rootRef.current) return;
    const root = rootRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const countUp = (el: HTMLElement) => {
      const target = parseFloat(el.dataset.count || '0'), dec = parseInt(el.dataset.dec || '0'), suf = el.dataset.suf || '';
      if (reduce) { el.textContent = target.toFixed(dec) + suf; return; }
      let t0: number | null = null;
      const step = (t: number) => { if (!t0) t0 = t; const p = Math.min((t - t0) / 1100, 1); const e = 1 - Math.pow(1 - p, 3); el.textContent = (target * e).toFixed(dec) + suf; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const draw = (scope: Element) => {
      scope.querySelectorAll<HTMLElement>('.bar-fill[data-w],.theme-fill[data-w],.conf .fill[data-w]').forEach((b) => { b.style.width = b.dataset.w || '0'; });
      scope.querySelectorAll<HTMLElement>('.hist .colbar[data-h]').forEach((c) => { c.style.height = c.dataset.h || '0'; });
      scope.querySelectorAll<HTMLElement>('.num[data-count]').forEach(countUp);
    };
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('vis'); draw(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    root.querySelectorAll('.rv').forEach((el) => io.observe(el));
    // hero visible immediately
    root.querySelectorAll('.hero .rv,.metrics,.synth').forEach((el) => { el.classList.add('vis'); draw(el); });
    return () => io.disconnect();
  }, [report]);

  const downloadExport = async (format: 'pdf' | 'pptx' | 'xlsx') => {
    setBusy(format);
    const id = toast.loading(`Generating ${format.toUpperCase()}…`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const res = await fetch(`${API_URL}/api/results/${missionId}/export/${format}`, { headers });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${(report?.header.title || 'vett-report').replace(/[^a-z0-9]+/gi, '-').slice(0, 50)}.${format}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} downloaded`, { id });
    } catch { toast.error(`${format.toUpperCase()} failed — try again`, { id }); } finally { setBusy(null); }
  };

  if (error) return <div className="premium" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}><p style={{ color: 'var(--muted)' }}>{error}</p></div>;
  if (!report) {
    // calm outcome language — never "AI is thinking" (§4)
    return <div className="premium" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}><p className="mono">Building your report…</p></div>;
  }

  const h = report.header;
  const sample = h.sample;
  const kpis = (report.key_findings || []).slice(0, 3) as Array<{ label: string; value: string }>;
  const recs = report.recommendations || [];
  const personas = report.personas || [];
  const eyebrow = [h.methodology_label, sample.n != null ? `n=${sample.n} ${sample.posture === 'directional' ? 'qualified' : ''}`.trim() : null].filter(Boolean).join(' · ');
  const confPct = sample.posture === 'directional' ? 55 : 85;

  return (
    <div className="premium" ref={rootRef}>
      <div className="topbar">
        {/* D8 — a clear back affordance on the results page (every non-CA type
            routes through this shell; the CA page has its own). Mirrors the CA
            page: ArrowLeft + label → the missions list at /dashboard. */}
        <button className="btn" onClick={() => navigate('/dashboard')} aria-label="Back to dashboard"><ArrowLeft /> Dashboard</button>
        <div className="logo"><span className="mark"><svg viewBox="0 0 24 24"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#0B0C15" /></svg></span>VETT</div>
        <div className="spacer" />
        <div className="exports">
          {(['pdf', 'pptx', 'xlsx'] as const).map((f) => (
            <button key={f} className="btn" disabled={busy === f} onClick={() => downloadExport(f)}>{f.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="wrap">
        <div className="grid">
          <div className="main">
            {/* HERO */}
            <div className="hero">
              <div className="eyebrow mono rv">{eyebrow}</div>
              <h1 className="finding rv">{report.finding || h.title}</h1>
              {h.brief && <div className="lede rv">{h.brief}</div>}
            </div>

            {/* HERO METRICS */}
            {kpis.length > 0 && (
              <div className="metrics rv">
                {kpis.map((k, i) => {
                  const pm = parseMetric(k.value);
                  return (
                    <div className="metric" key={i}>
                      {pm
                        ? <div className={`mv num${i === 0 ? ' lime' : ''}`} data-count={String(pm.target)} data-dec={String(pm.dec)} data-suf={pm.suf}>{pm.dec ? '0.0' : '0'}{pm.suf}</div>
                        : <div className={`mv${i === 0 ? ' lime' : ''}`}>{k.value}</div>}
                      <div className="mu"><span className="k">{k.label}</span></div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SYNTHESIS */}
            {(report.synthesis || report.exec_summary) && (
              <div className="synth rv">
                <div className="cap mono">VETT synthesis</div>
                <p>{report.synthesis || report.exec_summary}</p>
              </div>
            )}

            {/* SIGNATURE HERO (per-type centerpiece — methodology's signature read) */}
            <Centerpiece report={report} />

            {/* 01 QUESTIONS */}
            {report.survey.length > 0 && (
              <>
                <div className="sec-h rv"><span className="n serif">01</span><h2>Question by question</h2><span className="meta mono">{report.survey.length} questions · all visual</span></div>
                {report.survey.map((q) => <QuestionCard key={q.id} q={q} screening={report.screening} />)}
              </>
            )}

            {/* 02 SEGMENTS */}
            <SegmentExplorer missionId={missionId} baseReport={report} />

            {/* 03 PERSONAS */}
            {personas.length > 0 && (
              <>
                <div className="sec-h rv"><span className="n serif">03</span><h2>Who responded</h2><span className="meta mono">{personas.length} personas · n-gated</span></div>
                <div className="personas rv">
                  {personas.map((p, i) => (
                    <div className="persona" key={i}>
                      <div className="av" />
                      <h4>{p.name}</h4>
                      {p.role && <div className="role">{p.role}</div>}
                      {p.description && <p>{p.description}</p>}
                      {p.share != null && <div className="share">{p.share}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 04 RECS */}
            {recs.length > 0 && (
              <>
                <div className="sec-h rv"><span className="n serif">04</span><h2>What to do with this</h2><span className="meta mono">{recs.length} recommendations</span></div>
                <div className="recs rv">
                  {recs.map((r, i) => {
                    const [head, ...rest] = r.split(/[:—–]\s*/);
                    const body = rest.join(' — ');
                    return <div className="rec" key={i}><span className="ix serif">{i + 1}</span><div><h4>{body ? head : r}</h4>{body && <p>{body}</p>}</div></div>;
                  })}
                </div>
              </>
            )}

            {/* METHODOLOGY */}
            <div className="method rv">
              <div className="lead">Methodology &amp; honesty</div>
              {report.methodology_disclaimer}
              <div className="g3">
                <div><b>Sample</b><br />n = {sample.n ?? '—'} {sample.qualified != null ? `qualified` : ''}</div>
                <div><b>Confidence</b><br />{sample.posture === 'directional' ? 'Directional — read ranking and consensus as signal; treat point magnitudes as indicative.' : 'Indicative.'}</div>
                <div><b>Completed</b><br />{sample.completed_at ? new Date(sample.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
              </div>
            </div>
          </div>

          {/* RAIL */}
          <div className="rail">
            <div className="r-card rv">
              <h3>At a glance</h3>
              <div className="glance">
                <div className="row"><span className="k">Respondents</span><span className="v">n = {sample.n ?? '—'}</span></div>
                {sample.qualified != null && <div className="row"><span className="k">Qualified</span><span className="v">{sample.qualified}</span></div>}
                <div className="row"><span className="k">Questions</span><span className="v">{report.survey.length} · all visual</span></div>
                <div className="row"><span className="k">Methodology</span><span className="v">{h.methodology_label}</span></div>
              </div>
              <div className="conf" style={{ marginTop: 16 }}>
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--muted)' }}>Confidence</span><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: sample.posture === 'directional' ? 'var(--amber)' : 'var(--lime)' }}>{(sample.posture || 'indicative').toUpperCase()}</span></div>
                <div className="track"><div className="fill" data-w={`${confPct}%`} /></div>
                <div className="note">{sample.posture === 'directional' ? 'Small base — strong on direction and consensus, indicative on magnitude.' : 'Sufficient base for indicative reading.'}</div>
              </div>
            </div>
            {kpis.length > 0 && (
              <div className="r-card rv">
                <h3>Key metrics</h3>
                <div className="rail-kpi">
                  {kpis.map((k, i) => {
                    const pm = parseMetric(k.value);
                    return <div className="rk" key={i}>{pm ? <span className={`v num ${i === 1 ? 'amber' : 'lime'}`} data-count={String(pm.target)} data-dec={String(pm.dec)} data-suf={pm.suf}>{pm.dec ? '0.0' : '0'}{pm.suf}</span> : <span className={`v ${i === 1 ? 'amber' : 'lime'}`}>{k.value}</span>}<span className="k">{k.label}</span></div>;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumResults;
