import { useState } from 'react';
import { Crosshair, ImageOff, Info } from 'lucide-react';
import type { FrameAnalysis } from '../../types/creativeAnalysis';
import { normalizeHotspots } from '../../types/creativeAnalysis';

/**
 * PR 3 — Attention hotspot heatmap.
 *
 * Draws the vision pass's attention_hotspots ON TOP of the creative, as
 * translucent boxes positioned from frame-relative fractions (x/y/w/h in
 * 0-1), so the same payload lands correctly at any render width.
 *
 * TWO DATA SHAPES, both live in production forever:
 *
 *   SPATIAL  [{label, x, y, w, h, weight}] — missions analyzed after the
 *            spatial vision prompt shipped. These get the overlay.
 *
 *   LEGACY   ["prose describing where the eye lands", ...] — every mission
 *            analyzed before it, including the proof mission. There are no
 *            coordinates to draw, so these degrade to the ranked text list
 *            with an explicit note. They must never render an empty or
 *            NaN-positioned box.
 *
 * Video creatives are not overlaid on the <video> element: the boxes belong
 * to one extracted frame, and painting them over a playing timeline would
 * claim a precision the data does not have. Those render on a schematic
 * frame panel instead, which is honest about being geometry, not artwork.
 */

interface HotspotHeatmapProps {
  frameAnalyses: FrameAnalysis[];
  /** Resolved creative URL (media_url, else the public vett-creatives URL). */
  mediaUrl: string | null;
  isVideo: boolean;
  altText: string;
}

const BOX_TONES = [
  { border: '#BEF264', fill: 'rgba(190,242,100,0.30)' },
  { border: '#BEF264', fill: 'rgba(190,242,100,0.24)' },
  { border: '#A3E635', fill: 'rgba(163,230,53,0.20)' },
  { border: '#84CC16', fill: 'rgba(132,204,22,0.16)' },
  { border: '#65A30D', fill: 'rgba(101,163,13,0.14)' },
  { border: '#65A30D', fill: 'rgba(101,163,13,0.12)' },
];

export function HotspotHeatmap({ frameAnalyses, mediaUrl, isVideo, altText }: HotspotHeatmapProps) {
  const [activeFrame, setActiveFrame] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);

  const frames = (frameAnalyses || []).map((f, i) => ({
    index: i,
    timestamp: f?.timestamp ?? 0,
    hotspots: normalizeHotspots(f?.attention_hotspots),
  }));
  if (frames.length === 0) return null;

  const withSpatial = frames.filter((f) => f.hotspots.some((h) => h.spatial));
  const anySpatial = withSpatial.length > 0;
  const frame = frames[Math.min(activeFrame, frames.length - 1)];
  const spatial = frame.hotspots.filter((h) => h.spatial).slice(0, 6);
  // Legacy rows have no geometry: the overlay is impossible, the list is not.
  const canOverlay = anySpatial && spatial.length > 0;
  const overlayOnImage = canOverlay && !isVideo && !!mediaUrl;

  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--lime)]/10">
            <Crosshair className="w-5 h-5 text-[var(--lime)]" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--t1)]">Attention hotspots</h2>
            <p className="text-[var(--t3)] text-xs">
              {canOverlay
                ? 'Where the eye lands inside the frame, ranked by relative pull'
                : 'Where the eye lands, as described by the vision pass'}
            </p>
          </div>
        </div>
        {canOverlay && (
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--b1)] text-[var(--t2)] hover:text-[var(--t1)] transition-colors"
          >
            {showOverlay ? 'Hide overlay' : 'Show overlay'}
          </button>
        )}
      </header>

      {/* Frame picker — only when more than one frame carries geometry. */}
      {canOverlay && withSpatial.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {withSpatial.map((f) => (
            <button
              key={f.index}
              type="button"
              onClick={() => setActiveFrame(f.index)}
              className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                f.index === frame.index
                  ? 'border-[var(--lime)] text-[var(--lime)] bg-[var(--lime)]/10'
                  : 'border-[var(--b1)] text-[var(--t3)] hover:text-[var(--t1)]'
              }`}
            >
              {f.timestamp}s
            </button>
          ))}
        </div>
      )}

      {canOverlay && (
        // The box percentages are relative to the CREATIVE, so the positioned
        // parent must be the image box itself, not a full-width container: with
        // object-contain letterboxing, a full-width parent would shift every
        // box sideways by the size of the black bars. `inline-block` around a
        // `block` image makes the parent exactly the rendered image.
        <div className="flex justify-center rounded-xl border border-[var(--b1)] bg-black overflow-hidden">
          <div className={`relative ${overlayOnImage ? 'inline-block' : 'w-full aspect-video bg-black/40'}`}>
            {overlayOnImage ? (
              <img
                src={mediaUrl as string}
                alt={altText}
                className="block max-h-[520px] max-w-full w-auto"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-[var(--t3)] text-xs">
                <ImageOff className="w-4 h-4" aria-hidden />
                {isVideo
                  ? 'Frame geometry, drawn without the video still'
                  : 'Creative file unavailable, showing geometry only'}
              </div>
            )}

            {showOverlay && spatial.map((h) => {
              const tone = BOX_TONES[Math.min(h.rank - 1, BOX_TONES.length - 1)];
              return (
                <div
                  key={`${h.rank}-${h.label}`}
                  className="absolute rounded-md pointer-events-none"
                  style={{
                    left: `${h.leftPct}%`,
                    top: `${h.topPct}%`,
                    width: `${h.widthPct}%`,
                    height: `${h.heightPct}%`,
                    border: `1.5px solid ${tone.border}`,
                    background: tone.fill,
                  }}
                  title={`${h.label}${h.weight != null ? `, pull ${h.weight}/100` : ''}`}
                >
                  <span
                    className="absolute top-0 left-1 text-[10px] font-black"
                    style={{ color: tone.border }}
                  >
                    {h.rank}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranked list — rendered for BOTH shapes. It is the only rendering a
          legacy mission can get, and it stays useful next to the overlay. */}
      <ol className="space-y-2">
        {frame.hotspots.map((h) => (
          <li key={`${h.rank}-${h.label}`} className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-xs font-black text-[var(--lime)] tabular-nums">
              {h.rank}
            </span>
            <span className="flex-1 text-xs text-[var(--t2)] leading-snug">{h.label}</span>
            {h.weight != null && (
              <>
                <span className="hidden sm:block w-28 h-2 rounded-full bg-[var(--bg3,#1a2233)] overflow-hidden shrink-0">
                  <span
                    className="block h-full rounded-full bg-[var(--lime)]"
                    style={{ width: `${Math.min(100, Math.max(0, h.weight))}%` }}
                  />
                </span>
                <span className="w-8 text-right text-xs font-mono text-[var(--t3)] tabular-nums shrink-0">
                  {h.weight}
                </span>
              </>
            )}
          </li>
        ))}
      </ol>

      {!anySpatial && (
        <p className="flex items-start gap-2 text-[11px] text-[var(--t3)] leading-relaxed">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
          This mission was analyzed before VETT started capturing hotspot
          coordinates, so its hotspots are descriptions rather than positions and
          cannot be drawn on the creative. Missions run from now on carry
          coordinates and render the overlay above.
        </p>
      )}
    </section>
  );
}

export default HotspotHeatmap;
