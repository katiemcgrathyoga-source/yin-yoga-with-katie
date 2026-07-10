import { renderCard } from './lib/render.mjs';

/**
 * On-the-fly branded OG image (1200×630) for link previews.
 *   /og/card.png?t=<title>&s=<subtitle>
 * Used as og:image on routine pages so Facebook/X/etc. show a branded card.
 */
export default async (req) => {
  const url = new URL(req.url);
  const title = (url.searchParams.get('t') || 'Yin Yoga with Katie').slice(0, 120);
  const subtitle = (url.searchParams.get('s') || '').slice(0, 90);

  try {
    const png = await renderCard({ title, subtitle });
    return new Response(png, {
      headers: {
        'content-type': 'image/png',
        // cache hard: the image only changes if the title/subtitle query changes.
        'cache-control': 'public, max-age=86400, s-maxage=2592000, immutable',
      },
    });
  } catch (err) {
    return new Response(`OG render error: ${err?.message || err}`, { status: 500 });
  }
};

export const config = { path: '/og/card.png' };
