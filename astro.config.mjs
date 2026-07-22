import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Real domain — used for canonical URLs, Open Graph tags, JSON-LD and the sitemap.
export default defineConfig({
  site: 'https://yinyogawithkatie.com',
  integrations: [
    sitemap({
      // Keep hidden/private surfaces out of the sitemap: the runner funnel
      // (soft-launched, noindex) and Katie's private pin/board consoles.
      filter: (page) =>
        !page.includes('/runners') &&
        !page.includes('/sessions/') &&
        !page.includes('/blog/yoga-for-runners') &&
        !page.includes('/pins') &&
        !page.includes('/boards'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
