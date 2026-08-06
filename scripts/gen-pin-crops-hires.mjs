/**
 * Builds the high-resolution pin crops from the camera originals.
 *
 *   node scripts/gen-pin-crops-hires.mjs           # match and report only
 *   node scripts/gen-pin-crops-hires.mjs --write   # write the crops
 *
 * WHY THIS EXISTS
 * public/poses/*.jpg are 1400×933 — plenty for a wide window, but the portrait
 * templates (the full-bleed hook, the arch in split) scale a 933px-tall frame up
 * to 1500 and it goes soft. The originals in docs/ are 5760×3840, so the same
 * crop taken from there lands sharp.
 *
 * WHICH POSES
 * Only the ones a portrait template can actually hold. Resolution was never the
 * whole story: a full-bleed 2:3 pin keeps about half a 1.5:1 frame's width, so a
 * wide pose loses its ends no matter how many megapixels it started with. The
 * eligibility test is the same measurement /pincalendar uses.
 *
 * MATCHING
 * By pixels, not by filename. Several shots exist per pose and the filenames
 * ("High Dragon", "Shoelace Twist") don't map cleanly onto slugs, so each web
 * photo is matched to the original it was cut from by comparing downscaled
 * thumbnails. That guarantees the pin shows the frame Katie actually chose.
 *
 * NOTE: docs/ is gitignored — the originals live on Kevin's machine only. The
 * output is committed, so this is a one-off to re-run when a photo changes.
 */
import { readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { POSE_FRAMES } from '../src/data/poseFrames.ts';
import { POSE_TALL, IMMERSIVE_FLOOR } from '../src/data/poseTall.ts';

const ORIGINALS = 'docs';
const WEB = 'public/poses';
const OUT = 'public/poses/pin/tall';
const WRITE = process.argv.includes('--write');

// Long edge of the written crop. A full-bleed pin needs 1500px of height after
// cropping; 2200 wide on a 3:2 frame gives ~1470 and the arch needs less again,
// so this is the smallest size that never upscales.
const OUT_WIDTH = 2200;
const MAX_TRIM = 0.16;
// Above this thumbnail distance the match is not trustworthy — better no crop
// than a pin showing the wrong pose.
const MATCH_LIMIT = 12;

// The portrait templates, and the share of a crop's width each keeps.
const PORTRAIT_TEMPLATES = { hook: 1000 / 1500, split: 1000 / 1040 };

/* ── Perceptual match ─────────────────────────────────────────────────────── */
const THUMB_W = 32;
const THUMB_H = 21;

async function thumb(file) {
  return sharp(file)
    .resize(THUMB_W, THUMB_H, { fit: 'fill' })
    .greyscale()
    .normalise() // the originals are ungraded; the web copies are not
    .raw()
    .toBuffer();
}
const distance = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum / a.length);
};

/* ── Subject extent ────────────────────────────────────────────────────────
   Measured on the *web* copy, not the original. The thresholds below are tuned
   to the graded images — on an ungraded camera file the white tee doesn't reach
   the bright cut-off and she reads as narrower and off-centre, which lands her
   against one edge of the arch.

   The web photo is a straight downscale of the original at the same 3:2, so the
   extent expressed as fractions transfers exactly — the aspect-ratio guard
   below checks that assumption rather than trusting it. */
async function subjectExtent(file) {
  const { data, info } = await sharp(file).resize({ width: 1400 }).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const cols = new Array(W).fill(0);
  for (let y = (H * 0.1) | 0; y < ((H * 0.95) | 0); y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const mx = Math.max(r, g, b);
      const spread = mx - Math.min(r, g, b);
      if ((mx < 72 && spread < 26) || (mx > 195 && spread < 14)) cols[x]++;
    }
  }
  // Generous on purpose — see the note in gen-pin-crops.mjs. Erring wide leaves
  // a little negative space; erring narrow cuts her.
  const floor = Math.max(...cols) * 0.05;
  let L = 0, R = W - 1;
  while (L < W && cols[L] < floor) L++;
  while (R > 0 && cols[R] < floor) R--;
  return { L: L / W, R: R / W }; // as fractions, so they apply at any size
}

/* ── Which poses need this ──────────────────────────────────────────────────
   Two sources, because two different questions are being asked. The old
   portrait templates either fit a pose or didn't, so PORTRAIT_TEMPLATES is a
   yes/no. Immersive instead takes as much height as a pose can carry, and a
   band 1200px tall wants 1800px of source width — well past what the 1390px web
   crop can give without going soft. Any pose Immersive will use needs the
   camera original, so poseTall.ts is folded in here. */
