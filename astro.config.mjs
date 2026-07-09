import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// IMPORTANT: set this to your real domain before deploying.
// It is used for canonical URLs, Open Graph tags, JSON-LD and the sitemap.
// e.g. 'https://yin-directory.netlify.app' or your custom domain.
export default defineConfig({
  site: 'https://your-site.netlify.app',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
