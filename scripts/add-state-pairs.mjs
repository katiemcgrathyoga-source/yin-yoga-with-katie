/**
 * One-off: adds the before/after state pairs to the drafted angles.
 *
 *   node scripts/add-state-pairs.mjs --write
 *
 * Textual insertion so the drafts keep their comments. Idempotent — an angle
 * that already has the lines is left alone.
 *
 * Only some angles get a pair. The template works when the reader recognises
 * the "now" instantly and the "after" is a change they can feel, which is a
 * narrower set than it sounds: a complaint with a clock on it, or a body part
 * with an obvious opposite state.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const WRITE = process.argv.includes('--write');
const LIMIT = 19;

/** slug → [angleIndex, before, after] */
const POSES = {
  'sleeping-swan':     [0, 'Hips locked up',      'Hips that let go'],
  'legs-up-the-wall':  [0, 'Legs like concrete',  'Legs you can run on'],
  'sphinx':            [1, "A back that's flat",  'A back with a curve'],
  'melting-heart':     [0, 'Shoulders up high',   'Shoulders that drop'],
  'butterfly':         [0, 'Hips stuck at 3pm',   'Hips open by 7'],
  'caterpillar':       [0, 'Hamstrings, welded',  'Hamstrings, softer'],
  'corpse':            [1, 'A mind still racing', 'A mind that settles'],
  'thread-the-needle': [1, 'A knot by lunchtime', 'Shoulders that give'],
  'dragon':            [0, 'Stiff from mile one', 'Loose by the end'],
  'reclined-twist':    [0, 'Today, still in me',  'Today, put down'],
  'supported-fish':    [0, "A chest that's shut", 'A chest that opens'],
  'squat':             [0, 'Hips that stay high', 'Hips that sink low'],
};
const ROUTINES = {
  'lower-back-release':         [0, 'A back that aches',   'A back that eases'],
  'stress-overwhelm-relief':    [0, 'Wound up by six',     'Down by half past'],
  'bedtime-wind-down':          [0, 'Wide awake at 11',    'Asleep by half past'],
  'shoulders-neck-desk-relief': [0, 'Shoulders at 5pm',    'Shoulders at 6'],
  'deep-legs-hamstrings':       [0, 'Legs that feel used', 'Legs ready again'],
};

const q = (s) => `"${s.replace(/"/g, '\\"')}"`;

/** Insert the two lines after the `proof:` of the Nth angle under `slug`. */
function patch(lines, slug, index, before, after, indent) {
  const start = lines.findIndex((l) => l.trimEnd() === `${indent}${slug}:`);
  if (start < 0) return { ok: false, why: 'slug not found' };

  // Walk this slug's block, counting angles by their `- audience:` lines.
  let seen = -1;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() && !line.startsWith(`${indent} `)) break; // next slug
    if (/^\s+-\s+audience:/.test(line)) seen++;
    if (seen !== index) continue;
    if (/^\s+before:/.test(line)) return { ok: false, why: 'already has a pair' };
    if (/^\s+proof:/.test(line)) {
      const pad = line.slice(0, line.indexOf('proof:'));
      lines.splice(i + 1, 0, `${pad}before: ${q(before)}`, `${pad}after: ${q(after)}`);
      return { ok: true };
    }
  }
  return { ok: false, why: 'no proof line for that angle' };
}

let added = 0;
const problems = [];

for (const [file, map, indent] of [
  ['design/pin-angles-draft.yaml', POSES, ''],
  ['design/pin-angles-routines-videos.yaml', ROUTINES, '  '],
]) {
  const lines = readFileSync(file, 'utf8').split('\n');
  for (const [slug, [index, before, after]] of Object.entries(map)) {
    for (const [name, value] of [['before', before], ['after', after]]) {
      if (value.length > LIMIT) problems.push(`${slug}: ${name} is ${value.length}/${LIMIT} — "${value}"`);
    }
    const result = patch(lines, slug, index, before, after, indent);
    if (result.ok) added++;
    else problems.push(`${slug}: ${result.why}`);
  }
  if (WRITE) writeFileSync(file, lines.join('\n'));
}

console.log(`${added} state pairs ${WRITE ? 'added' : 'would be added'}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
if (!WRITE) console.log('Re-run with --write to apply.');
