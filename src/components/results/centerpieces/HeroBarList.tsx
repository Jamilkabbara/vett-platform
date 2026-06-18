/**
 * §F2 — adaptive wrapping bar list for centerpiece heroes (Compare forced-choice,
 * Naming win-rate) when option labels are long. SVG <text> can't wrap, so a
 * cramped axis slices labels to ~20 chars; a hover <title> is no fix (fails on
 * mobile and isn't a substitute). This renders plain HTML rows with FULL,
 * wrapping labels (never ellipsis), a proportional bar, the %, and an optional
 * sub-line (n / count). The winner is highlighted in lime.
 */
export interface HeroBarRow {
  label: string;
  /** 0–100, drives the bar width (and the displayed % unless valueText is set). */
  pct: number | null;
  /** Override the displayed value (e.g. a composite score that isn't a percent). */
  valueText?: string;
  sub?: string;
  isWinner?: boolean;
}

export function HeroBarList({ rows }: { rows: HeroBarRow[] }) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const maxPct = Math.max(...rows.map((r) => r.pct ?? 0), 1);
  return (
    <ul className="mt-3 space-y-3.5">
      {rows.map((r, i) => (
        <li key={i} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            {/* full, wrapping label — never sliced, never ellipsis */}
            <span className={`text-xs leading-snug break-words ${r.isWinner ? 'text-lime font-bold' : 'text-t1'}`}>
              {r.label}
            </span>
            <span className={`text-xs font-black tabular-nums shrink-0 ${r.isWinner ? 'text-lime' : 'text-t1'}`}>
              {r.valueText ?? (r.pct != null ? `${Math.round(r.pct)}%` : '—')}
            </span>
          </div>
          <div className="h-2 rounded-full bg-bg3 overflow-hidden">
            <div
              className={`h-full rounded-full ${r.isWinner ? 'bg-lime' : 'bg-t3/45'}`}
              style={{ width: `${((r.pct ?? 0) / maxPct) * 100}%` }}
            />
          </div>
          {r.sub && <p className="text-[10px] text-t3">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
