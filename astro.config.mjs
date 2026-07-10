import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Real domain — used for canonical URLs, Open Graph tags, JSON-LD and the sitemap.
export default defineConfig({
  site: 'https://yinyogawithkatie.com',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
