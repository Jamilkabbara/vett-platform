/**
 * AdminDeliveryHealth — Pass 19 Task 0
 * Shows delivery metrics for all completed missions: qualified count,
 * total simulated, qualification rate, and delivery_status breakdown.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface DeliveryRow {
  id: string;
  title: string | null;
  respondent_count: number | null;
  qualified_respondent_count: number | null;
  total_simulated_count: number | null;
  qualification_rate: number | null;
  delivery_status: string | null;
  completed_at: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  full:                    'bg-green-900/40 text-green-300 border-green-700/50',
  partial:                 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  screener_too_restrictive:'bg-red-900/40 text-red-300 border-red-700/50',
};

const STATUS_LABEL: Record<string, string> = {
  full:                    'Full',
  partial:                 'Partial',
  screener_too_restrictive:'Screener ⚠',
};

export function AdminDeliveryHealth({ apiFetch: _apiFetch }: { apiFetch: (path: string, opts?: RequestInit) => Promise<Response> }) {
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('missions')
          .select('id, title, respondent_count, qualified_respondent_count, total_simulated_count, qualification_rate, delivery_status, completed_at')
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(200);

        if (error) throw error;
        setRows(data || []);
      } catch (e: any) {
        setErr(e.message || 'Failed to load delivery data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Summary stats
  const total        = rows.length;
  const fullCount    = rows.filter(r => r.delivery_status === 'full').length;
  const partialCount = rows.filter(r => r.delivery_status === 'partial').length;
  const tooStrict    = rows.filter(r => r.delivery_status === 'screener_too_restrictive').length;
  const avgQualRate  = rows.filter(r => r.qualification_rate != null).length > 0
    ? rows.reduce((s, r) => s + (r.qualification_rate ?? 0), 0) / rows.filter(r => r.qualification_rate != null).length
    : null;

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Loading delivery data…</div>
  );

  if (err) return (
    <div className="text-red-400 text-sm p-6">{err}</div>
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-black text-white tracking-tight">Delivery Health</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Completed missions',   value: total,                             color: 'text-white' },
          { label: 'Full delivery',        value: `${fullCount} (${total ? Math.round(fullCount/total*100) : 0}%)`, color: 'text-green-400' },
          { label: 'Partial delivery',     value: partialCount,                      color: 'text-amber-400' },
          { label: 'Screener too strict',  value: tooStrict,                         color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {avgQualRate != null && (
        <p className="text-sm text-gray-400">
          Average qualification rate across screener missions:{' '}
          <span className="font-semibold text-white">{Math.round(avgQualRate * 100)}%</span>
        </p>
      )}

      {/* Mission table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-900/80 text-gray-400 text-[11px] uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3">Mission</th>
              <th className="px-4 py-3 text-right">Ordered</th>
              <th className="px-4 py-3 text-right">Qualified</th>
              <th className="px-4 py-3 text-right">Simulated</th>
              <th className="px-4 py-3 text-right">Qual rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-white font-medium max-w-xs truncate">
                  {r.title || r.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-gray-300 text-right">{r.respondent_count ?? '—'}</td>
                <td className="px-4 py-3 text-gray-300 text-right">
                  {r.qualified_respondent_count != null ? r.qualified_respondent_count : '—'}
                </td>
                <td className="px-4 py-3 text-gray-300 text-right">
                  {r.total_simulated_count != null ? r.total_simulated_count : '—'}
                </td>
                <td className="px-4 py-3 text-gray-300 text-right">
                  {r.qualification_rate != null ? `${Math.round(r.qualification_rate * 100)}%` : '—'}
                </td>
                <td className="px-4 py-3">
                  {r.delivery_status ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLES[r.delivery_status] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {STATUS_LABEL[r.delivery_status] || r.delivery_status}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-600 text-sm">
                  No completed missions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
