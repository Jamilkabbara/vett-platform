/** Types for the plain-ESM quote parser. See parseQuoteResponse.mjs. */
declare module '*/parseQuoteResponse.mjs' {
  export function parseQuoteResponse(res: unknown):
    | { ok: true; base: number; total: number; discount: number; free: boolean }
    | { ok: false };
}
