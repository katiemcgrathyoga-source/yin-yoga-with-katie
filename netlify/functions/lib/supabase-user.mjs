import { createClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Who is calling: the signed-in Supabase user behind a Bearer token, or null.
 *
 * The same check bunny-playback.mjs and src/lib/access.ts make, pulled out so
 * the Strava functions share one copy. Verified locally against the project's
 * JWKS (no round-trip), with auth.getUser() as the fallback when local
 * verification isn't available. Null on anything short of a valid session —
 * callers answer 401 and never guess.
 */
let jwks = null;
let jwksUrl = null;

async function verifyLocally(jwt, supabaseUrl) {
  try {
    if (!jwks || jwksUrl !== supabaseUrl) {
      jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
      jwksUrl = supabaseUrl;
    }
    const { payload } = await jwtVerify(jwt, jwks, { issuer: `${supabaseUrl}/auth/v1`, audience: 'authenticated' });
    return typeof payload.sub === 'string' ? { id: payload.sub, email: payload.email ?? null } : null;
  } catch {
    return null;
  }
}

/** The Bearer token on a request, or ''. */
export function bearer(req) {
  const authz = req.headers.get('authorization') || '';
  return authz.startsWith('Bearer ') ? authz.slice(7).trim() : '';
}

/** { id, email } for a valid session, else null. Null too when Supabase isn't configured. */
export async function userFromRequest(req) {
  const url = process.env.PUBLIC_SUPABASE_URL;
  const anon = process.env.PUBLIC_SUPABASE_ANON_KEY;
  const jwt = bearer(req);
  if (!url || !anon || !jwt) return null;

  const local = await verifyLocally(jwt, url);
  if (local) return local;

  const supa = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data, error } = await supa.auth.getUser(jwt);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
