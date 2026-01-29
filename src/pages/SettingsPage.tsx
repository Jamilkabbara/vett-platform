import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { User, CreditCard, Bell, Download, Upload, Plus, Trash2 } from 'lucide-react';

type TabType = 'profile' | 'billing' | 'notifications';

const paymentMethods = [
  {
    id: 1,
    type: 'Visa',
    last4: '4242',
    expiry: '12/25',
    isDefault: true,
  },
  {
    id: 2,
    type: 'Mastercard',
    last4: '8888',
    expiry: '09/26',
    isDefault: false,
  },
];

const invoices = [
  {
    id: 1,
    date: 'Oct 24, 2025',
    mission: 'Mission #102 - Validation',
    amount: '$75.00',
    status: 'paid',
  },
  {
    id: 2,
    date: 'Oct 20, 2025',
    mission: 'Mission #98 - Market Research',
    amount: '$125.00',
    status: 'paid',
  },
  {
    id: 3,
    date: 'Oct 15, 2025',
    mission: 'Mission #94 - Pricing Test',
    amount: '$50.00',
    status: 'paid',
  },
];

export const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(urlTab || 'profile');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-12">
          <h1 className="text-4xl font-black text-white mb-2">Settings</h1>
          <p className="text-white/50 mb-8">Manage your account preferences and billing</p>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <nav className="space-y-2">
                <button
                  onClick={() => handleTabChange('profile')}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-left transition-all ${
                    activeTab === 'profile'
                      ? 'bg-primary text-white font-bold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => handleTabChange('billing')}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-left transition-all ${
                    activeTab === 'billing'
                      ? 'bg-primary text-white font-bold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Billing & Invoices</span>
                </button>

                <button
                  onClick={() => handleTabChange('notifications')}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-left transition-all ${
                    activeTab === 'notifications'
                      ? 'bg-primary text-white font-bold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </button>
              </nav>
            </aside>

            <main className="lg:col-span-3">
              {activeTab === 'profile' && (
                <div className="glass-panel p-8 rounded-3xl">
                  <h2 className="text-2xl font-black text-white mb-6">Profile Information</h2>

                  <div className="mb-8">
                    <label className="block text-sm font-bold text-white/60 mb-3">Profile Picture</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-neon-lime flex items-center justify-center text-gray-900 font-black text-3xl">
                        JM
                      </div>
                      <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload New
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-white/60 mb-2">Full Name</label>
                      <input
                        type="text"
                        defaultValue="John Maverick"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-white/60 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue="john@example.com"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-white/60 mb-2">Company Name</label>
                      <input
                        type="text"
                        defaultValue="Acme Corporation"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-white/60 mb-2">Role</label>
                      <input
                        type="text"
                        defaultValue="Product Manager"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-bold text-white/60 mb-2">Password</label>
                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all">
                      Change Password
                    </button>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button className="px-6 py-3 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/5 font-medium transition-all">
                      Cancel
                    </button>
                    <button className="px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl text-white font-bold transition-all shadow-lg shadow-primary/25">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <div className="glass-panel p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-black text-white">Payment Methods</h2>
                      <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-neon-lime hover:shadow-lg hover:shadow-primary/25 rounded-xl text-gray-900 font-bold transition-all">
                        <Plus className="w-5 h-5" />
                        Add Payment Method
                      </button>
                    </div>

                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center justify-between p-6 bg-gray-900 border border-gray-700 rounded-2xl hover:border-gray-600 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-10 rounded-lg flex items-center justify-center text-white font-black text-xs ${
                              method.type === 'Visa'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                : 'bg-gradient-to-br from-orange-500 to-red-600'
                            }`}>
                              {method.type === 'Visa' ? 'VISA' : 'MC'}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="text-white font-bold">
                                  {method.type} ending in {method.last4}
                                </span>
                                {method.isDefault && (
                                  <span className="px-2 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary text-xs font-bold">
                                    DEFAULT
                                  </span>
                                )}
                              </div>
                              <div className="text-white/50 text-sm">Expires {method.expiry}</div>
                            </div>
                          </div>
                          <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-medium transition-all">
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-2xl font-black text-white mb-6">Billing History</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-4 px-4 text-sm font-bold text-white/60 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-bold text-white/60 uppercase tracking-wider">
                              Mission
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-bold text-white/60 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-bold text-white/60 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-bold text-white/60 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                              <td className="py-4 px-4 text-white font-medium">{invoice.date}</td>
                              <td className="py-4 px-4 text-white">{invoice.mission}</td>
                              <td className="py-4 px-4 text-white font-bold">{invoice.amount}</td>
                              <td className="py-4 px-4">
                                <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-bold flex items-center gap-1 w-fit">
                                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                  Paid
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <button className="text-primary hover:text-primary-hover transition-colors flex items-center gap-2 font-medium">
                                  <Download className="w-4 h-4" />
                                  <span className="text-sm">Download PDF</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="glass-panel p-8 rounded-3xl">
                  <h2 className="text-2xl font-black text-white mb-6">Notification Preferences</h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-gray-800">
                      <div>
                        <div className="text-white font-bold mb-1">Mission Completion</div>
                        <div className="text-white/50 text-sm">Get notified when your mission is complete</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-800">
                      <div>
                        <div className="text-white font-bold mb-1">Weekly Summary</div>
                        <div className="text-white/50 text-sm">Receive weekly insights and mission performance</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-800">
                      <div>
                        <div className="text-white font-bold mb-1">Payment Receipts</div>
                        <div className="text-white/50 text-sm">Get email confirmation for all payments</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-4">
                      <div>
                        <div className="text-white font-bold mb-1">Product Updates</div>
                        <div className="text-white/50 text-sm">Stay informed about new features and improvements</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-800">
                    <button className="px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl text-white font-bold transition-all shadow-lg shadow-primary/25">
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
