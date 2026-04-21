import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { TopNav } from '../ui/TopNav';
import { Logo } from '../ui/Logo';
import { NotificationBell } from '../ui/NotificationBell';
import { AvatarBubble } from '../ui/AvatarBubble';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Authed-user TopNav — composed from the Foundation <TopNav/> slots.
 *
 * Used by /setup and /dashboard/:missionId (Mission Setup + Mission
 * Control) in the redesign. Mirrors .design-reference/prototype.html
 * lines 1195–1210: logo left, "Live Dashboard" link, bell with badge,
 * lime initials avatar on the right.
 *
 * The mobile drawer shows the same items stacked, plus a Sign out row
 * at the bottom — because on mobile we can't rely on the avatar
 * dropdown for that.
 */

export interface AuthedTopNavProps {
  /** Optional extra right-side content (renders before the bell/avatar). */
  rightExtras?: React.ReactNode;
  className?: string;
}

export function AuthedTopNav({ rightExtras, className }: AuthedTopNavProps) {
  const { signOut } = useAuth();

  const dashboardLink = (
    <Link
      to="/dashboard"
      className="inline-flex items-center gap-2 h-10 px-3 rounded-lg text-t2 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/15 transition-colors font-display font-bold text-[12px] uppercase tracking-widest"
    >
      <LayoutDashboard className="w-4 h-4" aria-hidden />
      <span>Live Dashboard</span>
    </Link>
  );

  const desktopRight = (
    <>
      {rightExtras}
      {dashboardLink}
      <NotificationBell />
      <AvatarBubble />
    </>
  );

  // Mobile drawer: stack the same actions + an explicit Sign out row.
  const mobileMenu = (
    <div className="flex flex-col gap-2">
      <AvatarBubble plain />
      <div className="h-px bg-b1 my-1" />
      <Link
        to="/dashboard"
        className="flex items-center gap-2.5 h-11 px-3 rounded-lg text-t1 hover:bg-white/5 border border-white/10 font-display font-bold text-[13px]"
      >
        <LayoutDashboard className="w-4 h-4" aria-hidden />
        <span>Live Dashboard</span>
      </Link>
      <Link
        to="/profile"
        className="flex items-center h-11 px-3 rounded-lg text-t1 hover:bg-white/5 border border-white/10 font-display font-bold text-[13px]"
      >
        Profile
      </Link>
      <Link
        to="/billing"
        className="flex items-center h-11 px-3 rounded-lg text-t1 hover:bg-white/5 border border-white/10 font-display font-bold text-[13px]"
      >
        Billing
      </Link>
      <div className="mt-1 flex items-center justify-between px-1">
        <span className="font-display font-bold text-[11px] text-t3 uppercase tracking-widest">
          Notifications
        </span>
        <NotificationBell inDrawer />
      </div>
      <div className="h-px bg-b1 my-2" />
      <button
        type="button"
        onClick={signOut}
        className="flex items-center gap-2.5 h-11 px-3 rounded-lg text-red hover:bg-red/10 border border-red/30 font-display font-bold text-[13px]"
      >
        <LogOut className="w-4 h-4" aria-hidden />
        <span>Sign out</span>
      </button>
    </div>
  );

  return (
    <TopNav
      className={className}
      left={
        <Link to="/dashboard" aria-label="VETT — Dashboard">
          <Logo responsive />
        </Link>
      }
      right={desktopRight}
      mobileMenu={mobileMenu}
    />
  );
}

export default AuthedTopNav;
