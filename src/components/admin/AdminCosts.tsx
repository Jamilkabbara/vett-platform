import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle, AlertCircle, Info, RefreshCw, Pencil, Plus, Loader2,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

interface MonthAgg {
  revenue_usd: number;
  cost_usd: number;
  net_contribution_usd: number;
  gross_margin_pct: number;
  paid_missions: number;
}
interface Vendor {
  id: string;
  vendor: string;
  display_name: string;
  category: string;
  cost_usd: number;
  cost_unit: string;
  notes: string | null;
}
interface VendorRow {
  vendor: string;
  display_name: string;
  monthly_usd: number;
  notes: string | null;
}
interface PerGoal {
  goal_type: string;
  paid_missions: number;
  revenue_usd: number;
  avg_revenue_per_mission: number;
  has_revenue_gap: boolean;
}
interface Warning {
  severity: 'critical' | 'warning' | 'info';
  code: string;
  title: string;
  description: string;
  affected_count: number;
  suggested_action: string;
}
interface Dashboard {
  generated_at: string;
  this_month: MonthAgg;
  last_month: MonthAgg | null;
  fixed_costs: VendorRow[];
  variable_costs: {
    anthropic: { last_30d_usd: number; by_model: Array<{ model: string; calls: number; cost_usd: number }>; failed_calls: number };
    stripe: { estimated_30d_usd: number; formula: string };
  };
  per_goal_type: PerGoal[];
  integrity_warnings: Warning[];
  capacity: {
    supabase_db_size_mb: number;
    supabase_db_size_pct_of_free_tier: number;
    resend_sends_this_month: number | null;
    railway_credits_remaining_usd: number | null;
  };
}

function fmt(n: number) { return `$${n.toFixed(2)}`; }
function pct(n: number) { return `${n.toFixed(1)}%`; }

function delta(curr: number, prev: number | null | undefined) {
  if (prev == null || prev === 0) return null;
  return curr - prev;
}

