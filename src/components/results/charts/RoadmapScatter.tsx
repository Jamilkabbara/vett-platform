/**
 * Pass 42 D4 — Roadmap importance vs feasibility quadrant scatter.
 *
 * X = importance score (1-5), Y = feasibility (1-5).
 * Dot size = mention frequency.
 * Color = quadrant (must-have / nice-to-have / fast-win / deprioritize).
 *
 * Reads chart_data.methodology_specific.roadmap = [
 *   { feature: "API access", importance: 4.2, feasibility: 3.8, mentions: 8 }, ...
 * ]
 */
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, ResponsiveContainer, Tooltip, ReferenceLine, CartesianGrid, Cell,
} from 'recharts';
import { useChartData } from '../../../hooks/useChartData';

interface RoadmapRow {
  feature?: string;
  name?: string;
  importance?: number;
  feasibility?: number;
  mentions?: number;
}

interface Props {
  missionId: string | undefined;
}

const MID = 3;

function quadrantColor(importance: number, feasibility: number): string {
  if (importance >= MID && feasibility >= MID) return '#A3E635';  // must-have (TR)
  if (importance < MID  && feasibility >= MID) return '#6B7280';  // nice-to-have (TL)
  if (importance >= MID && feasibility < MID)  return '#6366F1';  // fast-win (BR)
  return '#F59E0B';                                                // deprioritize (BL)
}

function quadrantLabel(importance: number, feasibility: number): string {
  if (importance >= MID && feasibility >= MID) return 'Must-have';
  if (importance < MID  && feasibility >= MID) return 'Nice-to-have';
  if (importance >= MID && feasibility < MID)  return 'Fast-win';
  return 'Deprioritize';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: RoadmapRow & { quadrant?: string } }>;
}

function ScatterTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  if (!p) return null;
  return (
    <div className="bg-[#1e293b]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-3 text-xs">
      <p className="text-white font-display font-bold mb-1">{p.feature ?? p.name}</p>
      <p className="text-t2">Importance <span className="text-white tabular-nums">{p.importance}</span></p>
      <p className="text-t2">Feasibility <span className="text-white tabular-nums">{p.feasibility}</span></p>
      {p.mentions != null && <p className="text-t2">Mentions <span className="text-white tabular-nums">{p.mentions}</span></p>}
      {p.quadrant && <p className="text-t3 mt-1 text-[10px] uppercase tracking-widest">{p.quadrant}</p>}
    </div>
  );
}

export function RoadmapScatter({ missionId }: Props) {
  const { data } = useChartData(missionId);
  const roadmap = (data?.methodology_specific as Record<string, unknown> | undefined)?.roadmap as
    | RoadmapRow[]
    | undefined;
  if (!Array.isArray(roadmap) || roadmap.length === 0) return null;

  const rows = roadmap
    .filter((r) => Number.isFinite(r.importance) && Number.isFinite(r.feasibility))
    .map((r) => ({
      ...r,
      feature: r.feature ?? r.name ?? '—',
      mentions: r.mentions ?? 1,
      quadrant: quadrantLabel(r.importance!, r.feasibility!),
    }));
  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-6">
      <h3 className="text-xs font-display font-black text-lime uppercase tracking-widest mb-4">
        Importance vs Feasibility
      </h3>
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ left: 4, right: 16, top: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            type="number"
            dataKey="importance"
            name="Importance"
            domain={[1, 5]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            label={{ value: 'Importance', position: 'insideBottom', offset: -4, fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="feasibility"
            name="Feasibility"
            domain={[1, 5]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            label={{ value: 'Feasibility', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
          />
          <ZAxis type="number" dataKey="mentions" range={[40, 280]} />
          <ReferenceLine x={MID} stroke="#475569" strokeDasharray="3 3" />
          <ReferenceLine y={MID} stroke="#475569" strokeDasharray="3 3" />
          <Tooltip content={<ScatterTooltip />} />
          <Scatter data={rows}>
            {rows.map((r, i) => (
              <Cell key={i} fill={quadrantColor(r.importance!, r.feasibility!)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest font-display font-bold mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" /> Must-have
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" /> Fast-win
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6B7280]" /> Nice-to-have
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Deprioritize
        </div>
      </div>
    </div>
  );
}
