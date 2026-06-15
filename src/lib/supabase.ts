import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // PKCE is kept for OAuth. NOTE: PKCE does NOT fix the password-reset email
    // prefetch burn — the Supabase /auth/v1/verify GET consumes the recovery
    // token regardless of flow, so a Gmail/Outlook link-scanner's prefetch
    // still burns it (proven on prod). The real fix (A1) is the token_hash
    // flow: the recovery email links to /reset-password?token_hash=…&type=recovery
    // (the APP, not /verify), and ResetPasswordPage calls verifyOtp() on the
    // user's submit gesture — a prefetcher loads the page but never runs JS, so
    // the token survives until the real click. (Requires the Supabase recovery
    // email template to use {{ .TokenHash }} — see vett-ops/BUG-reset-password-email.md.)
    flowType: 'pkce',
  },
});
