import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Pass 23 Bug 23.60 — Results page Share / Copy-summary button.
 *
 * Two modes via prop:
 *   - 'link'    : copies the current page URL with the deep-link
 *                 anchor (default behavior — for the header Share
 *                 button next to Export Data).
 *   - 'summary' : copies the executive summary as Markdown for
 *                 Slack / Notion / email paste. Used inline next
 *                 to the Executive Summary heading.
 *
 * The component is intentionally small: the two modes share the
 * same visual treatment (ghost button, transitions to a check icon
 * for 1.6s after copy), they only differ in payload.
 *
 * Markdown shape (summary mode):
 *   # {missionName}
 *   ## Executive Summary
 *   {executiveSummary text}
 *   ---
 *   {totalRespondents} respondents · Completed {completedAt}
 *
 * If the browser refuses navigator.clipboard (private mode, http
 * origin), falls back to a hidden textarea + execCommand('copy').
 * On any failure, surfaces a toast.error so the user knows.
 */

type Mode = 'link' | 'summary';

interface ShareButtonProps {
  mode: Mode;
  /** For mode='summary': the markdown payload to copy. */
  summaryMarkdown?: string;
  /** Optional className override for visual placement. */
  className?: string;
  /** Override the default label. */
  label?: string;
}

const COPY_FEEDBACK_MS = 1600;

async function copyToClipboard(text: string): Promise<boolean> {
  // Modern path
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to textarea */ }

  // Legacy fallback for private mode / http origin
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function ShareButton({
  mode,
  summaryMarkdown,
  className = '',
  label,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const defaultLabel = mode === 'summary' ? 'Copy summary' : 'Share';

  const handleClick = async () => {
    const payload =
      mode === 'summary'
        ? (summaryMarkdown ?? '')
        : window.location.href;

    if (mode === 'summary' && !payload) {
      toast.error('No summary available to copy yet.');
      return;
    }

    const ok = await copyToClipboard(payload);
    if (!ok) {
      toast.error('Could not copy to clipboard.');
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);

    if (mode === 'summary') {
      toast.success('Summary copied as Markdown.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'flex items-center gap-2 px-4 py-2 rounded-xl border',
        'border-white/10 bg-white/5 text-white/60',
        'hover:text-white hover:border-white/20',
        'transition-all text-sm font-medium shrink-0',
        className,
      ].join(' ')}
      aria-label={label ?? defaultLabel}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" aria-hidden />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" aria-hidden />
          {label ?? defaultLabel}
        </>
      )}
    </button>
  );
}

export default ShareButton;
