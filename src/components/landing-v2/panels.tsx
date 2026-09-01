/**
 * The four "chart in a glass panel" demos from vett-landing.html:
 *
 *   PriceSensitivityPanel - Van Westendorp four-curve plot (.psm)
 *   CreativeAttentionPanel - emotion bars + attention heatmap
 *   NpsPanel               - NPS score, split bar, satisfaction dimensions
 *   BrandRadarPanel        - six-axis brand-perception radar
 *
 * SVG geometry, point lists and colour stops are copied verbatim from the
 * mock. The mock's IntersectionObserver draw-on transitions are driven here
 * by `useInView`, which toggles the `lv2-in` class the CSS file keys off.
 */
import { DemoCard } from './primitives';
import { useCountUp, useInView } from './hooks';

/* ══════════════════════════════════════════════════════════════════════
   Van Westendorp price sensitivity
════════════════════════════════════════════════════════════════════════ */

const PSM_LINES = [
  { color: '#A6E0CF', delay: '0ms',   points: '60,67.6 120,82.8 180,113.2 240,155 300,193 360,219.6 420,234.8 480,242.4' },
  { color: '#7C7BF5', delay: '100ms', points: '60,79 120,98 180,124.6 240,158.8 300,189.2 360,212 420,227.2 480,236.7' },
  { color: '#F2B24A', delay: '200ms', points: '60,238.6 120,227.2 180,208.2 240,174 300,139.8 360,113.2 420,90.4 480,79' },
  { color: '#F2748C', delay: '300ms', points: '60,244.3 120,236.7 180,219.6 240,185.4 300,143.6 360,109.4 420,82.8 480,69.5' },
];

const PSM_LEGEND = [
  { color: '#A6E0CF', label: 'Too cheap' },
  { color: '#7C7BF5', label: 'Cheap' },
  { color: '#F2B24A', label: 'Expensive' },
  { color: '#F2748C', label: 'Too expensive' },
];

