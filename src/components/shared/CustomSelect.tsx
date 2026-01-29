import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  prefix?: string;
}

export const CustomSelect = ({ value, onChange, options, prefix = '' }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block mx-1 align-baseline">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className="bg-primary/10 hover:bg-primary/20 transition-all active:scale-95 text-primary font-black px-3 py-1.5 rounded-xl inline-flex items-center gap-1 border border-primary/20 text-sm md:text-base"
      >
        {prefix} {value}
        <ChevronDown className="w-4 h-4" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-2 min-w-[160px] max-h-60 overflow-y-auto bg-[#161827] border border-white/10 rounded-xl shadow-2xl z-[70] flex flex-col p-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${
                  value === opt
                    ? 'bg-primary text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
