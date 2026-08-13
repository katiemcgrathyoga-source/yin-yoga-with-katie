import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { practiceMinutes, type DurationStep } from './lib/duration';
import { PIN_AUDIENCES, PIN_LIMITS } from './lib/pinBoards';

/**
 * Guards the hand-written `minutes` against the real runtime. `minutes` used to be
 * "the sum of the holds", which ignored rebound time and understated every practice
 * by a third. Now the build fails if the number on the page drifts from the timer.
 */
function checkMinutes(
  data: { minutes: number; steps: DurationStep[] },
  ctx: z.RefinementCtx,
) {
  const actual = practiceMinutes(data.steps);
  if (data.minutes !== actual) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['minutes'],
      message:
        `minutes is ${data.minutes} but the sequence actually runs ${actual} min ` +
        `(holds + rebounds + side switches + lead-in). Set minutes: ${actual}, ` +
        `or change the holds. Remember the prose and SEO copy quote this number too.`,
    });
  }
}

/**
 * Pin copy — the benefit-led angles the Pinterest templates and `/pincalendar`
 * read, shared by poses, routines and videos.
 *
 * A page's own copy is written for someone already reading it; these are written
 * for someone scrolling past. The audience tag doubles as the Pinterest board
 * (see PIN_BOARDS), so the calendar needs no separate board field.
 *
 * The limits are hard because Satori cannot shrink type to fit — a headline one
 * character too long doesn't wrap, it runs off the canvas. `npm run build` runs
 * `astro check` first, so a bad angle fails the build here rather than shipping
 * a broken pin.
 *
 * Drafted copy is in `design/pin-angles-draft.yaml` (poses) and
 * `design/pin-angles-routines-videos.yaml`; the templates and the five headline
 * formulas are in `design/pin-system.html`.
 *
 * @param max how many angles this content type may carry. Poses and routines get
 *   two, on two different boards, so a day's pair can always spread. Videos get
 *   one: their audience is already determined by `intent_tags`, so a second
 *   angle would only restate the first.
 */
const pinAngles = (max = 2) =>
  z
    .array(
      z
        .object({
          audience: z.enum(PIN_AUDIENCES),
          headline: z
            .string()
            .min(1)
            .max(
              PIN_LIMITS.headline,
              `pin headline must be ${PIN_LIMITS.headline} characters or fewer — rewrite it shorter, never shrink the type`,
            ),
          proof: z
            .string()
            .min(1)
            .max(PIN_LIMITS.proof, `pin proof must be ${PIN_LIMITS.proof} characters or fewer`),

          /**
           * Optional state pair, for the Before → after template.
           *
           * Both states set in the same face at the same size, so the only thing
           * that changes is the colour — which is what keeps it out of gimmick
           * territory. That only holds if both lines break the same way, and at
           * 108px nineteen characters is one line. A two-line "before" against a
           * one-line "after" kills the device, so the limit is hard and both are
           * required together.
           */
          before: z.string().min(1).max(PIN_LIMITS.state).optional(),
          after: z.string().min(1).max(PIN_LIMITS.state).optional(),
        })
        .refine((a) => Boolean(a.before) === Boolean(a.after), {
          message: 'before and after go together — an angle needs both state lines or neither',
          path: ['before'],
        }),
    )
    .max(max, `at most ${max} pin angle${max === 1 ? '' : 's'} here — beyond that the calendar surfaces the same page too often`)
    .default([]);

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

    pin_angles: pinAngles(),

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

    // Pin copy — one angle per class, for the Watch with me template.
    pin_angles: pinAngles(1),

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
    // Set when a routine belongs to a paid course rather than the public library.
    // The public /routines pages filter these OUT and the course page filters them
    // IN, so a bonus routine can never leak onto the free site by being forgotten.
    course: z.string().optional(), // e.g. "runner-reset"
    // Opts this routine's CTA into a matched lead magnet instead of the retreat.
    // Explicit rather than inferred from `intent`, because "legs" doesn't mean
    // "runner" — The Day After is for runners, a bedtime leg stretch isn't.
    audience: z.enum(['runners']).optional(),
    area: z.string().optional(), // body area for course filtering, e.g. "hamstrings"
    level: z.enum(['all-levels', 'beginner', 'intermediate', 'advanced']),
    minutes: z.number().int().positive(), // true runtime — verified against the sequence below
    intro: z.string().min(1), // a short paragraph in Katie's voice
    props: z.array(z.string()).default([]),
    steps: z
      .array(
        z.object({
          pose: z.string(), // slug → poses collection
          seconds: z.number().int().positive(), // hold length for this step
          sides: z.union([z.literal(1), z.literal(2)]).default(1), // 2 → player runs it left then right
          rebound: z.number().int().positive().optional(), // override the 45s rebound after this pose (Katie: 30–60s)
          note: z.string().optional(), // short cue shown while holding
        }),
      )
      .min(1),
    faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).default([]),
    membership_cta: z.string().min(1),
    summary: z.string().min(1),

    // Pin copy — two angles on two different boards.
    pin_angles: pinAngles(),

    seo_title: z.string().min(1),
    seo_description: z.string().min(1),
  }).superRefine(checkMinutes),
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
    // object-position for cropping the hero (keeps the head/heart centered, esp. in the
    // portrait featured-card crop). e.g. "74% 55%". Defaults to centered when absent.
    hero_focal: z.string().optional(),
    hero_caption: z.string().optional(), // italic caption under the hero image
    subtitle: z.string().optional(), // short italic line under the H1
    eyebrow_tag: z.string().optional(), // topic shown after "the journal ·" in the hero eyebrow
    // Optional pull-quote → activates the blush/sage Quote pin for this post (light + dark).
    pin_quote: z.string().optional(),

    // Pin copy — two angles on two different boards, same as poses and routines.
    pin_angles: pinAngles(),
    cta_program: z.string().optional(), // slug of the program to CTA to (else the free-retreat CTA)
    // FAQ block → rendered on the post + emitted as FAQPage schema (rich results).
    faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).default([]),
    // "Practice along" block: a routine slug (its page has the built-in timer) + an
    // optional full-class YouTube id to embed.
    practise: z
      .object({ routine: z.string(), video: z.string().optional(), video_label: z.string().optional() })
      .optional(),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
  }),
});

