import { useState, useEffect } from 'react';
import { Mail, Building2, Save, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUserProfile } from '../../hooks/useUserProfile';
import toast from 'react-hot-toast';

const ROLE_OPTIONS   = ['Founder', 'Product Manager', 'Marketing', 'Researcher', 'Developer', 'Other'];
const STAGE_OPTIONS  = ['Idea', 'Early Stage', 'Growth', 'Scale', 'Enterprise'];

export const AccountTab = () => {
  const { profile, loading: profileLoading } = useUserProfile();

  const [loading, setLoading]           = useState(false);
  const [firstName, setFirstName]       = useState('');
  const [lastName, setLastName]         = useState('');
  const [companyName, setCompanyName]   = useState('');
  const [vatTaxId, setVatTaxId]         = useState('');
  const [role, setRole]                 = useState('');
  const [projectStage, setProjectStage] = useState('');
  const [hydrated, setHydrated]         = useState(false);

  // Hydrate form once the profile hook resolves
  useEffect(() => {
    if (profile && !hydrated) {
      setFirstName(profile.firstName   ?? '');
      setLastName(profile.lastName     ?? '');
      setCompanyName(profile.companyName ?? '');
      setRole(profile.role             ?? '');
      setProjectStage(profile.projectStage ?? '');
      setHydrated(true);
    }
  }, [profile, hydrated]);

  // Also fetch vat_tax_id separately (not in the hook)
  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('profiles')
      .select('vat_tax_id')
      .eq('id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.vat_tax_id) setVatTaxId(data.vat_tax_id);
      });
  }, [profile?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id:            profile.id,
          first_name:    firstName.trim()   || null,
          last_name:     lastName.trim()    || null,
          full_name:     [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null,
          company_name:  companyName.trim() || null,
          vat_tax_id:    vatTaxId.trim()    || null,
          role:          role               || null,
          project_stage: projectStage       || null,
        });
      if (error) throw error;
      toast.success('Profile saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">

      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2.5">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="First name"
            className="w-full px-5 py-3.5 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2.5">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Last name"
            className="w-full px-5 py-3.5 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Email — locked */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 mb-2.5">
          <Lock className="w-3.5 h-3.5 text-gray-600" />
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="email"
            value={profile?.email || ''}
            disabled
            readOnly
            className="w-full pl-12 pr-5 py-3.5 bg-[#0f172a] border border-gray-800 rounded-xl text-gray-500 cursor-not-allowed select-none"
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">Email address cannot be changed here</p>
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">Your Role</label>
        <div className="flex flex-wrap gap-2.5">
          {ROLE_OPTIONS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r === role ? '' : r)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                role === r
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-[#1e293b] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Project Stage */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">Project Stage</label>
        <div className="flex flex-wrap gap-2.5">
          {STAGE_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setProjectStage(s === projectStage ? '' : s)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                projectStage === s
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-[#1e293b] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Invoicing details */}
      <div className="border-t border-gray-800 pt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">Invoicing Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2.5">
              Company Name <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Your company"
                className="w-full pl-12 pr-5 py-3.5 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2.5">
              VAT / Tax ID <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={vatTaxId}
              onChange={e => setVatTaxId(e.target.value)}
              placeholder="GB123456789"
              className="w-full px-5 py-3.5 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">Appears on downloadable invoices</p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};
