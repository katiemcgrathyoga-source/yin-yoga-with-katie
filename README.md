# Yin Yoga with Katie

A calm, filterable video library for the **Yin Yoga with Katie** YouTube channel, built with Astro. Every class has its own page; poses are a supporting reference layer; Programs and a Calendar turn the library into guided practice.

## Stack

- [Astro](https://astro.build) (static output) + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`) + bespoke component CSS in `src/styles/global.css`
- Content Collections for `videos` and `poses` (schemas in `src/content.config.ts`)
- Deployed on Netlify (`netlify.toml`); sitemap via `@astrojs/sitemap`

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # astro check && astro build
npm run preview    # preview the production build
```

## Structure

```
src/
├─ content/
│  ├─ videos/           # one Markdown file per class (the primary content)
│  └─ poses/            # pose reference library
├─ pages/
│  ├─ index.astro       # the filterable video library (home)
│  ├─ videos/[slug]     # per-class page (links out to YouTube)
│  ├─ poses/            # pose index + per-pose pages
│  ├─ programs/         # guided programs (data in src/data/programs.ts)
│  └─ calendar/         # week view, month view, build-your-own
├─ data/                # programs, weekly themes, site config
├─ lib/                 # shared helpers (thumbnails, length, ranking, titles)
└─ styles/global.css    # design tokens (mauve & gold) + components
```

## Content

- **Add a class:** drop a Markdown file into `src/content/videos/`. It's validated against the schema at build time and appears in the library automatically.
- **Skeletons from YouTube:** `scripts/generate-video-skeletons.mjs` turns a YouTube Studio *Content → Table data* CSV export into skeleton records. Add `--membership` to flag members-only content. Analytics exports live under `data/` and are **not** committed (they contain subscriber/revenue figures); the generated `.md` files are.
- `enriched: true` marks a fully written-up class (indexable); skeletons stay `noindex` until enriched.

## Notes

- Set the real production domain in `astro.config.mjs` (`site`) before deploying.
- Set the membership join URL in `src/data/site.ts`.
