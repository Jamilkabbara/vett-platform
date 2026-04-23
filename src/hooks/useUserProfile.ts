import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  /** Resolved: fullName || `${first} ${last}` || email prefix */
  displayName: string;
  /** First 2 uppercase initials of displayName */
  initials: string;
  companyName: string | null;
  role: string | null;
  projectStage: string | null;
  /** e.g. "Feb 2021" */
  memberSince: string | null;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select(
          'first_name, last_name, full_name, company_name, role, project_stage, created_at',
        )
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      const first = data?.first_name || '';
      const last = data?.last_name || '';
      const fullName =
        data?.full_name ||
        (first || last ? `${first} ${last}`.trim() : null);
      const emailPrefix = user.email?.split('@')[0] || 'User';
      const displayName = fullName || emailPrefix;
      const initials = displayName
        .split(' ')
        .map((w: string) => w[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const memberSince = data?.created_at
        ? new Date(data.created_at).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })
        : null;

      setProfile({
        id: user.id,
        email: user.email || '',
        firstName: first || null,
        lastName: last || null,
        fullName,
        displayName,
        initials,
        companyName: data?.company_name || null,
        role: data?.role || null,
        projectStage: data?.project_stage || null,
        memberSince,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading };
}