const eligible = [...new Set([
  ...Object.entries(POSE_FRAMES)
    .filter(([, frame]) =>
      Object.values(PORTRAIT_TEMPLATES).some((target) => Math.min(1, target / frame.aspect) >= frame.span))
    .map(([slug]) => slug),
  ...Object.keys(POSE_TALL).filter((slug) => POSE_TALL[slug] >= IMMERSIVE_FLOOR),
])].sort();

console.log(`${eligible.length} of ${Object.keys(POSE_FRAMES).length} poses can hold a portrait template:`);
console.log(`  ${eligible.join(', ')}\n`);
if (eligible.length === 0) process.exit(0);

if (!existsSync(ORIGINALS)) {
  console.error(`No ${ORIGINALS}/ directory — the camera originals aren't on this machine.`);
  process.exit(1);
}

/* ── Index the originals once ─────────────────────────────────────────────── */
const originals = readdirSync(ORIGINALS).filter((f) => /\.(jpe?g|png)$/i.test(f));
console.log(`Indexing ${originals.length} originals…`);
const index = [];
for (const file of originals) {
  try {
    index.push({ file, thumb: await thumb(`${ORIGINALS}/${file}`) });
  } catch {
    // Not every jpg in docs/ is a pose frame; skip anything sharp can't read.
  }
}

/* ── Match, crop, report ──────────────────────────────────────────────────── */
if (WRITE && !existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const report = [];
const skipped = [];
for (const slug of eligible) {
  const web = `${WEB}/${slug}.jpg`;
  if (!existsSync(web)) continue;
  const target = await thumb(web);

  let best = null;
  for (const candidate of index) {
    const d = distance(target, candidate.thumb);
    if (!best || d < best.d) best = { ...candidate, d };
  }
  if (!best) continue;

  const source = `${ORIGINALS}/${best.file}`;
  const { width: W, height: H } = await sharp(source).metadata();
  const { width: webW } = await sharp(web).metadata();

  // Two ways this can be the wrong file, and both must be caught rather than
  // quietly producing a pin of the wrong pose or a re-upscale of the same
  // pixels: a poor pixel match, or a "original" that is no bigger than the web
  // copy (a few poses were cut from video stills, and no camera frame exists).
  if (best.d > MATCH_LIMIT) {
    skipped.push({ slug, reason: `no confident match (closest was ${best.file}, distance ${best.d.toFixed(1)})` });
    continue;
  }
  if (W < webW * 1.5) {
    skipped.push({ slug, reason: `${best.file} is only ${W}px wide — no high-res original exists` });
    continue;
  }
  // Same framing, or the fractions below don't transfer.
  const { height: webH } = await sharp(web).metadata();
  if (Math.abs(webW / webH - W / H) > 0.02) {
    skipped.push({ slug, reason: `${best.file} is framed differently from the web copy — crop it by hand` });
    continue;
  }

  const { L, R } = await subjectExtent(web);
  const c = ((L + R) / 2) * W;
  const lPx = L * W;
  const rPx = R * W;

  let w = Math.round(Math.min(W, Math.max(2 * Math.min(c, W - c), W * (1 - MAX_TRIM))));
  let left = Math.max(0, Math.min(W - w, Math.round(c - w / 2)));
  if (left > lPx) left = Math.max(0, Math.round(lPx));
  if (left + w < rPx) left = Math.min(W - w, Math.round(rPx) - w);

  if (WRITE) {
    await sharp(source)
      .extract({ left, top: 0, width: w, height: H })
      .resize({ width: OUT_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(`${OUT}/${slug}.jpg`);
  }
  report.push({ slug, match: best.file, d: best.d, w, H });
}

console.log('\nslug                  matched original                          distance');
for (const r of report) {
  console.log(`  ${r.slug.padEnd(20)} ${r.match.slice(0, 40).padEnd(42)} ${r.d.toFixed(1).padStart(5)}`);
}
if (skipped.length) {
  console.log(`\n${skipped.length} skipped — these keep using the 1400px crop:`);
  for (const s of skipped) console.log(`  ${s.slug.padEnd(20)} ${s.reason}`);
}

if (WRITE) {
  writeFileSync(
    `${OUT}/README.md`,
    `# High-resolution pin crops\n\n` +
    `Generated by \`scripts/gen-pin-crops-hires.mjs\` from the camera originals in\n` +
    `\`docs/\`, which are gitignored and live on Kevin's machine only.\n\n` +
    `Only poses whose shape survives a portrait crop are here — the full-bleed hook\n` +
    `and the arch in split. Everything else uses \`public/poses/pin/\`, where 1400px\n` +
    `is already more than a wide window needs.\n\n` +
    `Re-run with \`--write\` after replacing a pose photo.\n`,
  );
  console.log(`\n${report.length} high-res crops written to ${OUT}/`);
} else {
  console.log('\nMatch only. Re-run with --write to generate the crops.');
}
