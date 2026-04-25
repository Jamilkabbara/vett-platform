import { useState } from 'react';
import { User, Receipt, Lock } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AccountTab }        from '../components/profile/AccountTab';
import { BillingInvoicesTab } from '../components/profile/BillingInvoicesTab';
import { SecurityTab }        from '../components/profile/SecurityTab';

// Pass 21 Bug 11: removed the "Payment Methods" tab. The PaymentMethodsTab
// was vaporware — DEMO_CARDS = [], "Add card coming soon" toast, "contact
// support" remove handler — and shipping a non-functional surface in
// production was misleading. Real card management happens at Stripe
// Checkout per-mission; saved-card UX can come back when there's an
// actual list_payment_methods integration to back it.
type TabId = 'account' | 'billing' | 'security';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'account',  label: 'Account',  icon: User    },
  { id: 'billing',  label: 'Billing',  icon: Receipt },
  { id: 'security', label: 'Security', icon: Lock    },
];

export const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<TabId>('account');

  const ActiveComponent = {
    account:  AccountTab,
    billing:  BillingInvoicesTab,
    security: SecurityTab,
  }[activeTab];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0b14] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">Account Settings</h1>
            <p className="text-gray-400">Manage your profile, billing, and security preferences</p>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 p-1 bg-gray-900/60 border border-gray-800 rounded-2xl mb-8 overflow-x-auto scrollbar-none">
            {TABS.map(tab => {
              const Icon    = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center ${
                    isActive
                      ? 'bg-primary text-black shadow'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content card */}
          <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-7 sm:p-10">
            {/* Tab title */}
            <div className="mb-8">
              {(() => {
                const tab = TABS.find(t => t.id === activeTab)!;
                const Icon = tab.icon;
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-white">{tab.label}</h2>
                  </div>
                );
              })()}
            </div>

            <ActiveComponent />
          </div>

          <div className="h-16" />
        </div>
      </div>
    </DashboardLayout>
  );
};
