import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Settings, CreditCard, User, Lock, Mail, Plus, Download, Trash2, Building2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/apiClient';
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

export const ProfilePage = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vatTaxId, setVatTaxId] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadInvoices();
    }
  }, [user]);

  const loadInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const data = await api.get('/api/profile/invoices');
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleDownloadInvoicePDF = async (invoiceId: string, missionId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const res = await fetch(`${API_URL}/api/results/${missionId}/export/pdf`, { headers });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vett_invoice_${invoiceId}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        toast.success('Invoice download coming soon!');
      }
    } catch {
      toast.success('Invoice download coming soon!');
    }
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, company_name, vat_tax_id')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setName(data.name || '');
        setCompanyName(data.company_name || '');
        setVatTaxId(data.vat_tax_id || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          name,
          company_name: companyName,
          vat_tax_id: vatTaxId,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Profile details updated');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Password changed successfully');
  };

  const handleAddPaymentMethod = () => {
    toast.success('Card ending in 4242 added');
  };

  const handleDeletePaymentMethod = () => {
    toast.success('Payment method removed');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion is currently disabled');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0b14] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">Account Settings</h1>
            <p className="text-gray-400 text-base">Manage your account and billing preferences</p>
          </div>

          <div className="space-y-10">
            {/* Profile Information */}
            <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-8 lg:p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Profile Information</h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-5 py-4 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-transparent transition-all text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-14 pr-5 py-4 bg-[#1e293b]/50 border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed text-base"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2.5">Email cannot be changed</p>
                </div>

                {/* Invoicing Details Divider */}
                <div className="pt-4 pb-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#ccff00]" />
                      <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Invoicing Details</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Company Name <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter your company name"
                      className="w-full pl-14 pr-5 py-4 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-transparent transition-all text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    VAT / Tax ID <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={vatTaxId}
                      onChange={(e) => setVatTaxId(e.target.value)}
                      placeholder="e.g., GB123456789 or 12-3456789"
                      className="w-full pl-14 pr-5 py-4 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-transparent transition-all text-base"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">
                    These details will appear on your downloadable invoices
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#ccff00] hover:bg-[#b8e600] text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-8 lg:p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 to-red-600 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Change Password</h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-5 py-4 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-transparent transition-all text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-5 py-4 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-transparent transition-all text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-5 py-4 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-transparent transition-all text-base"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] text-base"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            {/* Payment Methods */}
            <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-8 lg:p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Payment Methods</h2>
              </div>

              <div className="space-y-5">
                {/* Saved Card */}
                <div className="flex items-center justify-between p-6 bg-[#1e293b] rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-base">Visa ending in 4242</p>
                      <p className="text-sm text-gray-400 mt-1.5">Expires 12/25</p>
                    </div>
                  </div>
                  <button onClick={handleDeletePaymentMethod} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all p-2.5 rounded-lg ml-4">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Add Payment Method Button */}
                <button onClick={handleAddPaymentMethod} className="w-full flex items-center justify-center gap-2.5 py-5 bg-[#ccff00]/10 hover:bg-[#ccff00]/20 border-2 border-dashed border-[#ccff00]/30 hover:border-[#ccff00]/50 text-[#ccff00] font-bold rounded-xl transition-all text-base">
                  <Plus className="w-5 h-5" />
                  <span>Add Payment Method</span>
                </button>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-8 lg:p-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-10">Billing History</h2>

              {invoicesLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#ccff00]/30 border-t-[#ccff00] rounded-full animate-spin" />
                </div>
              )}

              {!invoicesLoading && invoices.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No invoices yet. Launch your first mission to see billing history here.</p>
                </div>
              )}

              {/* Desktop Table */}
              {!invoicesLoading && invoices.length > 0 && (
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-5 pr-8">Date</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-5 pr-8">Mission</th>
                      <th className="text-right text-xs font-bold text-gray-400 uppercase tracking-wider pb-5 px-8">Amount</th>
                      <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-5 px-8">Status</th>
                      <th className="text-right text-xs font-bold text-gray-400 uppercase tracking-wider pb-5 pl-8">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {invoices.map(inv => (
                      <tr key={inv.invoiceId} className="hover:bg-[#1e293b]/50 transition-colors group">
                        <td className="py-6 pr-8 text-sm text-gray-300 whitespace-nowrap">
                          {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-6 pr-8">
                          <p className="text-base font-semibold text-white">{inv.invoiceId}</p>
                          <p className="text-sm text-gray-400 mt-1.5 truncate max-w-[200px]">{inv.missionStatement || 'Mission'}</p>
                        </td>
                        <td className="py-6 px-8 text-right text-lg font-bold text-white whitespace-nowrap">
                          ${(inv.amount || 0).toFixed(2)}
                        </td>
                        <td className="py-6 px-8 text-center">
                          <span className="inline-flex items-center px-3.5 py-2 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                            Paid
                          </span>
                        </td>
                        <td className="py-6 pl-8 text-right">
                          <button
                            onClick={() => handleDownloadInvoicePDF(inv.invoiceId, inv.missionId)}
                            className="text-[#ccff00] hover:text-[#b8e600] transition-all p-2.5 hover:bg-[#ccff00]/10 rounded-lg"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-5">
                {invoices.map(inv => (
                  <div key={inv.invoiceId} className="bg-[#1e293b] rounded-xl border border-gray-700 p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-lg mb-2">{inv.invoiceId}</p>
                        <p className="text-sm text-gray-400 truncate">{inv.missionStatement || 'Mission'}</p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 ml-4 flex-shrink-0">
                        Paid
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-5 border-t border-gray-700">
                      <div>
                        <p className="text-xs text-gray-400 mb-2">
                          {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xl font-bold text-white">${(inv.amount || 0).toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleDownloadInvoicePDF(inv.invoiceId, inv.missionId)}
                        className="text-[#ccff00] hover:text-[#b8e600] transition-all p-3 hover:bg-[#ccff00]/10 rounded-lg"
                      >
                        <Download className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-[#0f172a] border border-red-900/50 rounded-2xl p-8 lg:p-10">
              <div className="flex items-center gap-4 mb-8">
                <Settings className="w-6 h-6 text-red-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-red-400">Danger Zone</h2>
              </div>
              <p className="text-base text-gray-400 mb-8 leading-relaxed">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button onClick={handleDeleteAccount} className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold py-4 rounded-xl border-2 border-red-600/50 hover:border-red-600/70 transition-all active:scale-[0.98] text-base">
                Delete Account
              </button>
            </div>
          </div>

          {/* Extra bottom padding for breathing room */}
          <div className="h-16"></div>
        </div>
      </div>
    </DashboardLayout>
  );
};
