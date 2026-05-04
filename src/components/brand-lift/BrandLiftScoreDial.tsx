interface Props {
  score: number;
  bandExplanation?: string;
}

const BANDS = [
  { min: 85, label: 'ELITE',   color: '#BEF264' },
  { min: 70, label: 'STRONG',  color: '#BEF264' },
  { min: 50, label: 'AVERAGE', color: '#F59E0B' },
  { min: 30, label: 'WEAK',    color: '#FB923C' },
  { min: 0,  label: 'POOR',    color: '#F87171' },
];

/**
 * Pass 25 Phase 1E — hero radial. Score is a weighted avg over the 5
 * KPI categories (computed by the page that owns this component).
 */
export function BrandLiftScoreDial({ score, bandExplanation }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band = BANDS.find(b => clamped >= b.min) || BANDS[BANDS.length - 1];
  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-8 flex flex-col items-center gap-4">
      <div
        className="relative w-44 h-44 rounded-full flex items-center justify-center"
        style={{ background: `conic-gradient(${band.color} ${clamped * 3.6}deg, #1F2937 0deg)` }}
      >
        <div className="w-36 h-36 rounded-full bg-[var(--bg2)] flex flex-col items-center justify-center">
          <span className="text-5xl font-black" style={{ color: band.color }}>{clamped}</span>
          <span className="text-[10px] text-[var(--t3)] uppercase tracking-wider mt-0.5">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-[var(--t3)]">Brand Lift Score</p>
        <p className="text-lg font-bold mt-1" style={{ color: band.color }}>{band.label}</p>
      </div>
      {bandExplanation && (
        <p className="text-xs text-[var(--t2)] text-center max-w-md leading-relaxed">{bandExplanation}</p>
      )}
    </div>
  );
}

export default BrandLiftScoreDial;