/**
 * The `practices` collection — the taught classes inside a course (currently
 * The Runner's Reset). A practice is a routine PLUS a teaching layer: a
 * follow-along video, the "why" (science), level modifications and an access
 * flag. Each page shows the video, the timed RoutinePlayer, the science,
 * written cues and a body map — one page for every learning style. `access`
 * gates it; `youtube_video_id` is blank until the class is filmed.
 *
 * Distinct from `routines`, which are timer-only and have no video or teaching
 * layer — the difference is a filmed class, not the length of the sequence.
 */
const practices = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/practices' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
    collection: z.string(),                     // e.g. "runners-reset"
    kind: z.enum(['post-run', 'rest-day', 'target', 'full-reset', 'start-here']),
    area: z.string(),                           // e.g. "hips", "hamstrings", "full-body"
    body_map: z.enum(['hips', 'hamstrings', 'calves', 'quads', 'back', 'full']).default('full'),
    level: z.enum(['all-levels', 'beginner', 'intermediate', 'advanced']).default('all-levels'),
    minutes: z.number().int().positive(), // true runtime — verified against the sequence below
    hold_label: z.string().default('2-minute holds'),
    props: z.array(z.string()).default([]),
    // Card thumbnail on the practices index. A pose photo stands in until the
    // class is filmed and a real still can replace it; falls back to the first
    // pose in the sequence, so a new practice always has an image.
    hero_pose: z.string().optional(),
    // Slug of another practice that is the SAME recording under a different
    // name — currently the free lead magnet, which is also listed in the course.
    // Two entries rather than one because the framing genuinely differs (a
    // stranger who needs the upsell vs a buyer who doesn't). Recorded here so
    // the pose library can avoid listing one class twice, and so the pairing is
    // discoverable instead of folklore. Cross-entry equality can't be checked in
    // a per-entry schema, so keeping the sequences in step is on the author —
    // each file's `minutes` is still verified independently.
    same_class_as: z.string().optional(),
    youtube_video_id: z.string().default(''),   // free/public classes → YouTube embed
    bunny_video_id: z.string().default(''),      // paid self-hosted class → Bunny GUID, gated by entitlement
    why: z.string().min(1),                     // the science rationale
    angle: z.string().optional(),               // a one-line message angle
    intro: z.string().min(1),                   // short intro in Katie's voice
    steps: z
      .array(
        z.object({
          pose: z.string(),                     // slug → poses collection
          seconds: z.number().int().positive(),
          sides: z.union([z.literal(1), z.literal(2)]).default(1),
          rebound: z.number().int().positive().optional(), // override the 45s rebound after this pose (Katie: 30–60s)
          note: z.string().optional(),          // cue shown while holding
        }),
      )
      .min(1),
    scale: z.array(z.object({ level: z.string(), note: z.string() })).default([]),
    when: z.array(z.string()).default([]),
    access: z.enum(['free', 'members']).default('members'),
    product: z.string().default('runner-reset'), // entitlement a 'members' session requires to unlock
    unlisted: z.boolean().default(false), // noindex + email-only (e.g. the free lead-magnet class)
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
  }).superRefine(checkMinutes),
});

export const collections = { poses, videos, routines, blog, practices };
