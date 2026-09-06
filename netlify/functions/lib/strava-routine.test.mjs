// node netlify/functions/lib/strava-routine.test.mjs
import assert from 'node:assert/strict';
import { classify, pickRoutine, describe, mergeDescription, ROUTINES } from './strava-routine.mjs';

const run = (over) => ({ id: 1, type: 'Run', sport_type: 'Run', distance: 8000, total_elevation_gain: 40, workout_type: 0, ...over });

// Only runs
assert.equal(classify({ type: 'Ride', distance: 30000 }), null);
assert.equal(classify({ sport_type: 'Walk', distance: 3000 }), null);
assert.equal(pickRoutine({ sport_type: 'Swim' }), null);

// Kinds
assert.equal(classify(run()), 'easy');
assert.equal(classify(run({ workout_type: 1 })), 'race');
assert.equal(classify(run({ workout_type: 2 })), 'long');
assert.equal(classify(run({ distance: 21100 })), 'long');
assert.equal(classify(run({ workout_type: 3 })), 'workout');
assert.equal(classify(run({ distance: 10000, total_elevation_gain: 200 })), 'hilly');
assert.equal(classify(run({ distance: 3000, total_elevation_gain: 100 })), 'easy', 'short hilly jog stays easy');
assert.equal(classify(run({ sport_type: 'TrailRun' })), 'easy');

// Rotation is deterministic on id, and cycles across the easy list
const easySlugs = new Set([1, 2, 3, 4].map((id) => pickRoutine(run({ id })).slug));
assert.equal(easySlugs.size, 4);
assert.equal(pickRoutine(run({ id: 7 })).slug, pickRoutine(run({ id: 7 })).slug);

// Every slug resolves to a public routine URL
for (const id of [1, 2, 3, 4, 5, 6]) {
  for (const wt of [0, 1, 2, 3]) {
    const p = pickRoutine(run({ id, workout_type: wt }));
    assert.ok(ROUTINES[p.slug], p.slug);
    assert.match(p.url, /^https:\/\/yinyogawithkatie\.com\/routines\/[a-z-]+\/$/);
  }
}

// Description text
const block = describe(pickRoutine(run({ id: 2, workout_type: 1 })));
assert.match(block, /^Race legs\./);
assert.match(block, /The Day After, 23 min/);
assert.match(block, /\/routines\/the-day-after\/\n/);
assert.match(block, /\/runners$/);

// Merge: appends below Kevin's own text, and is idempotent
assert.equal(mergeDescription('', block), block);
assert.equal(mergeDescription('Easy loop, felt fine.', block), `Easy loop, felt fine.\n\n${block}`);
assert.equal(mergeDescription(`Already done\n\n${block}`, block), null);

console.log('strava-routine: all checks passed');
