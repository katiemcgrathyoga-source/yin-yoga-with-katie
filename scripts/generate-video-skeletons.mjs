// Generate skeleton video records from a YouTube analytics CSV into the Astro
// videos collection. Every qualifying class becomes findable now; top performers
// get enriched by hand later. Safe to re-run: it never overwrites an existing
// file and never duplicates a video that's already in the collection.
//
//   node scripts/generate-video-skeletons.mjs [path/to/content.csv]
//
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
// Pass --membership to flag every video in the CSV as members-only (existing
// records get patched; new ones are created with `membership: true`).
// Hard cutoff: never generate a page for anything published before this date
// (older channel era, off-brand). Undated videos are kept (date unknowable).
const CUTOFF = new Date('2022-05-16');
const ARGS = process.argv.slice(2);
const MEMBERSHIP = ARGS.includes('--membership');
const CSV_ARG = ARGS.find((a) => !a.startsWith('--'));
const CSV_PATH = CSV_ARG ? path.resolve(CSV_ARG) : path.join(ROOT, 'data', 'content.csv');
const VIDEOS_DIR = path.join(ROOT, 'src', 'content', 'videos');

// ── minimal CSV parser (quoted fields with embedded commas/newlines) ──────────
function parseCSV(text) {
  const rows = []; let i = 0, f = '', row = [], q = false;
  const pf = () => { row.push(f); f = ''; };
  const pr = () => { rows.push(row); row = []; };
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i += 2; continue; } q = false; i++; continue; }
      f += c; i++; continue;
    }
    if (c === '"') { q = true; i++; continue; }
    if (c === ',') { pf(); i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { pf(); pr(); i++; continue; }
    f += c; i++;
  }
  if (f.length || row.length) { pf(); pr(); }
  return rows;
}

// ── helpers ───────────────────────────────────────────────────────────────────
const SLUG_MAX = 70;
const slugify = (s) => {
  let out = s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (out.length > SLUG_MAX) {
    out = out.slice(0, SLUG_MAX);
    const lastDash = out.lastIndexOf('-');
    if (lastDash > 30) out = out.slice(0, lastDash); // cut at a word boundary
    out = out.replace(/-+$/, '');
  }
  return out;
};

const shortHash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 6);

// Refresh ONLY the watch_hours line on an existing record (enriched or skeleton),
// so the homepage's "most-practised leads" order stays correct without ever
// touching hand-written content. Inserts the line if absent. Returns true if changed.
function patchWatchHours(file, hours) {
  let t = fs.readFileSync(file, 'utf8');
  let n;
  if (/^watch_hours:/m.test(t)) {
    n = t.replace(/^watch_hours:.*$/m, `watch_hours: ${hours}`);
  } else if (/^published:.*$/m.test(t)) {
    n = t.replace(/^(published:.*)$/m, `watch_hours: ${hours}\n$1`);
  } else {
    n = t.replace(/^(length_minutes:.*)$/m, `$1\nwatch_hours: ${hours}`);
  }
  if (n !== t) { fs.writeFileSync(file, n); return true; }
  return false;
}

// Ensure an existing record carries `membership: true` (added after `enriched:`
// or `published:`). Only that one line is touched. Returns true if changed.
function patchMembership(file) {
  let t = fs.readFileSync(file, 'utf8');
  if (/^membership:\s*true\b/m.test(t)) return false;
  let n;
  if (/^membership:.*$/m.test(t)) n = t.replace(/^membership:.*$/m, 'membership: true');
  else if (/^enriched:.*$/m.test(t)) n = t.replace(/^(enriched:.*)$/m, '$1\nmembership: true');
  else n = t.replace(/^(length_minutes:.*)$/m, '$1\nmembership: true');
  if (n !== t) { fs.writeFileSync(file, n); return true; }
  return false;
}

const headlineOf = (title) => {
  const m = title.match(/^(.*?)\s*[:|]\s*(.*)$/);
  return (m ? m[1] : title).trim();
};

