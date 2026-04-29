/**
 * Pass 22 Bug 22.1 — Funnel tracking, rewritten for emit reliability.
 *
 * Replaces the Pass 21-era client-direct supabase.from('funnel_events').insert()
 * which had several reliability issues:
 *
 *   1) Anon emits silently rejected by RLS (only user_insert_own_funnel for
 *      authenticated). 27 landing_view rows in 14d came exclusively from
 *      previously-authenticated visitors hitting the landing page.
 *
 *   2) supabase-js's underlying fetch was cancelled by the browser when
 *      the user navigated mid-emit. Root cause of the ~24% reliability for
 *      mission_setup_started (6 emits / ~25 missions in the same window).
 *
 *   3) await supabase.auth.getUser() on every emit added a network round-trip
 *      that compounded the navigation race.
 *
 * New shape:
 *   - POST /api/funnel/track (anon-friendly; backend resolves user_id from
 *     optional Authorization Bearer; service_role inserts).
 *   - fetch keepalive: true so the request survives navigation.
 *   - session_id from localStorage correlates anon emits with later
 *     authenticated events from the same browser (Bug 22.3).
 *   - localStorage queue for failed emits (offline / network blip), retried
 *     on next page load. Capped at 50 entries to avoid unbounded growth.
 *   - Sync token read from supabase.auth.getSession() (cheap; no network).
 *
 * Telemetry by definition: this module MUST NOT throw. Catches everywhere.
 */

import { supabase } from './supabase';

const API_URL =
  import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

const SESSION_STORAGE_KEY = 'vett_session_id';
const QUEUE_STORAGE_KEY = 'vett_funnel_queue';
const MAX_QUEUE_LENGTH = 50;

export type FunnelEvent =
  | 'landing_view'
  | 'signup_started'
  | 'signup_completed'
  | 'mission_setup_started'
  | 'mission_setup_completed'
  | 'checkout_opened'
  | 'checkout_completed'
  | 'checkout_canceled'   // Pass 23 Bug 23.0e v2 — user hit Stripe Checkout cancel
  | 'mission_paid'
  | 'mission_completed'
  // Pass 23 Bug 23.52 — PaymentSuccessPage diagnostic trail. Lets us trace
  // the exact path through the success-page polling loop when a paid
  // mission ends up redirected somewhere unexpected (e.g. /setup instead
  // of /dashboard/:id). Each emit carries minimal context so the funnel
  // table stays readable while still being forensic.
  | 'payment_success_page_loaded'
  | 'payment_success_poll_attempt'
  | 'payment_success_redirect'
  | 'payment_success_session_expired'
  | 'payment_success_timeout';

interface QueuedEvent {
  event_type: FunnelEvent;
  session_id: string;
  mission_id?: string | null;
  metadata?: Record<string, unknown>;
  queued_at: number;
}

// ─── session_id helpers ───────────────────────────────────────────────────

/**
 * Get-or-create the per-browser session_id. Persisted in localStorage so it
 * survives navigation, tab close, and (most importantly) the anon → signed-in
 * transition — that's what makes landing→signup conversion measurable.
 */
function getOrCreateSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && typeof existing === 'string' && existing.length > 0) {
      return existing;
    }
    const fresh = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : `sid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // localStorage unavailable (Safari private mode, etc.) — fall back to a
    // per-load id. Won't survive nav but at least every emit gets one.
    return `sid_${Date.now().toString(36)}`;
  }
}

// ─── Queue helpers ────────────────────────────────────────────────────────

function readQueue(): QueuedEvent[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(events: QueuedEvent[]): void {
  try {
    const trimmed = events.slice(-MAX_QUEUE_LENGTH);
    window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // out of storage / disabled — drop, don't block UX
  }
}

function enqueue(event: QueuedEvent): void {
  const q = readQueue();
  q.push(event);
  writeQueue(q);
}

function clearQueue(): void {
  try {
    window.localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ─── Auth helper (sync, no network) ───────────────────────────────────────

async function getAuthBearer(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

// ─── Core emit ────────────────────────────────────────────────────────────

/**
 * Send the event payload to the backend. Returns true on accepted (HTTP 2xx),
 * false otherwise. Never throws.
 *
 * fetch keepalive: true is the critical reliability primitive — it allows the
 * browser to complete the request even after the page navigates or unloads.
 * Limited to ≤64KB body, but our metadata cap is 4KB so we're fine.
 */
async function sendEvent(payload: QueuedEvent): Promise<boolean> {
  const token = await getAuthBearer();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_URL}/api/funnel/track`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event_type: payload.event_type,
        session_id: payload.session_id,
        mission_id: payload.mission_id ?? null,
        metadata:   payload.metadata   ?? {},
      }),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Drain the localStorage queue. Called on every emit and on app boot
 * (replayQueue export below). Each item is retried once; if it fails again
 * we re-enqueue at the tail (bounded by MAX_QUEUE_LENGTH so the queue
 * doesn't grow unbounded).
 */
async function drainQueue(): Promise<void> {
  const q = readQueue();
  if (q.length === 0) return;

  // Take the first batch; whatever fails we re-enqueue at the end.
  clearQueue();
  const failures: QueuedEvent[] = [];

  for (const ev of q) {
    // Drop very stale events (>7d) — likely a long-abandoned device.
    if (Date.now() - ev.queued_at > 7 * 24 * 60 * 60 * 1000) continue;
    const ok = await sendEvent(ev);
    if (!ok) failures.push(ev);
  }

  if (failures.length > 0) writeQueue(failures);
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Track a funnel event. Fire-and-forget — never blocks UX, never throws.
 *
 * Reliability flow:
 *   1) Build the payload synchronously (session_id from localStorage).
 *   2) Resolve auth token (cheap; cached in supabase client).
 *   3) POST with fetch keepalive: true (survives navigation).
 *   4) On failure, enqueue to localStorage; drained on next emit / boot.
 */
export async function trackFunnel(
  event: FunnelEvent,
  metadata?: Record<string, unknown>,
  options?: { mission_id?: string | null },
): Promise<void> {
  const session_id = getOrCreateSessionId();
  const payload: QueuedEvent = {
    event_type: event,
    session_id,
    mission_id: options?.mission_id ?? null,
    metadata:   metadata ?? {},
    queued_at:  Date.now(),
  };

  const ok = await sendEvent(payload);
  if (!ok) {
    enqueue(payload);
    return;
  }

  // Opportunistically drain any queued events in the background.
  // Don't block on this; if it fails, items stay queued for next attempt.
  drainQueue().catch(() => {});
}

/**
 * Drain the queue. Call from app boot (App.tsx top-level useEffect) so any
 * events queued before the last unload get a chance to land.
 */
export async function replayFunnelQueue(): Promise<void> {
  await drainQueue();
}

/**
 * Read the active session_id (e.g., to attach to an out-of-band emit or
 * to debug from the browser console). Creates one on first call.
 */
export function getFunnelSessionId(): string {
  return getOrCreateSessionId();
}

/**
 * Pass 22 Bug 22.4 — capture useful UTM/referrer/viewport context for the
 * landing_view event. Pulled from window/document at call time so each
 * call site doesn't need to remember the shape.
 */
export function landingMetadata(): Record<string, unknown> {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      referrer:       document.referrer || null,
      utm_source:     params.get('utm_source')   || null,
      utm_medium:     params.get('utm_medium')   || null,
      utm_campaign:   params.get('utm_campaign') || null,
      utm_content:    params.get('utm_content')  || null,
      utm_term:       params.get('utm_term')     || null,
      viewport_width: typeof window.innerWidth === 'number' ? window.innerWidth : null,
      pathname:       window.location.pathname,
    };
  } catch {
    return {};
  }
}
