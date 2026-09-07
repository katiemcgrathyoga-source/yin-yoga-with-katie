// Muscle-map images for Strava posts — one per public runner routine.
//   node scripts/gen-strava-maps.mjs            → design/strava-maps/<slug>.jpg
//
// Built from the body-map plates in design/bodymap-source/, recoloured to the
// rule Kevin asked for (2026-09-06): the worked muscle is ROSE QUARTZ and is
// the only thing highlighted; anything the plates drew as a secondary group
// (already quartz in the source) is painted back to the silhouette sage, so
// unworked muscles simply aren't shown. Front and back side by side, like the
// muscle-map card Strava's own gym integrations post.
//
// SUPERSEDED 2026-09-07: every map is now the Grok figure, edited with
// scripts/strava-map-edit.mjs from a clean source (STRAVA-SETUP.md, "Editing a
// muscle map"). Running this would overwrite them with the old plate style.
// Kept for the recolour code only.
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';

const SRC = 'design/bodymap-source';
const OUT = 'design/strava-maps';

// Sampled from the plates.
const SAGE = [126, 139, 121];     // silhouette
const CREAM = '#DDD5C8';          // plate ground (221,213,200)
const QUARTZ = [188, 157, 154];   // #BC9D9A — the one highlight
const INK = '#2E342F';

/** Which plates make up each routine: only the muscles it actually works. */
const ROUTINES = {
  'the-outside-line':     { front: 'quads', back: 'glutes', title: 'The Outside Line',       works: 'outer hip, glutes and quads' },
  'the-day-after':        { front: 'hips',  back: 'all',    title: 'The Day After',          works: 'hips, glutes, hamstrings and calves' },
  'deep-hips-lower-body': { front: 'hips',  back: 'glutes', title: 'Deep Hips & Lower Body', works: 'hip flexors, glutes and outer hip' },
  'deep-legs-hamstrings': { front: 'base',  back: 'all',    title: 'Deep Legs & Hamstrings', works: 'hamstrings, calves and feet' },
  'lower-back-release':   { front: 'base',  back: 'lumbar', title: 'Lower-Back Release',     works: 'lower back and spine' },
  'full-body-reset':      { front: 'all',   back: 'all',    title: 'Full-Body Reset',        works: 'the whole lower body' },
};

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const QL = lum(...QUARTZ);

/**
 * Red → quartz (fibre lines a shade darker); the secondary group → sage.
 *
 * The secondary group is drawn in light pink with a dark outline, and that
 * outline is as dark as the worked muscle's fill, so a per-pixel rule leaves
 * ghost outlines behind. Decide by neighbourhood instead: any reddish pixel
 * within a few px of light pink belongs to the secondary group and goes to
 * sage, outline and all. Fibre lines inside a worked muscle sit in dark red,
 * never near light pink, so they survive.
 */
async function recolour(plate) {
  const { data, info } = await sharp(`${SRC}/${plate}.jpg`).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const redness = new Float32Array(W * H);
  const pink = new Uint8Array(W * H);
  for (let p = 0, i = 0; p < W * H; p++, i += C) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const rd = Math.max(0, Math.min(1, (r - Math.max(g, b) - 8) / 24));
    redness[p] = rd;
    if (rd > 0.5 && lum(r, g, b) >= 118) pink[p] = 1;
  }
  // Dilate the light-pink mask by R px (separable box max).
  const R = 5;
  const tmp = new Uint8Array(W * H), near = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = 0; for (let k = -R; k <= R && !m; k++) { const xx = x + k; if (xx >= 0 && xx < W && pink[y * W + xx]) m = 1; }
    tmp[y * W + x] = m;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = 0; for (let k = -R; k <= R && !m; k++) { const yy = y + k; if (yy >= 0 && yy < H && tmp[yy * W + x]) m = 1; }
    near[y * W + x] = m;
  }
  for (let p = 0, i = 0; p < W * H; p++, i += C) {
    const rd = redness[p];
    if (rd <= 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    let target;
    if (near[p]) {
      target = SAGE;
    } else {
      const L = lum(r, g, b);
      const Lp = Math.max(112, Math.min(172, QL + (L - 72) * 1.6));
      const k = Lp / QL;
      target = QUARTZ.map((c) => Math.min(255, c * k));
    }
    data[i]     = Math.round(r + (target[0] - r) * rd);
    data[i + 1] = Math.round(g + (target[1] - g) * rd);
    data[i + 2] = Math.round(b + (target[2] - b) * rd);
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function caption(width, title, works) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="150" viewBox="0 0 ${width} 150">
    <rect width="${width}" height="150" fill="${CREAM}"/>
    <text x="${width / 2}" y="62" text-anchor="middle" font-family="Noto Serif TC" font-size="46" fill="${INK}">${esc(title)}</text>
    <text x="${width / 2}" y="112" text-anchor="middle" font-family="Cabin, Noto Serif TC" font-size="27" fill="#6E756F">${esc(works)} · yinyogawithkatie.com</text>
  </svg>`;
  return new Resvg(svg, { font: { fontFiles: ['NotoSerifTC-Regular.ttf'], loadSystemFonts: true } }).render().asPng();
}

mkdirSync(OUT, { recursive: true });
const cache = new Map();
const plate = async (name) => cache.get(name) ?? (cache.set(name, await recolour(name)), cache.get(name));

for (const [slug, r] of Object.entries(ROUTINES)) {
  const front = await plate(`front-${r.front}`);
  const back = await plate(`back-${r.back}`);
  const meta = await sharp(front).metadata();
  const W = meta.width * 2, H = meta.height;
  const out = await sharp({ create: { width: W, height: H + 150, channels: 3, background: CREAM } })
    .composite([
      { input: front, left: 0, top: 0 },
      { input: back, left: meta.width, top: 0 },
      { input: caption(W, r.title, r.works), left: 0, top: H },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
  writeFileSync(`${OUT}/${slug}.jpg`, out);
  console.log(`wrote ${OUT}/${slug}.jpg`);
}
