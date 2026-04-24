import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Plus, Shield } from 'lucide-react';
import { Logo } from '../shared/Logo';
import { UserMenu } from '../shared/UserMenu';
import { useUserProfile } from '../../hooks/useUserProfile';

export const DashboardNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useUserProfile();
  const isAdmin = profile?.is_admin === true;

  const isResultsPage = location.pathname === '/results' || location.pathname.startsWith('/dashboard/');
  const isMissionSuccessPage = location.pathname === '/mission-success';
  const isMissionControlPage = location.pathname === '/mission-control' || location.pathname === '/setup';

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999] bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <button
          onClick={() => navigate('/missions')}
          className="hover:opacity-80 transition-opacity"
        >
          <Logo />
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          {isMissionControlPage && (
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 sm:px-4 sm:py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 font-medium"
              aria-label="Live Dashboard"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Live Dashboard</span>
            </button>
          )}

          {(isResultsPage || isMissionSuccessPage) && (
            <button
              onClick={() => navigate('/setup')}
              className="p-2 sm:px-5 sm:py-2 rounded-lg bg-gradient-to-r from-neon-lime to-primary text-gray-900 font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-primary/30"
              aria-label="New Mission"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Mission</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              title="Admin panel"
              className="p-2 rounded-lg text-white/40 hover:text-lime hover:bg-lime/10 transition-colors"
              aria-label="Admin"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};
