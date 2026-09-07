/**
 * The routine data the Strava function posts: title, length, and every pose
 * with its hold — netlify/functions/lib/strava-routines.json.
 *
 * Generated from src/content/routines/ so the description on Strava can never
 * disagree with the routine page. Only public runner routines (audience:
 * runners, no course) plus the handful of general ones Kevin logs. The lib
 * test re-derives this file and fails if it is stale.
 *
 * Re-run after editing any of these routines:  node scripts/gen-strava-routines.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import yaml from 'js-yaml';

/** Public routines that get a Strava entry. Runner-tagged ones are picked up automatically. */
export const EXTRA = ['deep-hips-lower-body', 'deep-legs-hamstrings', 'lower-back-release', 'full-body-reset'];
export const OUT = 'netlify/functions/lib/strava-routines.json';

const fm = (file) => yaml.load(readFileSync(file, 'utf8').split('---')[1]);

export function build() {
  const poses = new Map(readdirSync('src/content/poses').map((f) => { const d = fm(`src/content/poses/${f}`); return [d.slug, d.name_en]; }));
  const out = {};
  for (const f of readdirSync('src/content/routines').sort()) {
    const d = fm(`src/content/routines/${f}`);
    if (d.course) continue;
    if (d.audience !== 'runners' && !EXTRA.includes(d.slug)) continue;
    out[d.slug] = {
      title: d.title,
      minutes: d.minutes,
      steps: d.steps.map((s) => ({ name: poses.get(s.pose) ?? s.pose, seconds: s.seconds, sides: s.sides ?? 1 })),
    };
  }
  return out;
}

if ((process.argv[1] || '').endsWith('gen-strava-routines.mjs')) {
  writeFileSync(OUT, JSON.stringify(build(), null, 2) + '\n');
  console.log(`wrote ${OUT}: ${Object.keys(build()).join(', ')}`);
}