export function PriceSensitivityPanel() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <DemoCard label="Price sensitivity, chilled meal kit (UAE)">
      <div ref={ref} className={inView ? 'lv2-in' : ''}>
        <svg viewBox="0 0 520 290" xmlns="http://www.w3.org/2000/svg" fontFamily="Inter" className="w-full h-auto block">
          <rect className="lv2-psm-band" x="205" y="60" width="115" height="190" fill="rgba(190,242,100,0.10)" />
          <line className="lv2-psm-band" x1="205" y1="60" x2="205" y2="250" stroke="rgba(190,242,100,0.35)" strokeWidth="1" strokeDasharray="3 3" />
          <line className="lv2-psm-band" x1="320" y1="60" x2="320" y2="250" stroke="rgba(190,242,100,0.35)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="60" y1="157" x2="480" y2="157" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="60" y1="60" x2="480" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="60" y1="250" x2="480" y2="250" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          <line x1="60" y1="60" x2="60" y2="250" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x="52" y="64" textAnchor="end" fill="#5C6470" fontSize="10">100%</text>
          <text x="52" y="161" textAnchor="end" fill="#5C6470" fontSize="10">50%</text>
          <text x="52" y="253" textAnchor="end" fill="#5C6470" fontSize="10">0%</text>
          <text x="60" y="270" fill="#5C6470" fontSize="11">Lower price</text>
          <text x="480" y="270" textAnchor="end" fill="#5C6470" fontSize="11">Higher price</text>
          {PSM_LINES.map((l) => (
            <polyline
              key={l.color}
              className="lv2-psm-line"
              pathLength={1}
              stroke={l.color}
              points={l.points}
              style={{ transitionDelay: l.delay }}
            />
          ))}
          <g className="lv2-psm-opt">
            <line x1="263" y1="60" x2="263" y2="250" stroke="#BEF264" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.85" />
            <circle cx="263" cy="169" r="11" fill="rgba(190,242,100,0.22)" />
            <circle cx="263" cy="169" r="5" fill="#BEF264" />
            <text x="263" y="50" textAnchor="middle" fill="#BEF264" fontSize="12" fontFamily="Manrope" fontWeight="700">
              Optimal
            </text>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-[9px] mx-0.5 mt-3.5 text-xs text-[#8B919C]">
        {PSM_LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-[7px]">
            <i className="w-[15px] h-[3px] rounded-sm inline-block" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="text-[13px] text-[#8B919C] border-t border-white/[0.07] pt-3.5 mt-1.5">
        Optimal price point: <b className="font-['Manrope',system-ui,sans-serif] text-[#BEF264]">$9</b>
        <br />
        Range of acceptable pricing: $7 to 11 &middot; n = 80
      </div>
    </DemoCard>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Creative attention: emotion bars + attention heatmap
════════════════════════════════════════════════════════════════════════ */

const EMOTIONS: Array<[string, number, string]> = [
  ['Joy', 74, '#BEF264'],
  ['Anticipation', 61, '#A6E0CF'],
  ['Trust', 55, '#7C7BF5'],
  ['Surprise', 38, '#F2B24A'],
  ['Fear', 8, '#F2748C'],
];

const HEAT = [88, 84, 80, 76, 70, 64, 72, 78, 66, 52, 40, 34, 46, 58, 70, 77];

/** Mock's heat -> colour ramp, ported exactly. */
function heatColor(v: number): string {
  if (v > 66) return `rgba(190,242,100,${v / 100})`;
  if (v > 46) return `rgba(242,178,74,${v / 100 + 0.2})`;
  return `rgba(242,116,140,${0.5 + (50 - v) / 100})`;
}

/** `.emorow` - label, animated track, value. */
export function BarRow({
  label,
  pct,
  color,
  grown,
}: {
  label: string;
  pct: number;
  color: string;
  grown: boolean;
}) {
  return (
    <div className="grid grid-cols-[90px_1fr_44px] items-center gap-3.5 mb-3 text-[13.5px]">
      <span>{label}</span>
      <div className="h-2.5 rounded-md bg-[#1B1E2B] overflow-hidden">
        <i
          className="block h-full rounded-md"
          style={{
            width: grown ? `${pct}%` : 0,
            background: color,
            transition: 'width 1.1s cubic-bezier(.22,1,.36,1)',
          }}
        />
      </div>
      <span className="font-['Manrope',system-ui,sans-serif] font-bold text-right text-[#8B919C]">{pct}%</span>
    </div>
  );
}

export function CreativeAttentionPanel() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);

  return (
    <DemoCard label="Emotion response, meal kit ad (30s)" innerRef={ref}>
      {EMOTIONS.map(([label, pct, color]) => (
        <BarRow key={label} label={label} pct={pct} color={color} grown={inView} />
      ))}

      <div className="text-[10.5px] tracking-[0.16em] uppercase text-[#5C6470] font-semibold mt-5 mb-2.5">
        Attention heatmap
      </div>
      <div className="flex gap-1 mb-2.5">
        {HEAT.map((v, i) => (
          <i key={i} className="flex-1 h-[34px] rounded" style={{ background: heatColor(v) }} />
        ))}
      </div>
      <div className="text-xs text-[#5C6470]">
        Frame-by-frame attention score (green = high attention &middot; red = low)
      </div>

      <div className="text-[13px] text-[#8B919C] border-t border-white/[0.07] pt-3.5 mt-1.5">
        Engagement score: <b className="font-['Manrope',system-ui,sans-serif] text-[#BEF264]">78/100</b>
        <br />
        Strong opening, slight drop in attention at 22s
      </div>
    </DemoCard>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Customer satisfaction / NPS
════════════════════════════════════════════════════════════════════════ */

const CSAT: Array<[string, number, string]> = [
  ['Ease of use', 88, '#BEF264'],
  ['Support', 81, '#A6E0CF'],
  ['Value', 74, '#7C7BF5'],
];

export function NpsPanel() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const nps = useCountUp(48, inView);

  return (
    <DemoCard label="Customer satisfaction, banking app (KSA)" innerRef={ref}>
      <div className="flex items-center gap-[15px] mb-5">
        <div className="font-['Manrope',system-ui,sans-serif] font-extrabold text-[52px] text-[#BEF264] leading-none">
          <span className="text-[30px] align-[8px] opacity-75 mr-px">+</span>
          {nps}
        </div>
        <div>
          <div className="font-['Manrope',system-ui,sans-serif] font-bold text-[14.5px]">Net Promoter Score</div>
          <div className="text-[#8B919C] text-[12.5px] mt-[3px]">n = 200 &middot; CSAT 4.4 / 5</div>
        </div>
      </div>

      <div className="flex h-4 rounded-lg overflow-hidden bg-[#1B1E2B] gap-0.5">
        {([['#F2748C', 13], ['#F2B24A', 26], ['#BEF264', 61]] as const).map(([c, w]) => (
          <i
            key={c}
            className="rounded-[3px]"
            style={{
              background: c,
              width: inView ? `${w}%` : 0,
              transition: 'width 1.1s cubic-bezier(.22,1,.36,1)',
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3.5 gap-y-2 mt-[13px] text-xs text-[#8B919C]">
        {([['#F2748C', 'Detractors 13%'], ['#F2B24A', 'Passives 26%'], ['#BEF264', 'Promoters 61%']] as const).map(
          ([c, l]) => (
            <span key={l} className="inline-flex items-center gap-[7px]">
              <i className="w-[11px] h-[11px] rounded-[3px]" style={{ background: c }} />
              {l}
            </span>
          ),
        )}
      </div>

      <div className="text-[10.5px] tracking-[0.16em] uppercase text-[#5C6470] font-semibold mt-5 mb-[11px]">
        Satisfaction by dimension
      </div>
      <div className="mt-1">
        {CSAT.map(([label, pct, color]) => (
          <BarRow key={label} label={label} pct={pct} color={color} grown={inView} />
        ))}
      </div>
    </DemoCard>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Brand perception radar
════════════════════════════════════════════════════════════════════════ */

const RADAR_AXES = ['Trust', 'Value', 'Quality', 'Innovation', 'Awareness', 'Loyalty'];
const RADAR_BRAND = [0.82, 0.7, 0.86, 0.92, 0.55, 0.76];
const RADAR_LEADER = [0.72, 0.6, 0.72, 0.55, 0.9, 0.68];
const RADAR_R = 92;
const RADAR_CX = 150;
const RADAR_CY = 135;

function radarPoint(i: number, v: number): [number, number] {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return [
    +(RADAR_CX + RADAR_R * v * Math.cos(a)).toFixed(1),
    +(RADAR_CY + RADAR_R * v * Math.sin(a)).toFixed(1),
  ];
}
const ring = (level: number) =>
  RADAR_AXES.map((_, i) => radarPoint(i, level).join(',')).join(' ');

export function BrandRadarPanel() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <DemoCard label="Brand perception vs category leader">
      <div ref={ref} className={`flex justify-center py-0.5 ${inView ? 'lv2-in' : ''}`}>
        <svg viewBox="0 0 300 270" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[340px] h-auto block">
          {[0.25, 0.5, 0.75, 1].map((l) => (
            <polygon key={l} points={ring(l)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          ))}
          {RADAR_AXES.map((lab, i) => {
            const [ex, ey] = radarPoint(i, 1);
            const [lx, ly] = radarPoint(i, 1.2);
            const anchor = Math.abs(lx - RADAR_CX) < 8 ? 'middle' : lx < RADAR_CX ? 'end' : 'start';
            return (
              <g key={lab}>
                <line x1={RADAR_CX} y1={RADAR_CY} x2={ex} y2={ey} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={lx} y={ly + 3} textAnchor={anchor} fill="#8B919C" fontSize="10.5" fontFamily="Inter">
                  {lab}
                </text>
              </g>
            );
          })}
          <polygon
            className="lv2-radar-poly lv2-radar-leader"
            pathLength={1}
            points={RADAR_LEADER.map((v, i) => radarPoint(i, v).join(',')).join(' ')}
            stroke="#7C7BF5"
            fill="#7C7BF5"
          />
          <polygon
            className="lv2-radar-poly lv2-radar-brand"
            pathLength={1}
            points={RADAR_BRAND.map((v, i) => radarPoint(i, v).join(',')).join(' ')}
            stroke="#BEF264"
            fill="#BEF264"
          />
        </svg>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-[9px] mt-1.5 text-xs text-[#8B919C]">
        <span className="inline-flex items-center gap-[7px]">
          <i className="w-3 h-3 rounded-[3px] bg-[#BEF264]" />Your brand
        </span>
        <span className="inline-flex items-center gap-[7px]">
          <i className="w-3 h-3 rounded-[3px] bg-[#7C7BF5]" />Category leader
        </span>
      </div>

      <div className="text-[13px] text-[#8B919C] border-t border-white/[0.07] pt-3.5 mt-1.5">
        Strongest on <b className="font-['Manrope',system-ui,sans-serif] text-[#BEF264]">Innovation</b> and{' '}
        <b className="font-['Manrope',system-ui,sans-serif] text-[#BEF264]">Quality</b> &middot; Awareness gap vs leader:
        33 pts
      </div>
    </DemoCard>
  );
}
