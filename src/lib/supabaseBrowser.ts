import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Browser-side Supabase client for auth (magic-link login + session).
// Uses PUBLIC_ env vars, which are safe to ship to the client by design —
// the anon key only grants what row-level security allows.
//
// Returns null when Supabase isn't configured yet, so pages can degrade
// gracefully (show a "not set up" note) instead of throwing at runtime.

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !anon) return null;
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // completes the magic-link redirect on return
      },
    });
  }
  return client;
}
