import { Sparkles, Users, TrendingUp, Clock } from 'lucide-react';
import { ShareButton } from './ShareButton';

/**
 * Pass 23 Bug 23.60 Chunk 3 — Executive Summary card.
 *
 * Magazine-style pull-quote treatment:
 *   - First sentence of the first paragraph renders as a bold,
 *     larger lead. This is what the reader's eye lands on.
 *   - Remaining sentences + remaining paragraphs render as
 *     supporting body text at base reading size.
 *   - Three stat callouts below the body: Respondents · Top
 *     theme · Completion. Concrete numbers anchor the prose.
 *
 * The component is presentational. The parent ResultsPage passes
 * already-derived values; we don't re-fetch or re-aggregate.
 *
 * Visual contract preserved from the prior inline rendering
 * (gradient background, blue/purple/pink blur orbs, centered
 * heading) so this is a typography refresh rather than a
 * reskin — keeps the audit-chat verification surface tight.
 */

interface ExecutiveSummaryProps {
  /** The summary text. May be undefined while still generating. */
  executiveSummary?: string;
  /** Markdown payload for the Copy button. */
  summaryMarkdown: string;
  /** Total respondent count for the stat callout. */
  totalRespondents: number;
  /** Optional 0-1 fraction. Renders alongside total when hasScreening + < 99.9%. */
  qualificationRate?: number | null;
  /** Whether this mission ran a screener — affects qualification display. */
  hasScreening?: boolean;
  /**
   * Optional "top theme" callout text. Parent computes this so the
   * component stays presentational. Pass undefined to hide the slot
   * entirely.
   */
  topTheme?: string | null;
  /** Completion timestamp string ("2h ago", "Mar 5", etc.). */
  completedAt: string;
}

/**
 * Splits a paragraph into a lead sentence + remainder.
 *   "First. Second. Third."  →  { lead: "First.", rest: "Second. Third." }
 *   "Single sentence"        →  { lead: "Single sentence", rest: "" }
 *
 * Sentence terminator: `.`, `!`, or `?` followed by whitespace or
 * end-of-string. Avoids common false-positive cases (e.g. "Mr.",
 * "U.S.", numeric "$1.5") by requiring a following whitespace gap;
 * if the lead would be < 24 chars (i.e. likely abbreviation like
 * "Mr."), keep going until we get a real sentence break.
 */
function splitLeadSentence(paragraph: string): { lead: string; rest: string } {
  const trimmed = paragraph.trim();
  const sentenceEnd = /([.!?])\s+/g;
  let match: RegExpExecArray | null;
  while ((match = sentenceEnd.exec(trimmed)) !== null) {
    const idx = match.index + 1;
    if (idx >= 24) {
      return {
        lead: trimmed.slice(0, idx),
        rest: trimmed.slice(idx).trim(),
      };
    }
  }
  return { lead: trimmed, rest: '' };
}

export function ExecutiveSummary({
  executiveSummary,
  summaryMarkdown,
  totalRespondents,
  qualificationRate,
  hasScreening,
  topTheme,
  completedAt,
}: ExecutiveSummaryProps) {
  const paragraphs = (executiveSummary?.trim() || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const firstParagraph = paragraphs[0] ?? '';
  const restParagraphs = paragraphs.slice(1);
  const { lead, rest: firstRemainder } = splitLeadSentence(firstParagraph);

  const showQualifiedCallout =
    hasScreening &&
    qualificationRate != null &&
    Number.isFinite(qualificationRate) &&
    qualificationRate < 0.999;

  return (
    <div
      id="exec-summary"
      className="relative z-0 mb-8 max-w-3xl mx-auto scroll-mt-20"
    >
      <div className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-2xl p-8 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="absolute top-4 right-4 z-10">
          <ShareButton mode="summary" summaryMarkdown={summaryMarkdown} label="Copy" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Sparkles className="w-5 h-5 text-blue-400" aria-hidden />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Executive Summary</h2>
          </div>

          {executiveSummary ? (
            <div className="space-y-4">
              {/* Lead sentence — pull-quote treatment */}
              <p className="text-white text-lg md:text-xl font-semibold leading-relaxed">
                {lead}
              </p>

              {/* Remainder of first paragraph + further paragraphs */}
              {firstRemainder ? (
                <p className="text-white/80 text-base md:text-lg leading-relaxed">
                  {firstRemainder}
                </p>
              ) : null}
              {restParagraphs.map((para, i) => (
                <p
                  key={i}
                  className="text-white/80 text-base md:text-lg leading-relaxed"
                >
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-white/50 text-base italic">
              Executive summary is being generated...
            </p>
          )}

          {/* Stat callouts — concrete numbers under the prose. */}
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCallout
              icon={<Users className="w-4 h-4 text-blue-300" aria-hidden />}
              label="Respondents"
              value={
                showQualifiedCallout
                  ? `${totalRespondents} · ${Math.round((qualificationRate as number) * 100)}% qualified`
                  : `${totalRespondents}`
              }
            />
            <StatCallout
              icon={<TrendingUp className="w-4 h-4 text-purple-300" aria-hidden />}
              label="Top theme"
              value={topTheme ?? '—'}
            />
            <StatCallout
              icon={<Clock className="w-4 h-4 text-pink-300" aria-hidden />}
              label="Completed"
              value={completedAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCallout({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
          {label}
        </div>
        <div className="text-sm md:text-base font-semibold text-white mt-0.5 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

export default ExecutiveSummary;
