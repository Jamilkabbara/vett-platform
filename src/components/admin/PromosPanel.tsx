/**
 * PromosPanel — Admin UI for managing promo codes.
 * Loaded as the "Promos" tab inside AdminPage.
 */
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, ToggleLeft, ToggleRight, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

interface PromoCode {
  code: string;
  type: 'percentage' | 'flat' | 'free';
  value: number;
  description: string | null;
  active: boolean;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_at: string;
}

interface NewPromoForm {
  code: string;
  type: 'percentage' | 'flat' | 'free';
  value: string;
  description: string;
  active: boolean;
  max_uses: string;
  expires_at: string;
}

const EMPTY_FORM: NewPromoForm = {
  code: '', type: 'percentage', value: '', description: '',
  active: true, max_uses: '', expires_at: '',
};

interface PromosPanelProps {
  apiFetch: (path: string, opts?: RequestInit) => Promise<Response>;
}

export function PromosPanel({ apiFetch }: PromosPanelProps) {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<NewPromoForm>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/promos');
      setPromos(await res.json());
    } catch {
      toast.error('Failed to load promo codes');
    }
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.code.trim()) return toast.error('Code is required');
    setBusy(true);
    try {
      const res = await apiFetch('/api/admin/promos', {
        method: 'POST',
        body: JSON.stringify({
          code:        form.code.trim().toUpperCase(),
          type:        form.type,
          value:       form.type === 'free' ? 100 : Number(form.value || 0),
          description: form.description || null,
          active:      form.active,
          max_uses:    form.max_uses ? Number(form.max_uses) : null,
          expires_at:  form.expires_at || null,
        }),
      });
      const created: PromoCode = await res.json();
      setPromos(p => [created, ...p]);
      setShowNew(false);
      setForm(EMPTY_FORM);
      toast.success(`Promo code ${created.code} created`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create promo code');
    }
    setBusy(false);
  };

  const toggleActive = async (promo: PromoCode) => {
    try {
      await apiFetch(`/api/admin/promos/${promo.code}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !promo.active }),
      });
      setPromos(p => p.map(x => x.code === promo.code ? { ...x, active: !x.active } : x));
      toast.success(promo.active ? `${promo.code} deactivated` : `${promo.code} activated`);
    } catch {
      toast.error('Update failed');
    }
  };

  const deletePromo = async (code: string) => {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/promos/${code}`, { method: 'DELETE' });
      setPromos(p => p.filter(x => x.code !== code));
      toast.success(`${code} deleted`);
    } catch {
      toast.error('Delete failed');
    }
    setBusy(false);
    setConfirmDelete(null);
  };

  const inputCls = 'w-full h-9 px-3 bg-bg3 border border-b1 rounded-lg text-[12px] text-t1 placeholder:text-t4 focus:outline-none focus:border-lime/60';
  const selectCls = 'w-full h-9 px-3 bg-bg3 border border-b1 rounded-lg text-[12px] text-t1 focus:outline-none focus:border-lime/60';

  const typeLabel = (t: string, v: number) => {
    if (t === 'free')       return '🎁 Free (100% off)';
    if (t === 'percentage') return `${v}% off`;
    if (t === 'flat')       return `$${v} off`;
    return t;
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-black text-white text-lg">Promo Codes</h2>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-t3 hover:text-t1 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNew(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-lime/10 border border-lime/30 rounded-lg text-lime text-[12px] font-bold hover:bg-lime/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Code
          </button>
        </div>
      </div>

      {/* Create form */}
      {showNew && (
        <div className="bg-bg2 border border-b1 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="font-display font-bold text-white text-[13px] mb-4">Create Promo Code</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-t3 text-[11px] font-bold uppercase tracking-wider mb-1">Code *</label>
              <input
                className={inputCls}
                placeholder="e.g. SUMMER30"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              />
            </div>

            <div>
              <label className="block text-t3 text-[11px] font-bold uppercase tracking-wider mb-1">Type *</label>
              <select
                className={selectCls}
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as NewPromoForm['type'] }))}
              >
                <option value="percentage">Percentage off (%)</option>
                <option value="flat">Flat discount ($)</option>
                <option value="free">Free launch (100% off)</option>
              </select>
            </div>

            {form.type !== 'free' && (
              <div>
                <label className="block text-t3 text-[11px] font-bold uppercase tracking-wider mb-1">
                  {form.type === 'percentage' ? 'Percent off (%)' : 'Flat discount ($)'}
                </label>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  placeholder={form.type === 'percentage' ? '20' : '10'}
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                />
              </div>
            )}

            <div>
              <label className="block text-t3 text-[11px] font-bold uppercase tracking-wider mb-1">Max Uses</label>
              <input
                className={inputCls}
                type="number"
                placeholder="Unlimited"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-t3 text-[11px] font-bold uppercase tracking-wider mb-1">Expires At</label>
              <input
                className={inputCls}
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-t3 text-[11px] font-bold uppercase tracking-wider mb-1">Description</label>
              <input
                className={inputCls}
                placeholder="Internal note"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={create}
              disabled={busy}
              className="px-4 py-2 bg-lime text-bg1 text-[12px] font-bold rounded-lg hover:bg-lime/90 transition-colors disabled:opacity-50"
            >
              {busy ? 'Creating...' : 'Create Code'}
            </button>
            <button
              onClick={() => { setShowNew(false); setForm(EMPTY_FORM); }}
              className="px-4 py-2 text-t3 hover:text-t1 text-[12px] font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-b1">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-b1 text-t3 font-display font-bold uppercase tracking-wider">
              {['Code', 'Discount', 'Description', 'Uses', 'Expires', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-t3">
                  <Tag className="w-5 h-5 mx-auto mb-2 opacity-40" />
                  No promo codes yet
                </td>
              </tr>
            )}
            {promos.map(p => (
              <tr key={p.code} className="border-b border-b1/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-3 py-2.5 font-mono font-bold text-lime">{p.code}</td>
                <td className="px-3 py-2.5 text-t1">{typeLabel(p.type, p.value)}</td>
                <td className="px-3 py-2.5 text-t3 max-w-[200px] truncate">{p.description || '—'}</td>
                <td className="px-3 py-2.5 text-t2">
                  {p.uses_count}{p.max_uses ? `/${p.max_uses}` : ''}
                </td>
                <td className="px-3 py-2.5 text-t3">{fmtDate(p.expires_at)}</td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${
                      p.active ? 'text-green-400 hover:text-green-300' : 'text-t4 hover:text-t2'
                    }`}
                  >
                    {p.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {p.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  {confirmDelete === p.code ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deletePromo(p.code)}
                        disabled={busy}
                        className="text-[11px] font-bold text-red-400 hover:text-red-300"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[11px] font-bold text-t3 hover:text-t1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(p.code)}
                      className="text-t4 hover:text-red-400 transition-colors"
                      title="Delete code"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
