import { createClient } from '@supabase/supabase-js';

export type Access = { signedIn: boolean; entitled: boolean };

/**
 * Server-side entitlement check from a Supabase access token (read from the
 * `sb-token` cookie the browser client keeps in sync). Uses the anon key + the
 * user's token so row-level security limits the read to their own rows — no
 * service-role key needed. This is what makes the gate real: the SSR page calls
 * it and only renders member content when `entitled` is true.
 */
export async function checkAccess(token: string | undefined, product: string): Promise<Access> {
  const url = process.env.PUBLIC_SUPABASE_URL;
  const anon = process.env.PUBLIC_SUPABASE_ANON_KEY;
  // Not configured yet → dev fallback: treat as open (mirrors the functions).
  if (!url || !anon) return { signedIn: false, entitled: true };
  if (!token) return { signedIn: false, entitled: false };

  const supa = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error } = await supa.auth.getUser(token);
  if (error || !userData?.user) return { signedIn: false, entitled: false };

  const { data: ent } = await supa
    .from('entitlements')
    .select('product')
    .eq('user_id', userData.user.id)
    .eq('product', product)
    .maybeSingle();

  return { signedIn: true, entitled: !!ent };
}
