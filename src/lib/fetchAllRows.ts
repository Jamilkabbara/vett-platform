/**
 * fetchAllRows - read a Supabase query to completion instead of to 1000 rows.
 *
 * WHY THIS EXISTS
 * ---------------
 * PostgREST caps every unbounded SELECT at 1000 rows (`db-max-rows`). It does
 * not throw and it does not warn: it returns the first 1000 rows, an HTTP 206,
 * and a `content-range` header. supabase-js surfaces none of that, so the
 * caller sees a perfectly ordinary success with a quietly truncated array.
 *
 * An explicit `.limit(n)` with n above 1000 does NOT lift the cap. It looks
 * like a fix and changes nothing.
 *
 * Measured on production, 2026-09-13: mission 10ecb820 is a completed
 * 240-respondent study holding 4,320 response rows across 240 personas at 18
 * questions each. The first 1,000 rows contain 56 distinct personas. The live
 * mission page, which counted personas out of an unbounded read ordered by
 * `answered_at` ascending, therefore rendered "56 of 240 - 23%" for a study
 * that had fully delivered. Ordering ascending is what made it convincing: the
 * truncation returns the EARLIEST rows, so the page shows a plausible
 * early-progress number rather than an obvious error.
 *
 * The backend hit the same wall and solved it the same way; see
 * vettit-backend/src/db/fetchAllRows.js and fetchAllResponses.js.
 *
 * HOW IT WORKS
 * ------------
 * Calls the builder once per page with `.range(offset, offset + pageSize - 1)`
 * and stops when a short page comes back, which is the only reliable
 * end-of-data signal PostgREST gives. `maxRows` is a runaway guard, not a
 * limit you are expected to hit; reaching it is reported rather than swallowed,
 * because a silent stop is the bug this function exists to prevent.
 */
/**
 * The helper needs exactly one capability from the query builder: the ability
 * to ask for a row range and be awaited. Typing it structurally rather than as
 * a `PostgrestFilterBuilder` keeps this file off the supabase-js generic
 * signature, which changes shape between versions and produces "type
 * instantiation is excessively deep" at the call site.
 */
export interface RangeableQuery<T> {
  range(from: number, to: number): PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
}

/** A function that builds the query afresh for each page. */
export type PageBuilder<T> = () => RangeableQuery<T>;

export interface FetchAllResult<T> {
  rows: T[];
  /** True when MAX_ROWS stopped the read. The caller must not treat rows as complete. */
  truncated: boolean;
  error: { message: string } | null;
}

const PAGE_SIZE = 1000;
const MAX_ROWS = 100_000;

export async function fetchAllRows<T>(
  build: PageBuilder<T>,
  opts: { pageSize?: number; maxRows?: number } = {},
): Promise<FetchAllResult<T>> {
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const maxRows = opts.maxRows ?? MAX_ROWS;

  const rows: T[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await build().range(offset, offset + pageSize - 1);
    if (error) return { rows, truncated: false, error };

    const page = data ?? [];
    rows.push(...page);

    // A page shorter than pageSize is the last page. This is the only
    // end-of-data signal available, which is why every page must be a full
    // pageSize for the loop to continue.
    if (page.length < pageSize) return { rows, truncated: false, error: null };

    offset += pageSize;
    if (offset >= maxRows) return { rows, truncated: true, error: null };
  }
}
