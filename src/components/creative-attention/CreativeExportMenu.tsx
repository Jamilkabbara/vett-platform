import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import {
  downloadCreativeAnalysisJson,
  downloadCreativeAnalysisCsv,
} from '../../lib/exporters/creativeAttentionExports';
import type { CreativeAnalysis } from '../../types/creativeAnalysis';

/**
 * Pass 23 Bug 23.74 (quickship) — Creative Attention export menu.
 *
 * Dropdown button next to the page title on /creative-results.
 * Two formats live today (client-side, no backend needed):
 *   - JSON: full creative_analysis JSONB + mission metadata
 *   - CSV:  flattened sectioned spreadsheet (UTF-8 BOM, RFC-4180
 *           CRLF) — opens cleanly in Excel/Numbers/Sheets
 *
 * PDF / PPTX / XLSX deferred to a follow-up that needs backend
 * HTML-to-PDF infrastructure (Bug 23.62 Option B). The placeholder
 * label below indicates the upcoming additions.
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

  const handleJson = () => {
    setOpen(false);
    downloadCreativeAnalysisJson(analysis, { missionId, brand });
  };

  const handleCsv = () => {
    setOpen(false);
    downloadCreativeAnalysisCsv(analysis, { missionId, brand });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/15 rounded-xl text-sm font-bold text-white hover:bg-white/10 hover:border-white/25 transition-all"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download className="w-4 h-4" aria-hidden />
        Export
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
          <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 font-bold">
              <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden />
              Coming soon
            </div>
            <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
              PDF report, PPTX deck, and XLSX workbook with chart
              renders need server-side HTML-to-image rendering — wiring
              up.
            </p>
          </div>
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
