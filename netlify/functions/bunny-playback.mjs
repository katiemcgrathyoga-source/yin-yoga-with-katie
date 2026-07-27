import { createHash } from 'node:crypto';

/**
 * Mints a short-lived, signed Bunny Stream playback URL.
 *   GET /api/playback?v=<videoGuid>  ->  { embedUrl, expires }
 *
 * This is the access gate for self-hosted PAID video (The Runner's Reset, and
 * the membership later). The client never sees a permanent video URL — it asks
 * this function, which returns a token that expires, so links can't be shared.
 *
 * SPIKE STATE: there is no user auth yet. To make sure this endpoint can't be
 * abused to sign real paid content before entitlements exist, it will ONLY sign
 * video GUIDs listed in BUNNY_STREAM_ALLOW. Phase 1 replaces that allowlist with
 * a Supabase session + entitlement check (see SELF-HOSTING-VIDEO.md).
 */
export default async (req) => {
  const url = new URL(req.url);
  const videoId = (url.searchParams.get('v') || '').trim();

  const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
  const TOKEN_KEY = process.env.BUNNY_STREAM_TOKEN_KEY;
  const ALLOW = (process.env.BUNNY_STREAM_ALLOW || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const TTL = Number(process.env.BUNNY_STREAM_TTL || 3600);

  if (!LIBRARY_ID || !TOKEN_KEY) {
    return json({ error: 'Bunny Stream is not configured (set BUNNY_STREAM_LIBRARY_ID and BUNNY_STREAM_TOKEN_KEY).' }, 500);
  }
  if (!videoId) {
    return json({ error: 'Missing video id. Call /api/playback?v=<videoGuid>.' }, 400);
  }
  // TODO(phase 1): replace this allowlist with a real Supabase entitlement check.
  if (!ALLOW.includes(videoId)) {
    return json({ error: 'This video is not available to you.' }, 403);
  }

  // Bunny "Embed View Token Authentication":
  //   token = SHA256_hex(tokenAuthenticationKey + videoId + expires)
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
