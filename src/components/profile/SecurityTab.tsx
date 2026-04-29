import { useState } from 'react';
import { Eye, EyeOff, Shield, Smartphone, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/apiClient';
import toast from 'react-hot-toast';

export const SecurityTab = () => {
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [pwLoading, setPwLoading]           = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState('');
  const [deleteLoading, setDeleteLoading]   = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      toast.error(msg);
    } finally {
      setPwLoading(false);
    }
  };

  // Pass 21 Bug 12: real account deletion. Calls DELETE /api/auth/account
  // which wipes user-owned rows in dependency order (ai_calls →
  // chat_sessions → missions → profiles → auth.users) then signs out
  // locally and bounces back to the landing page. The "type DELETE"
  // gate is enforced both client- and server-side.
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    if (!window.confirm('This permanently deletes your account, missions, and results. This cannot be undone. Continue?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const result = await api.delete('/api/auth/account', { confirm: 'DELETE' });
      if (Array.isArray(result?.partialErrors) && result.partialErrors.length > 0) {
        // Backend logged them; we surface a soft-warning but still sign out.
        console.warn('Account deletion partial errors:', result.partialErrors);
      }
      toast.success('Your account has been deleted.');
      await supabase.auth.signOut();
      // Hard redirect — easier than wiping every cached store.
      window.location.href = '/';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      toast.error(msg + ' - contact hello@vettit.ai if this persists.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Change password */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-orange-400" />
          </div>
          <h3 className="text-base font-bold text-white">Change Password</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-5 py-3.5 pr-12 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showNew ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2.5">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-5 py-3.5 pr-12 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pwLoading || !newPassword || newPassword !== confirmPassword}
            className="px-7 py-3 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* 2FA */}
      <div className="border-t border-gray-800 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-violet-400" />
          </div>
          <h3 className="text-base font-bold text-white">Two-Factor Authentication</h3>
          <span className="text-xs bg-gray-800 text-gray-400 border border-gray-700 rounded-full px-2.5 py-1 font-bold">Coming soon</span>
        </div>
        <p className="text-sm text-gray-500 max-w-md">
          Add an extra layer of security with TOTP authenticator apps. Available in an upcoming update.
        </p>
      </div>

      {/* Danger zone */}
      <div className="border-t border-red-900/40 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-base font-bold text-red-400">Delete Account</h3>
        </div>
        <p className="text-sm text-gray-400 mb-5 max-w-md">
          This action is permanent and cannot be undone. All your missions and data will be removed.
          Type <span className="font-mono text-red-400 font-bold">DELETE</span> to confirm.
        </p>
        <div className="flex gap-3 max-w-md">
          <input
            type="text"
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE"
            className="flex-1 px-4 py-3 bg-[#1e293b] border border-red-900/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all font-mono"
          />
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'DELETE' || deleteLoading}
            className="px-5 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold rounded-xl border border-red-600/40 hover:border-red-600/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleteLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
