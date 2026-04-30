import type { ReactNode } from 'react';

/**
 * Pass 23 Bug 23.60 — Results page section header.
 *
 * Single-source pattern for the header rows above each results
 * section (Executive Summary, Tensions Flagged, Cross-Cut Analysis,
 * Screening Funnel, Per-Question Analysis, Recommended Next Step).
 *
 * Responsibilities:
 *   - Render the title with consistent typography across sections.
 *   - Optionally apply an anchor id so sibling Tensions cards and
 *     ShareButton can scroll-to-section via #anchor-id.
 *   - Optionally render a trailing pill (severity, count, status)
 *     and an optional action slot on the right.
 *
 * Visual contract (matches the existing ResultsPage typography to
 * avoid a regression — only the wiring is centralized here):
 *   - h2: text-xl md:text-2xl, font-bold, text-white
 *   - amber-accent variant available for Tensions section
 *   - 16px gap between header row and section body (mb-4)
 */

type Variant = 'default' | 'amber';

interface SectionHeaderProps {
  title: string;
  /** Anchor id for scroll-to-section. Rendered on the wrapping div, not the heading. */
  anchorId?: string;
  /** Trailing pill (severity / count / status). Rendered next to the title. */
  pill?: ReactNode;
  /** Right-aligned action (button, link). Pushed to the right edge of the row. */
  action?: ReactNode;
  /** Visual accent. `amber` for Tensions Flagged, `default` for everything else. */
  variant?: Variant;
  /** Optional icon node rendered before the title. */
  icon?: ReactNode;
  /** Sub-headline below the title (smaller, t3). */
  subtitle?: string;
}

const variantClasses: Record<Variant, string> = {
  default: 'text-white',
  amber: 'text-amber-300',
};

export function SectionHeader({
  title,
  anchorId,
  pill,
  action,
  variant = 'default',
  icon,
  subtitle,
}: SectionHeaderProps) {
  return (
    <div id={anchorId} className="scroll-mt-20 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon ? <span className="shrink-0" aria-hidden>{icon}</span> : null}
          <h2 className={`text-xl md:text-2xl font-bold ${variantClasses[variant]} truncate`}>
            {title}
          </h2>
          {pill ? <span className="shrink-0">{pill}</span> : null}
        </div>
        {action ? <span className="shrink-0">{action}</span> : null}
      </div>
      {subtitle ? (
        <p className="mt-1 text-sm text-white/60">{subtitle}</p>
      ) : null}
    </div>
  );
}

export default SectionHeader;
