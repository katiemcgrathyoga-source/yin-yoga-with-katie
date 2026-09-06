/**
 * Which yin routine to suggest after a run, and the text that goes on Strava.
 *
 * Pure functions, no I/O, so `node netlify/functions/lib/strava-routine.test.mjs`
 * exercises the whole decision without a Strava account.
 *
 * Only PUBLIC routines (no `course:` key in src/content/routines/) are linked.
 * A Strava follower who taps through must land on a page they can practise
 * from, not a paywall — the routine page then makes the runner offer itself.
 */

const SITE = 'https://yinyogawithkatie.com';

/** Public runner-relevant routines. Keep `minutes` in step with the routine files. */
export const ROUTINES = {
  'the-day-after':        { title: 'The Day After',          minutes: 23 },
  'the-outside-line':     { title: 'The Outside Line',       minutes: 26 },
  'deep-hips-lower-body': { title: 'Deep Hips & Lower Body', minutes: 37 },
  'deep-legs-hamstrings': { title: 'Deep Legs & Hamstrings', minutes: 26 },
  'lower-back-release':   { title: 'Lower-Back Release',     minutes: 25 },
  'full-body-reset':      { title: 'Full-Body Reset',        minutes: 37 },
};

/** Strava's run workout_type codes. */
const RACE = 1, LONG = 2, WORKOUT = 3;

const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun']);

/**
 * Classify a Strava activity summary. Returns null when it isn't a run.
 * @param {object} a  Strava activity (detailed or summary representation)
 */
export function classify(a) {
  const type = a.sport_type || a.type;
  if (!RUN_TYPES.has(type)) return null;
  const km = (a.distance || 0) / 1000;
  const gainPerKm = km > 0 ? (a.total_elevation_gain || 0) / km : 0;
  if (a.workout_type === RACE) return 'race';
  if (a.workout_type === LONG || km >= 16) return 'long';
  if (a.workout_type === WORKOUT) return 'workout';
  if (km >= 5 && gainPerKm >= 12) return 'hilly';
  return 'easy';
}

/** Alternatives per kind, in rotation order. First entry is the "obvious" one. */
const BY_KIND = {
  race:    ['the-day-after'],
  long:    ['the-day-after', 'deep-hips-lower-body'],
  workout: ['deep-legs-hamstrings', 'the-day-after'],
  hilly:   ['deep-legs-hamstrings'],
  easy:    ['the-outside-line', 'deep-hips-lower-body', 'lower-back-release', 'full-body-reset'],
};

/**
 * Pick the routine for an activity. Deterministic on the activity id, so a
 * webhook retry picks the same one, and consecutive easy runs rotate.
 */
export function pickRoutine(a) {
  const kind = classify(a);
  if (!kind) return null;
  const options = BY_KIND[kind];
  const slug = options[Number(a.id || 0) % options.length];
  return { kind, slug, ...ROUTINES[slug], url: `${SITE}/routines/${slug}/` };
}

/** Marker that tells us we already wrote to this activity. */
export const MARKER = 'yinyogawithkatie.com';

const LEAD = {
  race:    'Race legs. Tomorrow morning, the yin for it:',
  long:    'Long one. The yin for it, tonight or tomorrow morning:',
  workout: 'Hard session. The yin for it:',
  hilly:   'Hills. The yin for calves and hamstrings after:',
  easy:    'Post-run yin:',
};

/**
 * The block appended to the activity description. Two lines: today's routine,
 * and the free class for runners. Plain text, since Strava strips formatting
 * but makes bare URLs tappable.
 */
export function describe(pick) {
  return (
    `${LEAD[pick.kind]} ${pick.title}, ${pick.minutes} min, follow-along timer\n` +
    `${pick.url}\n` +
    `Free 15-min post-run yin class for runners: ${SITE}/runners`
  );
}

/**
 * Merge our block into whatever description Kevin already wrote. Returns null
 * if the activity already carries the marker, so retries are no-ops.
 */
export function mergeDescription(existing, block) {
  const current = (existing || '').trim();
  if (current.includes(MARKER)) return null;
  return current ? `${current}\n\n${block}` : block;
}
