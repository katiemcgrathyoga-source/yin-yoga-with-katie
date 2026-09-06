import { getStore } from '@netlify/blobs';
import { pickRoutine, describe, mergeDescription } from './lib/strava-routine.mjs';

/**
 * Strava webhook: when Kevin uploads a run, append the matching yin routine
 * link to its description.
 *   GET  /api/strava-webhook   Strava's one-time subscription check
 *   POST /api/strava-webhook   activity events
 *
 * Why: every follower sees the run in their feed, and that feed is the runner
 * audience the course is for. A link on every run is daily distribution that
 * costs nothing once it's wired, and can't be forgotten.
 *
 * Strava wants a 200 within two seconds and retries otherwise, so the work is
 * kept to two API calls on the usual path (token refresh only when expired) and
 * is idempotent: a description that already carries our marker is left alone.
 *
 * Only `create` events for Kevin's athlete id are acted on. Other athletes,
 * updates, deletes, and non-run activities are acknowledged and ignored.
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
  if (event.object_type !== 'activity' || event.aspect_type !== 'create') return ok('ignored: not an activity create');
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

    const pick = pickRoutine(activity);
    if (!pick) return ok(`ignored: ${activity.sport_type || activity.type}`);

    const description = mergeDescription(activity.description, describe(pick));
    if (description === null) return ok('already done');

    const put = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    if (!put.ok) return ok(`update activity ${id} failed: ${put.status} ${await put.text()}`, true);

    return ok(`activity ${id} (${pick.kind}) -> ${pick.slug}`);
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
