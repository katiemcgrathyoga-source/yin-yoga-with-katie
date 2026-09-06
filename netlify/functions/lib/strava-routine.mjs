/**
 * Which yin routine to suggest after a run, and the text that goes on Strava.
 *
 * Pure functions, no I/O, so `node netlify/functions/lib/strava-routine.test.mjs`
 * exercises the whole decision without a Strava account.
 *
 * MANUAL BY DESIGN. Kevin runs most days; a routine link on every run would be
 * noise, and would claim yin he didn't do. Two ways in, both his choice:
 *
 *   1. A separate YOGA activity (the preferred one). He logs "Yoga" in the
 *      Strava app with the routine's name as the title ("The Outside Line",
 *      or just "outside"), adds the muscle-map photo, and the block is written
 *      into its description. Every yoga activity is one he actually did.
 *   2. A `+yin` tag on a run's title or description, for the days he'd rather
 *      keep it on the run. `+yin` alone picks from the run; `+yin outside-line`
 *      names one. The tag is removed and the block written.
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

/** Short names Kevin can type after +yin, on top of the full slugs. */
const ALIASES = {
  'day-after': 'the-day-after',
  'outside-line': 'the-outside-line', 'outside': 'the-outside-line',
  'hips': 'deep-hips-lower-body',
  'legs': 'deep-legs-hamstrings', 'hamstrings': 'deep-legs-hamstrings',
  'back': 'lower-back-release',
  'full': 'full-body-reset', 'reset': 'full-body-reset',
};

/** The opt-in tag: `+yin` on its own, or `+yin <routine>`. Case-insensitive. */
export const TAG = /\+yin(?:[ \t]+([a-z0-9-]+))?/i;

/**
 * Find the tag in a run's title or description. Returns null when absent, else
 * { where: 'name' | 'description', slug: string | null }. A word after +yin
 * that isn't a routine is treated as ordinary text (slug null), so
 * "+yin tonight" still works and picks automatically.
 */
export function findTag(activity) {
  for (const where of ['name', 'description']) {
    const m = TAG.exec(activity[where] || '');
    if (!m) continue;
    const word = (m[1] || '').toLowerCase();
    const slug = ROUTINES[word] ? word : ALIASES[word] || null;
    return { where, slug, matched: slug ? m[0] : m[0].replace(/[ \t]+[a-z0-9-]+$/i, '') };
  }
  return null;
}

const YOGA_TYPES = new Set(['Yoga', 'Workout']);

/**
 * For a yoga activity, find the routine named in the title: a slug, an alias,
 * or the routine's own title ("The Outside Line", "outside line", "Outside").
 * Returns a slug or null.
 */
export function matchTitle(name) {
  const t = (name || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  if (!t) return null;
  for (const slug of Object.keys(ROUTINES)) {
    const title = ROUTINES[slug].title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
    if (t.includes(title) || t.includes(slug.replace(/-/g, ' '))) return slug;
  }
  for (const word of t.split(' ')) {
    if (ALIASES[word]) return ALIASES[word];
    if (ALIASES[word.replace(/s$/, '')]) return ALIASES[word.replace(/s$/, '')];
  }
  return null;
}

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
 * Pick the routine for an activity: the one named in the tag if any, else by
 * the run. Deterministic on the activity id, so a retry picks the same one.
 * Non-runs get a routine only when the tag names one.
 */
export function pickRoutine(a, named = null) {
  const kind = classify(a) || 'easy';
  if (named && ROUTINES[named]) return { kind, slug: named, ...ROUTINES[named], url: `${SITE}/routines/${named}/` };
  if (!classify(a)) return null;
  const options = BY_KIND[kind];
  const slug = options[Number(a.id || 0) % options.length];
  return { kind, slug, ...ROUTINES[slug], url: `${SITE}/routines/${slug}/` };
}

/** Marker that tells us we already wrote to this activity. */
export const MARKER = 'yinyogawithkatie.com';

const LEAD = {
  yoga:    'Follow along with the timer:',
  race:    'Race legs. The yin for the morning after:',
  long:    'Long one. The yin for it:',
  workout: 'Hard session. The yin for it:',
  hilly:   'Hills. The yin for calves and hamstrings:',
  easy:    'Post-run yin:',
};

/**
 * The block written into the description. Two lines: the routine, and the
 * free class for runners. Plain text, since Strava strips formatting but
 * makes bare URLs tappable.
 */
export function describe(pick) {
  return (
    `${LEAD[pick.kind]} ${pick.title}, ${pick.minutes} min, follow-along timer\n` +
    `${pick.url}\n` +
    `Free 15-min post-run yin class for runners: ${SITE}/runners`
  );
}

/**
 * Work out what to write back. Returns null when nothing should change:
 * no tag, or the block is already there. Otherwise { name?, description }.
 */
export function plan(activity) {
  if ((activity.description || '').includes(MARKER)) return null;

  // A yoga activity named after a routine: fill it in, leave the title alone.
  if (YOGA_TYPES.has(activity.sport_type || activity.type)) {
    const slug = matchTitle(activity.name);
    if (!slug) return null;
    const pick = { kind: 'yoga', slug, ...ROUTINES[slug], url: `${SITE}/routines/${slug}/` };
    const block = describe(pick);
    const body = (activity.description || '').trim();
    return { pick, description: body ? `${body}

${block}` : block };
  }

  const tag = findTag(activity);
  if (!tag) return null;
  const pick = pickRoutine(activity, tag.slug);
  if (!pick) return null;
  const block = describe(pick);

  const strip = (s) => (s || '').replace(tag.matched, '').replace(/[ \t]{2,}/g, ' ').trim();
  const out = { pick };
  if (tag.where === 'name') out.name = strip(activity.name);
  const body = tag.where === 'description' ? strip(activity.description) : (activity.description || '').trim();
  out.description = body ? `${body}\n\n${block}` : block;
  return out;
}
