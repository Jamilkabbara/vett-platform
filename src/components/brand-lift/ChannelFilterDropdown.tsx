import { ChevronDown } from 'lucide-react';

interface Channel { id: string; display_name: string }

interface Props {
  channels: Channel[];
  value: string | null;
  onChange: (next: string | null) => void;
}

/**
 * Pass 25 Phase 1E — channel filter. Re-renders all sections when
 * filtered (state lifted to BrandLiftResultsPage).
 */
export function ChannelFilterDropdown({ channels, value, onChange }: Props) {
  return (
    <div className="relative inline-block">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="appearance-none bg-[var(--bg3)] text-[var(--t1)] text-xs rounded-lg pl-3 pr-8 py-2 border border-[var(--b1)] focus:border-[var(--lime)] focus:outline-none cursor-pointer"
      >
        <option value="">All channels</option>
        {channels.map(c => (
          <option key={c.id} value={c.id}>{c.display_name}</option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--t3)]" />
    </div>
  );
}

export default ChannelFilterDropdown;
