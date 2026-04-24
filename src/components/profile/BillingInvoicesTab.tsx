import { useState, useEffect } from 'react';
import { FileText, Download, DollarSign, Target, TrendingUp } from 'lucide-react';
import { api } from '../../lib/apiClient';
import toast from 'react-hot-toast';

interface Invoice {
  invoiceId: string;
  missionId: string;
  missionStatement: string;
  amount: number;
  date: string;
  status: string;
  respondentCount: number;
}

export const BillingInvoicesTab = () => {
  const [invoices, setInvoices]       = useState<Invoice[]>([]);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

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
      const formattedDate = new Date(inv.date).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      });
      const amount = (inv.amount || 0).toFixed(2);
      const respondents = inv.respondentCount ?? 0;
      const unitPrice = respondents > 0 ? (inv.amount / respondents).toFixed(2) : amount;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${inv.invoiceId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #111; background: #fff; padding: 48px; font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .brand { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #111; }
    .brand span { color: #84cc16; }
    .invoice-meta { text-align: right; }
    .invoice-meta h1 { font-size: 28px; font-weight: 900; color: #111; letter-spacing: -1px; margin-bottom: 4px; }
    .invoice-meta p { color: #6b7280; font-size: 13px; }
    .invoice-meta .invoice-id { font-size: 13px; color: #374151; font-weight: 600; margin-top: 4px; }
    .divider { border: none; border-top: 1.5px solid #e5e7eb; margin: 24px 0; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
    .party h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 8px; }
    .party p { color: #111; font-weight: 600; font-size: 14px; line-height: 1.6; }
    .party .sub { color: #6b7280; font-size: 13px; font-weight: 400; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    thead th { background: #f9fafb; text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; border-bottom: 1.5px solid #e5e7eb; }
    thead th:last-child { text-align: right; }
    tbody td { padding: 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #111; vertical-align: top; }
    tbody td:last-child { text-align: right; font-weight: 600; }
    .desc-title { font-weight: 600; color: #111; }
    .desc-sub { color: #6b7280; font-size: 12px; margin-top: 2px; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #374151; }
    .totals-row.total { border-top: 2px solid #111; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 900; color: #111; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; background: #dcfce7; color: #15803d; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 99px; border: 1px solid #86efac; }
    .footer { margin-top: 64px; padding-top: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 12px; color: #9ca3af; }
    .footer .thank-you { font-size: 14px; font-weight: 700; color: #111; }
    @media print {
      body { padding: 32px; }
      @page { margin: 0; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">VETT<span>.</span></div>
    <div class="invoice-meta">
      <h1>INVOICE</h1>
      <p class="invoice-id">${inv.invoiceId}</p>
      <p>Issued: ${formattedDate}</p>
    </div>
  </div>

  <hr class="divider" />

  <div class="parties">
    <div class="party">
      <h3>From</h3>
      <p>Vett Inc.</p>
      <p class="sub">hello@vett.ai</p>
      <p class="sub">vett.ai</p>
    </div>
    <div class="party">
      <h3>Bill To</h3>
      <p>Account Holder</p>
      <p class="sub">Payment on file</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <p class="desc-title">Market Research Mission</p>
          <p class="desc-sub">${inv.missionStatement || 'Consumer research mission'}</p>
          <p class="desc-sub">Mission ID: ${inv.missionId}</p>
        </td>
        <td>${respondents > 0 ? respondents + ' respondents' : '1'}</td>
        <td>$${respondents > 0 ? unitPrice : amount}</td>
        <td>$${amount}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>$${amount}</span>
    </div>
    <div class="totals-row">
      <span>Tax</span>
      <span>$0.00</span>
    </div>
    <div class="totals-row total">
      <span>Total</span>
      <span>$${amount}</span>
    </div>
  </div>

  <div style="margin-top: 32px; display: flex; align-items: center; gap: 12px;">
    <span class="status-badge">✓ PAID</span>
    <span style="color: #6b7280; font-size: 13px;">Payment received on ${formattedDate}</span>
  </div>

  <div class="footer">
    <p>Vett Inc. · hello@vett.ai · vett.ai</p>
    <p class="thank-you">Thank you for your business!</p>
  </div>

  <script>window.onload = () => { window.print(); };<\/script>
</body>
</html>`;

      const win = window.open('', '_blank', 'width=900,height=700');
      if (win) {
        win.document.write(html);
        win.document.close();
      } else {
        toast.error('Pop-up blocked — please allow pop-ups for this site');
      }
    } catch {
      toast.error('Could not generate invoice');
    } finally {
      setDownloading(null);
    }
  };

  const totalSpent    = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const missionCount  = invoices.length;
  const avgOrder      = missionCount > 0 ? totalSpent / missionCount : 0;

  const kpis = [
    { icon: DollarSign,  label: 'Total Spent',    value: `$${totalSpent.toFixed(2)}`,  color: 'from-primary/20 to-primary/5',  iconColor: 'text-primary'  },
    { icon: Target,      label: 'Missions Run',   value: missionCount.toString(),      color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400' },
    { icon: TrendingUp,  label: 'Avg Per Mission', value: `$${avgOrder.toFixed(2)}`,   color: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400' },
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
