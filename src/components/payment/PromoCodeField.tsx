import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/apiClient';
import { parseQuoteResponse } from './parseQuoteResponse.mjs';

/**
 * Promo code entry, in the app, before checkout.
 *
 * Promo entry used to exist in exactly one place, Mission Control, and on
 * Stripe's hosted page. Creative Attention had no entry at all, so a customer
 * holding a valid code could not apply it and saw the undiscounted price right
 * up to the final screen.
 *
 * The quote is authoritative and server-side: /api/pricing/quote resolves the
 * code against promo_codes and applies the same engine the charge uses. This
 * component never computes a discount itself, so what the customer reads here
 * is what checkout will bill.
 */
export interface PromoQuote {
  /** Price before any discount, in whole dollars. */
  base: number;
  /** Price after the discount, in whole dollars. */
  total: number;
  discount: number;
  /** True for a 100%-off code, which skips Stripe entirely. */
  free: boolean;
  code: string;
}

/**
 * The shape POST /api/pricing/quote answers with. `total` is top-level;
 * `base`, `subtotal` and `discount` live under `details`. Typed explicitly
 * because reading the wrong level of this object is what made the field
 * reject every code.
 */
interface QuoteResponse {
  total?: number;
  base?: number;
  discount?: number;
  details?: {
    base?: number;
    subtotal?: number;
    discount?: number;
    total?: number;
  };
}

interface Props {
  /** Everything the quote endpoint needs to price this mission. */
  quoteBody: Record<string, unknown>;
  /** Fires whenever a valid code is applied or cleared (null). */
  onApplied: (quote: PromoQuote | null) => void;
  className?: string;
}

type State =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'valid'; quote: PromoQuote }
  | { kind: 'invalid'; reason: string };

export function PromoCodeField({ quoteBody, onApplied, className = '' }: Props) {
  const [code, setCode] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  // Guards against a slow response for an earlier code overwriting a newer one.
  const seq = useRef(0);

  useEffect(() => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setState({ kind: 'idle' });
      onApplied(null);
      return;
    }

    const mine = ++seq.current;
    setState({ kind: 'checking' });

    // Debounced so a code is not validated on every keystroke.
    const t = setTimeout(async () => {
      try {
        const res = (await api.post('/api/pricing/quote', {
          ...quoteBody,
          promoCode: trimmed,
        })) as QuoteResponse;

        if (mine !== seq.current) return; // a newer code superseded this one

        // Parsing lives in parseQuoteResponse.mjs so a Node guard can execute
        // the real function; see the note there for what it got wrong.
        const parsed = parseQuoteResponse(res);
        if (!parsed.ok) {
          setState({ kind: 'invalid', reason: 'That code is not valid for this mission.' });
          onApplied(null);
          return;
        }

        const quote: PromoQuote = {
          base:     parsed.base,
          total:    parsed.total,
          discount: parsed.discount,
          free:     parsed.free,
          code:     trimmed,
        };
        setState({ kind: 'valid', quote });
        onApplied(quote);
      } catch {
        if (mine !== seq.current) return;
        // A failed lookup is not a valid code. Never let a network error read
        // as a discount the customer will not actually receive.
        setState({ kind: 'invalid', reason: 'Could not check that code. Try again.' });
        onApplied(null);
      }
    }, 450);

    return () => clearTimeout(t);
    // quoteBody is rebuilt each render by callers; depending on it directly
    // would re-validate on every keystroke of an unrelated field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className={className}>
      <label htmlFor="promo-code" className="block text-xs text-white/50 mb-1.5">
        Promo code (optional)
      </label>
      <input
        id="promo-code"
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter a code"
        autoComplete="off"
        spellCheck={false}
        className="w-full h-10 px-3 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime/40 uppercase"
      />
      {state.kind === 'checking' && (
        <p className="mt-1.5 text-xs text-white/40">Checking…</p>
      )}
      {state.kind === 'invalid' && (
        <p className="mt-1.5 text-xs text-[#F2787F]">{state.reason}</p>
      )}
      {state.kind === 'valid' && (
        <p className="mt-1.5 text-xs text-lime">
          {state.quote.free
            ? 'Code applied. This mission runs at no charge.'
            : `Code applied. You save $${state.quote.discount.toLocaleString('en-US')}.`}
        </p>
      )}
    </div>
  );
}
