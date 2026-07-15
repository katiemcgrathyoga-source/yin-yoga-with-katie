import { renderPin } from './lib/pin.mjs';

const SITE = 'https://yinyogawithkatie.com';

// Fetch a repo/public image and inline it as a data URI so satori can embed it.
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

/**
 * On-the-fly branded Pinterest pin (1000×1500, 2:3).
 *   /pin/card.png?t=<title>&s=<eyebrow>&img=/poses/butterfly.jpg&tpl=photo|text
 * Used as the `media` image on the site's Save-to-Pinterest buttons and the /pins console,
 * so every post pins as an on-brand vertical image with no Canva step.
 */
export default async (req) => {
  const url = new URL(req.url);
  const title = (url.searchParams.get('t') || 'Yin Yoga with Katie').slice(0, 120);
  const eyebrow = (url.searchParams.get('s') || '').slice(0, 40);
  const tpl = url.searchParams.get('tpl') === 'text' ? 'text' : 'photo';
  const img = await loadImage(url.searchParams.get('img') || '');

  try {
    const png = await renderPin({ title, eyebrow, img, tpl });
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
