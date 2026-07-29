import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Mints a short-lived, signed Bunny Stream playback URL — but only for a signed-in
 * user who actually owns the course.
 *   GET /api/playback?v=<videoGuid>
 *   Authorization: Bearer <supabase access token>   (from the logged-in client)
 *   -> { embedUrl, expires }
 *
 * Gate order:
 *   1. The GUID must be a known course video (BUNNY_STREAM_ALLOW).
 *   2. If Supabase is configured, the caller must present a valid session AND
 *      hold the entitlement for this product. If Supabase is NOT configured yet,
 *      we fall back to allowlist-only (the Phase 0 spike behaviour).
 *   3. Then, and only then, we sign the embed URL.
 */
export default async (req) => {
  const url = new URL(req.url);
  const videoId = (url.searchParams.get('v') || '').trim();

  const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
  const TOKEN_KEY = process.env.BUNNY_STREAM_TOKEN_KEY;
  const ALLOW = (process.env.BUNNY_STREAM_ALLOW || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const TTL = Number(process.env.BUNNY_STREAM_TTL || 3600);
  const PRODUCT = process.env.RUNNER_PRODUCT || 'runner-reset';

  const SUPA_URL = process.env.PUBLIC_SUPABASE_URL;
  const SUPA_ANON = process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!LIBRARY_ID || !TOKEN_KEY) {
    return json({ error: 'Bunny Stream is not configured.' }, 500);
  }
  if (!videoId) {
    return json({ error: 'Missing video id. Call /api/playback?v=<videoGuid>.' }, 400);
  }
  // 1. Known course video?
  if (!ALLOW.includes(videoId)) {
    return json({ error: 'This video is not available.' }, 403);
  }

  // 2. Entitlement check (skipped until Supabase is configured).
  //    KEEP IN SYNC with src/lib/access.ts checkAccess() — the SSR gate is a
  //    parallel copy (same query + same unconfigured-open policy); the esbuild/
  //    Vite boundary prevents sharing one module.
  if (SUPA_URL && SUPA_ANON) {
    const authz = req.headers.get('authorization') || '';
    const jwt = authz.startsWith('Bearer ') ? authz.slice(7).trim() : '';
    if (!jwt) {
      return json({ error: 'Please sign in to watch.', code: 'signin' }, 401);
    }
    // Run as the user: getUser validates the token; the entitlements read is
    // then constrained by row-level security to their own rows.
    const supa = createClient(SUPA_URL, SUPA_ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await supa.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return json({ error: 'Your session has expired — sign in again.', code: 'signin' }, 401);
    }
    const { data: ent, error: entErr } = await supa
      .from('entitlements')
      .select('product')
      .eq('user_id', userData.user.id)
      .eq('product', PRODUCT)
      .maybeSingle();
    if (entErr) {
      return json({ error: 'Could not verify your access, please try again.' }, 500);
    }
    if (!ent) {
      return json({ error: "You don't have access to this course yet.", code: 'locked' }, 403);
    }
  }

  // 3. Sign the embed URL: token = SHA256_hex(tokenKey + videoId + expires)
  //    KEEP IN SYNC with src/lib/bunny.ts signBunnyEmbed() — same formula,
  //    duplicated across the esbuild/Vite boundary; a drift fails closed.
  const expires = Math.floor(Date.now() / 1000) + TTL;
  const token = createHash('sha256').update(TOKEN_KEY + videoId + expires).digest('hex');
  const embedUrl =
    `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}?token=${token}&expires=${expires}`;

  return json({ embedUrl, expires });
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export const config = { path: '/api/playback' };
