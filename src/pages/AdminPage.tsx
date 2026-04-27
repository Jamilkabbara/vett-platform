import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, DollarSign, Cpu, Users, Target,
  HeadphonesIcon, FileText, Tag, Menu, X, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { supabase } from '../lib/supabase';

import { AdminOverview }  from '../components/admin/AdminOverview';
import { AdminRevenue }   from '../components/admin/AdminRevenue';
import { AdminAICosts }   from '../components/admin/AdminAICosts';
import { AdminUsers }     from '../components/admin/AdminUsers';
import { AdminMissions }  from '../components/admin/AdminMissions';
import { AdminCRM }       from '../components/admin/AdminCRM';
import { AdminSupport }   from '../components/admin/AdminSupport';
import { AdminBlog }      from '../components/admin/AdminBlog';
import { PromosPanel }    from '../components/admin/PromosPanel';
import { AdminPaymentErrors } from '../components/admin/AdminPaymentErrors';
import { ErrorBoundary }  from '../components/shared/ErrorBoundary';

const API_URL    = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';
const ADMIN_EMAIL = 'kabbarajamil@gmail.com';

type SidebarTab =
  | 'overview' | 'revenue' | 'ai-costs'
  | 'users' | 'missions' | 'payment-errors'
  | 'crm' | 'support' | 'blog' | 'promos';

const NAV_ITEMS: { id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }>; group?: string }[] = [
  { id: 'overview',       label: 'Overview',       icon: LayoutDashboard, group: 'Analytics' },
  { id: 'revenue',        label: 'Revenue',        icon: DollarSign,      group: 'Analytics' },
  { id: 'ai-costs',       label: 'AI Costs',       icon: Cpu,             group: 'Analytics' },
  { id: 'users',          label: 'Users',          icon: Users,           group: 'Data' },
  { id: 'missions',       label: 'Missions',       icon: Target,          group: 'Data' },
  { id: 'payment-errors', label: 'Payment Errors', icon: AlertTriangle,   group: 'Data' },
  { id: 'crm',            label: 'CRM',            icon: Users,           group: 'Growth' },
  { id: 'support',        label: 'Support',        icon: HeadphonesIcon,  group: 'Growth' },
  { id: 'blog',           label: 'Blog',           icon: FileText,        group: 'Content' },
  { id: 'promos',         label: 'Promos',         icon: Tag,             group: 'Content' },
];

const TAB_TITLES: Record<SidebarTab, string> = {
  'overview':       'Overview',
  'revenue':        'Revenue',
  'ai-costs':       'AI Costs',
  'users':          'Users',
  'missions':       'Missions',
  'payment-errors': 'Payment Errors',
  'crm':            'CRM Leads',
  'support':        'Support',
  'blog':           'Blog',
  'promos':         'Promo Codes',
};

export function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate                       = useNavigate();
  const [tab, setTab]                  = useState<SidebarTab>('overview');
  const [sidebarOpen, setSidebarOpen]  = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Auth token helper — uses the app-wide singleton to avoid re-auth loops
  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? '';
  }, []);

  const apiFetch = useCallback(async (path: string, opts: RequestInit = {}): Promise<Response> => {
    const token = await getToken();
    const res   = await fetch(`${API_URL}${path}`, {
      ...opts,
      headers: {
        'Authorization':  `Bearer ${token}`,
        'Content-Type':   'application/json',
        ...(opts.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
  }, [getToken]);

  if (authLoading) return null;
  if (!user || user.email !== ADMIN_EMAIL) return null;

  // Wrap each panel in its own ErrorBoundary so a downstream payload
  // surprise (undefined field, malformed shape) only blacks out one tab
  // instead of the whole /admin route. Pass 20 Hotfix Round 2 (SEV-1).
  const ActivePanel = () => {
    const props = { apiFetch };
    const wrap = (label: string, node: React.ReactNode) => (
      <ErrorBoundary label={label}>{node}</ErrorBoundary>
    );
    switch (tab) {
      case 'overview':  return wrap('Overview',  <AdminOverview  {...props} />);
      case 'revenue':   return wrap('Revenue',   <AdminRevenue   {...props} />);
      case 'ai-costs':  return wrap('AI Costs',  <AdminAICosts   {...props} />);
      case 'users':     return wrap('Users',     <AdminUsers     {...props} />);
      case 'missions':  return wrap('Missions',  <AdminMissions  {...props} />);
      case 'payment-errors': return wrap('Payment Errors', <AdminPaymentErrors {...props} />);
      case 'crm':       return wrap('CRM',       <AdminCRM       {...props} />);
      case 'support':   return wrap('Support',   <AdminSupport   {...props} />);
      case 'blog':      return wrap('Blog',      <AdminBlog      {...props} />);
      case 'promos':    return wrap('Promos',    <PromosPanel     apiFetch={apiFetch} />);
    }
  };

  // Group nav items
  const groups = ['Analytics', 'Data', 'Growth', 'Content'];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <span className="font-black text-white text-sm tracking-tight">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map(group => {
          const items = NAV_ITEMS.filter(n => n.group === group);
          return (
            <div key={group}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-2 mb-1.5">{group}</p>
              {items.map(item => {
                const Icon     = item.icon;
                const isActive = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setTab(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-[10px] text-gray-600 truncate">{ADMIN_EMAIL}</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex h-screen overflow-hidden bg-[#0a0b14]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-52 border-r border-gray-800 bg-[#0d0e1a] flex-shrink-0">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-52 h-full bg-[#0d0e1a] border-r border-gray-800">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-800 bg-[#0d0e1a] flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <h1 className="font-black text-white text-lg">{TAB_TITLES[tab]}</h1>
          </div>

          {/* Panel */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            <ActivePanel />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}

export default AdminPage;
