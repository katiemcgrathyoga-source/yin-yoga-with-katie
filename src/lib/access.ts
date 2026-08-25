import { createClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';

export type Access = { signedIn: boolean; entitled: boolean };

const CACHE_COOKIE = 'access-cache';
const CACHE_TTL_SECONDS = 300; // short on purpose — bounds how long a revoked entitlement stays cached

// Cached across warm invocations of the same function instance — createRemoteJWKSet
// already memoises the fetched keys internally, so we only need to avoid rebuilding
// a fresh JWKSet (and losing that cache) on every call.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksSupabaseUrl: string | null = null;

/**
 * Verifies the Supabase access token's signature locally against the project's
 * published JWKS instead of calling auth.getUser() over the network. Saves one
 * full round-trip per request. Returns the user id on success, null on any
 * failure (bad/expired token, or local verification unavailable for this
 * project) — callers fall back to the network check on null, so this can only
 * make things faster, never more permissive.
 */
async function verifyTokenLocally(token: string, supabaseUrl: string): Promise<string | null> {
  try {
    if (!jwks || jwksSupabaseUrl !== supabaseUrl) {
      jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
      jwksSupabaseUrl = supabaseUrl;
    }
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

// Reads the `sub` claim without verifying the signature — used only to decide
// whether a *previously verified* cache entry still matches the presented
// token, never to authenticate. Malformed input just fails the match.
function unsafeDecodeSub(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as JWTPayload;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function verifySignature(value: string, signature: string, secret: string): boolean {
  const expected = sign(value, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Reads a cached "yes, entitled" verdict written by a previous checkAccess()
 * call in this session. Bound to the product AND the presented token's user id
 * so it can never leak across products or across users sharing a browser.
 */
function readCache(cookies: AstroCookies, userId: string, product: string, secret: string): boolean {
  const raw = cookies.get(CACHE_COOKIE)?.value;
  if (!raw) return false;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature || !verifySignature(payload, signature, secret)) return false;
  const [cachedUserId, cachedProduct, expiresAt] = Buffer.from(payload, 'base64url').toString('utf8').split('|');
  return cachedUserId === userId && cachedProduct === product && Number(expiresAt) > Date.now();
}

function writeCache(cookies: AstroCookies, userId: string, product: string, secret: string): void {
  const payload = Buffer.from(`${userId}|${product}|${Date.now() + CACHE_TTL_SECONDS * 1000}`).toString('base64url');
  const value = `${payload}.${sign(payload, secret)}`;
  cookies.set(CACHE_COOKIE, value, {
    path: '/practices',
    maxAge: CACHE_TTL_SECONDS,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });
}

/**
 * Server-side entitlement check from a Supabase access token (read from the
 * `sb-token` cookie the browser client keeps in sync). Uses the anon key + the
 * user's token so row-level security limits the read to their own rows — no
 * service-role key needed. This is what makes the gate real: the SSR page calls
 * it and only renders member content when `entitled` is true.
 *
 * Every /practices/* page calls this on its own, so a visitor clicking through
 * several course pages would otherwise pay for a Supabase round-trip on each
 * one. A short signed cache cookie (ACCESS_CACHE_SECRET) skips that for repeat
 * navigations within the same product; local JWT verification (via the
 * project's JWKS) skips the auth.getUser() round-trip on top of that.
 *
 * KEEP IN SYNC with the parallel gate in netlify/functions/bunny-playback.mjs
 * (same query + same unconfigured-open policy, duplicated across the build boundary).
 */
export async function checkAccess(cookies: AstroCookies, product: string): Promise<Access> {
  const url = process.env.PUBLIC_SUPABASE_URL;
  const anon = process.env.PUBLIC_SUPABASE_ANON_KEY;
  // Not configured → FAIL CLOSED (deny), so a production deploy that's missing the
  // Supabase env can never render member content to everyone. Local dev can opt
  // into open access with DEV_OPEN_ACCESS=1. (Mirrors bunny-playback.mjs.)
  if (!url || !anon) return { signedIn: false, entitled: process.env.DEV_OPEN_ACCESS === '1' };

  const token = cookies.get('sb-token')?.value;
  if (!token) return { signedIn: false, entitled: false };

  const cacheSecret = process.env.ACCESS_CACHE_SECRET;
  const tokenUserId = cacheSecret ? unsafeDecodeSub(token) : null;
  if (cacheSecret && tokenUserId && readCache(cookies, tokenUserId, product, cacheSecret)) {
    return { signedIn: true, entitled: true };
  }

  const supa = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  let userId = await verifyTokenLocally(token, url);
  if (!userId) {
    const { data: userData, error } = await supa.auth.getUser(token);
    if (error || !userData?.user) return { signedIn: false, entitled: false };
    userId = userData.user.id;
  }

  const { data: ent } = await supa
    .from('entitlements')
    .select('product')
    .eq('user_id', userId)
    .eq('product', product)
    .maybeSingle();

  const entitled = !!ent;
  if (entitled && cacheSecret) writeCache(cookies, userId, product, cacheSecret);
  return { signedIn: true, entitled };
}
