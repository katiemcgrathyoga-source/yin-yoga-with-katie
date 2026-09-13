/**
 * Body maps for the course routines — one per routine, lit by what its poses
 * actually work, not by the routine's filing `area`.
 *
 * Seven Honest Minutes is filed under "full" because it is a quick everything
 * practice, but its two shapes only reach the hamstrings, glutes and lower back.
 * Lighting the whole lower body for it was a lie (Kevin, 2026-09-13). So the
 * map is derived: each pose names the muscle groups it works, a routine lights
 * the union, and the caption is written from the same list.
 *
 * The figure is the Grok render used for the Strava cards and the six region
 * plates (STRAVA-SETUP.md, "Editing a muscle map"). design/bodymap-course/base.jpg
 * is that figure with nothing lit; strava-map-edit.mjs flood-fills the segments
 * whose seeds are listed here. The seeds were read off `map` and checked by
 * eye on 2026-09-13 — if the figure is ever re-rendered, re-check them.
 *
 * Re-run after changing a routine, a pose's muscles, or the seeds:
 *   node scripts/gen-course-maps.mjs
 * Writes public/bodymap/routines/<slug>.webp (page) and .jpg (download / Strava),
 * design/bodymap-course/<slug>.jpg (master), and src/lib/courseRoutineMaps.json
 * (the caption per routine, read by src/lib/routineMaps.ts).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import yaml from 'js-yaml';
import sharp from 'sharp';

const BASE = 'design/bodymap-course/base.jpg';
const MASTERS = 'design/bodymap-course';
const WEB = 'public/bodymap/routines';
const OUT_JSON = 'src/lib/courseRoutineMaps.json';

/**
 * Muscle groups on the figure: flood-fill seeds (1408px frame, front figure on
 * the left, back figure on the right) and the words the caption uses. Order is
 * the caption order — top to bottom, front then back — so captions read the
 * same way on every routine.
 */
const MUSCLES = {
  chest:       { word: 'chest',                 seeds: [[412, 340], [510, 341]] },
  shoulders:   { word: 'shoulders',             seeds: [[578, 303], [345, 303], [842, 305], [1086, 305]] },
  upper_back:  { word: 'upper back',            seeds: [[963, 345], [891, 412], [1035, 412]] },
  abs:         { word: 'belly',                 seeds: [[488, 443], [433, 447], [488, 524], [436, 525]] },
  obliques:    { word: 'side body',             seeds: [[532, 467], [390, 504], [534, 573], [389, 581]] },
  lower_back:  { word: 'lower back',            seeds: [[964, 525]] },
  hip_flexors: { word: 'hip flexors',           seeds: [[441, 616], [482, 620]] },
  quads:       { word: 'quads',                 seeds: [[392, 799], [528, 798]] },
  it_band:     { word: 'outer hip',             seeds: [[362, 767], [559, 761]] },
  adductors:   { word: 'inner thighs',          seeds: [[426, 788], [495, 784]] },
  glutes:      { word: 'glutes',                seeds: [[915, 640], [1012, 641]] },
  hamstrings:  { word: 'hamstrings',            seeds: [[896, 818], [1031, 818]] },
  calves:      { word: 'calves',                seeds: [[879, 1110], [1044, 1111]] },
  shins:       { word: 'shins',                 seeds: [[406, 1086], [516, 1079]] },
  feet:        { word: 'feet',                  seeds: [[369, 1093], [554, 1080]] },
};

/**
 * What each pose works, in the figure's vocabulary. From the pose files'
 * target_areas and the Clark/Grilley reading, kept to what the tissue actually
 * loads under a long passive hold — Sphinx lengthens the belly and hip flexors
 * while the lower back compresses, so all three light; Corpse works nothing.
 * A pose missing from here fails the run, so a new shape can't show up blank.
 */