const isoDate = (s) => {
  const d = new Date(s);
  if (isNaN(d)) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const displayLength = (title) => {
  const m = title.match(/(\d+)\s*-?\s*min\b/i);
  return m ? `${m[1]} min` : null;
};

// intent tags — a class may earn several; order is deterministic.
const INTENT_RULES = [
  ['sleep', /sleep|bedtime|night|insomnia/i],
  ['nervous-system', /nervous system|stress|anxiet|calm|relax|wind[ -]?down/i],
  ['hips-lower-back', /hip|lower back|low back/i],
  ['flexibility', /flexib|deep stretch|splits/i], // NOT the bare word "stretch"
  ['full-body', /full[ -]?body/i],
  ['digestion', /digest/i],
  ['beginner', /beginner/i],
];
const intentTags = (title) => INTENT_RULES.filter(([, re]) => re.test(title)).map(([t]) => t);

// body areas — from the title.
const AREA_RULES = [
  ['hips', /hip/i],
  ['lower back', /lower back|low back/i],
  ['shoulders', /shoulder/i],
  ['hamstrings', /hamstring/i],
  ['legs', /\bleg/i],
  ['spine', /spine/i],
  ['full body', /full[ -]?body/i],
];
const bodyAreas = (title) => AREA_RULES.filter(([, re]) => re.test(title)).map(([a]) => a);

// props — "no props" wins; else list any named; else [].
const PROP_RULES = [
  ['bolster', /bolster/i],
  ['blocks', /block/i],
  ['strap', /strap/i],
  ['blanket', /blanket/i],
  ['cushion', /cushion/i],
  ['pillow', /pillow/i],
];
const propsFor = (title) => {
  if (/no props|without props|prop[- ]?free/i.test(title)) return ['none'];
  return PROP_RULES.filter(([, re]) => re.test(title)).map(([p]) => p);
};

// membership CTA by dominant intent — outcome-led, never "support".
const dominantIntent = (tags) => {
  if (tags.includes('sleep')) return 'sleep';
  if (tags.includes('hips-lower-back')) return 'hips';
  if (tags.includes('nervous-system')) return 'reset';
  return 'full-body';
};
const CTA = {
  sleep: "This class lives inside the membership's Sleep program — a night-by-night path that helps you fall asleep faster and sleep through. Press play and let it carry you.",
  hips: 'Inside the membership, this class is part of the Hips & Lower Back program — follow it and become someone who moves through the day loose and easy.',
  reset: 'Inside the membership, this class anchors the Reset program — a guided way to downshift at the end of the day so you feel calmer and sleep more easily.',
  'full-body': 'Inside the membership, this class is part of a guided Full-Body program — so instead of choosing a video each day, you follow the plan and move through your week feeling looser and lighter.',
};

// YAML scalar/array emitters (JSON strings are valid double-quoted YAML scalars).
const yStr = (s) => JSON.stringify(String(s));
const yArr = (arr) => `[${arr.map(yStr).join(', ')}]`;

// ── read existing collection: dedup by youtube_id AND by slug/filename ─────────
fs.mkdirSync(VIDEOS_DIR, { recursive: true });
const existingFiles = fs.readdirSync(VIDEOS_DIR).filter((f) => f.endsWith('.md'));
const existingYoutubeIds = new Map(); // id -> { slug, enriched }
const usedSlugs = new Set();
for (const file of existingFiles) {
  const txt = fs.readFileSync(path.join(VIDEOS_DIR, file), 'utf8');
  const idm = txt.match(/^\s*youtube_id:\s*["']?([^"'\n#]+)/m);
  const enr = /^\s*enriched:\s*true\b/m.test(txt);
  const slug = file.replace(/\.md$/, '');
  usedSlugs.add(slug);
  if (idm) existingYoutubeIds.set(idm[1].trim(), { slug, enriched: enr });
}

// ── parse + aggregate the CSV by video id ─────────────────────────────────────
const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
const header = rows[0];
const ix = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
const col = (names) => { for (const n of names) if (n in ix) return ix[n]; return -1; };
const idCol = col(['Content']);
const titleCol = col(['Video title', 'Title']);
const pubCol = col(['Video publish time', 'Publish time']);
const durCol = col(['Duration']);
const watchCol = header.findIndex((h) => /watch\s*time.*hour/i.test(h)); // "Watch time (hours)"

const byId = new Map();
let skippedTotalRow = 0, skippedEmptyTitle = 0;
for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (row.length < header.length) continue;
  const id = (row[idCol] || '').trim();
  const title = (row[titleCol] || '').trim();
  if (/^total$/i.test(id) || /^total$/i.test(title)) { skippedTotalRow++; continue; }
  if (!title) { skippedEmptyTitle++; continue; }
  if (!byId.has(id)) {
    byId.set(id, {
      id, title,
      publish: row[pubCol],
      duration: Number(row[durCol]),
      watchHours: 0,
      hasWatch: watchCol !== -1,
    });
  }
  if (watchCol !== -1) byId.get(id).watchHours += Number(row[watchCol] || 0);
}

// ── classify + generate ───────────────────────────────────────────────────────
const RUNNER = /runner|running|pre-?run|for runners/i;
const report = {
  uniqueVideos: byId.size,
  excludedShorts: 0,
  excludedRunner: 0,
  excludedPreCutoff: 0,
  skippedExisting: [],
  written: 0,
  membershipFlagged: 0,
  intentCounts: {},
  collisions: [],
};
for (const [, re] of INTENT_RULES) report.intentCounts[re] = 0;
const intentCounts = Object.fromEntries(INTENT_RULES.map(([t]) => [t, 0]));

for (const v of byId.values()) {
  if (v.duration < 120) { report.excludedShorts++; continue; }        // Shorts / clips
  if (RUNNER.test(v.title)) { report.excludedRunner++; continue; }    // runner content
  const pubDate = isoDate(v.publish);
  if (pubDate && new Date(pubDate) < CUTOFF) { report.excludedPreCutoff++; continue; } // hard cutoff

  const existing = existingYoutubeIds.get(v.id);
  if (existing) {
    // Keep the popularity metric fresh even for already-written/enriched records,
    // so the homepage sort stays correct. Only the watch_hours line is touched.
    const file = path.join(VIDEOS_DIR, `${existing.slug}.md`);
    const refreshed = v.hasWatch && patchWatchHours(file, Math.round(v.watchHours));
    // In --membership mode, flag this already-in-collection record as members-only.
    const flagged = MEMBERSHIP && patchMembership(file);
    if (flagged) report.membershipFlagged++;
    report.skippedExisting.push({ id: v.id, slug: existing.slug, enriched: existing.enriched, refreshed, flagged });
    continue;
  }

  // slug (+ collision hash)
  let slug = slugify(v.title);
  if (!slug) slug = `video-${shortHash(v.id)}`;
  if (usedSlugs.has(slug)) {
    const hashed = `${slug}-${shortHash(v.id)}`;
    report.collisions.push({ base: slug, resolved: hashed, id: v.id });
    slug = hashed;
  }
  usedSlugs.add(slug);

  const lengthMinutes = Math.max(1, Math.round(v.duration / 60));
  const dLen = displayLength(v.title);
  const lenLabel = dLen || `${lengthMinutes} min`;
  const tags = intentTags(v.title);
  const areas = bodyAreas(v.title);
  const props = propsFor(v.title);
  const cta = CTA[dominantIntent(tags)];
  const published = isoDate(v.publish); // may be null (e.g. undated members content)
  const headline = headlineOf(v.title);
  for (const t of tags) intentCounts[t]++;

  const summary = `${headline} — a ${lenLabel} Yin Yoga class to follow along with.`;
  const seoTitle = `${headline} — ${lenLabel} Yin Yoga`;
  const seoDesc = `A ${lenLabel} Yin Yoga class: ${headline}. Press play and follow along on YouTube.`;
  const body = `${headline} — a ${lenLabel} Yin Yoga class. A full write-up is coming soon; for now, press play on YouTube and follow along.`;

  const lines = [
    '---',
    '# Skeleton record — auto-generated from data/content.csv. Enrich by hand, then set enriched: true.',
    `title: ${yStr(v.title)}`,
    `slug: ${yStr(slug)}`,
    `youtube_id: ${yStr(v.id)}`,
    `length_minutes: ${lengthMinutes}`,
    ...(dLen ? [`display_length: ${yStr(dLen)}`] : []),
    ...(v.hasWatch ? [`watch_hours: ${Math.round(v.watchHours)}`] : []),
    ...(published ? [`published: ${yStr(published)}`] : []),
    'enriched: false',
    ...(MEMBERSHIP ? ['membership: true'] : []),
    'level: "all-levels"',
    `intent_tags: ${yArr(tags)}`,
    `body_areas: ${yArr(areas)}`,
    `props: ${yArr(props)}`,
    'poses_featured: []',
    'chapters: []',
    `membership_cta: ${yStr(cta)}`,
    `summary: ${yStr(summary)}`,
    `seo_title: ${yStr(seoTitle)}`,
    `seo_description: ${yStr(seoDesc)}`,
    '---',
    '',
    body,
    '',
  ];
  fs.writeFileSync(path.join(VIDEOS_DIR, `${slug}.md`), lines.join('\n'), 'utf8');
  report.written++;
}

// ── report ────────────────────────────────────────────────────────────────────
const L = (s) => console.log(s);
L('');
L('════════════════════════ Skeleton generation report ════════════════════════');
L(`CSV:                 ${CSV_PATH}`);
L(`Watch-time column:   ${watchCol !== -1 ? `"${header[watchCol]}"` : 'NOT FOUND — watch_hours omitted, homepage falls back to newest-first'}`);
L(`Rows parsed:         ${rows.length - 1}  (Total-row skipped: ${skippedTotalRow}, empty-title skipped: ${skippedEmptyTitle})`);
L(`Unique videos:       ${report.uniqueVideos}`);
L('');
L(`Excluded — Shorts (<120s): ${report.excludedShorts}`);
L(`Excluded — runner content: ${report.excludedRunner}`);
L(`Excluded — before ${CUTOFF.toISOString().slice(0, 10)}: ${report.excludedPreCutoff}`);
L(`Skipped — already in collection: ${report.skippedExisting.length}`);
for (const s of report.skippedExisting) L(`    · ${s.slug}  (enriched: ${s.enriched}${s.refreshed ? ', watch_hours refreshed' : ''})  ${s.id}`);
L('');
if (MEMBERSHIP) L(`Members-only flag:   applied (${report.membershipFlagged} existing records flagged)`);
L(`Records WRITTEN:     ${report.written}${MEMBERSHIP ? ' (as members-only)' : ''}`);
L('Per-intent counts (written records):');
for (const [t, n] of Object.entries(intentCounts)) L(`    ${t.padEnd(16)} ${n}`);
L('');
if (report.collisions.length) {
  L(`Slug collisions resolved: ${report.collisions.length}`);
  for (const c of report.collisions) L(`    · ${c.base} → ${c.resolved}  (${c.id})`);
} else {
  L('Slug collisions resolved: 0');
}
L('═════════════════════════════════════════════════════════════════════════════');
