import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // PKCE flow prevents Gmail/Outlook link-prefetchers from consuming the
    // one-time OTP token before the user clicks. With PKCE the verify URL
    // still redirects to the app with a `?code=` query param, but that code
    // can only be exchanged by the browser that holds the code_verifier in
    // localStorage — link prefetchers never run JS so the exchange never fires.
    flowType: 'pkce',
  },
});
