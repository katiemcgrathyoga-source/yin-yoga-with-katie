import { getStore } from '@netlify/blobs';

/**
 * Where each person's Strava tokens live, and how they're kept fresh.
 *
 * One Netlify Blobs store, "strava":
 *   tokens             Kevin's original connection (strava-auth.mjs, key-gated)
 *   user:<supabase id> a member who pressed Connect Strava (strava-connect.mjs)
 *   athlete:<strava id> -> { uid }   so the webhook can find a member's tokens
 *                        from the owner_id on an activity event
 *
 * Every function that talks to Strava goes through freshAccessToken(), which
 * refreshes within a minute of expiry and writes the new pair back under the
 * same key, whichever kind of key it is.
 */
export const stravaStore = () => getStore('strava');
export const userKey = (uid) => `user:${uid}`;
export const athleteKey = (athleteId) => `athlete:${athleteId}`;
export const LEGACY_KEY = 'tokens';

/** Token record under `key`, or null. */
export const tokensAt = (store, key) => store.get(key, { type: 'json' });

/**
 * Tokens for the athlete an activity belongs to: Kevin's legacy record when
 * it's his id, else the member whose connection registered that athlete.
 * Returns { key, tokens } or null when nobody we know owns the activity.
 */
export async function tokensForAthlete(store, athleteId, legacyAthleteId) {
  const id = String(athleteId ?? '');
  if (!id) return null;
  if (legacyAthleteId && id === String(legacyAthleteId)) {
    const tokens = await tokensAt(store, LEGACY_KEY);
    return tokens ? { key: LEGACY_KEY, tokens } : null;
  }
  const link = await tokensAt(store, athleteKey(id));
  if (!link?.uid) {
    // Before STRAVA_ATHLETE_ID was set, Kevin's record was the only one.
    if (!legacyAthleteId) {
      const tokens = await tokensAt(store, LEGACY_KEY);
      if (tokens && String(tokens.athlete_id) === id) return { key: LEGACY_KEY, tokens };
    }
    return null;
  }
  const tokens = await tokensAt(store, userKey(link.uid));
  return tokens ? { key: userKey(link.uid), tokens } : null;
}

/** Refresh when within a minute of expiry; persist whatever Strava hands back. */
export async function freshAccessToken(store, key, tokens, clientId, clientSecret) {
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
  await store.setJSON(key, {
    ...tokens,
    access_token: t.access_token,
    refresh_token: t.refresh_token || tokens.refresh_token,
    expires_at: t.expires_at,
  });
  return t.access_token;
}
