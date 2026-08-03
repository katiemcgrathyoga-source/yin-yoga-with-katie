// Builds design/pin-system.html from design/pin-system-src.html by inlining the
// real brand fonts and pose photos as data URIs — an Artifact can't fetch either
// from a URL, and these are the same font files the pin renderer uses, so the
// preview is typographically identical to the output.
//
//   node design/build-pin-system.mjs
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { CORMORANT, AURELLIE } from '../netlify/functions/lib/pinfonts.mjs';
import { CABIN_400, CABIN_600 } from '../netlify/functions/lib/journalfonts.mjs';

// Every photo used by a template example or a list-pin thumbnail.
const PHOTOS = [
  'dragon', 'camel', 'melting-heart', 'thread-the-needle', 'bow-tie', 'eagle',
  'reclined-twist', 'sleeping-swan', 'caterpillar', 'childs-pose', 'butterfly',
  'legs-up-the-wall',
];
// Never discard more than this much width — past it the pose itself starts to go.
const MAX_TRIM = 0.16;

/**
 * Katie's horizontal extent in a frame, as [left, right] pixel columns.
 *
 * Her two reliable signatures against this room are neutral-dark (black
 * leggings, hair) and neutral-bright (the white tee). The cream wall is warm —
 * roughly (218,210,196), a channel spread over 20 — so it never reads as
 * bright-neutral, and the wood floor and plinth are warm enough to miss the
 * dark test. The result is the whole subject, not just the legs: centring on
 * leg mass alone pushes her head out of frame in the folded poses.
 */
async function subjectExtent(path) {
  const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const cols = new Array(W).fill(0);
  for (let y = (H * 0.1) | 0; y < ((H * 0.95) | 0); y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const mx = Math.max(r, g, b), spread = mx - Math.min(r, g, b);
      if ((mx < 72 && spread < 26) || (mx > 195 && spread < 14)) cols[x]++;
    }
  }
  const floor = Math.max(...cols) * 0.05;
  let L = 0, R = W - 1;
  while (L < W && cols[L] < floor) L++;
  while (R > 0 && cols[R] < floor) R--;
  return { W, H, L, R };
}

let html = await readFile('design/pin-system-src.html', 'utf8');

for (const [key, b64] of Object.entries({
  F_CORMORANT: CORMORANT,
  F_CABIN400: CABIN_400.toString('base64'),
  F_CABIN600: CABIN_600.toString('base64'),
  F_AURELLIE: AURELLIE,
})) {
  html = html.replaceAll(`__${key}__`, b64);
}

// 720px wide is ~2.3x the largest on-screen size any pin photo reaches, so it
// stays sharp on retina without bloating the page.
const map = {};
for (const slug of PHOTOS) {
  const file = `public/poses/${slug}.jpg`;
  const { W, H, L, R } = await subjectExtent(file);
  const c = (L + R) / 2;

  // Widest symmetric window around her that still fits the frame, floored at
  // the trim budget. Then two guards so the window can never eat into her:
  // it must start at or before L and end at or after R.
  let w = Math.round(Math.min(W, Math.max(2 * Math.min(c, W - c), W * (1 - MAX_TRIM))));
  let left = Math.max(0, Math.min(W - w, Math.round(c - w / 2)));
  if (left > L) left = Math.max(0, L);
  if (left + w < R) left = Math.min(W - w, R - w);

  const buf = await sharp(file)
    .extract({ left, top: 0, width: w, height: H })
    .resize({ width: 720, withoutEnlargement: true })
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();
  map[slug] = `data:image/jpeg;base64,${buf.toString('base64')}`;

  const held = L >= left && R <= left + w;
  console.log(
    `  ${slug.padEnd(20)} ${(buf.length / 1024).toFixed(0).padStart(3)} KB` +
    `   subject ${((c / W) * 100).toFixed(0)}% → ${(((c - left) / w) * 100).toFixed(0)}%` +
    `   trimmed ${(((W - w) / W) * 100).toFixed(0).padStart(2)}%` +
    `   ${held ? 'whole pose kept' : 'CLIPPED'}`,
  );
  if (!held) throw new Error(`${slug}: recompose clipped the subject`);
}
html = html.replace('__IMAGE_MAP__', JSON.stringify(map));

// Only our own placeholders — window.__PIN_IMAGES__ is a real identifier.
const left = html.match(/__(?:F_[A-Z0-9]+|IMAGE_MAP)__/g);
if (left) throw new Error(`Unreplaced placeholders: ${[...new Set(left)].join(', ')}`);

await writeFile('design/pin-system.html', html);
console.log(`\ndesign/pin-system.html — ${(html.length / 1024).toFixed(0)} KB`);
