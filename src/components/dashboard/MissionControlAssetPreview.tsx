import { useMemo } from 'react';
import { ImageIcon, Video as VideoIcon } from 'lucide-react';

import type { MissionAsset } from '../../types/missionAssets';

/**
 * MissionControlAssetPreview — Phase 10.5.
 *
 * Renders above MissionControlQuestions on /dashboard/:missionId whenever
 * the mission has at least one uploaded asset. This is the single place
 * researchers can visually confirm "yes, the AI is grounding questions on
 * the right creative."
 *
 * Media rendering rules:
 *   - image  → <img> with lazy load, contained at natural aspect ratio.
 *   - video  → <video controls muted playsInline> with autoplay ONLY when
 *              autoplayForAd is true (marketing + creative_attention goals).
 *              Brand-lift / other goals keep the player paused on mount so
 *              the researcher can click play intentionally — autoplaying a
 *              baseline-exposure video inside Mission Control would be odd.
 *
 * The preview stack is read-only. Adding / removing assets lives on the
 * setup page by design: a researcher editing assets post-creation would
 * invalidate the AI-generated questions that reference them.
 */
interface Props {
  assets: MissionAsset[];
  /** Goal id from the mission row, used to decide autoplay on videos. */
  goalType: string | null;
}

const AUTOPLAY_GOALS = new Set(['marketing', 'creative_attention']);

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const MissionControlAssetPreview = ({ assets, goalType }: Props) => {
  const autoplay = useMemo(
    () => !!goalType && AUTOPLAY_GOALS.has(goalType),
    [goalType],
  );

  if (!assets.length) return null;

  return (
    <section
      className={[
        'rounded-[20px] border border-b1 bg-bg2',
        'p-4 md:p-5',
      ].join(' ')}
      aria-label="Uploaded asset"
    >
      {/* Header — mirrors the other MC cards (icon + label, no border). */}
      <header className="flex items-center gap-2 mb-3.5">
        <span
          className={[
            'inline-flex items-center justify-center w-6 h-6 rounded-md',
            'bg-pur/15 text-pur',
          ].join(' ')}
          aria-hidden
        >
          {assets[0].type === 'video' ? (
            <VideoIcon className="w-3.5 h-3.5" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5" />
          )}
        </span>
        <h2 className="font-display font-black text-white text-[13px] tracking-tight-2">
          Uploaded Asset
        </h2>
        <span
          className={[
            'ml-auto font-display font-bold text-[10px] text-t4 uppercase tracking-[0.1em]',
          ].join(' ')}
        >
          The AI references this
        </span>
      </header>

      <div className="flex flex-col gap-3">
        {assets.map((asset, i) => (
          <AssetCard
            key={`${asset.path || asset.url}-${i}`}
            asset={asset}
            autoplay={autoplay && asset.type === 'video'}
          />
        ))}
      </div>
    </section>
  );
};

const AssetCard = ({
  asset,
  autoplay,
}: {
  asset: MissionAsset;
  autoplay: boolean;
}) => {
  return (
    <div
      className={[
        'rounded-xl overflow-hidden',
        'bg-bg3 border border-b1',
      ].join(' ')}
    >
      {/* Media */}
      <div className="w-full bg-black/40">
        {asset.type === 'image' ? (
          <img
            src={asset.url}
            alt={asset.filename || 'Uploaded creative'}
            loading="lazy"
            className={[
              'block w-full h-auto max-h-[420px]',
              'object-contain',
            ].join(' ')}
          />
        ) : (
          <video
            src={asset.url}
            controls
            muted
            playsInline
            autoPlay={autoplay}
            preload="metadata"
            className={[
              'block w-full h-auto max-h-[420px]',
              'bg-black',
            ].join(' ')}
          />
        )}
      </div>

      {/* Meta row — filename + size, subtle. */}
      <div
        className={[
          'px-3 py-2 flex items-center gap-2',
          'border-t border-b1',
        ].join(' ')}
      >
        <span
          className={[
            'truncate font-mono text-[11px] text-t2',
            'min-w-0 flex-1',
          ].join(' ')}
          title={asset.filename}
        >
          {asset.filename}
        </span>
        {asset.sizeBytes > 0 && (
          <span className="shrink-0 font-mono text-[10px] text-t4">
            {formatSize(asset.sizeBytes)}
          </span>
        )}
      </div>
    </div>
  );
};

export default MissionControlAssetPreview;
