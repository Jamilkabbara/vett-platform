import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // PKCE is kept for OAuth (signInWithOAuth returns ?code=, which the client
    // auto-exchanges on the redirect back). The password-reset email's real fix
    // is the token_hash flow: the recovery email links to
    // /reset-password?token_hash=…&type=recovery (the APP, not Supabase /verify),
    // and ResetPasswordPage calls verifyOtp() on the user's submit gesture — a
    // prefetcher loads the page but never runs JS, so the token survives until
    // the real click, and token_hash needs no code_verifier (works cross-device).
    // (Requires the Supabase recovery template to use {{ .TokenHash }} — see
    // vett-ops/BUG-reset-password-email.md.)
    flowType: 'pkce',
    // Explicit: OAuth login AND the ?code= branch of ResetPasswordPage rely on
    // the client auto-exchanging the code/implicit token found in the URL.
    // (Default is already true; pinned here so it isn't silently flipped.)
    detectSessionInUrl: true,
  },
});
