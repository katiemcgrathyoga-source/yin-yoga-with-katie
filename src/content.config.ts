import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The `poses` collection — the single source of truth for the whole directory.
 *
 * Each pose is one Markdown file in `src/content/poses/`. Add a pose by dropping
 * in a new file; no code changes required. Later phases (collection pages,
 * routines, the practice player, accounts) all reference poses by their `slug`,
 * so this schema is the contract everything else bolts onto.
 *
 * The schema below mirrors the frontmatter in `sleeping-swan.md` exactly. Astro
 * runs it against every file at build time (`astro check` / `astro build`) and
 * fails the build with a precise message if a field is missing, mistyped, or
 * malformed — so a bad pose file can never ship silently.
 */
const poses = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/poses' }),
  schema: z.object({
    // Names & identity
    name_en: z.string().min(1), // the yin-yoga name (the only name shown on the page)
    name_sanskrit: z.string().optional(), // no longer displayed — yin names only
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
    also_known_as: z.array(z.string()).default([]), // no longer displayed

    // Anatomy & energetics
    target_areas: z.array(z.string()).min(1),
    meridians: z.array(z.string()),
    accessibility: z.enum(['beginner', 'intermediate', 'advanced']),
    hold_time: z.string().min(1), // human-readable range, e.g. "3–5 minutes per side"
    hold_seconds: z.number().int().positive().optional(), // default timer target (seconds); powers the on-page hold timer + future routine player
    props: z.array(z.string()),

    // Teaching content
    benefits: z.array(z.string()).min(1),
    cues: z.array(z.string()).min(1),
    transitions_in: z.array(z.string()),
    transitions_out: z.array(z.string()),
    counterposes: z.array(z.string()),
    cautions: z.array(z.string()),

    // Frequently-asked questions — rendered on the page and as FAQPage schema.
    faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).default([]),

    // Relationships (slugs of other poses)
    related_poses: z.array(z.string()),

    // Media — youtube_video_id is optional; the embed only renders when it has a value.
    // (Pose clips are unlisted YouTube videos and embed exactly like public ones.)
    youtube_video_id: z.string().optional(),
    images: z.array(z.string()),

    // SEO
    seo_title: z.string().min(1),
    seo_description: z.string().min(1),
  }),
});

/**
 * The `videos` collection — the site's new primary content type.
 *
 * Each YouTube class is one Markdown file in `src/content/videos/`. The schema
 * mirrors the frontmatter in `bend-like-bamboo.md` exactly and is validated at
 * build time (`astro check` / `astro build`), so a malformed video file fails
 * the build with a precise message rather than shipping broken.
 *
 * Videos link *to* poses (`poses_featured`, and each chapter's optional `pose`);
 * pose pages read this collection back to show "Classes featuring this pose".
 */
const videos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/videos' }),
  schema: z.object({
    // Core video data
    title: z.string().min(1), // full title — kept for SEO/OG + matching the YouTube upload
    display_title: z.string().optional(), // short, absorbable headline for the page/tile
    subtitle: z.string().optional(), // optional supporting line under the headline
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
    youtube_id: z.string().min(1),
    length_minutes: z.number().int().positive(), // true runtime; filtering always uses this
    display_length: z.string().optional(), // optional marketed length shown on the pill/badge (e.g. "30 min")
    watch_hours: z.number().nonnegative().optional(), // lifetime watch time; homepage sorts by this
    published: z.coerce.date().optional(), // some members-only classes have no public publish date
    enriched: z.boolean().default(false), // true once the file is fully written up (vs a skeleton)
    membership: z.boolean().default(false), // members-only class → funnels to the membership

    // Filter taxonomy — skeleton records may leave these empty until enriched.
    intent_tags: z.array(z.string()).default([]),
    body_areas: z.array(z.string()).default([]),
    props: z.array(z.string()), // may be empty → surfaces as a "no props" filter
    level: z.enum(['all-levels', 'beginner', 'intermediate', 'advanced']),

    // Connective tissue: poses featured, in order (slugs of pose pages)
    poses_featured: z.array(z.string()),

    // Chapters — clickable index for TV viewers
    chapters: z
      .array(
        z.object({
          time: z.string().min(1), // display timestamp, e.g. "1:27:50"
          seconds: z.number().int().nonnegative(), // deep-link offset
          title: z.string().min(1),
          pose: z.string().optional(), // legacy single slug → /poses/[slug] (kept for older files)
          poses: z.array(z.string()).optional(), // slugs of every held pose in this chapter, in order
        }),
      )
      .default([]), // skeleton records have no chapters yet

    // SEO — thumbnail is optional; when absent it's derived from youtube_id.
    seo_title: z.string().min(1),
    seo_description: z.string().min(1),
    thumbnail: z.string().optional(),

    // Frequently-asked questions — rendered on the page and as FAQPage schema.
    // Optional; the template falls back to a derived FAQ for enriched classes.
    faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).default([]),

    // Outcome-led membership CTA + a short summary for cards/meta.
    membership_cta: z.string().min(1),
    summary: z.string().min(1),
  }),
});

