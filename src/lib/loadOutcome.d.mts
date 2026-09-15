export function settleInvoices<T>(request: Promise<unknown>): Promise<{ invoices: T[] | null; error: string | null }>;
export function settleSegment<R>(key: string, request: Promise<{ report?: R } | null | undefined>): Promise<{ seg: string; active: R | null; error: string | null }>;
export type ChatFrame =
  | { type: 'delta'; delta: string }
  | { type: 'done'; quota: unknown }
  | { type: 'blocked'; quota: unknown }
  | { type: 'error'; error: string }
  | { type: 'malformed' };
export function parseChatFrame(payload: string): ChatFrame;
