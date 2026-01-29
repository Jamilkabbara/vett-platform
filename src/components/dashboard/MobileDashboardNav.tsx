import { FileText, Target, Smartphone } from 'lucide-react';

interface MobileDashboardNavProps {
  activeView: 'mission' | 'targeting' | 'preview';
  onViewChange: (view: 'mission' | 'targeting' | 'preview') => void;
}

export const MobileDashboardNav = ({ activeView, onViewChange }: MobileDashboardNavProps) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[420px] glass-panel h-[72px] rounded-[2rem] flex items-center justify-around px-6 z-[60] shadow-2xl shadow-black/50 backdrop-blur-3xl bg-[#0B0C15]/90 border border-white/10 md:hidden">
      <button
        onClick={() => onViewChange('mission')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          activeView === 'mission' ? 'text-primary' : 'text-white/30 hover:text-white'
        }`}
      >
        <FileText className="w-6 h-6" />
        <span className="text-xs font-bold uppercase tracking-wider">Mission</span>
      </button>
      <button
        onClick={() => onViewChange('targeting')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          activeView === 'targeting' ? 'text-neon-lime' : 'text-white/30 hover:text-white'
        }`}
      >
        <Target className="w-6 h-6" />
        <span className="text-xs font-bold uppercase tracking-wider">Targeting</span>
      </button>
      <button
        onClick={() => onViewChange('preview')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          activeView === 'preview' ? 'text-blue-400' : 'text-white/30 hover:text-white'
        }`}
      >
        <Smartphone className="w-6 h-6" />
        <span className="text-xs font-bold uppercase tracking-wider">Preview</span>
      </button>
    </div>
  );
};
