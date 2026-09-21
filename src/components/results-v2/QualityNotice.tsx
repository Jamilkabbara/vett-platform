/**
 * A study produced before the quality fixes of 20 September says so, at the
 * top of its own report.
 *
 * It sits above the figures rather than in a footnote: someone reading a
 * number needs to know before they act on it, not after. The study itself is
 * unchanged and still readable - it is what the customer paid for and the
 * record of what was delivered - and what is actually wrong with it is named
 * in plain words instead of a generic disclaimer.
 *
 * The server decides this per study from that study's own stored data
 * (backend services/report/qualityNotice.js). The page never infers it from a
 * date and never writes the wording itself.
 */
import { AlertTriangle } from 'lucide-react';

export interface ReportQuality {
  notice: string;
  flags: string[];
  reasons: string[];
  flagged_at: string | null;
  excluded_from_public: boolean;
}

export function QualityNotice({ quality }: { quality: ReportQuality }) {
  return (
    <div
      role="note"
      className="mx-auto mt-5 max-w-[1340px] rounded-[14px] border border-[#F2B24A]/40 bg-[#F2B24A]/[0.10] px-5 py-4 max-[680px]:px-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-[2px] h-[18px] w-[18px] shrink-0 text-[#F2B24A]" aria-hidden />
        <div>
          <p className="font-['Manrope',system-ui,sans-serif] text-[14.5px] font-bold text-[#F2B24A]">
            {quality.notice}
          </p>
          {quality.reasons.length > 0 && (
            <ul className="mt-[6px] list-disc pl-[18px] text-[13.5px] leading-[1.6] text-[#C8CDD6]">
              {quality.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          <p className="mt-[7px] text-[12.5px] text-[#8B919C]">
            The study is unchanged and still available to read. It is not used in any public
            material, case study or benchmark.
          </p>
        </div>
      </div>
    </div>
  );
}

export default QualityNotice;