function DeltaBadge({ value, asPct = false }: { value: number | null; asPct?: boolean }) {
  if (value == null) return null;
  const positive = value >= 0;
  const Icon = value === 0 ? Minus : positive ? TrendingUp : TrendingDown;
  const color = value === 0 ? 'text-[var(--t3)]' : positive ? 'text-[var(--lime)]' : 'text-amber-400';
  const text = asPct ? `${positive ? '+' : ''}${value.toFixed(1)}pp` : `${positive ? '+' : ''}${fmt(value)}`;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] ${color}`}>
      <Icon className="w-3 h-3" /> {text}
    </span>
  );
}

export function AdminCosts() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const [dRes, vRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/costs/dashboard`, { headers }),
        fetch(`${API_URL}/api/admin/costs/vendors`, { headers }),
      ]);
      if (!dRes.ok) throw new Error(`dashboard: ${dRes.status}`);
      if (!vRes.ok) throw new Error(`vendors: ${vRes.status}`);
      setData(await dRes.json());
      setVendors((await vRes.json()).vendors || []);
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to load');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading && !data) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-[var(--lime)] animate-spin" />
    </div>
  );
  if (error) return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300 flex items-center justify-between">
      <span>Error: {error}</span>
      <button onClick={fetchAll} className="text-xs text-red-200 hover:underline">Retry</button>
    </div>
  );
  if (!data) return null;

  const tm = data.this_month, lm = data.last_month;

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-display font-black text-[var(--t1)]">Costs &amp; Economics</h2>
          <p className="text-xs text-[var(--t3)] mt-1">
            Monthly burn, revenue, and per-mission contribution. Updated {new Date(data.generated_at).toLocaleString()}.
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 text-xs text-[var(--t2)] hover:text-[var(--lime)]"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </header>

      {data.integrity_warnings.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-4 space-y-3">
          {data.integrity_warnings.map(w => {
            const Icon = w.severity === 'critical' ? AlertTriangle : w.severity === 'warning' ? AlertCircle : Info;
            const color = w.severity === 'critical' ? 'text-red-300' : w.severity === 'warning' ? 'text-amber-300' : 'text-[var(--t2)]';
            return (
              <div key={w.code} className="flex gap-3">
                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color}`} />
                <div className="text-xs flex-1">
                  <div className={`font-semibold ${color}`}>{w.title} <span className="opacity-70">· {w.affected_count} affected</span></div>
                  <p className="text-[var(--t2)] mt-1">{w.description}</p>
                  <p className="text-[var(--t3)] mt-1 italic">{w.suggested_action}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Revenue (this month)" value={fmt(tm.revenue_usd)} delta={delta(tm.revenue_usd, lm?.revenue_usd)} />
        <KpiCard label="Cost (this month)"    value={fmt(tm.cost_usd)}    delta={delta(tm.cost_usd, lm?.cost_usd)} invertDeltaColors />
        <KpiCard label="Net contribution"      value={fmt(tm.net_contribution_usd)} delta={delta(tm.net_contribution_usd, lm?.net_contribution_usd)} />
        <KpiCard label="Gross margin"          value={pct(tm.gross_margin_pct)} delta={delta(tm.gross_margin_pct, lm?.gross_margin_pct)} asPct />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-5">
          <header className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--t1)]">Fixed monthly costs</h3>
            <button
              onClick={() => setAdding(true)}
              className="text-xs text-[var(--lime)] hover:opacity-80 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add vendor
            </button>
          </header>
          <table className="w-full text-xs">
            <tbody>
              {data.fixed_costs.map(f => {
                const v = vendors.find(x => x.vendor === f.vendor);
                return (
                  <tr key={f.vendor} className="border-b border-[var(--b1)]/40">
                    <td className="py-2 text-[var(--t1)]">{f.display_name}</td>
                    <td className="py-2 text-right text-[var(--t2)] tabular-nums">{fmt(f.monthly_usd)}/mo</td>
                    <td className="py-2 pl-3 w-8 text-right">
                      {v && (
                        <button onClick={() => setEditing(v)} className="text-[var(--t3)] hover:text-[var(--lime)]" aria-label="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="font-semibold">
                <td className="py-3 text-[var(--t1)]">Total</td>
                <td className="py-3 text-right text-[var(--lime)] tabular-nums">
                  {fmt(data.fixed_costs.reduce((s, f) => s + f.monthly_usd, 0))}/mo
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </section>

        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--t1)]">Variable costs (last 30d)</h3>
          <div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--t2)]">Anthropic API</span>
              <span className="text-[var(--lime)] tabular-nums">{fmt(data.variable_costs.anthropic.last_30d_usd)}</span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-[var(--t3)]">
              {data.variable_costs.anthropic.by_model.map(m => (
                <div key={m.model} className="flex justify-between">
                  <span>{m.model}</span>
                  <span className="tabular-nums">{m.calls} calls · {fmt(m.cost_usd)}</span>
                </div>
              ))}
              {data.variable_costs.anthropic.failed_calls > 0 && (
                <div className="text-amber-400">{data.variable_costs.anthropic.failed_calls} failed call(s) — see ai_calls.error_message</div>
              )}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--t2)]">Stripe processing (est.)</span>
              <span className="text-[var(--lime)] tabular-nums">{fmt(data.variable_costs.stripe.estimated_30d_usd)}</span>
            </div>
            <p className="text-[11px] text-[var(--t3)] mt-1">{data.variable_costs.stripe.formula}</p>
          </div>
        </section>
      </div>

      <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[var(--t1)] mb-3">Per-mission economics by goal type</h3>
        <table className="w-full text-xs">
          <thead className="text-[var(--t3)]">
            <tr className="border-b border-[var(--b1)]">
              <th className="text-left py-2 font-medium">Goal type</th>
              <th className="text-right py-2 font-medium">Paid</th>
              <th className="text-right py-2 font-medium">Revenue</th>
              <th className="text-right py-2 font-medium">Avg revenue/mission</th>
            </tr>
          </thead>
          <tbody>
            {data.per_goal_type.map(g => (
              <tr key={g.goal_type} className="border-b border-[var(--b1)]/40">
                <td className="py-2 text-[var(--t1)]">{g.goal_type}{g.has_revenue_gap && <span className="ml-2 text-amber-400 text-[10px]">⚠ revenue gap</span>}</td>
                <td className="py-2 text-right text-[var(--t2)] tabular-nums">{g.paid_missions}</td>
                <td className="py-2 text-right text-[var(--lime)] tabular-nums">{fmt(g.revenue_usd)}</td>
                <td className="py-2 text-right text-[var(--t2)] tabular-nums">{fmt(g.avg_revenue_per_mission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid sm:grid-cols-3 gap-3">
        <CapacityCard
          label="Supabase DB"
          value={`${data.capacity.supabase_db_size_mb} MB`}
          subtext={`${data.capacity.supabase_db_size_pct_of_free_tier}% of 500 MB free tier`}
          progressPct={data.capacity.supabase_db_size_pct_of_free_tier}
        />
        <CapacityCard
          label="Resend (this month)"
          value={data.capacity.resend_sends_this_month != null ? String(data.capacity.resend_sends_this_month) : '—'}
          subtext="3,000 free / mo"
        />
        <CapacityCard
          label="Railway credits"
          value={data.capacity.railway_credits_remaining_usd != null ? fmt(data.capacity.railway_credits_remaining_usd) : '—'}
          subtext="$5 monthly credits"
        />
      </div>

      {editing && (
        <EditVendorModal vendor={editing} onClose={() => { setEditing(null); fetchAll(); }} />
      )}
      {adding && (
        <AddVendorModal onClose={() => { setAdding(false); fetchAll(); }} />
      )}
    </div>
  );
}

function KpiCard({ label, value, delta, asPct, invertDeltaColors }: { label: string; value: string; delta: number | null; asPct?: boolean; invertDeltaColors?: boolean }) {
  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-[var(--t3)]">{label}</div>
      <div className="text-2xl font-bold text-[var(--t1)] mt-1 tabular-nums">{value}</div>
      <div className="mt-1">
        <DeltaBadge value={invertDeltaColors && delta != null ? -delta : delta} asPct={asPct} />
      </div>
    </div>
  );
}

function CapacityCard({ label, value, subtext, progressPct }: { label: string; value: string; subtext: string; progressPct?: number }) {
  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-[var(--t3)]">{label}</div>
      <div className="text-xl font-bold text-[var(--t1)] mt-1">{value}</div>
      <div className="text-[11px] text-[var(--t3)] mt-1">{subtext}</div>
      {progressPct != null && (
        <div className="mt-2 h-1.5 bg-[var(--bg3)] rounded">
          <div className="h-full bg-[var(--lime)] rounded" style={{ width: `${Math.min(100, progressPct)}%` }} />
        </div>
      )}
    </div>
  );
}

function EditVendorModal({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const [costUsd, setCostUsd] = useState(String(vendor.cost_usd));
  const [notes, setNotes] = useState(vendor.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (effective_to?: string) => {
    setSaving(true); setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const res = await fetch(`${API_URL}/api/admin/costs/vendors/${vendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cost_usd: Number(costUsd), notes, effective_to }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[var(--t1)] mb-4">Edit {vendor.display_name}</h3>
        <div className="space-y-3 text-xs">
          <label className="block">
            <span className="text-[var(--t3)]">Cost (USD per {vendor.cost_unit})</span>
            <input
              type="number" step="0.01" min="0"
              value={costUsd} onChange={(e) => setCostUsd(e.target.value)}
              className="mt-1 w-full bg-[var(--bg3)] text-[var(--t1)] rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[var(--t3)]">Notes</span>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="mt-1 w-full bg-[var(--bg3)] text-[var(--t1)] rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] outline-none"
            />
          </label>
        </div>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        <div className="mt-5 flex justify-between">
          <button
            onClick={() => save(new Date().toISOString().slice(0, 10))}
            disabled={saving}
            className="text-xs text-amber-400 hover:opacity-80 disabled:opacity-30"
          >
            End this entry (sets effective_to today)
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs px-3 py-1.5 text-[var(--t2)] hover:text-[var(--t1)]">Cancel</button>
            <button
              onClick={() => save()}
              disabled={saving}
              className="text-xs px-3 py-1.5 bg-[var(--lime)] text-black font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddVendorModal({ onClose }: { onClose: () => void }) {
  const [vendor, setVendor] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('fixed_monthly');
  const [costUsd, setCostUsd] = useState('0');
  const [costUnit, setCostUnit] = useState('month');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!vendor || !displayName) { setError('Vendor key + display name required'); return; }
    setSaving(true); setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const res = await fetch(`${API_URL}/api/admin/costs/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          vendor: vendor.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
          display_name: displayName,
          category, cost_usd: Number(costUsd), cost_unit: costUnit, notes,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[var(--t1)] mb-4">Add vendor cost</h3>
        <div className="space-y-3 text-xs">
          <label className="block"><span className="text-[var(--t3)]">Vendor key (snake_case)</span>
            <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. cloudflare" className="mt-1 w-full bg-[var(--bg3)] text-[var(--t1)] rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] outline-none" />
          </label>
          <label className="block"><span className="text-[var(--t3)]">Display name</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full bg-[var(--bg3)] text-[var(--t1)] rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className="text-[var(--t3)]">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full bg-[var(--bg3)] text-[var(--t1)] rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] outline-none">
                <option value="fixed_monthly">fixed_monthly</option>
                <option value="annual">annual</option>
                <option value="per_request">per_request</option>
                <option value="one_time">one_time</option>
              </select>
            </label>
            <label className="block"><span className="text-[var(--t3)]">Cost unit</span>
              <input value={costUnit} onChange={(e) => setCostUnit(e.target.value)} placeholder="month / year / request" className="mt-1 w-full bg-[var(--bg3)] text-[var(--t1)] rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] outline-none" />
            </label>
          </div>
          <label className="block"><span className="text-[var(--t3)]">Cost (USD)</span>
            <input type="number" step="0.01" min="0" value={costUsd} onChange={(e) => setCostUsd(e.target.value)} className="mt-1 w-full bg-[var(--bg3)] text-[var(--t1)] rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] outline-none" />
          </label>
          <label className="block"><span className="text-[var(--t3)]">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full bg-[var(--bg3)] text-[var(--t1)] rounded-lg px-3 py-2 border border-[var(--b1)] focus:border-[var(--lime)] outline-none" />
          </label>
        </div>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-3 py-1.5 text-[var(--t2)] hover:text-[var(--t1)]">Cancel</button>
          <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 bg-[var(--lime)] text-black font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminCosts;