/**
 * The `routines` collection — curated pose sequences the practice player runs.
 *
 * Each routine is one Markdown file in `src/content/routines/`. It references
 * poses by `slug` (the same identity used everywhere), and each step carries a
 * hold length and whether it's done on one side or both. The routine page
 * resolves each slug to the pose's name, photo and cue, then hands the expanded
 * sequence to the `<routine-player>` component (which reuses the pose timer).
 */
const routines = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/routines' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
    tagline: z.string().optional(),
    intent: z.string(), // grouping label, e.g. "sleep" | "hips" | "shoulders" | "full-body"
    hero_pose: z.string().optional(), // slug of the pose to use as the card/OG image (defaults to the first step)
    level: z.enum(['all-levels', 'beginner', 'intermediate', 'advanced']),
    minutes: z.number().int().positive(), // marketed length (matches the sum of holds)
    intro: z.string().min(1), // a short paragraph in Katie's voice
    props: z.array(z.string()).default([]),
    steps: z
      .array(
        z.object({
          pose: z.string(), // slug → poses collection
          seconds: z.number().int().positive(), // hold length for this step
          sides: z.union([z.literal(1), z.literal(2)]).default(1), // 2 → player runs it left then right
          note: z.string().optional(), // short cue shown while holding
        }),
      )
      .min(1),
    faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).default([]),
    membership_cta: z.string().min(1),
    summary: z.string().min(1),
    seo_title: z.string().min(1),
    seo_description: z.string().min(1),
  }),
});

/**
 * The `blog` collection — Katie's Journal. Each post is one Markdown file in
 * src/content/blog/. Body is Markdown; frontmatter drives the listing + SEO.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
    description: z.string().min(1), // excerpt for the listing + meta description
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    // Unlisted: builds its page (reviewable at the URL) but noindex + hidden from
    // the /blog listing and RSS. Used to soft-launch a post before it's public.
    unlisted: z.boolean().default(false),
    hero: z.string().optional(), // optional lead image (path under /public)
    hero_caption: z.string().optional(), // italic caption under the hero image
    subtitle: z.string().optional(), // short italic line under the H1
    eyebrow_tag: z.string().optional(), // topic shown after "the journal ·" in the hero eyebrow
    cta_program: z.string().optional(), // slug of the program to CTA to (else the free-retreat CTA)
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
  }),
});

/**
 * The `sessions` collection — course practices (e.g. the Runner's Reset). A
 * session is a routine PLUS a teaching layer: a follow-along video, the "why"
 * (science), level modifications and an access flag. Each session page shows the
 * video, the timed RoutinePlayer, the science, written cues and a body map — one
 * page for every learning style. `access` gates it for the future membership;
 * `youtube_video_id` is left blank until the class is filmed.
 */
const sessions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sessions' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
    collection: z.string(),                     // e.g. "runners-reset"
    kind: z.enum(['post-run', 'rest-day', 'target', 'full-reset', 'start-here']),
    area: z.string(),                           // e.g. "hips", "hamstrings", "full-body"
    body_map: z.enum(['hips', 'hamstrings', 'calves', 'quads', 'back', 'full']).default('full'),
    level: z.enum(['all-levels', 'beginner', 'intermediate', 'advanced']).default('all-levels'),
    minutes: z.number().int().positive(),
    hold_label: z.string().default('2-minute holds'),
    props: z.array(z.string()).default([]),
    youtube_video_id: z.string().default(''),   // plug in after filming
    why: z.string().min(1),                     // the science rationale
    angle: z.string().optional(),               // a one-line message angle
    intro: z.string().min(1),                   // short intro in Katie's voice
    steps: z
      .array(
        z.object({
          pose: z.string(),                     // slug → poses collection
          seconds: z.number().int().positive(),
          sides: z.union([z.literal(1), z.literal(2)]).default(1),
          note: z.string().optional(),          // cue shown while holding
        }),
      )
      .min(1),
    scale: z.array(z.object({ level: z.string(), note: z.string() })).default([]),
    when: z.array(z.string()).default([]),
    access: z.enum(['free', 'members']).default('members'),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
  }),
});

export const collections = { poses, videos, routines, blog, sessions };
