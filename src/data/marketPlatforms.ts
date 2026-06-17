/*
 * WO §D1 — market-localized media platforms (FINAL, owner-approved).
 *
 * Bug this fixes: channels_master tags channels by region meta-code (MENA),
 * but the MarketPicker selects ISO country codes (SA / AE / EG) or the GCC
 * meta-code, so `markets.ov.{SA}` overlapped nothing and every MENA market
 * collapsed to the is_global set ("KSA shows generic/empty"). This static map
 * guarantees each market returns its real localized list, grouped TV/VOD/Social,
 * with no fragile DB tagging. Selected platforms flow into per-channel recall
 * generation + the exposure simulation (ad_channels_seen) via campaign_channels.
 *
 * Keyed by markets_master.code. Channels carry the same shape the ChannelPicker
 * renders (id / display_name / category), category ∈ tv | vod | social.
 */

export interface MarketChannel {
  id: string;
  display_name: string;
  category: 'tv' | 'vod' | 'social';
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const ch = (display_name: string, category: MarketChannel['category']): MarketChannel => ({ id: slug(display_name), display_name, category });

// KSA (SA)
const KSA: MarketChannel[] = [
  ch('SSC (Saudi Sports)', 'tv'), ch('Saudi TV / SBA', 'tv'), ch('MBC1', 'tv'), ch('MBC Action', 'tv'), ch('MBC Drama', 'tv'), ch('Rotana', 'tv'), ch('Al Arabiya', 'tv'),
  ch('Shahid', 'vod'), ch('TOD', 'vod'), ch('STC TV / Jawwy TV', 'vod'),
  ch('Snapchat', 'social'), ch('TikTok', 'social'), ch('YouTube', 'social'), ch('Instagram', 'social'), ch('X', 'social'),
];

// UAE (AE)
const UAE: MarketChannel[] = [
  ch('MBC', 'tv'), ch('Dubai TV', 'tv'), ch('Abu Dhabi TV', 'tv'), ch('Al Arabiya', 'tv'),
  ch('Shahid', 'vod'), ch('OSN+', 'vod'), ch('TOD', 'vod'), ch('Starzplay', 'vod'),
  ch('Instagram', 'social'), ch('TikTok', 'social'), ch('YouTube', 'social'), ch('Snapchat', 'social'), ch('X', 'social'),
];

// Egypt (EG)
const EGYPT: MarketChannel[] = [
  ch('DMC', 'tv'), ch('ON', 'tv'), ch('CBC', 'tv'), ch('MBC Masr', 'tv'),
  ch('Shahid', 'vod'), ch('Watch It', 'vod'), ch('TOD', 'vod'),
  ch('Facebook', 'social'), ch('TikTok', 'social'), ch('YouTube', 'social'), ch('Instagram', 'social'),
];

function dedupe(list: MarketChannel[]): MarketChannel[] {
  const seen = new Set<string>(); const out: MarketChannel[] = [];
  for (const c of list) { const k = c.display_name.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(c); } }
  return out;
}

// GCC (regional): the superset — union of the Gulf markets (KSA + UAE here),
// keeping the existing "GCC = broad" behavior with a populated, grouped list.
const GCC: MarketChannel[] = dedupe([...KSA, ...UAE]);

export const MARKET_PLATFORMS: Record<string, MarketChannel[]> = {
  SA: KSA, AE: UAE, EG: EGYPT, GCC,
};

export const MAPPED_MARKET_CODES = new Set(Object.keys(MARKET_PLATFORMS));

/** Union (deduped by display_name) of the localized channels for the selected market codes. */
export function channelsForMarkets(codes: string[]): MarketChannel[] {
  return dedupe((codes || []).flatMap((c) => MARKET_PLATFORMS[c] || []));
}

export const CATEGORY_LABEL: Record<string, string> = { tv: 'TV', vod: 'VOD / Streaming', social: 'Social' };
