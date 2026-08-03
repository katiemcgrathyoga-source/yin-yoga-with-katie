import { renderPin } from './lib/pin.mjs';

const SITE = 'https://yinyogawithkatie.com';

// Per-photo focal points (object-position) from design_handoff .../photo-crop-spec.md.
// cls = subject orientation class (upright poses are arch/1a-safe; lying poses are band-only).
const PHOTOS = {
  camel: { cls: 'upright', square: '38% 45%', band: '45% 45%' },
  caterpillar: { cls: 'upright', square: '48% 55%', band: '50% 55%' },
  swan: { cls: 'upright', square: '52% 45%', band: '50% 50%' },
  'childs-pose': { cls: 'lying', square: '50% 55%', band: '50% 60%' },
  corpse: { cls: 'lying', square: '30% 50%', band: '50% 50%' },
  banana: { cls: 'lying', square: '30% 55%', band: '50% 60%' },
};

const baseName = (p) => (p || '').split('/').pop().replace(/\.[a-z0-9]+$/i, '');
const focalFor = (imgPath, frame) => {
  const rec = PHOTOS[baseName(imgPath)];
  return (rec && rec[frame]) || 'center';
};

// Photo hook is a full-bleed 2:3 crop; bias the vertical downward (64%) so the
// subject — usually low in the frame — shows, with less empty ceiling above.
// Keep any registered horizontal focal (e.g. corpse's 30%).
const hookFocal = (imgPath) => {
  const rec = PHOTOS[baseName(imgPath)];
  const horiz = rec?.square ? rec.square.split(' ')[0] : '50%';
  return `${horiz} 64%`;
};

async function loadImage(src) {
  if (!src) return null;
  try {
    const url = src.startsWith('http') ? src : `${SITE}${src.startsWith('/') ? '' : '/'}${src}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get('content-type') || 'image/jpeg';
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

// Which focal key each template's main photo uses (photo=1a square; band/text/step = wide band;
// photohook = full-bleed 2:3, reuse the square focal to keep the subject framed).
const MAIN_FRAME = { photo: 'square', band: 'band', text: 'band', step: 'band', photohook: 'square' };

/* ── The benefit-led set (v2) ───────────────────────────────────────────────
   These read /poses/pin/, where scripts/gen-pin-crops.mjs has already centred
   Katie horizontally. So the horizontal focal is always 50% and only the
   vertical varies — by template, not by photo, which is the whole point of
   recomposing once upstream. */
const V2_FOCAL = {
  hook: '50% 50%',     // full-bleed 2:3 — crops width; vertical is moot
  split: '50% 50%',    // arch, portrait — same
  video: '50% 48%',    // 1.16:1 — crops width
  window: '50% 52%',   // 1.52:1 — crops height, so this one matters
  offer: '50% 48%',    // 1.39:1 band under the card
  states: '50% 52%',   // fills what the type leaves
  poselist: '50% 45%', // 96×70 thumbnails
};
const isV2 = (tpl) => tpl in V2_FOCAL;
/** Prefer the subject-centred crop, fall back to the original if it isn't there. */
const loadPinImage = async (path) => {
  if (!path) return null;
  const centred = path.replace(/^\/poses\//, '/poses/pin/');
  return (await loadImage(centred)) ?? (await loadImage(path));
};

/**
 * On-the-fly branded Pinterest pin (1000×1500, 2:3), matching the Claude Design system.
 *   /pin/card.png?tpl=photo|band|text|list|quote|numbered|step|ritual|checklist
 *   &t=<title>&s=<eyebrow>&img=/poses/x.jpg&q=<quote>&items=<json>&footer=<text>
 * Photos are cropped with the per-photo focal point from the crop spec.
 */
export default async (req) => {
  const url = new URL(req.url);
  const p = url.searchParams;
  const tpl = p.get('tpl') || 'photo';
  const title = (p.get('t') || 'Yin Yoga with Katie').slice(0, 160);
  const eyebrow = (p.get('s') || '').slice(0, 48);
  const subline = (p.get('sub') || '').slice(0, 120);
  const quote = (p.get('q') || '').slice(0, 160);
  const footer = (p.get('footer') || '').slice(0, 120);
  const tone = p.get('tone') === 'dark' ? 'dark' : 'light';
  let items = [];
  try { const raw = p.get('items'); if (raw) items = JSON.parse(raw); } catch { items = []; }

  // Benefit-led copy layers (v2). The older templates ignore these.
  const identifier = (p.get('id') || '').slice(0, 60);
  const poseName = (p.get('pose') || '').slice(0, 40);
  const duration = (p.get('dur') || '').slice(0, 12);
  const offer = (p.get('offer') || '').slice(0, 60);
  const cta = (p.get('cta') || '').slice(0, 30);
  const before = (p.get('b') || '').slice(0, 40);
  const after = (p.get('a') || '').slice(0, 40);

  // Main photo. v2 templates take the subject-centred crop and a fixed vertical
  // focal; the older ones keep the per-photo focal registry above.
  const imgPath = p.get('img') || '';
  const frame = MAIN_FRAME[tpl];
  let img = null;
  let focal = 'center';
  if (isV2(tpl)) {
    img = tpl === 'card' ? null : await loadPinImage(imgPath);
    focal = V2_FOCAL[tpl];
  } else if (frame) {
    img = await loadImage(imgPath);
    focal = tpl === 'photohook' ? hookFocal(imgPath) : focalFor(imgPath, frame);
  }

  // Row thumbnails: the old numbered/list pair, and the v2 pose list.
  if ((tpl === 'numbered' || tpl === 'list') && Array.isArray(items)) {
    items = await Promise.all(
      items.map(async (it) => (it && it.img ? { ...it, thumb: await loadImage(it.img), focal: focalFor(it.img, 'square') } : it)),
    );
  }
  if (tpl === 'poselist' && Array.isArray(items) && items.length <= 6) {
    items = await Promise.all(
      items.map(async (it) => (it && it.img ? { ...it, thumb: await loadPinImage(it.img), focal: V2_FOCAL.poselist } : it)),
    );
  }

  try {
    const png = await renderPin({
      tpl, title, eyebrow, subline, img, focal, quote, items, footer, tone,
      identifier, poseName, duration, offer, cta, before, after,
    });
    return new Response(png, {
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public, max-age=86400, s-maxage=2592000, immutable',
      },
    });
  } catch (err) {
    return new Response(`Pin render error: ${err?.message || err}`, { status: 500 });
  }
};

export const config = { path: '/pin/card.png' };
