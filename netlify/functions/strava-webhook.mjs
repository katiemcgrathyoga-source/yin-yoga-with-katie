import { getStore } from '@netlify/blobs';
import { plan } from './lib/strava-routine.mjs';

/**
 * Strava webhook: write the yin routine link into an activity Kevin logged.
 *   GET  /api/strava-webhook   Strava's one-time subscription check
 *   POST /api/strava-webhook   activity events
 *
 * Manual, not automatic: Kevin runs most days and a link on every run would
 * be noise. Two ways in, both his choice (see lib/strava-routine.mjs):
 *   1. a separate Yoga activity titled with the routine ("The Outside Line",
 *      "hips") — the preferred one; it carries the muscle-map photo too;
 *   2. `+yin` (or `+yin hips`…) in a run's title, for keeping it on the run.
 * Anything else is acknowledged and left alone.
 *
 * Both `create` and `update` events are handled, so a title fixed after
 * upload still fires. (Strava only sends update events for title, type and
 * privacy changes, so a change to the description alone won't.)
 *
 * Strava wants a 200 within two seconds and retries otherwise, so the usual
 * path is two API calls (token refresh only when expired) and the write is
 * idempotent: a description already carrying our marker is left alone.
 */
export default async (req) => {
  const VERIFY = process.env.STRAVA_VERIFY_TOKEN;
  const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
  const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
  const ATHLETE = process.env.STRAVA_ATHLETE_ID;
  if (!VERIFY || !CLIENT_ID || !CLIENT_SECRET) return new Response('Strava env not configured', { status: 500 });

  // Subscription handshake.
  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === VERIFY) {
      return json({ 'hub.challenge': url.searchParams.get('hub.challenge') });
    }
    return new Response('Forbidden', { status: 403 });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let event;
  try {
    event = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  // Always 200 from here on: Strava treats anything else as "retry me".
  if (event.object_type !== 'activity') return ok('ignored: not an activity');
  if (event.aspect_type !== 'create' && event.aspect_type !== 'update') return ok(`ignored: ${event.aspect_type}`);
  if (ATHLETE && String(event.owner_id) !== String(ATHLETE)) return ok('ignored: other athlete');

  try {
    const store = getStore('strava');
    const tokens = await store.get('tokens', { type: 'json' });
    if (!tokens) return ok('no tokens: visit /api/strava-auth first', true);

    const access = await freshAccessToken(store, tokens, CLIENT_ID, CLIENT_SECRET);
    const id = event.object_id;

    const res = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (!res.ok) return ok(`fetch activity ${id} failed: ${res.status}`, true);
    const activity = await res.json();

    const change = plan(activity);
    if (!change) return ok(`activity ${id}: nothing to do (no routine named, or already done)`);

    const body = { description: change.description };
    if (change.name !== undefined) body.name = change.name;
    const put = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!put.ok) return ok(`update activity ${id} failed: ${put.status} ${await put.text()}`, true);

    return ok(`activity ${id} (${change.pick.kind}) -> ${change.pick.slug}`);
  } catch (err) {
    return ok(`error: ${err?.message || err}`, true);
  }
};

/** Refresh when within a minute of expiry; persist whatever Strava hands back. */
async function freshAccessToken(store, tokens, clientId, clientSecret) {
  const now = Math.floor(Date.now() / 1000);
  if (tokens.expires_at && tokens.expires_at - 60 > now) return tokens.access_token;

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status} ${await res.text()}`);
  const t = await res.json();
  await store.setJSON('tokens', {
    ...tokens,
    access_token: t.access_token,
    refresh_token: t.refresh_token || tokens.refresh_token,
    expires_at: t.expires_at,
  });
  return t.access_token;
}

function ok(msg, isError = false) {
  (isError ? console.error : console.log)(`strava-webhook: ${msg}`);
  return new Response('ok', { status: 200 });
}

const json = (body) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

export const config = { path: '/api/strava-webhook' };
