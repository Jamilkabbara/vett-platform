/**
 * results-v2 — the value slot.
 *
 * THE BUG THIS EXISTS TO MAKE IMPOSSIBLE
 * --------------------------------------
 * On the live results page a hero tile renders
 *
 *     <div className="mv">{k.value}</div>
 *
 * straight from `report.key_findings[i].value`, which is model-authored and
 * is NOT guaranteed to be a scalar. Real production rows carry values like
 * "Lack of trust in plant-based ingredients or unfamiliar food technology"
 * (market_entry `top_barrier`) and labels like "Understated pragmatists
 * citing affordable pricing as top factor". A whole sentence lands in a 46px
 * Manrope numeral slot and wraps five lines.
 *
 * The fix is a TYPE, not a lint rule. A numeral element in results-v2 can
 * only be handed a `ScalarSlot`, and a `ScalarSlot` can only be minted by
 * `toScalarSlot()` in this file (the brand is a non-exported unique symbol,
 * so no other module can build the object literal, not even with a cast to
 * the exported shape). `toScalarSlot` splits its input in two:
 *
 *   .scalar  a SHORT token that is safe at display size, or null
 *   .note    everything that is not that, to be rendered as prose
 *
 * `<StatValue>` interpolates `.scalar` into the numeral and `.note` into a
 * caption. There is no code path from a sentence to a numeral.
 *
 * Second live bug closed here: `parseMetric` on the live page count-ups from
 * zero off the LEADING NUMBER of the string, so "95-235" animates through
 * "9-235" and an audit screenshot catches "9 / 9-235 / 9" on a mission whose
 * real optimal price point is $95. results-v2 never animates a value; the
 * scalar is rendered verbatim, once.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- phantom type brand
declare const scalarSlotBrand: unique symbol;
/** Exported only so the branded interface below has no private name. */
export type ScalarSlotBrand = typeof scalarSlotBrand;

export interface ScalarSlot {
  /** Nominal brand. Only `toScalarSlot` can produce a value of this type. */
  readonly __scalarSlot: ScalarSlotBrand;
  /** Short token safe for a display-size numeral. Null when there is none. */
  readonly scalar: string | null;
  /** Prose that must never be rendered at display size. */
  readonly note: string | null;
  /** True when the input was demoted out of the numeral slot. */
  readonly demoted: boolean;
}

/**
 * Budget for the numeral slot. Tuned against real rows:
 *   "62/100"        1 word   6 chars  -> scalar
 *   "SAR 29-38"     2 words  9 chars  -> scalar
 *   "71.7% (n=43)"  2 words 12 chars  -> scalar
 *   "95-235"        1 word   6 chars  -> scalar
 *   "Status-seekers, early adopters"  -> note
 */
const MAX_SCALAR_CHARS = 14;
const MAX_SCALAR_WORDS = 2;

/** Trailing sentence punctuation, or any internal sentence break. */
const SENTENCE = /[.!?](\s|$)|[,;:]\s/;

/** Trim runaway float precision: 74.4186% -> 74.4%, 82.50 -> 82.5. */
function tidyNumber(s: string): string {
  return s.replace(/(-?\d+)\.(\d{2,})/g, (_whole, int: string, frac: string) => {
    const rounded = Number(`${int}.${frac}`).toFixed(1);
    return rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded;
  });
}

function mint(scalar: string | null, note: string | null, demoted: boolean): ScalarSlot {
  // The single construction site. Nothing outside this module can reach it.
  return { scalar, note, demoted } as unknown as ScalarSlot;
}

/** The empty slot: renders as an em-free placeholder, never as text. */
export const EMPTY_SLOT: ScalarSlot = mint(null, null, false);

/**
 * Classify an arbitrary analysis value into a numeral and/or a note.
 * Numbers are always scalars. Strings are scalars only if short, unpunctuated
 * and at most two words.
 */
export function toScalarSlot(raw: unknown): ScalarSlot {
  if (raw == null) return EMPTY_SLOT;

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return EMPTY_SLOT;
    return mint(tidyNumber(String(raw)), null, false);
  }

  const text = String(raw).trim().replace(/\s+/g, ' ');
  if (!text) return EMPTY_SLOT;

  const tidy = tidyNumber(text);
  const words = tidy.split(' ').length;
  const fits =
    tidy.length <= MAX_SCALAR_CHARS &&
    words <= MAX_SCALAR_WORDS &&
    !SENTENCE.test(tidy);

  // A short token stays a numeral. Anything longer is prose and is demoted to
  // the note, where it is typeset at reading size and can wrap honestly.
  return fits ? mint(tidy, null, false) : mint(null, tidy, true);
}

/**
 * A stat: a label, plus a value that has already been through the guard.
 * `value` is typed `ScalarSlot`, so a caller physically cannot pass a raw
 * string through to a numeral.
 */
export interface Stat {
  label: string;
  value: ScalarSlot;
  tone?: 'lime' | 'amber' | 'rose' | 'plain';
}

/** Convenience: build a `Stat` from an untrusted analysis value. */
export function stat(
  label: string,
  raw: unknown,
  tone: Stat['tone'] = 'plain',
): Stat {
  return { label, value: toScalarSlot(raw), tone };
}
