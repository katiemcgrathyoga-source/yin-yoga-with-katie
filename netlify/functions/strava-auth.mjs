import { getStore } from '@netlify/blobs';

/**
 * One-time Strava connection for Kevin's account.
 *   GET /api/strava-auth?key=<STRAVA_VERIFY_TOKEN>   -> bounces to Strava's consent screen
 *   GET /api/strava-auth?code=...&state=<key>        -> Strava sends him back here; we
 *                                                       swap the code for tokens and keep them
 *
 * Tokens live in the Netlify Blobs store "strava" under the key "tokens". The
 * webhook function refreshes them as needed and writes the new ones back.
 *
 * The `key` (sent through OAuth as `state`) is what stops a stranger who finds
 * this URL from connecting THEIR Strava and hijacking the runs feed. Once
 * connected, STRAVA_ATHLETE_ID pins it further: any other athlete is refused.
 */
export default async (req) => {
  const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
  const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
  const KEY = process.env.STRAVA_VERIFY_TOKEN;
  const ATHLETE = process.env.STRAVA_ATHLETE_ID;
  if (!CLIENT_ID || !CLIENT_SECRET || !KEY) return text('Strava env not configured', 500);

  const url = new URL(req.url);
  const redirect = `${url.origin}/api/strava-auth`;

  // Step 2: back from Strava with a code.
  const code = url.searchParams.get('code');
  if (code) {
    if (url.searchParams.get('state') !== KEY) return text('Bad state', 403);
    const scope = url.searchParams.get('scope') || '';
    if (!scope.includes('activity:write') || !/activity:read/.test(scope)) {
      return text(`Strava did not grant the needed scopes (got "${scope}"). Start again and tick both boxes.`, 400);
    }

    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, grant_type: 'authorization_code' }),
    });
    if (!res.ok) return text(`Token exchange failed (${res.status}): ${await res.text()}`, 502);
    const tok = await res.json();

    const athleteId = String(tok.athlete?.id || '');
    if (ATHLETE && athleteId !== String(ATHLETE)) {
      return text(`Refused: this is athlete ${athleteId}, but STRAVA_ATHLETE_ID is ${ATHLETE}.`, 403);
    }

    await getStore('strava').setJSON('tokens', {
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: tok.expires_at,
      athlete_id: athleteId,
      connected_at: new Date().toISOString(),
    });

    const name = [tok.athlete?.firstname, tok.athlete?.lastname].filter(Boolean).join(' ') || athleteId;
    return text(
      `Connected Strava as ${name} (athlete ${athleteId}).\n\n` +
        (ATHLETE ? '' : `Now set STRAVA_ATHLETE_ID=${athleteId} in Netlify so nobody else can connect.\n`) +
        'Next: create the webhook subscription (see STRAVA-SETUP.md), then go for a run.',
    );
  }

  // Step 1: send Kevin to Strava.
  if (url.searchParams.get('key') !== KEY) return text('Not found', 404);
  const authorize = new URL('https://www.strava.com/oauth/authorize');
  authorize.searchParams.set('client_id', CLIENT_ID);
  authorize.searchParams.set('redirect_uri', redirect);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('approval_prompt', 'force');
  authorize.searchParams.set('scope', 'activity:read_all,activity:write');
  authorize.searchParams.set('state', KEY);
  return Response.redirect(authorize.toString(), 302);
};

const text = (body, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

export const config = { path: '/api/strava-auth' };
