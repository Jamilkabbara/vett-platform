import { Zap } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = '' }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 bg-gradient-to-br from-neon-lime to-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
        <Zap className="w-5 h-5 text-gray-900" fill="currentColor" />
      </div>
      <span className="text-xl font-black text-white tracking-wider">VETT</span>
    </div>
  );
};
