// node netlify/functions/lib/strava-routine.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classify, pickRoutine, describe, findTag, plan, matchTitle, routinePick, ROUTINES, SHORT, MARKER } from './strava-routine.mjs';

const run = (over) => ({ id: 1, name: 'Morning Run', description: '', type: 'Run', sport_type: 'Run', distance: 8000, total_elevation_gain: 40, workout_type: 0, ...over });

// Only runs classify
assert.equal(classify({ type: 'Ride', distance: 30000 }), null);
assert.equal(pickRoutine({ sport_type: 'Swim' }), null);

// Kinds
assert.equal(classify(run()), 'easy');
assert.equal(classify(run({ workout_type: 1 })), 'race');
assert.equal(classify(run({ workout_type: 2 })), 'long');
assert.equal(classify(run({ distance: 21100 })), 'long');
assert.equal(classify(run({ workout_type: 3 })), 'workout');
assert.equal(classify(run({ distance: 10000, total_elevation_gain: 200 })), 'hilly');
assert.equal(classify(run({ distance: 3000, total_elevation_gain: 100 })), 'easy', 'short hilly jog stays easy');

// Rotation is deterministic on id and cycles the easy list
assert.equal(new Set([1, 2, 3, 4].map((id) => pickRoutine(run({ id })).slug)).size, 4);
for (const id of [1, 2, 3, 4, 5, 6]) for (const wt of [0, 1, 2, 3]) {
  const p = pickRoutine(run({ id, workout_type: wt }));
  assert.ok(ROUTINES[p.slug], p.slug);
  assert.match(p.url, /^https:\/\/yinyogawithkatie\.com\/routines\/[a-z-]+\/$/);
  assert.match(p.short, /^https:\/\/yinyogawithkatie\.com\/r\/[a-z-]+$/);
}

// A named routine wins, aliases resolve
assert.equal(pickRoutine(run(), 'lower-back-release').slug, 'lower-back-release');
assert.equal(findTag(run({ name: 'Easy 8k +yin hips' })).slug, 'deep-hips-lower-body');
assert.equal(findTag(run({ name: 'Easy 8k +YIN outside-line' })).slug, 'the-outside-line');
assert.equal(findTag(run({ name: 'Easy 8k +yin tonight' })).slug, null, 'unknown word is not a slug');
assert.equal(findTag(run({ name: 'Easy 8k +yin tonight' })).matched, '+yin', 'only the tag is removed');
assert.equal(findTag(run({ description: 'felt fine +yin' })).where, 'description');
assert.equal(findTag(run()), null);

// Description text: the routine, its length, the short link. Same every time.
const block = describe(pickRoutine(run({ id: 2, workout_type: 1 })));
assert.equal(block, "Katie's The Day After, 23 min:\nyinyogawithkatie.com/r/day-after");
assert.doesNotMatch(block, /runners|follow-along|https/);
assert.ok(block.includes(MARKER));

// plan(): nothing without a tag
assert.equal(plan(run()), null);
assert.equal(plan(run({ description: 'Easy loop, felt fine.' })), null);

// plan(): tag in the title is removed from the title, block goes in the description
let p = plan(run({ name: 'Easy 8k +yin hips', description: 'Legs heavy.' }));
assert.equal(p.name, 'Easy 8k');
assert.match(p.description, /^Legs heavy\.\n\n/);
assert.match(p.description, /\/r\/hips$/m);
assert.equal(p.pick.slug, 'deep-hips-lower-body');

// plan(): tag in the description is removed there, name untouched
p = plan(run({ name: 'Morning Run', description: 'Felt fine +yin' }));
assert.equal(p.name, undefined);
assert.match(p.description, /^Felt fine\n\n/);
assert.doesNotMatch(p.description, /\+yin/);

// plan(): tag alone, empty description -> block only
p = plan(run({ name: '+yin', description: '' }));
assert.equal(p.name, '');
assert.match(p.description, /^Katie's [A-Z]/);

// plan(): idempotent once the block is there
assert.equal(plan(run({ name: 'Easy 8k +yin', description: `Done\n\n${block}` })), null);

// plan(): a ride tagged with a named routine works; a ride with bare +yin does not
assert.equal(plan({ id: 9, sport_type: 'Ride', name: 'Spin +yin back', description: '' }).pick.slug, 'lower-back-release');
assert.equal(plan({ id: 9, sport_type: 'Ride', name: 'Spin +yin', description: '' }), null);

// ---- yoga activities -------------------------------------------------------
const yoga = (name, over = {}) => ({ id: 42, sport_type: 'Yoga', type: 'Yoga', name, description: '', elapsed_time: 1560, ...over });

assert.equal(matchTitle('The Outside Line'), 'the-outside-line');
assert.equal(matchTitle('outside line, 26 min'), 'the-outside-line');
assert.equal(matchTitle('Outside'), 'the-outside-line');
assert.equal(matchTitle('Deep Hips & Lower Body'), 'deep-hips-lower-body');
assert.equal(matchTitle('hips'), 'deep-hips-lower-body');
assert.equal(matchTitle('Evening yin: lower-back release'), 'lower-back-release');
assert.equal(matchTitle('Yoga'), null, 'a plain yoga session is left alone');
assert.equal(matchTitle('Morning Yoga'), null);

let y = plan(yoga('The Outside Line'));
assert.equal(y.name, undefined, 'title untouched');
assert.equal(y.pick.kind, 'yoga');
assert.equal(y.description, "Katie's The Outside Line, 26 min:\nyinyogawithkatie.com/r/outside");

y = plan(yoga('hips', { description: 'Slow one after the long run.' }));
assert.match(y.description, /^Slow one after the long run\.\n\nKatie's Deep Hips/);
assert.equal(plan(yoga('Yoga')), null);
assert.equal(plan(yoga('The Outside Line', { description: `x\n\n${block}` })), null, 'idempotent');

// ---- short links -----------------------------------------------------------
// The posts link /r/<alias>; the redirects live in netlify.toml. Nothing else
// connects the two, so check here that every alias really resolves.
const toml = readFileSync(new URL('../../../netlify.toml', import.meta.url), 'utf8');
const rules = new Map(
  toml.split('[[redirects]]').slice(1).map((block) => [
    (/from = "([^"]+)"/.exec(block) || [])[1],
    (/to = "([^"]+)"/.exec(block) || [])[1],
  ]),
);
for (const [slug, alias] of Object.entries(SHORT)) {
  assert.ok(ROUTINES[slug], `SHORT has an unknown routine: ${slug}`);
  // ?for=runners switches the page's offer to the Post-Run Reset (Cta.astro).
  assert.equal(rules.get(`/r/${alias}`), `/routines/${slug}/?for=runners`, `netlify.toml is missing or wrong for /r/${alias}`);
}
for (const slug of Object.keys(ROUTINES)) assert.ok(SHORT[slug], `${slug} has no short link`);
assert.equal(new Set(Object.values(SHORT)).size, Object.keys(SHORT).length, 'short aliases must be unique');

// routinePick backs the finish-screen "Log to Strava" button
assert.equal(routinePick('nope'), null);
const rp = routinePick('deep-legs-hamstrings');
assert.equal(rp.kind, 'yoga');
assert.equal(rp.short, 'https://yinyogawithkatie.com/r/legs');
assert.equal(describe(rp), "Katie's Deep Legs & Hamstrings, 26 min:\nyinyogawithkatie.com/r/legs");

console.log('strava-routine: all checks passed');
