import { useState, useEffect } from 'react';
import { FileText, Download, DollarSign, Target, TrendingUp } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { useUserProfile } from '../../hooks/useUserProfile';
import { generateInvoicePdf } from '../../lib/generateInvoicePdf';
import toast from 'react-hot-toast';

interface Invoice {
  invoiceId: string;
  missionId: string;
  missionStatement: string;
  amount: number;
  date: string;
  status: string;
  respondentCount: number;
  // Optional cost breakdown (returned by newer backend versions)
  base_cost_usd?: number;
  targeting_surcharge_usd?: number;
  extra_questions_cost_usd?: number;
  discount_usd?: number;
  promo_code?: string | null;
  goal_type?: string;
}

export const BillingInvoicesTab = () => {
  const [invoices, setInvoices]       = useState<Invoice[]>([]);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { profile } = useUserProfile();

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/api/profile/invoices');
        setInvoices(Array.isArray(data) ? data : []);
      } catch {
        // fail silently — show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDownload = (inv: Invoice) => {
    if (downloading) return;
    setDownloading(inv.invoiceId);

    try {
      // Build the InvoiceMission shape from what's available.
      // base_cost_usd falls back to total amount when the backend doesn't
      // return a breakdown (older missions), which keeps the line-item correct.
      const total = inv.amount || 0;
      const baseCost = inv.base_cost_usd ?? total;
      const targetingSurcharge = inv.targeting_surcharge_usd ?? 0;
      const extraQuestions = inv.extra_questions_cost_usd ?? 0;
      const discount = inv.discount_usd ?? 0;

      generateInvoicePdf(
        {
          id: inv.missionId,
          title: inv.missionStatement || 'Market Research Mission',
          total_price_usd: total,
          base_cost_usd: baseCost,
          targeting_surcharge_usd: targetingSurcharge,
          extra_questions_cost_usd: extraQuestions,
          discount_usd: discount,
          promo_code: inv.promo_code ?? null,
          respondent_count: inv.respondentCount || 0,
          paid_at: inv.date,
          goal_type: inv.goal_type || 'research',
        },
        {
          displayName: profile?.displayName || '',
          email: profile?.email || '',
          companyName: profile?.companyName ?? null,
        },
      );
    } catch (err) {
      console.error('[invoice-pdf]', err);
      toast.error('Could not generate PDF — please try again');
    } finally {
      setDownloading(null);
    }
  };

  const totalSpent   = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const missionCount = invoices.length;
  const avgOrder     = missionCount > 0 ? totalSpent / missionCount : 0;

  const kpis = [
    { icon: DollarSign, label: 'Total Spent',     value: `$${totalSpent.toFixed(2)}`,  color: 'from-primary/20 to-primary/5',       iconColor: 'text-primary'    },
    { icon: Target,     label: 'Missions Run',    value: missionCount.toString(),       color: 'from-blue-500/20 to-blue-500/5',     iconColor: 'text-blue-400'   },
    { icon: TrendingUp, label: 'Avg Per Mission', value: `$${avgOrder.toFixed(2)}`,    color: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`bg-gradient-to-br ${k.color} border border-gray-800 rounded-2xl p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <k.icon className={`w-5 h-5 ${k.iconColor}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{k.label}</span>
            </div>
            <p className="text-2xl font-black text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No invoices yet</p>
          <p className="text-sm mt-1">Launch your first mission to see billing history here.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full">
              <thead className="bg-gray-900/60">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Date</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Mission</th>
                  <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Amount</th>
                  <th className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {invoices.map(inv => (
                  <tr key={inv.invoiceId} className="hover:bg-gray-900/40 transition-colors">
                    <td className="px-6 py-5 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-white">{inv.invoiceId}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{inv.missionStatement || 'Research mission'}</p>
                    </td>
                    <td className="px-6 py-5 text-right text-base font-bold text-white whitespace-nowrap">
                      ${(inv.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                        Paid
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => handleDownload(inv)}
                        disabled={downloading === inv.invoiceId}
                        className="p-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-all disabled:opacity-50"
                        title="Download PDF"
                      >
                        <Download className={`w-4.5 h-4.5 ${downloading === inv.invoiceId ? 'animate-bounce' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-4">
            {invoices.map(inv => (
              <div key={inv.invoiceId} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-bold text-white">{inv.invoiceId}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{inv.missionStatement || 'Research mission'}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 flex-shrink-0">
                    Paid
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-xl font-black text-white mt-1">${(inv.amount || 0).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(inv)}
                    disabled={downloading === inv.invoiceId}
                    className="p-3 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-xl transition-all disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
