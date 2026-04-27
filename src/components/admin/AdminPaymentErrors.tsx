/**
 * Pass 22 Bug 22.9 — Admin viewer for the payment_errors table.
 *
 * Surfaces the most recent Stripe failures across both backend (create-intent
 * / confirm / webhook payment_intent.payment_failed) and frontend
 * (confirmCardPayment catch / wallet PaymentRequest catch / OverageModal /
 * Element-not-ready guards) origins. Each row carries enough context to open
 * Stripe Dashboard with the PI id, group by stage/error_code, and segment
 * by viewport width.
 *
 * Backend route: GET /api/admin/payment-errors
 *   Query params: limit, stage, missionId, errorCode, since, until
 *   Response: { rows[], count, window: {since,until}, summary: {byStage, byErrorCode} }
 */

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, ExternalLink, AlertTriangle, Loader2, Filter, X } from 'lucide-react';

interface PaymentErrorRow {
  id: string;
  user_id: string | null;
  mission_id: string | null;
  stripe_payment_intent_id: string | null;
  error_code: string | null;
  error_message: string | null;
  decline_code: string | null;
  payment_method: string | null;
  amount_cents: number | null;
  currency: string | null;
  stage_at_failure: string | null;
  user_agent: string | null;
  browser: string | null;
  os: string | null;
  viewport_width: number | null;
  created_at: string;
}

interface PaymentErrorsPayload {
  rows: PaymentErrorRow[];
  count: number;
  window: { since: string; until: string };
  summary: { byStage: Record<string, number>; byErrorCode: Record<string, number> };
}

const STAGE_LABEL: Record<string, string> = {
  create_intent:                 'Backend · /create-intent',
  confirm:                       'Backend · /confirm',
  webhook_payment_failed:        'Backend · webhook payment_failed',
  client_confirm_card:           'Client · card confirm',
  client_wallet_payment_method:  'Client · wallet (Apple/Google Pay)',
  client_chat_overage:           'Client · chat overage',
  client_element_not_ready:      'Client · Element not ready',
  client_unknown:                'Client · unknown',
};

const STAGE_COLOR: Record<string, string> = {
  create_intent:                 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  confirm:                       'bg-blue-500/15 text-blue-300 border-blue-500/30',
  webhook_payment_failed:        'bg-purple-500/15 text-purple-300 border-purple-500/30',
  client_confirm_card:           'bg-amber-500/15 text-amber-300 border-amber-500/30',
  client_wallet_payment_method:  'bg-amber-500/15 text-amber-300 border-amber-500/30',
  client_chat_overage:           'bg-pink-500/15 text-pink-300 border-pink-500/30',
  client_element_not_ready:      'bg-red-500/15 text-red-300 border-red-500/30',
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function fmtUsd(cents: number | null) {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

function deviceClass(viewportWidth: number | null) {
  if (viewportWidth == null) return '—';
  if (viewportWidth < 480) return `📱 ${viewportWidth}px`;
  if (viewportWidth < 1024) return `🟦 ${viewportWidth}px`;
  return `🖥️ ${viewportWidth}px`;
}

export const AdminPaymentErrors = ({
  apiFetch,
}: {
  apiFetch: (path: string, opts?: RequestInit) => Promise<Response>;
}) => {
  const [data, setData]       = useState<PaymentErrorsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter]         = useState('');
  const [errorCodeFilter, setErrorCodeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (stageFilter)     params.set('stage',     stageFilter);
      if (errorCodeFilter) params.set('errorCode', errorCodeFilter);
      const res = await apiFetch(`/api/admin/payment-errors?${params}`);
      const payload = (await res.json()) as PaymentErrorsPayload;
      setData(payload);
    } catch (e) {
      console.error('AdminPaymentErrors load failed', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, stageFilter, errorCodeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-white text-xl font-black flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Payment Errors
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Last 100 Stripe failures across backend &amp; frontend origins.
            Window: {data ? `${fmtTime(data.window.since)} → ${fmtTime(data.window.until)}` : '…'}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition-colors"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#0d0e1a] border border-gray-800 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">By stage</p>
            <div className="space-y-1.5">
              {Object.entries(data.summary.byStage)
                .sort((a, b) => b[1] - a[1])
                .map(([stage, n]) => (
                  <button
                    key={stage}
                    onClick={() => setStageFilter(stage === stageFilter ? '' : stage)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      stage === stageFilter ? 'bg-primary/15' : 'hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-gray-400">{STAGE_LABEL[stage] ?? stage}</span>
                    <span className="text-white font-bold">{n}</span>
                  </button>
                ))}
              {Object.keys(data.summary.byStage).length === 0 && (
                <p className="text-gray-600 text-xs">No errors in window.</p>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-[#0d0e1a] border border-gray-800 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">By error code</p>
            <div className="space-y-1.5">
              {Object.entries(data.summary.byErrorCode)
                .sort((a, b) => b[1] - a[1])
                .map(([code, n]) => (
                  <button
                    key={code}
                    onClick={() => setErrorCodeFilter(code === errorCodeFilter ? '' : code)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      code === errorCodeFilter ? 'bg-primary/15' : 'hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-gray-400 font-mono">{code}</span>
                    <span className="text-white font-bold">{n}</span>
                  </button>
                ))}
              {Object.keys(data.summary.byErrorCode).length === 0 && (
                <p className="text-gray-600 text-xs">No errors in window.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active filters */}
      {(stageFilter || errorCodeFilter) && (
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-gray-500">Filtering:</span>
          {stageFilter && (
            <button
              onClick={() => setStageFilter('')}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 text-primary"
            >
              {STAGE_LABEL[stageFilter] ?? stageFilter}
              <X className="w-3 h-3" />
            </button>
          )}
          {errorCodeFilter && (
            <button
              onClick={() => setErrorCodeFilter('')}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 text-primary"
            >
              {errorCodeFilter}
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Rows */}
      <div className="rounded-xl bg-[#0d0e1a] border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-900/50 border-b border-gray-800">
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-500">
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">Stage</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Message</th>
                <th className="px-4 py-2.5">Method</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">Device</th>
                <th className="px-4 py-2.5">Mission</th>
                <th className="px-4 py-2.5">PI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && data && data.rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    No payment errors in this window. 🎉
                  </td>
                </tr>
              )}
              {!loading && data?.rows.map((r) => {
                const stage = r.stage_at_failure ?? 'unknown';
                const stageColor = STAGE_COLOR[stage] ?? 'bg-gray-700 text-gray-400 border-gray-600';
                return (
                  <tr key={r.id} className="text-gray-300 hover:bg-gray-900/30">
                    <td className="px-4 py-2.5 whitespace-nowrap">{fmtTime(r.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${stageColor}`}>
                        {STAGE_LABEL[stage] ?? stage}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px]">{r.error_code ?? '—'}</td>
                    <td className="px-4 py-2.5 max-w-[280px] truncate" title={r.error_message ?? ''}>
                      {r.error_message ?? '—'}
                      {r.decline_code && (
                        <span className="ml-1 text-amber-400 text-[10px]">({r.decline_code})</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[11px]">{r.payment_method ?? '—'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{fmtUsd(r.amount_cents)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-[11px]">{deviceClass(r.viewport_width)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[10px]">
                      {r.mission_id ? r.mission_id.slice(0, 8) : '—'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {r.stripe_payment_intent_id ? (
                        <a
                          href={`https://dashboard.stripe.com/payments/${r.stripe_payment_intent_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:text-primary-hover"
                        >
                          <span className="font-mono text-[10px]">{r.stripe_payment_intent_id.slice(0, 14)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentErrors;
