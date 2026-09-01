/**
 * LiveMission - React port of the mock's "Watch a mission simulate live"
 * panel (`.mission` + the vanilla-JS `runMission()` / `finish()` pair).
 *
 * Behaviour ported 1:1 from vett-landing.html:
 *   - four scenario chips; clicking one swaps the question and re-runs
 *   - 80 panel nodes light up staggered at 120ms + 10ms each, ~22% indigo
 *   - four persona rows stream in at 500ms + 260ms each
 *   - on completion the demand gauge sweeps and counts up, and the three
 *     scenario stats render
 *   - the panel auto-runs once, 400ms after scrolling into view
 *
 * All timers are tracked and cleared on unmount, and the run is guarded by
 * a `running` ref so a re-entrant click cannot interleave two runs.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { V2Button } from './primitives';
import { useCountUp } from './hooks';

const NODE_COUNT = 80;

interface Scenario {
  chip: string;
  question: string;
  demand: number;
  rows: Array<{ k: string; v: string; lime?: boolean }>;
}

const SCENARIOS: Scenario[] = [
  {
    chip: 'Market entry',
    question: 'Will premium plant-based ready-meals sell in Saudi Arabia?',
    demand: 62,
    rows: [
      { k: 'Purchase intent', v: '85%', lime: true },
      { k: 'Willingness to pay', v: '$8 to 11' },
      { k: 'Top barrier', v: 'Halal certification' },
    ],
  },
  {
    chip: 'Pricing',
    question: 'What is the right price for our chilled meal kit in the UAE?',
    demand: 58,
    rows: [
      { k: 'Price sweet spot', v: '$8 to 9', lime: true },
      { k: 'Intent at price', v: '71%' },
      { k: 'Drop-off above', v: '$11' },
    ],
  },
  {
    chip: 'Concept test',
    question: 'How appealing is a high-protein date energy bar to Gulf gym-goers?',
    demand: 67,
    rows: [
      { k: 'Concept appeal', v: '6.1 / 10', lime: true },
      { k: 'Purchase intent', v: '64%' },
      { k: 'Top driver', v: 'Clean ingredients' },
    ],
  },
  {
    chip: 'Messaging',
    question: 'Which tagline lands best: speed or freshness?',
    demand: 60,
    rows: [
      { k: 'Winning line', v: '"Fresh in 20"', lime: true },
      { k: 'Preference', v: '58%' },
      { k: 'Runner-up', v: '"Always on time"' },
    ],
  },
];

const ROLES = [
  'Marketing Manager', 'Business Owner', 'Dietitian', 'Software Engineer',
  'Parent of two', 'Fitness Coach', 'Procurement Lead', 'Retail Buyer',
  'Pharmacist', 'Content Creator',
];
const CITIES = ['Riyadh', 'Jeddah', 'Dubai', 'Abu Dhabi', 'Cairo', 'Dammam', 'Doha', 'Sharjah'];
const AGES = [24, 27, 29, 31, 34, 36, 38, 41, 45, 49, 52];
const FNAMES = ['Layla', 'Omar', 'Sara', 'Yousef', 'Maya', 'Karim', 'Nour', 'Tariq', 'Hana', 'Adam', 'Rana', 'Sami'];
const AV_COLORS = ['#BEF264', '#7C7BF5', '#F2B24A', '#A6E0CF', '#F2748C'];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

type NodeState = { on: boolean; alt: boolean; role: string; meta: string };
type StreamRow = { name: string; age: number; role: string; city: string; color: string };

const GAUGE_R = 50;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

export function LiveMission() {
  const [idx, setIdx] = useState(0);
  const [nodes, setNodes] = useState<NodeState[]>(() =>
    Array.from({ length: NODE_COUNT }, () => ({ on: false, alt: false, role: '', meta: '' })),
  );
  const [stream, setStream] = useState<StreamRow[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [tip, setTip] = useState<{ x: number; y: number; role: string; meta: string } | null>(null);

  const runningRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const scenario = SCENARIOS[idx];
  const shown = status === 'done';
  // Demand count-up runs once the panel finishes, same easing as the mock.
  const gaugeNum = useCountUp(scenario.demand, shown, 900);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const after = useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  const run = useCallback(
    (which: number) => {
      if (runningRef.current) return;
      runningRef.current = true;
      clearTimers();

      setIdx(which);
      setStatus('running');
      setStream([]);
      setNodes(Array.from({ length: NODE_COUNT }, () => ({ on: false, alt: false, role: '', meta: '' })));

      // Nodes light up one at a time - 120ms lead-in, 10ms apart.
      for (let k = 0; k < NODE_COUNT; k++) {
        after(120 + k * 10, () => {
          setNodes((prev) => {
            const next = prev.slice();
            next[k] = {
              on: true,
              alt: Math.random() < 0.22,
              role: pick(ROLES),
              meta: `${pick(AGES)}, ${pick(CITIES)}`,
            };
            return next;
          });
        });
      }

      // Four persona rows stream in alongside.
      for (let j = 0; j < 4; j++) {
        after(500 + j * 260, () => {
          setStream((prev) => [
            ...prev,
            {
              name: pick(FNAMES),
              age: pick(AGES),
              role: pick(ROLES),
              city: pick(CITIES),
              color: AV_COLORS[j % AV_COLORS.length],
            },
          ]);
        });
      }

      // All 80 have answered -> read the signal.
      after(120 + (NODE_COUNT - 1) * 10 + 20, () => {
        setStatus('done');
        runningRef.current = false;
      });
    },
    [after, clearTimers],
  );

  // Auto-run once, 400ms after the panel scrolls into view (mock: threshold .4).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            io.unobserve(entry.target);
            after(400, () => run(0));
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [after, run]);

  const dash = (scenario.demand / 100) * GAUGE_C;

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden rounded-[24px] border border-white/[0.13] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012))] shadow-[0_40px_100px_-50px_rgba(99,102,241,0.6)] after:content-[''] after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(124,123,245,0.6),transparent)]"
    >
      <div className="grid grid-cols-1 min-[980px]:grid-cols-[1.15fr_1fr]">
        {/* ── left: question, chips, run, node grid ───────────────────── */}
        <div className="p-7 border-b border-white/[0.07] min-[980px]:border-b-0 min-[980px]:border-r">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] tracking-[0.18em] uppercase text-[#5C6470] font-semibold">
              Live mission
            </span>
            <span className="flex items-center gap-[7px] text-[11.5px] text-[#BEF264]">
              <i className="lv2-livedot w-[7px] h-[7px] rounded-full bg-[#BEF264]" />
              synthetic panel
            </span>
          </div>

          <div className="bg-[#0B0C15] border border-white/[0.07] rounded-xl px-[15px] py-[14px] text-[14.5px] font-medium min-h-[50px] flex items-center gap-2.5">
            <span className="text-[#6366F1] shrink-0" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 9h8M8 13h5" />
                <path d="M21 12a8 8 0 1 1-3.3-6.5L21 4v5h-5" />
              </svg>
            </span>
            <span>{scenario.question}</span>
          </div>

          <div className="flex gap-2 flex-wrap my-3 mb-4">
            {SCENARIOS.map((s, i) => (
              <button
                key={s.chip}
                type="button"
                onClick={() => run(i)}
                className={[
                  'text-[12.5px] font-medium rounded-full px-[13px] py-[7px] border transition-all duration-150',
                  i === idx
                    ? 'text-[#BEF264] bg-[rgba(190,242,100,0.13)] border-[rgba(190,242,100,0.22)]'
                    : 'text-[#8B919C] bg-white/[0.025] border-white/[0.07] hover:text-[#F3F5EF] hover:border-white/[0.13]',
                ].join(' ')}
              >
                {s.chip}
              </button>
            ))}
          </div>

          <V2Button
            variant="lime"
            onClick={() => run(idx)}
            disabled={status === 'running'}
            className={`w-full ${status === 'running' ? 'opacity-70' : ''}`}
          >
            {status === 'running' ? 'Simulating' : status === 'done' ? 'Run again' : 'Run synthetic panel'}
            <ArrowRight className="w-4 h-4" />
          </V2Button>

          <div
            className="text-[12.5px] text-[#8B919C] mt-4 mb-3 min-h-[18px]"
            aria-live="polite"
          >
            {status === 'idle' && 'Tap a question, then run the panel.'}
            {status === 'running' && (
              <>
                Simulating <b className="text-[#BEF264] font-['Manrope',system-ui,sans-serif] font-bold">80</b> respondents matched to your audience...
              </>
            )}
            {status === 'done' && (
              <>
                <b className="text-[#BEF264] font-['Manrope',system-ui,sans-serif] font-bold">80</b> of 80 answered &middot; reading the signal
              </>
            )}
          </div>

          <div className="grid grid-cols-[repeat(16,1fr)] min-[600px]:grid-cols-[repeat(20,1fr)] gap-[5px]">
            {nodes.map((n, i) => (
              <div
                key={i}
                onMouseEnter={(e) =>
                  n.on && setTip({ x: e.clientX, y: e.clientY, role: n.role, meta: n.meta })
                }
                onMouseMove={(e) =>
                  n.on && setTip({ x: e.clientX, y: e.clientY, role: n.role, meta: n.meta })
                }
                onMouseLeave={() => setTip(null)}
                className={[
                  'aspect-square rounded-[3px] transition-[background,transform,box-shadow] duration-[250ms]',
                  n.on
                    ? n.alt
                      ? 'bg-[#6366F1] shadow-[0_0_8px_rgba(99,102,241,0.5)] hover:scale-150 hover:relative hover:z-[3]'
                      : 'bg-[#BEF264] shadow-[0_0_8px_rgba(190,242,100,0.5)] hover:scale-150 hover:relative hover:z-[3]'
                    : 'bg-[#1B1E2B]',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        {/* ── right: gauge, stats, respondent stream ───────────────────── */}
        <div className="p-7 flex flex-col">
          <div className={`transition-all duration-500 ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="flex items-center gap-[18px] mb-[18px]">
              <div className="relative w-[108px] h-[108px] shrink-0">
                <svg viewBox="0 0 120 120" width="108" height="108" className="-rotate-90">
                  <circle cx="60" cy="60" r={GAUGE_R} fill="none" stroke="#1B1E2B" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r={GAUGE_R}
                    fill="none"
                    stroke="#BEF264"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={shown ? `${dash} ${GAUGE_C - dash}` : `0 ${GAUGE_C}`}
                    style={{ transition: 'stroke-dasharray 1s cubic-bezier(.22,1,.36,1)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-['Manrope',system-ui,sans-serif] font-extrabold text-[28px] leading-none">
                    {gaugeNum}
                  </div>
                  <div className="text-[9.5px] text-[#8B919C] tracking-[0.05em] uppercase">demand</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {scenario.rows.map((r, i) => (
                  <div
                    key={r.k}
                    className={[
                      'flex items-baseline justify-between gap-2.5 text-[13px]',
                      i === scenario.rows.length - 1 ? '' : 'border-b border-white/[0.07] pb-[7px]',
                    ].join(' ')}
                  >
                    <span className="text-[#8B919C]">{r.k}</span>
                    <span
                      className={`font-['Manrope',system-ui,sans-serif] font-bold ${r.lime ? 'text-[#BEF264]' : ''}`}
                    >
                      {r.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-1 border-t border-white/[0.07] pt-3.5 flex-1 min-h-[150px]">
            <div className="text-[10px] tracking-[0.16em] uppercase text-[#5C6470] font-semibold mb-2.5">
              Respondents answering
            </div>
            {stream.map((p, i) => (
              <StreamRowView key={`${p.name}-${i}`} row={p} />
            ))}
          </div>
        </div>
      </div>

      {tip && (
        <div
          className="fixed z-[80] pointer-events-none rounded-[10px] border border-white/[0.13] border-l-[3px] border-l-[#6366F1] bg-[rgba(16,18,28,0.96)] backdrop-blur-xl px-[11px] py-2 text-xs shadow-[0_14px_36px_rgba(0,0,0,0.5)]"
          style={{ left: tip.x + 14, top: tip.y + 14 }}
        >
          <div className="font-['Manrope',system-ui,sans-serif] font-bold text-[12.5px]">{tip.role}</div>
          <div className="text-[#8B919C] text-[11.5px] mt-0.5">{tip.meta}</div>
        </div>
      )}
    </div>
  );
}

/** One `.prow` - mounts hidden, then flips to `lv2-in` on the next frame. */
function StreamRowView({ row }: { row: StreamRow }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className={`lv2-prow ${entered ? 'lv2-in' : ''} flex items-center gap-[11px] px-2 py-[7px] rounded-[10px]`}>
      <div
        className="w-[30px] h-[30px] rounded-lg shrink-0 grid place-items-center font-['Manrope',system-ui,sans-serif] font-bold text-xs text-[#0B0C15]"
        style={{ background: row.color }}
      >
        {row.name.charAt(0)}
      </div>
      <div>
        <div className="font-['Manrope',system-ui,sans-serif] font-bold text-[12.5px]">
          {row.name}, {row.age}
        </div>
        <div className="text-[#8B919C] text-[11px]">
          {row.role} &middot; {row.city}
        </div>
      </div>
    </div>
  );
}
