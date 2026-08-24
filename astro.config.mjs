import fs from 'node:fs';
import { defineConfig } from 'astro/config';

/**
 * Video pages are noindex until they're written up (`enriched: false` → the
 * template sets noindex, because a title plus a link to YouTube is a thin page).
 * They must therefore stay OUT of the sitemap: listing a URL there asks Google to
 * index it, and the page then refuses. That contradiction wastes crawl budget on
 * a site that has plenty of pages and little authority to spend, and it showed up
 * in Search Console as 168 sitemap URLs excluded by noindex.
 *
 * Read straight off the frontmatter rather than kept as a hand-written list, so
 * enriching a class removes it from here automatically.
 */
const noindexPaths = (dir, prefix, isHidden) =>
  fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => fs.readFileSync(`${dir}/${f}`, 'utf8'))
    .filter(isHidden)
    .map((src) => src.match(/^slug:\s*"([^"]+)"/m)?.[1])
    .filter(Boolean)
    .map((slug) => `${prefix}/${slug}`);

const hiddenPaths = new Set([
  ...noindexPaths('./src/content/videos', '/videos', (src) => /^enriched:\s*false\s*$/m.test(src)),
  // Same contradiction, different collection: an unlisted post is a soft launch —
  // it renders at its URL for review but sets noindex and stays out of the listing
  // and RSS. Submitting it to Google undoes the point of the flag.
  ...noindexPaths('./src/content/blog', '/blog', (src) => /^unlisted:\s*true\s*$/m.test(src)),
]);
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

// Real domain — used for canonical URLs, Open Graph tags, JSON-LD and the sitemap.
// The whole site prerenders to static EXCEPT routes that opt out with
// `export const prerender = false` (currently the gated /practices/[slug] pages),
// which render on-demand via the Netlify adapter so member content is never sent
// to non-buyers.
export default defineConfig({
  site: 'https://yinyogawithkatie.com',
  adapter: netlify(),
  integrations: [
    sitemap({
      // Keep hidden/private surfaces out: the runner funnel (noindex until
      // launch), the gated course, and Katie's private pin/board consoles.
      //
      // Matched on the EXACT pathname, not `includes()`. Substring matching had
      // silently dropped /videos/runners-yoga-to-boost-recovery... because the
      // slug contains "runners" — hiding a real, enriched class from Google on
      // account of a rule meant for the /runners opt-in page.
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/+$/, '') || '/';
        // /pincalendar belongs here for the same reason as /pins and /boards —
        // it's one of Katie's private consoles and it renders noindex. It was
        // missing from this list, so the sitemap was submitting it to Google:
        // the exact contradiction the comment at the top of this file describes.
        //
        // /videos/all is the overflow list of not-yet-written-up classes. It is
        // noindex on purpose (see the file) and must not be submitted either.
        const exact = [
          '/runners', '/account', '/pins', '/boards',
          '/pincalendar', '/videos/all',
        ];
        if (exact.includes(path)) return false;
        // Whole sections, matched as path segments so a slug can't collide.
        if (path === '/dev' || path.startsWith('/dev/')) return false;
        if (path === '/practices' || path.startsWith('/practices/')) return false;
        // Anything that renders noindex — unwritten video pages, soft-launched
        // posts — must not be submitted to Google as well.
        if (hiddenPaths.has(path)) return false;
        return true;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
