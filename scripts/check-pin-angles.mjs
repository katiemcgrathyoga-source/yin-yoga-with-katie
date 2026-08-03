/**
 * Checks the drafted pin angles before they go anywhere near a pose file, and
 * reports how much of the library is covered.
 *
 *   node scripts/check-pin-angles.mjs                     # check the draft
 *   node scripts/check-pin-angles.mjs --content           # check what's merged
 *
 * The same limits the pose schema enforces (src/lib/pinBoards.ts) are applied
 * here, so a draft that passes this will pass `astro check` after merging.
 * Exits non-zero on any violation.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

/**
 * The board map and the limits both come from src/lib/pinBoards.ts, read as text
 * so this stays a plain node script. Keeping a second copy here is exactly the
 * drift this checker exists to catch.
 */
const LIB = readFileSync('src/lib/pinBoards.ts', 'utf8');
/** The body of an `export const NAME = { ... }` literal, as text. */
function literal(name) {
  const start = LIB.indexOf(`export const ${name}`);
  if (start < 0) throw new Error(`${name} not found in src/lib/pinBoards.ts`);
  const open = LIB.indexOf('{', start);
  return LIB.slice(open, LIB.indexOf('}', open));
}
const PIN_BOARDS = Object.fromEntries(
  // Quote-aware: "when you're wound up" is double-quoted precisely because it
  // contains an apostrophe, so a naive [^'"]+ would stop halfway through it.
  [...literal('PIN_BOARDS').matchAll(/(['"])((?:(?!\1).)+)\1\s*:\s*(['"])((?:(?!\3).)+)\3/g)]
    .map((m) => [m[2], m[4]]),
);
const LIMITS = Object.fromEntries(
  [...literal('PIN_LIMITS').matchAll(/(\w+)\s*:\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]),
);

const POSE_DIR = 'src/content/poses';
const DRAFT = process.argv.find((a) => a.endsWith('.yaml')) ?? 'design/pin-angles-draft.yaml';
const fromContent = process.argv.includes('--content');

/** slug → pin_angles[], from either the draft file or the pose frontmatter. */
function load() {
  if (!fromContent) {
    let doc = parse(readFileSync(DRAFT, 'utf8')) ?? {};
    // the routines/videos draft nests by collection; the pose draft doesn't
    if (doc.routines || doc.videos) doc = { ...(doc.routines ?? {}), ...(doc.videos ?? {}) };
    return Object.fromEntries(
      Object.entries(doc).map(([slug, v]) => [slug, v?.pin_angles ?? []]),
    );
  }
  const out = {};
  for (const file of readdirSync(POSE_DIR).filter((f) => f.endsWith('.md'))) {
    const raw = readFileSync(`${POSE_DIR}/${file}`, 'utf8');
    const fm = raw.split(/^---$/m)[1] ?? '';
    const data = parse(fm) ?? {};
    out[data.slug ?? file.replace(/\.md$/, '')] = data.pin_angles ?? [];
  }
  return out;
}

const angles = load();
const errors = [];
const boardCount = {};
let total = 0;
let withAngles = 0;

for (const [slug, list] of Object.entries(angles)) {
  if (!Array.isArray(list) || list.length === 0) continue;
  withAngles++;
  const audiences = new Set();

  list.forEach((a, i) => {
    total++;
    const where = `${slug}[${i}]`;
    for (const field of ['audience', 'headline', 'proof']) {
      const value = a?.[field];
      if (typeof value !== 'string' || !value.trim()) {
        errors.push(`${where}: ${field} is missing`);
        continue;
      }
      if (value.length > LIMITS[field]) {
        errors.push(
          `${where}: ${field} is ${value.length}/${LIMITS[field]} — "${value}"`,
        );
      }
    }
    // The optional state pair. Both or neither, and both inside the one-line
    // limit — a two-line "before" against a one-line "after" kills the device.
    if (Boolean(a?.before) !== Boolean(a?.after)) {
      errors.push(`${where}: has only one state line — before and after go together`);
    }
    for (const field of ['before', 'after']) {
      const value = a?.[field];
      if (typeof value === 'string' && value.length > LIMITS.state) {
        errors.push(`${where}: ${field} is ${value.length}/${LIMITS.state} — "${value}"`);
      }
    }
    if (a?.audience && !PIN_BOARDS[a.audience]) {
      errors.push(`${where}: "${a.audience}" is not a known audience — add it to src/lib/pinBoards.ts first`);
    } else if (a?.audience) {
      const board = PIN_BOARDS[a.audience];
      boardCount[board] = (boardCount[board] ?? 0) + 1;
      audiences.add(a.audience);
    }
  });

  if (list.length > 1 && audiences.size === 1) {
    errors.push(`${slug}: both angles use "${[...audiences][0]}" — the calendar can't spread the day across two boards`);
  }
  if (list.length > 4) errors.push(`${slug}: ${list.length} angles, max is 4`);
}

// Duplicate headlines read as a repeat in the feed even on different poses.
const seen = new Map();
for (const [slug, list] of Object.entries(angles)) {
  for (const a of list ?? []) {
    if (!a?.headline) continue;
    const key = a.headline.toLowerCase();
    if (seen.has(key)) errors.push(`duplicate headline in ${slug} and ${seen.get(key)}: "${a.headline}"`);
    else seen.set(key, slug);
  }
}

// When checking a draft the universe is that file's own entries; only
// `--content` is measured against the whole pose library.
const universe = fromContent
  ? readdirSync(POSE_DIR).filter((f) => f.endsWith('.md')).length
  : Object.keys(angles).length;

console.log(fromContent ? POSE_DIR : DRAFT);
console.log(`  ${withAngles}/${universe} pages have angles · ${total} angles total\n`);
for (const [board, n] of Object.entries(boardCount).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${board}`);
}

if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nAll angles within limits, every audience maps to a board, no duplicates.');

