import { useState, useRef, useEffect } from 'react';
import {
  Download,
  ChevronDown,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileImage,
  Presentation,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  downloadCreativeAnalysisJson,
  downloadCreativeAnalysisCsv,
  downloadCreativeAnalysisPdf,
  downloadCreativeAnalysisPptx,
  downloadCreativeAnalysisXlsx,
} from '../../lib/exporters/creativeAttentionExports';
import type { CreativeAnalysis } from '../../types/creativeAnalysis';

/**
 * Pass 23 Bug 23.74 (quickship) — Creative Attention export menu.
 * Pass 32 X3 — PDF / PPTX / XLSX exporters wired in. All five formats
 * are now live; the legacy "Coming soon" placeholder is gone. The
 * heavy libs (jspdf, pptxgenjs, xlsx) are lazy-loaded by the exporter
 * functions so opening this menu has no extra cost.
 *
 * Dropdown button next to the page title on /creative-results.
 *   - PDF:   branded one-page-per-section report (jsPDF + autotable)
 *   - PPTX:  multi-slide deck with bar chart for top emotions (pptxgenjs)
 *   - XLSX:  multi-sheet workbook with frame-level data (SheetJS xlsx)
 *   - CSV:   flattened sectioned spreadsheet (UTF-8 BOM, RFC-4180 CRLF)
 *   - JSON:  full creative_analysis JSONB + mission metadata
 *
 * Menu closes on outside-click + on Escape (matches the existing
 * /results Export Data dropdown UX).
 */

interface CreativeExportMenuProps {
  analysis: CreativeAnalysis;
  missionId?: string;
  brand?: string | null;
}

export function CreativeExportMenu({ analysis, missionId, brand }: CreativeExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
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

  /**
   * runAsync — wraps the lazy-loaded exporters with toast feedback so
   * the user knows the heavy lib is fetching. The exporters return
   * Promises (PDF / PPTX / XLSX); CSV / JSON are sync but use the
   * same wrapper for consistency.
   */
  const runAsync = async (label: string, run: () => Promise<void> | void) => {
    setOpen(false);
    setBusy(label);
    try {
      await run();
      toast.success(`${label} downloaded`);
    } catch (err) {
      console.error('Creative Attention export failed', err);
      toast.error(`${label} export failed — try again`);
    } finally {
      setBusy(null);
    }
  };

  const handleCsv = () => runAsync('CSV', () => downloadCreativeAnalysisCsv(analysis, { missionId, brand }));
  const handleJson = () => runAsync('JSON', () => downloadCreativeAnalysisJson(analysis, { missionId, brand }));
  const handlePdf = () => runAsync('PDF', () => downloadCreativeAnalysisPdf(analysis, { missionId, brand }));
  const handlePptx = () => runAsync('PPTX', () => downloadCreativeAnalysisPptx(analysis, { missionId, brand }));
  const handleXlsx = () => runAsync('XLSX', () => downloadCreativeAnalysisXlsx(analysis, { missionId, brand }));

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy != null}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/15 rounded-xl text-sm font-bold text-white hover:bg-white/10 hover:border-white/25 transition-all disabled:opacity-60 disabled:cursor-wait"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download className="w-4 h-4" aria-hidden />
        {busy ? `Preparing ${busy}…` : 'Export'}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          <ExportItem
            icon={<FileImage className="w-5 h-5 text-rose-300" aria-hidden />}
            label="PDF report"
            sub="Branded multi-section document"
            onClick={handlePdf}
          />
          <ExportItem
            icon={<Presentation className="w-5 h-5 text-amber-300" aria-hidden />}
            label="PowerPoint deck"
            sub="Slides with emotion bar chart"
            onClick={handlePptx}
          />
          <ExportItem
            icon={<FileSpreadsheet className="w-5 h-5 text-emerald-300" aria-hidden />}
            label="Excel workbook"
            sub="Multi-sheet XLSX with all data"
            onClick={handleXlsx}
          />
          <ExportItem
            icon={<FileText className="w-5 h-5 text-blue-300" aria-hidden />}
            label="CSV (flattened)"
            sub="Spreadsheet-ready, all sections"
            onClick={handleCsv}
          />
          <ExportItem
            icon={<FileJson className="w-5 h-5 text-purple-300" aria-hidden />}
            label="JSON (full data)"
            sub="Raw creative_analysis JSONB"
            onClick={handleJson}
          />
        </div>
      ) : null}
    </div>
  );
}

function ExportItem({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-700/50 last:border-b-0"
    >
      <div className="flex items-center justify-center w-10 h-10 bg-white/5 rounded-lg shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-bold text-sm">{label}</div>
        <div className="text-white/60 text-xs">{sub}</div>
      </div>
    </button>
  );
}

export default CreativeExportMenu;
