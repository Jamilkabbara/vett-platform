import { useState, useCallback, useEffect } from 'react';
import { Plus, Download, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface CRMLead {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  stage: string;
  ltv_usd: number;
  notes: string | null;
  created_at: string;
  last_activity_at: string | null;
}

const STAGES = ['new_lead', 'qualified', 'demo_booked', 'proposal', 'closed_won', 'closed_lost'];

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export const AdminCRM = ({ apiFetch }: { apiFetch: (path: string, opts?: RequestInit) => Promise<Response> }) => {
  const [leads, setLeads]         = useState<CRMLead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const [busy, setBusy]           = useState(false);
  const [search, setSearch]       = useState('');
  const [newLead, setNewLead]     = useState({ name: '', email: '', company: '', notes: '' });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await apiFetch('/api/admin/crm');
      const json = await res.json();
      setLeads((json.leads ?? json) || []);
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const createLead = async () => {
    if (!newLead.email) return;
    setBusy(true);
    try {
      const res  = await apiFetch('/api/admin/crm', { method: 'POST', body: JSON.stringify(newLead) });
      const lead = await res.json();
      setLeads(l => [lead, ...l]);
      setShowNew(false);
      setNewLead({ name: '', email: '', company: '', notes: '' });
      toast.success('Lead added');
    } catch { toast.error('Failed to create lead'); }
    finally { setBusy(false); }
  };

  const exportCSV = async () => {
    try {
      const res  = await apiFetch('/api/admin/crm/export');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'crm_leads.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const filtered = leads.filter(l =>
    !search || [l.email, l.name, l.company].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const inputCls = 'w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads…"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
          <Download className="w-4 h-4" />Export CSV
        </button>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />New Lead
        </button>
      </div>

      {showNew && (
        <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">New Lead</h3>
            <button onClick={() => setShowNew(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Name" value={newLead.name} onChange={e => setNewLead(l => ({ ...l, name: e.target.value }))} />
            <input className={inputCls} placeholder="Email *" type="email" value={newLead.email} onChange={e => setNewLead(l => ({ ...l, email: e.target.value }))} />
            <input className={inputCls} placeholder="Company" value={newLead.company} onChange={e => setNewLead(l => ({ ...l, company: e.target.value }))} />
            <input className={inputCls} placeholder="Notes" value={newLead.notes} onChange={e => setNewLead(l => ({ ...l, notes: e.target.value }))} />
          </div>
          <button onClick={createLead} disabled={busy || !newLead.email} className="px-5 py-2.5 bg-primary text-black text-sm font-bold rounded-xl disabled:opacity-50">
            {busy ? 'Creating…' : 'Create Lead'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="w-full text-xs">
          <thead className="bg-gray-900/60">
            <tr className="text-gray-500 font-bold uppercase tracking-wider">
              {['Email', 'Name', 'Company', 'Stage', 'LTV', 'Created', 'Notes'].map(h => (
                <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {loading && <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No leads yet</td></tr>}
            {!loading && filtered.map(l => (
              <tr key={l.id} className="hover:bg-gray-900/40 transition-colors">
                <td className="px-4 py-3 text-white font-medium">{l.email}</td>
                <td className="px-4 py-3 text-gray-400">{l.name || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{l.company || '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded-lg bg-gray-800 text-gray-400 text-[10px] font-bold uppercase border border-gray-700">
                    {STAGES.includes(l.stage) ? l.stage.replace(/_/g, ' ') : l.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-primary font-semibold">${(l.ltv_usd || 0).toFixed(0)}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(l.created_at)}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{l.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
