import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string | ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}

export const CollapsibleSection = ({
  title,
  subtitle,
  icon,
  defaultExpanded = false,
  children,
  className = '',
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-white/5 transition group"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <div className="text-left">
            <div className="text-white font-medium text-sm sm:text-base">{title}</div>
            {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 group-hover:text-white/80 transition" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 group-hover:text-white/80 transition" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  );
};
