import { renderJournalPin } from './lib/journalpin.mjs';

const SITE = 'https://yinyogawithkatie.com';

// Minimal intrinsic-size reader (PNG IHDR + JPEG SOF) so we can place every photo
// at its natural aspect ratio — the handoff forbids cropping the subject.
function imageSize(buf) {
  // PNG
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // JPEG: walk the marker segments to the first SOF (start-of-frame).
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 carry dimensions.
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

async function loadPhoto(src) {
  if (!src) return null;
  try {
    const url = src.startsWith('http') ? src : `${SITE}${src.startsWith('/') ? '' : '/'}${src}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const size = imageSize(buf);
    if (!size) return null;
    const type = res.headers.get('content-type') || 'image/jpeg';
    return { data: `data:${type};base64,${buf.toString('base64')}`, w: size.w, h: size.h };
  } catch {
    return null;
  }
}

// Wordmark PNG for the footer, keyed to the variant's background (dark → oat, light → sage).
const WORDMARK = {
  dark: '/brand/wordmark-soft-oat.png',
  light: '/brand/wordmark-deep-sage.png',
};
const LIGHT_VARIANTS = new Set(['oat-frame', 'card']);

/**
 * On-the-fly Journal Pin (1000×1500, 2:3) — four brand variants.
 *   /pin/journal.png?variant=arch|oat-frame|split|card
 *     &t=<title>&s=<eyebrow>&meta=<tracked caps>&ex=<excerpt>&img=/poses/x.jpg&footer=url|wordmark
 * Photos are rendered at natural aspect (never cropped); meta must never reveal a hold time.
 */
export default async (req) => {
  const url = new URL(req.url);
  const p = url.searchParams;
  const variant = p.get('variant') || 'arch';
  const title = (p.get('t') || 'Yin Yoga with Katie').slice(0, 160);
  const eyebrow = (p.get('s') ?? 'Stay a while').slice(0, 48);
  const meta = (p.get('meta') || '').slice(0, 80);
  const excerpt = (p.get('ex') || '').slice(0, 220);
  const footer = p.get('footer') === 'wordmark' ? 'wordmark' : 'url';
  const showEyebrow = p.get('noeyebrow') !== '1' && eyebrow.length > 0;

  const photo = await loadPhoto(p.get('img') || '');
  const footerImg = footer === 'wordmark'
    ? await loadPhoto(LIGHT_VARIANTS.has(variant) ? WORDMARK.light : WORDMARK.dark)
    : null;

  try {
    const png = await renderJournalPin({ variant, title, eyebrow, meta, excerpt, photo, showEyebrow, footer, footerImg });
    return new Response(png, {
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public, max-age=86400, s-maxage=2592000, immutable',
      },
    });
  } catch (err) {
    return new Response(`Journal pin render error: ${err?.message || err}`, { status: 500 });
  }
};

export const config = { path: '/pin/journal.png' };
