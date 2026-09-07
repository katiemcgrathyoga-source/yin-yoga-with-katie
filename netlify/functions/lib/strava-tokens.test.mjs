// node netlify/functions/lib/strava-tokens.test.mjs
import assert from 'node:assert/strict';
import { tokensForAthlete, userKey, athleteKey, LEGACY_KEY } from './strava-tokens.mjs';
import { makeState, readState } from '../strava-connect.mjs';

// An in-memory stand-in for the blobs store.
const mem = (init = {}) => ({
  data: { ...init },
  async get(k) { return this.data[k] ?? null; },
  async setJSON(k, v) { this.data[k] = v; },
  async delete(k) { delete this.data[k]; },
});

const kevin = { access_token: 'k', refresh_token: 'kr', expires_at: 9e9, athlete_id: '111' };
const member = { access_token: 'm', refresh_token: 'mr', expires_at: 9e9, athlete_id: '222' };
const store = mem({ [LEGACY_KEY]: kevin, [userKey('uid-1')]: member, [athleteKey('222')]: { uid: 'uid-1' } });

// Kevin by STRAVA_ATHLETE_ID -> legacy record.
assert.deepEqual(await tokensForAthlete(store, 111, '111'), { key: LEGACY_KEY, tokens: kevin });
// A member by the athlete index -> their record.
assert.deepEqual(await tokensForAthlete(store, '222', '111'), { key: userKey('uid-1'), tokens: member });
// A stranger -> nothing, so the webhook ignores them.
assert.equal(await tokensForAthlete(store, '333', '111'), null);
// Before STRAVA_ATHLETE_ID is set, Kevin's record still matches by its own athlete_id.
assert.deepEqual(await tokensForAthlete(store, '111', ''), { key: LEGACY_KEY, tokens: kevin });
assert.equal(await tokensForAthlete(store, '333', ''), null);
// A dangling athlete index (member disconnected) -> nothing.
const dangling = mem({ [athleteKey('444')]: { uid: 'gone' } });
assert.equal(await tokensForAthlete(dangling, '444', '111'), null);

// OAuth state: round-trips, keeps the return path same-site, rejects tampering.
const secret = 's3cret';
const st = makeState({ uid: 'uid-1', ret: '/routines/after-the-run/' }, secret);
assert.deepEqual(readState(st, secret), { uid: 'uid-1', ret: '/routines/after-the-run/' });
assert.equal(readState(st, 'other'), null, 'wrong secret');
assert.equal(readState(st.slice(0, -2) + 'zz', secret), null, 'tampered signature');
assert.equal(readState('', secret), null);
assert.equal(readState(makeState({ uid: 'u', ret: 'https://evil.example/' }, secret), secret).ret, '/account', 'absolute return refused');
assert.equal(readState(makeState({ uid: 'u', ret: '//evil.example/' }, secret), secret).ret, '/account', 'protocol-relative refused');

console.log('strava-tokens: all checks passed');
