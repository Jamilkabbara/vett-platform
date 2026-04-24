/**
 * AdminPaymentErrors — Pass 19 Task 4
 * Surfaces payment failure telemetry from the `payment_errors` table.
 * Shows a summary of error codes, decline codes, and device distribution,
 * plus a paginated table of recent errors.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface PaymentErrorRow {
  id: string;
  user_id: string | null;
  mission_id: string | null;
  error_code: string | null;
  error_message: string | null;
  decline_code: string | null;
  payment_method: string | null;
  amount_cents: number | null;
  currency: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
}

function tally<T extends string | null>(rows: PaymentErrorRow[], key: keyof PaymentErrorRow): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const v = String(r[key] ?? 'unknown');
    counts[v] = (counts[v] || 0) + 1;
  }
  return counts;
}

function TopList({ label, data }: { label: string; data: Record<string, number> }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!sorted.length) return null;
  const max = sorted[0][1] || 1;
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">{label}</p>
      <div className="space-y-2">
        {sorted.map(([k, v]) => (
          <div key={k} className="flex items-center gap-3">
            <span className="text-xs text-gray-300 w-32 truncate flex-shrink-0">{k}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(v / max) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPaymentErrors({ apiFetch: _apiFetch }: { apiFetch: (path: string, opts?: RequestInit) => Promise<Response> }) {
  const [rows, setRows]       = useState<PaymentErrorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState<string | null>(null);
  const [page, setPage]       = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('payment_errors')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);
        if (error) throw error;
        setRows(data || []);
      } catch (e: any) {
        setErr(e.message || 'Failed to load payment errors');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Loading payment errors…</div>
  );
  if (err) return <div className="text-red-400 text-sm p-6">{err}</div>;

  const total7d = rows.filter(r => new Date(r.created_at) > new Date(Date.now() - 7 * 86400e3)).length;
  const errorCodes   = tally(rows, 'error_code');
  const declineCodes = tally(rows, 'decline_code');
  const methods      = tally(rows, 'payment_method');
  const browsers     = tally(rows, 'browser');

  const paged = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white tracking-tight">Payment Errors</h2>
        <span className="text-sm text-gray-500">{rows.length} total · {total7d} last 7 days</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-600 text-sm">No payment errors recorded yet.</div>
      ) : (
        <>
          {/* Summary charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <TopList label="Error codes"   data={errorCodes} />
            <TopList label="Decline codes" data={declineCodes} />
            <TopList label="Payment method" data={methods} />
            <TopList label="Browser"        data={browsers} />
          </div>

          {/* Recent errors table */}
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-900/80 text-gray-400 text-[11px] uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Decline</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 max-w-xs">Message</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Browser/OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {paged.map(r => (
                  <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-red-400 text-xs font-mono">
                      {r.error_code || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-amber-400 text-xs font-mono">
                      {r.decline_code || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-300 text-xs capitalize">
                      {r.payment_method?.replace('_', ' ') || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs max-w-xs truncate">
                      {r.error_message || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-300 text-xs text-right whitespace-nowrap">
                      {r.amount_cents != null
                        ? `${(r.amount_cents / 100).toFixed(2)} ${(r.currency || 'USD').toUpperCase()}`
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      {[r.browser, r.os].filter(Boolean).join(' / ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
