import type { ReactNode } from 'react';
import { Card } from './Card';

/**
 * Stat tile — mirrors prototype.html's .stat-n / .stat-l pair, with a
 * shrunk label-first layout for dashboard KPI rows.
 *
 * The value font-size is clamped so it stays readable on phones and
 * expressive on desktop:
 *   mobile (<=375): 20px
 *   tablet:         22px
 *   desktop:        26px
 */
export type KpiColor = 'lime' | 'white' | 'grn' | 'red' | 'blu' | 'pur' | 'org';

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** Semantic color for the value — defaults to lime (prototype accent). */
  valueColor?: KpiColor;
  /** Optional icon shown in the top-right corner. */
  icon?: ReactNode;
  className?: string;
}

const VALUE_COLOR: Record<KpiColor, string> = {
  lime: 'text-lime',
  white: 'text-white',
  grn: 'text-grn',
  red: 'text-red',
  blu: 'text-blu',
  pur: 'text-pur',
  org: 'text-org',
};

export function KpiCard({
  label,
  value,
  sub,
  valueColor = 'lime',
  icon,
  className = '',
}: KpiCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="font-body text-[12px] md:text-[13px] text-t2 leading-tight">
          {label}
        </span>
        {icon && <span className="text-t2 shrink-0">{icon}</span>}
      </div>
      <div
        className={[
          'font-display font-black tracking-display-l leading-none',
          // clamp(20px, 4vw, 26px) — scale smoothly across breakpoints
          'text-[clamp(20px,4vw,26px)]',
          VALUE_COLOR[valueColor],
        ].join(' ')}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1.5 font-body text-[11px] md:text-[12px] text-t3">
          {sub}
        </div>
      )}
    </Card>
  );
}

export default KpiCard;
