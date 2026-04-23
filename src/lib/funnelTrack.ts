/**
 * Lightweight funnel tracking — inserts rows into `funnel_events` via Supabase.
 * Fire-and-forget: errors are silently swallowed so tracking never blocks UX.
 */
import { supabase } from './supabase';

export type FunnelEvent =
  | 'landing_view'
  | 'signup_started'
  | 'signup_completed'
  | 'mission_setup_started'
  | 'mission_setup_completed'
  | 'checkout_opened'
  | 'checkout_completed'
  | 'mission_paid'
  | 'mission_completed';

export async function trackFunnel(
  event: FunnelEvent,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('funnel_events').insert({
      user_id:    user?.id ?? null,
      event_name: event,
      properties: properties ?? {},
    });
  } catch {
    // never throw — tracking must be invisible to users
  }
}
