import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { effectiveBound } from '../../lib/sampleSizeMinimums';

/**
 * Pass 29 B3 — sample-size guidance caption rendered below the
 * respondent slider on every methodology-bound setup page.
 *
 * Render rules:
 *   respondentCount >= best  → small lime caption (strong sample)
 *   min <= count < best      → small gray caption (adequate)
 *   count < min              → amber warning (directional only)
 *
 * Does NOT block submission. VETT's value prop is fast directional
 * research; small-n studies are valid sniff tests. Just be transparent.
 *
 * For per-concept methodologies (Sequential Monadic, Naming Monadic,
 * Monadic + Paired), pass conceptCount = N to multiply the bounds.
 * Default 1.
 */

interface Props {
  methodology: string;
  respondentCount: number;
  conceptCount?: number;
}

export function SampleSizeGuidance({
  methodology,
  respondentCount,
  conceptCount = 1,
}: Props) {
  const bound = effectiveBound(methodology, conceptCount);
  if (!bound) return null;

  const n = Math.max(0, Math.floor(respondentCount));
  const perConcept = conceptCount > 1
    ? ` (${bound.min}/concept × ${conceptCount} concepts)`
    : '';

  if (n >= bound.best) {
    return (
      <p className="mt-2 text-[11px] text-[var(--lime)] flex items-start gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 mt-px shrink-0" />
        <span>
          Strong sample for {bound.label} (n={n}, best ≥{bound.best}{perConcept}).
        </span>
      </p>
    );
  }

  if (n >= bound.min) {
    return (
      <p className="mt-2 text-[11px] text-[var(--t3)] flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 mt-px shrink-0" />
        <span>
          Adequate sample for {bound.label} (n={n}, best ≥{bound.best}{perConcept}).
          Sub-segment cuts may be unstable.
        </span>
      </p>
    );
  }

  return (
    <p className="mt-2 text-[11px] text-amber-400 flex items-start gap-1.5">
      <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
      <span>
        {bound.label} typically requires ≥{bound.min} respondents{perConcept}.
        At n={n}, output is directional only — not statistically conclusive.
      </span>
    </p>
  );
}

export default SampleSizeGuidance;
