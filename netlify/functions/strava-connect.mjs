import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { userFromRequest } from './lib/supabase-user.mjs';
import { stravaStore, userKey, athleteKey, tokensAt } from './lib/strava-tokens.mjs';

/**
 * Connect a member's own Strava, so Log to Strava posts to THEIR feed.
 *
 *   GET    /api/strava-connect            Bearer  -> { connected, athlete }
 *   POST   /api/strava-connect  {return}  Bearer  -> { url }  the Strava consent screen
 *   GET    /api/strava-connect?code&state         <- Strava sends them back here
 *   DELETE /api/strava-connect            Bearer  -> disconnect, and tell Strava
 *
 * Identity is the Supabase session (lib/supabase-user.mjs). The OAuth `state`
 * carries the user id and where to return to, signed with the Strava client
 * secret, so the callback can file the tokens under the right account without
 * a session cookie on the redirect and nobody can attach their Strava to
 * someone else's account by forging it. Ten-minute expiry.
 *
 * Tokens: user:<id> in the "strava" blobs store, plus athlete:<strava id> ->
 * { uid } so the webhook can act on this person's activities too (a Yoga
 * activity titled with a routine, or +yin on a run — the same opt-in Kevin
 * uses; see lib/strava-routine.mjs).
 *
 * Strava caps a new app at ONE connected athlete until they raise it on request
 * (developers.strava.com, "athlete capacity"). Until that's granted, only
 * Kevin's connection works and everyone else's consent screen fails with a
 * capacity error, which this returns to the page as ?strava=capacity.
 */
export default async (req) => {
  const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
  const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
  if (!CLIENT_ID || !CLIENT_SECRET) return json({ error: 'Strava not configured' }, 500);

  const url = new URL(req.url);
  const redirect = `${url.origin}/api/strava-connect`;

  // Back from Strava.
  if (req.method === 'GET' && (url.searchParams.get('code') || url.searchParams.get('error'))) {
    const state = readState(url.searchParams.get('state') || '', CLIENT_SECRET);
    if (!state) return text('Bad state', 403);
    const back = (flag) => Response.redirect(`${url.origin}${state.ret}${state.ret.includes('?') ? '&' : '?'}strava=${flag}`, 302);

    if (url.searchParams.get('error')) return back('denied');
    const scope = url.searchParams.get('scope') || '';
    if (!scope.includes('activity:write')) return back('scope');

    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code: url.searchParams.get('code'), grant_type: 'authorization_code' }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`strava-connect: token exchange failed ${res.status}: ${detail}`);
      return back(/capacity|athlete limit/i.test(detail) ? 'capacity' : 'failed');
    }
    const tok = await res.json();
    const athleteId = String(tok.athlete?.id || '');
    const name = [tok.athlete?.firstname, tok.athlete?.lastname].filter(Boolean).join(' ') || athleteId;

    const store = stravaStore();
    await store.setJSON(userKey(state.uid), {
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: tok.expires_at,
      athlete_id: athleteId,
      athlete_name: name,
      connected_at: new Date().toISOString(),
    });
    await store.setJSON(athleteKey(athleteId), { uid: state.uid });
    console.log(`strava-connect: ${state.uid} connected athlete ${athleteId}`);
    return back('connected');
  }

  // Everything else needs a signed-in member.
  const user = await userFromRequest(req);
  if (!user) return json({ error: 'Sign in first', code: 'signin' }, 401);
  const store = stravaStore();

  if (req.method === 'GET') {
    const tokens = await tokensAt(store, userKey(user.id));
    return json({ connected: !!tokens, athlete: tokens?.athlete_name ?? null });
  }

  if (req.method === 'POST') {
    let body = {};
    try { body = await req.json(); } catch { /* no body is fine */ }
    const ret = safePath(body.return);
    const authorize = new URL('https://www.strava.com/oauth/authorize');
    authorize.searchParams.set('client_id', CLIENT_ID);
    authorize.searchParams.set('redirect_uri', redirect);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('approval_prompt', 'auto');
    authorize.searchParams.set('scope', 'activity:read_all,activity:write');
    authorize.searchParams.set('state', makeState({ uid: user.id, ret }, CLIENT_SECRET));
    return json({ url: authorize.toString() });
  }

  if (req.method === 'DELETE') {
    const tokens = await tokensAt(store, userKey(user.id));
    if (tokens) {
      // Best effort: Strava forgets the app either way once the tokens are gone here.
      await fetch('https://www.strava.com/oauth/deauthorize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }).catch(() => {});
      if (tokens.athlete_id) await store.delete(athleteKey(tokens.athlete_id));
      await store.delete(userKey(user.id));
    }
    return json({ connected: false });
  }

  return json({ error: 'Method not allowed' }, 405);
};

/** A same-site path to return to, never an absolute URL someone slipped in. */
function safePath(p) {
  const s = String(p || '');
  return s.startsWith('/') && !s.startsWith('//') ? s.split('#')[0] : '/account';
}

const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (payload, secret) => createHmac('sha256', secret).update(payload).digest('base64url');

export function makeState({ uid, ret }, secret) {
  const payload = b64(JSON.stringify({ uid, ret, exp: Date.now() + 10 * 60 * 1000, n: randomBytes(6).toString('hex') }));
  return `${payload}.${sign(payload, secret)}`;
}

export function readState(state, secret) {
  const [payload, sig] = state.split('.');
  if (!payload || !sig) return null;
  const a = Buffer.from(sign(payload, secret));
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!s.uid || !s.ret || s.exp < Date.now()) return null;
    return { uid: String(s.uid), ret: safePath(s.ret) };
  } catch {
    return null;
  }
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const text = (body, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

export const config = { path: '/api/strava-connect' };
