import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Zero-dependency RSS feed for the Journal. Powers auto-syndication:
// point Buffer / Publer / Zapier / IFTTT at /rss.xml and every new post
// auto-posts to X, Facebook and Pinterest the moment it publishes.
const SITE = 'https://yinyogawithkatie.com';

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft && !p.data.unlisted)
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime());

  const items = posts
    .map((p) => {
      const url = `${SITE}/blog/${p.data.slug}/`;
      return `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${p.data.published.toUTCString()}</pubDate>
      <description>${esc(p.data.description)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Yin Yoga with Katie — Journal</title>
    <link>${SITE}/blog/</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Slow, gentle words on Yin Yoga, rest and winding down — from Katie McGrath.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
