import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Link2,
  Presentation,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MISSION_GOALS } from '../../data/missionGoals';

/**
 * Pass 46 Phase 1 — universal results action bar.
 *
 * Every methodology results page mounts this (sticky, above the fold)
 * and optionally its footer twin. It restores the three things the
 * report spec (§2, §5) requires on EVERY results view:
 *
 *   1. ← Back to missions — persistent navigation, not just a modal ×.
 *   2. Correct methodology label — sourced from MISSION_GOALS so a
 *      brand_lift mission reads "Brand Lift Study", never the generic
 *      fallback's "General Research".
 *   3. Export ▾ + Share — the backend has served PDF / PPTX / XLSX /
 *      raw-JSON exports since Pass 29 (/api/results/:id/export/*);
 *      the buttons simply stopped being mounted when the specialized
 *      renderers replaced the old generic /results view. The download
 *      logic here is the same authenticated blob fetch that view used.
 *
 * Mount in ALL states (loading / partial / error included) — the user
 * must always be able to leave the page or grab the raw data.
 */

type ExportFormat = 'pdf' | 'pptx' | 'xlsx' | 'raw';

const API_URL =
  import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

const FORMATS: Array<{
  format: ExportFormat;
  label: string;
  ext: string;
  Icon: typeof FileText;
}> = [
  { format: 'pdf', label: 'PDF report', ext: 'pdf', Icon: FileText },
  { format: 'pptx', label: 'PowerPoint deck', ext: 'pptx', Icon: Presentation },
  { format: 'xlsx', label: 'Excel workbook', ext: 'xlsx', Icon: FileSpreadsheet },
  { format: 'raw', label: 'Raw JSON', ext: 'json', Icon: FileJson },
];

export function methodologyLabel(goalType?: string | null): string {
  if (!goalType) return 'Research Study';
  const goal = MISSION_GOALS.find((g) => g.id === goalType);
  if (goal) return goal.label;
  // Legacy goal_type spellings that predate the canonical ids.
  if (goalType === 'general_research') return 'General Research';
  return 'Research Study';
}

export interface ResultsActionBarProps {
  missionId?: string | null;
  /** Mission title shown next to the methodology chip. */
  title?: string | null;
  goalType?: string | null;
  completedAt?: string | null;
  /** Qualified-respondent count for the "n=" credibility chip. */
  qualified?: number | null;
  /** 'header' (sticky, default) or 'footer' (static, slimmer). */
  variant?: 'header' | 'footer';
}

export function ResultsActionBar({
  missionId,
  title,
  goalType,
  completedAt,
  qualified,
  variant = 'header',
}: ResultsActionBarProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setOpen(false);
    if (!missionId) {
      toast.error('Export unavailable — mission not loaded yet');
      return;
    }
    const meta = FORMATS.find((f) => f.format === format)!;
    setBusy(format);
    const id = toast.loading(`Generating ${meta.label}…`);
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`${API_URL}/api/results/${missionId}/export/${format}`, { headers });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (title || 'vett_results').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 60);
      link.href = url;
      link.download = `${safeName}.${meta.ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`${meta.label} downloaded`, { id });
    } catch (err) {
      console.error('Results export failed', err);
      toast.error(`${meta.label} failed — try again`, { id });
    } finally {
      setBusy(null);
    }
  };

  const label = methodologyLabel(goalType);
  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const isHeader = variant === 'header';

  return (
    <div
      className={[
        isHeader
          ? 'sticky top-0 z-40 bg-bg1/95 backdrop-blur border-b border-b2'
          : 'border-t border-b2 mt-10',
        'px-4 md:px-6 py-3',
      ].join(' ')}
    >
      <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap">
        <Link
          to="/missions"
          className="inline-flex items-center gap-1.5 text-t3 hover:text-lime transition-colors font-display font-semibold text-[12px] shrink-0"
        >
          <ArrowLeft size={14} aria-hidden />
          Missions
        </Link>

        <span className="inline-flex items-center rounded-full px-2 py-[2px] bg-lime/10 border border-lime/25 text-lime font-display font-bold text-[10px] uppercase tracking-wider shrink-0">
          {label}
        </span>

        {isHeader && title && (
          <span className="font-display font-bold text-t1 text-[13px] truncate min-w-0 flex-1">
            {title}
          </span>
        )}
        {!isHeader && (
          <span className="font-body text-t3 text-[11px] flex-1">
            {`n=${qualified ?? '—'} · ${label} · generated by VETT`}
          </span>
        )}

        {isHeader && (
          <span className="hidden md:inline font-body text-t3 text-[11px] shrink-0">
            {[dateStr, qualified != null ? `n=${qualified}` : null].filter(Boolean).join(' · ')}
          </span>
        )}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-b2 bg-bg3 px-2.5 py-1.5 text-t1 hover:border-t3 transition-colors font-display font-semibold text-[12px]"
          >
            <Link2 size={13} aria-hidden />
            Share
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              disabled={busy !== null}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Export report"
              className="inline-flex items-center gap-1.5 rounded-lg bg-lime px-2.5 py-1.5 text-black hover:opacity-90 transition-opacity font-display font-bold text-[12px] disabled:opacity-60"
            >
              <Download size={13} aria-hidden />
              {busy ? 'Exporting…' : 'Export'}
              <ChevronDown size={12} aria-hidden />
            </button>
            {open && (
              <div role="menu" className="absolute right-0 mt-1.5 w-52 rounded-xl border border-b2 bg-bg3 shadow-xl overflow-hidden z-50">
                {FORMATS.map(({ format, label: fLabel, Icon }) => (
                  <button
                    key={format}
                    type="button"
                    role="menuitem"
                    onClick={() => handleExport(format)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-t1 hover:bg-white/5 transition-colors font-body text-[12px]"
                  >
                    <Icon size={14} className="text-t3" aria-hidden />
                    {fLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsActionBar;
