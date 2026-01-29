import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserMenuProps {
  userName?: string;
  userEmail?: string;
}

export const UserMenu = ({ userName = 'John Maverick', userEmail = 'john@example.com' }: UserMenuProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/landing');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-neon-lime flex items-center justify-center text-gray-900 font-black text-sm hover:scale-105 active:scale-95 transition-transform shadow-lg ring-2 ring-black/5"
        aria-label="User menu"
      >
        {getInitials(userName)}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-[#0A0A0A] border border-gray-800/80 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden z-50 backdrop-blur-xl">
          <div className="p-6 border-b border-gray-800/60 bg-gradient-to-br from-gray-900/50 to-gray-900/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-neon-lime flex items-center justify-center text-gray-900 font-black text-xs">
                {getInitials(userName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          <div className="py-1.5 px-1.5">
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all duration-150 rounded-lg group"
            >
              <User className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Account Settings</span>
            </button>

            <button
              onClick={() => handleNavigation('/dashboard')}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all duration-150 rounded-lg group"
            >
              <Target className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">My Missions</span>
            </button>
          </div>

          <div className="border-t border-gray-800/60 py-1.5 px-1.5 bg-gray-900/20">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 rounded-lg group"
            >
              <LogOut className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
