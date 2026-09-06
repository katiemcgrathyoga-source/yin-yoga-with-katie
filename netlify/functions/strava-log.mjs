import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';
import { ROUTINES, routinePick, describe } from './lib/strava-routine.mjs';

/**
 * Create the yoga activity on Strava from the routine player's finish screen.
 *   POST /api/strava-log  { key, slug, seconds }
 *
 * Why this exists: it removes the manual entry. Press the button and the
 * activity appears with the right title, length and description, instead of
 * typing all three into the Strava app.
 *
 * It was BUILT hoping the card would also read "via Yin Yoga with Katie", the
 * way a watch is credited. Tested 2026-09-06: it does not. An activity created
 * through POST /activities is credited the same as a hand-typed one, so the
 * branding idea is dead — don't rebuild it expecting a different answer. (The
 * only untested avenue is the /uploads endpoint with a TCX file, which is a lot
 * of machinery for a line of text.) The convenience is the whole payoff.
 *
 * Kevin only. The button is hidden unless the browser holds STRAVA_LOG_KEY, and
 * this endpoint checks it again — the client is not trusted. Worst case if the
 * key leaks: somebody posts a yoga activity to his feed, which he can delete.
 *
 * Photos still go on in the Strava app: the API cannot upload them.
 */
export default async (req) => {
  const KEY = process.env.STRAVA_LOG_KEY;
  const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
  const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
  if (!KEY || !CLIENT_ID || !CLIENT_SECRET) return json({ error: 'Strava logging not configured' }, 500);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad JSON' }, 400);
  }

  if (!sameSecret(body.key, KEY)) return json({ error: 'Not authorised' }, 403);

  const slug = String(body.slug || '');
  if (!ROUTINES[slug]) return json({ error: `Unknown routine: ${slug}` }, 400);

  // Trust the routine's own length over a stopwatch the browser may have had
  // paused or backgrounded; accept the measured time only when it is sane.
  const planned = ROUTINES[slug].minutes * 60;
  const measured = Number(body.seconds);
  const seconds = Number.isFinite(measured) && measured > 60 && measured < planned * 3
    ? Math.round(measured)
    : planned;

  try {
    const store = getStore('strava');
    const tokens = await store.get('tokens', { type: 'json' });
    if (!tokens) return json({ error: 'Strava is not connected' }, 503);
    const access = await freshAccessToken(store, tokens, CLIENT_ID, CLIENT_SECRET);

    const pick = routinePick(slug);
    // Strava's start_date_local is wall-clock time with no zone, so it has to
    // come from the phone that practised — the server's clock is UTC and would
    // file the activity hours out. Fall back to UTC only if the client didn't say.
    const start = localStamp(body.startedAt) ?? localStamp(new Date(Date.now() - seconds * 1000).toISOString());

    const res = await fetch('https://www.strava.com/api/v3/activities', {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: ROUTINES[slug].title,
        sport_type: 'Yoga',
        start_date_local: start,
        elapsed_time: seconds,
        description: describe(pick),
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`strava-log: create failed ${res.status}: ${detail}`);
      return json({ error: `Strava refused the activity (${res.status})` }, 502);
    }
    const activity = await res.json();
    console.log(`strava-log: created ${activity.id} (${slug}, ${seconds}s)`);
    return json({ id: activity.id, url: `https://www.strava.com/activities/${activity.id}` });
  } catch (err) {
    console.error(`strava-log: ${err?.message || err}`);
    return json({ error: 'Could not reach Strava' }, 502);
  }
};

/** "2026-09-06T21:04:00" from an ISO-ish string, or null if it isn't one. */
function localStamp(v) {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/.exec(String(v ?? ''));
  return m ? `${m[1]}T${m[2]}` : null;
}

/** Length-safe constant-time compare, so the key can't be probed byte by byte. */
function sameSecret(given, expected) {
  const a = Buffer.from(String(given ?? ''));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

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

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const config = { path: '/api/strava-log' };
