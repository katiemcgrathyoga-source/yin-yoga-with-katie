# Claude Code Prompt — Back-Catalogue Skeleton Script

## How to use this

1. Put your Content CSV in the project — e.g. `C:\yin-site\data\content.csv` (the `Table_data - Content...` export).
2. Save the two ready-made records into the project too: `bend-like-bamboo.md` and `yin-yoga-for-sleep-challenge-day-1.md` (drop them in `src/content/videos/`).
3. In the Code tab, open `C:\yin-site`, and paste the prompt below.
4. Approve as it goes. It will generate one Markdown file per video, then show you a summary.

---

## The prompt (copy everything below)

> Write and run a Node script that generates **skeleton video records** for my whole YouTube back catalogue from a CSV, into my existing Astro `videos` collection. This makes every video findable immediately; I'll enrich the top performers with transcripts later.
>
> **First, add one field to the `videos` schema:** `enriched` (boolean, default false), and an optional `display_length` (string). Make sure the existing `bend-like-bamboo.md` (enriched: true) and `yin-yoga-for-sleep-challenge-day-1.md` still validate.
>
> **Input:** `data/content.csv`. Relevant columns: `Content` (this is the YouTube video ID), `Video title`, `Video publish time`, `Duration` (seconds). Skip the `Total` row and any row with an empty title.
>
> **For each video, write `src/content/videos/{slug}.md`** with:
> - `title` = Video title
> - `slug` = kebab-cased title (strip `|`, punctuation, collapse spaces; if two slugs collide, append the video ID short-hash). Keep it keyword-rich.
> - `youtube_id` = the `Content` value
> - `length_minutes` = round(Duration ÷ 60)
> - `display_length` = if the title contains a pattern like "30-min"/"30 min", use that ("30 min"); else omit
> - `published` = ISO date parsed from Video publish time
> - `enriched: false`
> - `level: "all-levels"`
> - `intent_tags` — infer from title keywords: sleep/bedtime/night → `sleep`; nervous system/stress/anxiety/calm → `nervous-system`; hips/lower back/back → `hips-lower-back`; flexib/stretch/splits → `flexibility`; full body/full-body → `full-body`; digestion → `digestion`; beginner → `beginner`. (A video can get several. If none match, leave `[]`.)
> - `body_areas` — infer from title: hips, lower back, shoulders, hamstrings, legs, spine, full body.
> - `props` — if title has "no props" → `["none"]`; if "bolster"/"blocks"/"props" → list them; else `[]`.
> - `poses_featured: []` and `chapters: []` (enriched later).
> - `membership_cta` — pick by dominant intent: sleep → the Sleep program line; hips-lower-back → Hips; nervous-system → Reset; else Full-Body. Outcome-led, never "support."
> - `summary` — one warm sentence from the title + length, in a calm tone.
> - `seo_title` / `seo_description` — templated from the title and outcome.
> - Body = a single short intro line from the title; leave the rest for enrichment.
> - **Do NOT overwrite any file where `enriched: true`** (protects Bamboo and any hand-built page), and skip slugs that already exist.
>
> **Thumbnails** derive from `youtube_id` in the template already — don't write thumbnail files.
>
> **After generating:** print a summary — how many records written, the tag distribution (how many got each intent), any rows skipped, and any slug collisions resolved. Then update the homepage/library so `enriched: false` videos still appear as tiles and are filterable.
>
> **SEO guardrail:** in `BaseLayout`, add `<meta name="robots" content="noindex">` on any video page where `enriched: false`, so thin skeleton pages don't get indexed by Google until I've enriched them. Enriched pages stay indexable. (This keeps the library fully usable on-site while protecting SEO quality.)
>
> When done: show me the homepage with the full grid, the total video count, and confirm `astro check` passes.

---

## Why it's built this way

- **Findable now, quality later.** Every video becomes browsable and filterable on your site immediately — the core value ("find my evergreen videos") — while the `enriched` flag lets us upgrade the top performers to full voice-matched pages (like Bamboo) over time.
- **The noindex guardrail matters:** ~500 thin pages hitting Google at once would look like low-value content. Skeletons stay on-site (great for members browsing) but out of Google until they're real pages. Enrich a video → it flips to indexable automatically.
- **Auto-tagging from titles** works because your titles are already specific (outcome + descriptor). It won't be perfect; we'll spot-fix the top ones as we enrich them.

## After it runs

Tell me the total count and the tag distribution, and I'll: (1) sanity-check the auto-tagging on your top 20, and (2) we pick the next handful of top performers to enrich with transcripts — starting by finishing video #2 (send me its transcript + chapters and I'll complete it to Bamboo standard).
