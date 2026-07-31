import { useEffect, useState } from 'react';

/**
 * usePricingTiers — THE single client source for displayed prices.
 *
 * Fetches GET /api/pricing/tiers, the flag-aware backend endpoint (PR A). The
 * SAME module drives the Stripe charge, so display can never drift from what
 * customers pay. Returns V1 today and the canonical V2 ladder after the owner
 * flips PRICING_V2 — the frontend needs no change at flip time.
 *
 * Reusable primitive: the landing page, pricing section, and Terms table all
 * read this; there must be no second client pricing path for DISPLAY. (The
 * interactive setup engine still computes surcharges client-side and reconciles
 * against the server quote — that migration is deferred to the landing redesign.)
 */

export interface PricingTier {
  id: string;
  name: string;
  respondents: number;
  priceCents: number | null;   // null = custom (Enterprise)
  priceUsd: number | null;
  fromLabel: string;           // e.g. "$9", "$39", "Custom"
  custom: boolean;
}

export interface PricingTiersData {
  version: 'v1' | 'v2';
  flagActive: boolean;
  startingFromCents: number | null;
  tiers: PricingTier[];
}

const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

// Module-level cache so the many display surfaces on a page share one fetch.
let _cache: PricingTiersData | null = null;
let _inflight: Promise<PricingTiersData> | null = null;

async function fetchTiers(): Promise<PricingTiersData> {
  if (_cache) return _cache;
  if (_inflight) return _inflight;
  _inflight = fetch(`${API_URL}/api/pricing/tiers`)
    .then((r) => {
      if (!r.ok) throw new Error(`pricing/tiers ${r.status}`);
      return r.json();
    })
    .then((d: PricingTiersData) => { _cache = d; _inflight = null; return d; })
    .catch((e) => { _inflight = null; throw e; });
  return _inflight;
}

export interface UsePricingTiers {
  data: PricingTiersData | null;
  loading: boolean;
  error: string | null;
  /** Starting-from price in whole dollars (e.g. 9), or null while loading. */
  startingFromUsd: number | null;
  /** "$9" style label for the starting price. */
  startingFromLabel: string | null;
  /** Look up a tier's whole-dollar "from" price by id (sniff/validate/...). */
  priceUsdFor: (tierId: string) => number | null;
}

export function usePricingTiers(): UsePricingTiers {
  const [data, setData] = useState<PricingTiersData | null>(_cache);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (_cache) { setData(_cache); setLoading(false); return; }
    let cancelled = false;
    fetchTiers()
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const startingFromUsd = data?.startingFromCents != null ? data.startingFromCents / 100 : null;
  return {
    data,
    loading,
    error,
    startingFromUsd,
    startingFromLabel: startingFromUsd != null ? `$${startingFromUsd}` : null,
    priceUsdFor: (tierId) => {
      const t = data?.tiers.find((x) => x.id === tierId);
      return t && t.priceUsd != null ? t.priceUsd : null;
    },
  };
}

/** Test/util: clear the module cache (e.g. after the PRICING_V2 flip). */
export function _clearPricingTiersCache() { _cache = null; _inflight = null; }
