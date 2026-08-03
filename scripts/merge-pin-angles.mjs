/**
 * Merges the drafted pin angles into content frontmatter.
 *
 *   node scripts/merge-pin-angles.mjs            # show what would change
 *   node scripts/merge-pin-angles.mjs --write    # do it
 *
 * Textual, not a YAML round-trip: these content files are hand-written, with
 * comments and a deliberate field order, and re-serialising them would flatten
 * both. So an existing `pin_angles:` block is cut and a fresh one inserted above
 * `seo_title:`, leaving everything else byte-identical.
 *
 * Idempotent — run it again after editing a draft and only the block moves.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const WRITE = process.argv.includes('--write');

const DRAFTS = [
  ['design/pin-angles-draft.yaml', 'src/content/poses', null],
  ['design/pin-angles-routines-videos.yaml', 'src/content/routines', 'routines'],
  ['design/pin-angles-routines-videos.yaml', 'src/content/videos', 'videos'],
  ['design/pin-angles-blog.yaml', 'src/content/blog', null],
];

const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
const block = (angles) =>
  ['pin_angles:']
    .concat(
      angles.flatMap((a) => [
        `  - audience: ${q(a.audience)}`,
        `    headline: ${q(a.headline)}`,
        `    proof: ${q(a.proof)}`,
        // Optional pair for the Before → after template; the schema requires
        // both or neither.
        ...(a.before ? [`    before: ${q(a.before)}`, `    after: ${q(a.after)}`] : []),
      ]),
    )
    .join('\n');

/** Remove a top-level frontmatter key and everything indented under it. */
function stripKey(fm, key) {
  const lines = fm.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (start < 0) return fm;
  let end = start + 1;
  while (end < lines.length && /^\s+\S/.test(lines[end])) end++;
  lines.splice(start, end - start);
  return lines.join('\n');
}

let changed = 0;
let missing = 0;

for (const [draftPath, dir, section] of DRAFTS) {
  let doc = parse(readFileSync(draftPath, 'utf8')) ?? {};
  if (section) doc = doc[section] ?? {};

  for (const [slug, entry] of Object.entries(doc)) {
    const file = `${dir}/${slug}.md`;
    if (!existsSync(file)) {
      console.warn(`  ? ${dir}/${slug}.md — no such file, skipped`);
      missing++;
      continue;
    }
    const raw = readFileSync(file, 'utf8');
    const open = raw.indexOf('---');
    const close = raw.indexOf('\n---', open + 3);
    let fm = raw.slice(open + 3, close);

    fm = stripKey(fm, 'pin_angles');
    if (entry.pin_quote) fm = stripKey(fm, 'pin_quote');

    const anchor = fm.split('\n').findIndex((l) => l.startsWith('seo_title:'));
    if (anchor < 0) {
      console.warn(`  ! ${file} — no seo_title: to anchor to, skipped`);
      missing++;
      continue;
    }
    const insert = [
      ...(entry.pin_quote ? [`pin_quote: ${q(entry.pin_quote)}`] : []),
      block(entry.pin_angles),
    ].join('\n');

    const lines = fm.split('\n');
    lines.splice(anchor, 0, insert);
    const next = raw.slice(0, open + 3) + lines.join('\n') + raw.slice(close);

    if (next !== raw) {
      changed++;
      if (WRITE) writeFileSync(file, next);
    }
  }
}

console.log(`\n${changed} file${changed === 1 ? '' : 's'} ${WRITE ? 'updated' : 'would change'}${missing ? `, ${missing} skipped` : ''}`);
if (!WRITE) console.log('Re-run with --write to apply.');
