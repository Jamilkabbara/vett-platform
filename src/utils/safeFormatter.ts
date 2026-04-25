/**
 * safeFormatter — null/undefined/NaN-safe number formatting utilities.
 *
 * Background (Pass 20 Hotfix, SEV-1):
 * Admin dashboards crashed with "Cannot read properties of undefined" when
 * Recharts called `tickFormatter` and `Tooltip.formatter` with `undefined`
 * values during empty/sparse data states. The crash happened inside
 * unguarded `.toFixed()` and `.toLocaleString()` calls inside
 * AdminAICosts, AdminRevenue, and AdminOverview, taking down the whole
 * /admin route with a white page.
 *
 * Recharts contract: tickFormatters and Tooltip formatters MAY receive
 * undefined/NaN, especially while the chart is mid-render or when a series
 * is briefly absent during a range switch. Every formatter must be defensive.
 *
 * Use these helpers — never call `.toFixed()` / `.toLocaleString()` directly
 * on values that could come from API payloads, chart props, or user input.
 */

/** Type guard — true when value is a finite number. */
export const isFiniteNum = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n);

/**
 * Wrap any number-formatting fn so it survives undefined/null/NaN input.
 * Returns `fallback` (default '—') when the input is not a finite number.
 *
 *   safeFormatter(maybeUndef, n => n.toFixed(2))           // '—' on undef
 *   safeFormatter(0, n => n.toFixed(2))                    // '0.00'
 *   safeFormatter(maybeUndef, n => n.toFixed(2), '0.00')   // '0.00' on undef
 */
export const safeFormatter = (
  n: number | undefined | null,
  fn: (x: number) => string,
  fallback = '—',
): string => (isFiniteNum(n) ? fn(n) : fallback);

/** Common shapes used by the admin dashboards. */
export const safe = {
  usd: (n: number | undefined | null, frac = 4): string =>
    safeFormatter(n, (x) =>
      x.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: frac,
      }),
    ),
  usd2: (n: number | undefined | null): string =>
    safeFormatter(n, (x) =>
      x.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }),
    ),
  pct: (n: number | undefined | null, frac = 1): string =>
    safeFormatter(n, (x) => `${x.toFixed(frac)}%`),
  num: (n: number | undefined | null): string =>
    safeFormatter(n, (x) => x.toLocaleString('en-US')),
  fixed: (n: number | undefined | null, frac = 2): string =>
    safeFormatter(n, (x) => x.toFixed(frac)),
};
