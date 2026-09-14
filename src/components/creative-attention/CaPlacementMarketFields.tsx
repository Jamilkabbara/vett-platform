import type { CaPlacementOption } from '../../lib/caMissionInsert.mjs';

export interface CaMarketOption { code: string; name: string; is_meta_market: boolean }

export type CaOptionsState =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'ready'; placements: CaPlacementOption[]; markets: CaMarketOption[] | null };

interface Props {
  options: CaOptionsState;
  /** Already filtered to what the uploaded format can be scored for. */
  offeredPlacements: CaPlacementOption[];
  placementId: string;
  onPlacementChange: (id: string) => void;
  marketCode: string;
  onMarketChange: (code: string) => void;
}

/**
 * The Creative Attention placement (required) and market (optional) pickers.
 *
 * Placements are only those with a published attention norm, already filtered
 * to what the upload can be scored for. Markets come from markets_master via
 * the server. If markets are unavailable the customer can still continue; if
 * placements are unavailable they cannot, because the result would have no
 * norm to be compared against.
 */
export function CaPlacementMarketFields({
  options, offeredPlacements, placementId, onPlacementChange, marketCode, onMarketChange,
}: Props) {
  return (
    <>
      {/* Placement - required. Only placements with a published
          attention norm, filtered to what this upload can be scored
          for (TV and pre-roll need motion; print is static). */}
      <div>
        <label htmlFor="ca-placement" className="block text-xs text-[var(--t3)] mb-1.5 font-medium">
          Where will it run? <span className="text-red-400">*</span>
        </label>
        {options.status === 'failed' ? (
          <p role="alert" className="text-sm text-red-300">
            We could not load the placement list. Refresh the page to try again.
          </p>
        ) : (
          <select
            id="ca-placement"
            value={placementId}
            disabled={options.status !== 'ready'}
            onChange={(e) => onPlacementChange(e.target.value)}
            className="w-full bg-[var(--bg2)] border border-[var(--b1)] rounded-xl px-4 py-3 text-sm text-[var(--t1)] focus:outline-none focus:border-purple-500/60 transition-colors disabled:opacity-60"
          >
            <option value="">{options.status === 'ready' ? 'Choose a placement' : 'Loading placements...'}</option>
            {offeredPlacements.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} · norm {Number(p.norm_active_seconds).toFixed(1)}s
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-[var(--t3)] mt-1.5">
          We compare the creative&rsquo;s predicted attention against this placement&rsquo;s published norm.
        </p>
      </div>

      {/* Market - optional, qualitative only */}
      <div>
        <label htmlFor="ca-market" className="block text-xs text-[var(--t3)] mb-1.5 font-medium">
          Market <span className="text-[var(--t3)] font-normal">(optional)</span>
        </label>
        {options.status === 'ready' && options.markets === null ? (
          <p className="text-sm text-[var(--t3)]">Markets are unavailable right now. You can continue without one.</p>
        ) : (
          <select
            id="ca-market"
            value={marketCode}
            disabled={options.status !== 'ready'}
            onChange={(e) => onMarketChange(e.target.value)}
            className="w-full bg-[var(--bg2)] border border-[var(--b1)] rounded-xl px-4 py-3 text-sm text-[var(--t1)] focus:outline-none focus:border-purple-500/60 transition-colors disabled:opacity-60"
          >
            <option value="">No specific market</option>
            {options.status === 'ready' && options.markets && (
              <>
                <optgroup label="Regions">
                  {options.markets.filter((m) => m.is_meta_market).map((m) => (
                    <option key={m.code} value={m.code}>{m.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Countries">
                  {options.markets.filter((m) => !m.is_meta_market).map((m) => (
                    <option key={m.code} value={m.code}>{m.name}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
        )}
        <p className="text-xs text-[var(--t3)] mt-1.5">
          Adds notes on cultural fit and localisation. It does not change any score.
        </p>
      </div>
    </>
  );
}
