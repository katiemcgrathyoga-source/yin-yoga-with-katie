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
    // Bridge the session to a short-lived cookie so SSR pages (the gated
    // /sessions routes) can read it server-side and gate before rendering.
    client.auth.onAuthStateChange((_event, session) => writeSbCookie(session));
  }
  return client;
}

/**
 * Single source of truth for the `sb-token` bridge cookie (name, TTL, flags).
 * Written on auth changes and by the gated-session reload fallback.
 */
export function writeSbCookie(session: { access_token?: string } | null): void {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = session?.access_token
    ? `sb-token=${session.access_token}; Path=/; Max-Age=3600; SameSite=Lax${secure}`
    : `sb-token=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
