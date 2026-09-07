// Turn muscle segments on or off in a Strava muscle-map image.
//   node scripts/strava-map-edit.mjs <source> <out> on:x,y off:x,y ...
//
// The maps themselves are generated in Grok (see STRAVA-SETUP.md) from the F45
// -style figure in the brand palette: every muscle drawn in light grey, the
// worked ones in rose quartz. Regenerating a whole image just to change which
// muscles are lit wastes a render and risks a figure that no longer matches the
// others, so instead we flood-fill segments in a clean source.
//
// Coordinates are for a 1408px-square map; `map:` prints every segment's
// centroid so you can pick them.
//
// The fill is bounded: a segment is a solid block of one colour ringed by the
// body fill, so a flood that runs past 60k pixels has escaped into the body and
// is abandoned rather than written. That guard exists because an unbounded fill
// once painted most of a figure pink.
import sharp from 'sharp';

const [src, out, ...ops] = process.argv.slice(2);
if (!src) {
  console.error('usage: strava-map-edit.mjs <source> <out> [map] [on:x,y] [off:x,y] ...');
  process.exit(1);
}

const GREY = [218, 217, 213];
const TOL = 14;        // colour distance that still counts as the same segment
const MAX = 60000;     // a fill bigger than this has escaped the segment

const img = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const { data, info } = img;
const W = info.width, H = info.height, C = info.channels, N = W * H;
const at = (x, y) => (y * W + x) * C;
const colour = (x, y) => [data[at(x, y)], data[at(x, y) + 1], data[at(x, y) + 2]];
const near = (i, c, tol = TOL) =>
  Math.abs(data[i] - c[0]) < tol && Math.abs(data[i + 1] - c[1]) < tol && Math.abs(data[i + 2] - c[2]) < tol;

/**
 * This image's own quartz, so edited segments match the render exactly.
 *
 * The MODE, not the first pixel found: every lit muscle is ringed by lighter
 * anti-aliased edge pixels, and the first match scanning top-left is always one
 * of those — sampling it painted new segments a visibly paler pink than the old.
 */
function housePink() {
  const counts = new Map();
  for (let p = 0; p < N; p++) {
    const i = p * C;
    if (data[i] - data[i + 1] < 40 || data[i] - data[i + 2] < 40) continue;
    const k = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  if (!counts.size) return [219, 151, 150];
  const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best.split(',').map(Number);
}

/** Nearest pixel of `want` within a few px, so a seed needn't be exact. */
function seed(x, y, want) {
  for (let r = 0; r <= 14; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && near(at(nx, ny), want, 10)) return [nx, ny];
      }
  return null;
}

function fill(x, y, from, to, label) {
  const s = seed(x, y, from);
  if (!s) return console.warn(`  ${label} ${x},${y}: no ${from.join(',')} pixel nearby — skipped`);
  const seen = new Uint8Array(N);
  const stack = [s[1] * W + s[0]];
  const hit = [];
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * C;
    if (!near(i, from)) continue;
    hit.push(i);
    if (hit.length > MAX) return console.warn(`  ${label} ${x},${y}: fill escaped the segment — skipped`);
    const px = p % W, py = (p / W) | 0;
    if (px < x0) x0 = px; if (px > x1) x1 = px;
    if (py < y0) y0 = py; if (py > y1) y1 = py;
    if (px > 0) stack.push(p - 1);
    if (px < W - 1) stack.push(p + 1);
    if (py > 0) stack.push(p - W);
    if (py < H - 1) stack.push(p + W);
  }
  for (const i of hit) { data[i] = to[0]; data[i + 1] = to[1]; data[i + 2] = to[2]; }

  // Turning a segment OFF leaves its anti-aliased rim behind: those pixels are
  // between pink and the body fill, so the flood never matched them and the
  // muscle keeps a pink outline. Fade whatever is still reddish inside the
  // segment's own box (padded, since a tip can sit just outside the flood's
  // bounds) toward the target, in proportion to how red it is.
  let rim = 0;
  if (to === GREY) {
    for (let yy = Math.max(0, y0 - 24); yy <= Math.min(H - 1, y1 + 24); yy++)
      for (let xx = Math.max(0, x0 - 24); xx <= Math.min(W - 1, x1 + 24); xx++) {
        const i = at(xx, yy);
        const k = Math.max(0, Math.min(1, (data[i] - data[i + 1] - 10) / 30));
        if (k <= 0) continue;
        data[i] = Math.round(data[i] + (to[0] - data[i]) * k);
        data[i + 1] = Math.round(data[i + 1] + (to[1] - data[i + 1]) * k);
        data[i + 2] = Math.round(data[i + 2] + (to[2] - data[i + 2]) * k);
        rim++;
      }
  }
  console.log(`  ${label} ${x},${y}: ${hit.length} px${rim ? ` + ${rim} rim` : ''}`);
}

/** Print every segment's centroid, to choose coordinates from. */
function map() {
  const isSeg = (i) => near(i, GREY, 9) || data[i] - data[i + 1] > 40;
  const m = new Uint8Array(N);
  for (let p = 0; p < N; p++) if (isSeg(p * C)) m[p] = 1;
  const lab = new Int32Array(N), comps = [];
  for (let p = 0; p < N; p++) {
    if (!m[p] || lab[p]) continue;
    const id = comps.length + 1, stack = [p];
    lab[p] = id;
    let n = 0, sx = 0, sy = 0;
    while (stack.length) {
      const q = stack.pop(); n++;
      sx += q % W; sy += (q / W) | 0;
      for (const d of [1, -1, W, -W]) { const r = q + d; if (r >= 0 && r < N && m[r] && !lab[r]) { lab[r] = id; stack.push(r); } }
    }
    if (n > 800) comps.push({ n, cx: Math.round(sx / n), cy: Math.round(sy / n), lit: data[at(Math.round(sx / n), Math.round(sy / n))] - data[at(Math.round(sx / n), Math.round(sy / n)) + 1] > 40 });
  }
  for (const side of ['front', 'back'])
    comps
      .filter((c) => (side === 'front' ? c.cx < W / 2 : c.cx >= W / 2))
      .sort((a, b) => a.cy - b.cy)
      .forEach((c) => console.log(`${side}  ${c.cx},${c.cy}  ${c.n} px  ${c.lit ? 'LIT' : 'grey'}`));
}

const PINK = housePink();
console.log(`pink ${PINK.join(',')}`);
for (const op of ops) {
  if (op === 'map') { map(); continue; }
  const [kind, xy] = op.split(':');
  const [x, y] = (xy || '').split(',').map(Number);
  if (kind === 'on') fill(x, y, GREY, PINK, 'on ');
  else if (kind === 'off') fill(x, y, colour(x, y), GREY, 'off');
  else console.warn(`unknown op: ${op}`);
}
if (out && out !== '-') {
  await sharp(data, { raw: info }).jpeg({ quality: 92 }).toFile(out);
  console.log(`wrote ${out}`);
}
