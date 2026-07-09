import { supabase } from './supabase';
import { api } from './apiClient';
import { ADMIN_EMAIL } from './adminConfig';

// WO#4 — cross-user admin read for the results pages.
//
// The results pages read the mission row directly from Supabase in the browser,
// which is scoped by RLS to the signed-in user's OWN missions. That is exactly
// what we want for regular users. But the ADMIN needs to open ANY user's mission
// from the admin panel, and RLS (correctly) hides other users' rows from the
// browser. Rather than loosen the row policy, we grant cross-user read ONLY on
// the server: when the direct read comes back empty AND the viewer is the admin,
// fall back to the admin-only endpoint (GET /api/admin/missions/:id, gated by
// authenticate + adminOnly with the service-key client). Regular users never hit
// the fallback and stay fully isolated.

interface MissionRowResult<T = Record<string, unknown>> {
  data: T | null;
  error: unknown;
}

/**
 * Read a single mission row for a results page. Drop-in replacement for
 *   supabase.from('missions').select(select).eq('id', id).maybeSingle()
 * returning the same { data, error } shape, with a server-side admin fallback.
 *
 * @param missionId  the mission id from the route
 * @param select     the same column list the page needs (used for the direct
 *                   read; the admin fallback returns the full row, a superset)
 */
export async function fetchMissionRow<T = Record<string, unknown>>(
  missionId: string,
  select: string,
): Promise<MissionRowResult<T>> {
  const { data, error } = await supabase
    .from('missions')
    .select(select)
    .eq('id', missionId)
    .maybeSingle();

  // Owner (or admin viewing own) — the direct RLS read found the row.
  if (data) return { data: data as T, error: null };

  // Empty: either genuinely missing, or the row belongs to another user and RLS
  // hid it. Only the admin gets the server-side cross-user fallback.
  const { data: auth } = await supabase.auth.getUser();
  if (auth?.user?.email === ADMIN_EMAIL) {
    try {
      const json = await api.get(`/api/admin/missions/${missionId}`);
      const mission = (json && (json.mission ?? json)) as T | null;
      return { data: mission ?? null, error: mission ? null : (error ?? new Error('Mission not found')) };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  // Consistent contract: a missing/hidden mission always carries a non-null
  // error (maybeSingle returns error:null on 0 rows, which would otherwise make
  // this path error:null while the admin path errors — a latent trap for any
  // future `if (error)`-only guard).
  return { data: null, error: error ?? new Error('Mission not found') };
}
