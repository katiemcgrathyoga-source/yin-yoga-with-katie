# Claude Code Prompt — Phase 1 (Pose-Page Layer)

## How to use this

1. Save these files into your `yin-site` folder: `sleeping-swan.md`, `sleeping-swan-preview.html`, and (optional but helpful) `yin-site-build-plan.md`.
2. In the **Code** tab of the Claude Desktop app, choose your `yin-site` folder as the folder to work in.
3. Drag those files into the Code window so it can see them.
4. Paste the prompt below as your message.
5. Claude Code proposes each change and waits for approval — read what it's about to do and click approve as it goes. It will install some things (normal) and then show you a live preview.

---

## The prompt (copy everything below)

> Build the pose-page layer of my Astro + TypeScript + Tailwind yin yoga directory. This is a brand-new, empty folder — set up the whole project from scratch.
>
> Context (optional reading): I've attached `yin-site-build-plan.md` describing the wider project. For now, build only Phase 1, the pose-page template — but keep the data decoupled so later phases (routines, accounts, membership) bolt on without a rebuild.
>
> 1. Create a `poses` content collection. Define its schema to match the frontmatter in the attached `sleeping-swan.md` exactly: name_en, name_sanskrit, slug, also_known_as[], target_areas[], meridians[], accessibility, hold_time, props[], benefits[], cues[], transitions_in[], transitions_out[], counterposes[], cautions[], related_poses[], youtube_video_id (optional), images[], seo_title, seo_description. The schema should flag missing or malformed fields at build time.
>
> 2. Add `sleeping-swan.md` as the first entry, in `src/content/poses/`.
>
> 3. Build a reusable `/poses/[slug]` page that renders every field, generated automatically from each file in the collection. Match the design in the attached `sleeping-swan-preview.html` — calm, spacious, mobile-first, with the breathing hold-time marker as the signature element, a distinct "Take care" cautions block, an "At a glance" data list, an email-capture box (leave it as a non-functional placeholder for now), and related-pose links. Only render the video area when youtube_video_id has a value. Note: my pose videos will be **unlisted** YouTube videos — these embed exactly like public ones, so no special handling is needed beyond the conditional embed.
>
> 4. Add SEO to each page: title and description from the file's fields, Open Graph tags, and schema.org HowTo structured data generated from the cues, hold_time, and props (see the JSON-LD example in the preview file).
>
> 5. Keep each pose as its own Markdown file in `src/content/poses/` so I can add poses later without touching code.
>
> 6. Run the dev preview and show me the Sleeping Swan page. Then: (a) show me the project file tree, (b) confirm the schema validates against sleeping-swan.md, and (c) give me step-by-step instructions to put the site online with Netlify and to add it to Google Search Console.

---

## What to expect / sanity checks

- It will scaffold the project, install Astro + Tailwind, create the collection and the `[slug]` page, then open a preview of `/poses/sleeping-swan`.
- The page should look like the preview: the breathing hold-time marker near the top, numbered "How to" steps, benefits, the bordered "Take care" cautions block, the "At a glance" list, and related poses.
- The video area should be **hidden** (because `youtube_video_id` is empty in this file) — that's correct.
- If anything turns red / shows an error, copy the message back to me and I'll get you unstuck.

## After it works

Tell me it's rendering and I'll (a) walk you through putting it online, and (b) generate the next batch of pose files — Frog, Happy Baby, Sphinx (the high-demand, low-competition quick wins) — for you to drop straight into `src/content/poses/`.
