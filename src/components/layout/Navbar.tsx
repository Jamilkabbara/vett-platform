import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Logo } from '../shared/Logo';

interface NavbarProps {
  onSignInClick: () => void;
  missionStatus?: string;
  showPreviewButton?: boolean;
  onPreviewClick?: () => void;
}

export const Navbar = ({ onSignInClick, showPreviewButton, onPreviewClick }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogoClick = () => {
    if (isLandingPage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/landing');
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return 'JM';
    const email = user.email;
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user?.email) return 'Jamil';
    const emailPart = user.email.split('@')[0];
    const parts = emailPart.split('.');
    if (parts.length >= 2) {
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || !isLandingPage
          ? 'bg-[#020617]/80 backdrop-blur-md border-b border-gray-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 md:py-4 flex items-center justify-between">
        <button
          onClick={handleLogoClick}
          className="group hover:opacity-80 transition-opacity"
        >
          <Logo />
        </button>

        <div className="flex items-center gap-2 md:gap-4">
          {isLandingPage ? (
            <>
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  onClick={onSignInClick}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 text-gray-300 hover:text-white font-medium px-3 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all text-xs md:text-sm tracking-wide"
                >
                  Sign In
                </button>
                <Link
                  to="/setup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold uppercase tracking-wider text-xs md:text-sm px-3 py-1.5 md:px-6 md:py-2.5 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)] hover:shadow-[0_0_25px_rgba(124,58,237,0.7)] hover:scale-105 transition-all"
                >
                  VETT IT
                </Link>
              </div>
            </>
          ) : (
            <>
              {showPreviewButton && onPreviewClick && (
                <button
                  onClick={onPreviewClick}
                  className="flex items-center gap-2 bg-[#ccff00] text-black font-bold uppercase tracking-wide px-3 py-1.5 md:px-6 md:py-2.5 rounded-full shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:scale-105 transition-transform text-xs md:text-sm"
                >
                  <Eye className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
              )}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg hover:ring-2 hover:ring-purple-500 transition-all"
                >
                  {getUserInitials()}
                </button>

                {isMenuOpen && (
                  <div className="absolute top-12 right-0 w-56 bg-[#0f172a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-sm text-white font-medium">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-500">{user?.email || 'user@vettit.ai'}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/missions');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                      >
                        My Missions
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                      >
                        Account Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
