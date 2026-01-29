import { ReactNode } from 'react';
import { DashboardNavbar } from './DashboardNavbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-[100dvh]">
      <DashboardNavbar />
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
};