const POSE_MUSCLES = {
  'ankle-stretch':      ['shins', 'feet'],
  'banana':             ['obliques', 'it_band'],
  'butterfly':          ['adductors', 'lower_back'],
  'camel':              ['chest', 'abs', 'hip_flexors', 'quads'],
  'caterpillar':        ['hamstrings', 'lower_back', 'calves'],
  'childs-pose':        ['lower_back'],
  'corpse':             [],
  'crocodile':          ['lower_back'],
  'dangling':           ['hamstrings', 'lower_back', 'calves'],
  'deer':               ['glutes', 'it_band', 'adductors'],
  'dragon':             ['hip_flexors', 'quads'],
  'dragonfly':          ['hamstrings', 'adductors', 'lower_back'],
  'eagle':              ['upper_back', 'shoulders'],
  'frog':               ['adductors'],
  'half-butterfly':     ['hamstrings', 'adductors', 'lower_back'],
  'happy-baby':         ['adductors', 'glutes', 'lower_back'],
  'legs-up-the-wall':   ['hamstrings', 'calves'],
  'melting-heart':      ['chest', 'shoulders', 'upper_back'],
  'puppy':              ['chest', 'shoulders', 'upper_back'],
  'reclined-hamstring': ['hamstrings', 'calves'],
  'reclined-swan':      ['glutes', 'it_band'],
  'reclined-twist':     ['lower_back', 'obliques', 'glutes'],
  'saddle':             ['quads', 'hip_flexors', 'shins'],
  'seal':               ['abs', 'hip_flexors', 'lower_back'],
  'seated-twist':       ['obliques', 'upper_back', 'lower_back'],
  'shoelace':           ['glutes', 'it_band', 'lower_back'],
  'sleeping-swan':      ['glutes', 'it_band', 'hip_flexors'],
  'sphinx':             ['abs', 'hip_flexors', 'lower_back'],
  'squat':              ['adductors', 'calves', 'feet', 'lower_back'],
  'supported-bridge':   ['hip_flexors', 'lower_back', 'chest'],
  'supported-fish':     ['chest', 'shoulders'],
  'thread-the-needle':  ['upper_back', 'shoulders'],
  'toe-squat':          ['feet'],
  'twisted-dragon':     ['hip_flexors', 'quads', 'obliques', 'it_band'],
  'wind-relieving':     ['lower_back', 'glutes'],
};

const fm = (file) => yaml.load(readFileSync(file, 'utf8').split('---')[1]);

/** "the hip flexors, quads and lower back" — in MUSCLES order. */
const sentence = (keys) => {
  const words = Object.keys(MUSCLES).filter((k) => keys.has(k)).map((k) => MUSCLES[k].word);
  if (!words.length) return 'nothing in particular — this one is rest';
  if (words.length === 1) return `the ${words[0]}`;
  return `the ${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
};

export function build() {
  const out = {};
  for (const f of readdirSync('src/content/routines').sort()) {
    const d = fm(`src/content/routines/${f}`);
    if (!d.course) continue;
    const lit = new Set();
    for (const s of d.steps) {
      const m = POSE_MUSCLES[s.pose];
      if (!m) throw new Error(`${d.slug}: no muscle list for pose "${s.pose}" — add it to POSE_MUSCLES in scripts/gen-course-maps.mjs`);
      m.forEach((k) => lit.add(k));
    }
    out[d.slug] = { muscles: [...lit].sort(), works: sentence(lit) };
  }
  return out;
}

if ((process.argv[1] || '').endsWith('gen-course-maps.mjs')) {
  mkdirSync(MASTERS, { recursive: true });
  mkdirSync(WEB, { recursive: true });
  const maps = build();
  for (const [slug, m] of Object.entries(maps)) {
    const master = `${MASTERS}/${slug}.jpg`;
    const ops = m.muscles.flatMap((k) => MUSCLES[k].seeds.map(([x, y]) => `on:${x},${y}`));
    if (ops.length) execFileSync('node', ['scripts/strava-map-edit.mjs', BASE, master, ...ops], { stdio: 'pipe' });
    else execFileSync('node', ['scripts/strava-map-edit.mjs', BASE, master], { stdio: 'pipe' });
    await sharp(master).resize({ width: 880 }).webp({ quality: 82 }).toFile(`${WEB}/${slug}.webp`);
    await sharp(master).resize({ width: 1200 }).jpeg({ quality: 88 }).toFile(`${WEB}/${slug}.jpg`);
    console.log(`${slug.padEnd(26)} ${m.works}`);
  }
  const json = Object.fromEntries(Object.entries(maps).map(([s, m]) => [s, { works: m.works }]));
  writeFileSync(OUT_JSON, JSON.stringify(json, null, 2) + '\n');
  console.log(`\nwrote ${OUT_JSON} (${Object.keys(maps).length} routines)`);
}
