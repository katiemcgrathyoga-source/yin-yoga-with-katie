import { defineConfig } from 'astro/config';
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
      // Keep hidden/private surfaces out of the sitemap: the runner funnel
      // (soft-launched, noindex) and Katie's private pin/board consoles.
      filter: (page) =>
        !page.includes('/runners') &&
        !page.includes('/runner-reset') &&
        !page.includes('/dev/') &&
        !page.includes('/account') &&
        !page.includes('/practices') &&
        !page.includes('/pins') &&
        !page.includes('/boards'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
