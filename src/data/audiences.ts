import type { CollectionEntry } from 'astro:content';

/**
 * Audience hubs — the second browse axis.
 *
 * The seven entries in `src/lib/videoFacets.ts` are *matchers*: each one asks a
 * question of `body_areas` and `intent_tags` and gets a list back. That works
 * because "does this class work the hips" is genuinely answerable from the
 * frontmatter.
 *
 * "Would a runner want this" is not. The frontmatter has no field for it, and
 * the two obvious proxies both fail: matching the word "run" returns 4 classes
 * out of 149, and matching lower-body areas returns 130 — a page that duplicates
 * the library under a different heading, which is worse than not having one.
 *
 * So audience hubs are CURATED. `classes` is an ordered list of slugs, chosen by
 * hand, and the page renders them in that order rather than by watch-hours. The
 * order is editorial: what you'd hand someone in that order, not what's popular.
 *
 * Adding an audience is adding an entry here. Desk Workers has exactly the same
 * shape (matching upper-body areas also returns 130 of 149) and slots in the
 * same way when its course is closer.
 */

type VideoEntry = CollectionEntry<'videos'>;

export interface Audience {
  key: string;
  label: string;
  heading: string;
  tagline: string;
  title: string;
  description: string;
  intro: string;
  /** Ordered class slugs. Curated by hand — see the note above. */
  classes: string[];
  /** The rest of the funnel: where this audience goes next. */
  related: { href: string; label: string }[];
  /**
   * Which lead magnet this hub asks for. An audience hub is the one page on the
   * site that knows exactly who is reading it, so offering the generic retreat
   * here would waste the clearest match we ever get — and, for runners, it would
   * skip the funnel that actually has a product behind it.
   */
  offer?: 'retreat' | 'runners';
  /** CTA body, when the default copy for that offer doesn't fit the page. */
  offerBody?: string;
}

export const AUDIENCES: Audience[] = [
  {
    key: 'runners',
    label: 'Runners',
    heading: 'Yin Yoga for Runners',
    tagline: 'for the tissue running tightens, and the days between',
    title: 'Yin Yoga for Runners — free classes for tight hips, hamstrings & recovery',
    description:
      'Free Yin Yoga classes for runners — long, passive holds for tight hips, hamstrings, quads, glutes and calves. Post-run, rest-day and recovery practices, 10 to 70 minutes.',
    intro:
      "Running is repetitive, forward-facing, and relentless on the same few tissues — hips, hamstrings, quads, calves. Yin won't make you faster, and it won't clear the ache after a hard session; honestly, nothing much does. What it does is stop the tightness quietly accumulating, and give you something to do with a rest day that isn't nothing. Everything here is long, slow and passive, which is the opposite of what your legs did this morning. The two short ones are for either side of a run; the rest are for the days in between.",
    classes: [
      // The four that answer the question directly.
      'runners-yoga-to-boost-recovery-35-min-rest-day-yin',
      'deep-stretch-yoga-for-runners-30-min-recovery-day',
      'after-running-yoga-10-min-post-run-stretches',
      'pre-run-yoga-10-min-warm-up-before-running',
      // Then the classes a runner is genuinely best served by, most useful first.
      '60-min-legs-up-the-wall-yin-yoga-for-tired-legs-w-gentle-yoga-at-the',
      '35-min-yin-yoga-deep-stretch-for-glutes-hamstrings-lower-body-3-min',
      'yoga-for-hips-lower-back-release-yin-yoga-for-lower-body-1-hour-yin',
      '30-min-yin-yoga-for-quads-psoas-hip-flexors-lower-body-yoga-deep',
      '35-min-leg-yin-yoga-deep-leg-stretch-poses-for-feet-ankles-calves',
      '30-minute-leg-yin-yoga-silent-relaxing-deep-leg-stretch-minimal-cues',
      '25-min-yin-yoga-for-glutes-long-holds-for-deep-stretches',
      '20-min-yoga-for-feet-ankles-rejuvenate-tired-feet-and-tight-ankles',
      '70-min-hip-opening-yoga-full-class-of-yoga-for-tight-hips-yin-yoga',
      'yin-yoga-1-hour-lower-body-focus-hips-spine-legs-deep-stretch-with',
      'yin-yoga-for-tight-hips-glutes-deep-stretch-yoga-stretches-for-hips',
      '30-min-yin-yoga-deep-stretch-glutes-hamstrings-3-5-minute-hold-yoga',
      '30-min-yin-yoga-for-flexibility-stretch-release-hips-hamstrings',
      '20-minute-yin-yoga-for-spine-hips-hamstrings',
      '40-min-yin-yoga-class-lower-back-deep-stretch-yin-for-back-hamstring',
      'hip-flexibility-yin-5-poses-for-internal-external-rotation-adductors',
      'deep-hip-stretch-yoga-25-min-yin-yoga-to-open-tight-hips-increase-hip',
      'grounding-yin-yoga-class-for-hips-lower-back-no-props-stretch-relax',
    ],
    offer: 'runners',
    offerBody:
      "Somewhere to start: I'll send you my free 15-Minute Post-Run Reset — a follow-along Yin class for straight after a run, with a hold timer and written cues. Fifteen quiet minutes to loosen what running tightens. Yours to keep, for any run.",
    related: [
      { href: '/blog/yoga-for-runners', label: 'Yoga for Runners: the best Yin poses for tight hips and recovery' },
      { href: '/blog/post-run-stretches', label: 'What to do after a run: a 15-minute post-run routine' },
      { href: '/routines/the-day-after', label: 'The Day After — a guided 23-minute routine for aching legs' },
    ],
  },
];

/**
 * Resolve an audience's curated slugs against the collection, IN CURATED ORDER.
 *
 * Throws rather than skipping. A curated list is hand-maintained, so a slug that
 * no longer resolves is a typo or a renamed class — silently dropping it would
 * shrink the page without anyone noticing, which is exactly the failure mode a
 * curated list is supposed to avoid. Same for a slug that points at a skeleton:
 * an indexable hub must never link to a `noindex` page.
 */
export function resolveAudienceClasses(audience: Audience, videos: VideoEntry[]): VideoEntry[] {
  const bySlug = new Map(videos.map((v) => [v.data.slug, v]));
  return audience.classes.map((slug) => {
    const found = bySlug.get(slug);
    if (!found) {
      throw new Error(
        `AUDIENCES["${audience.key}"] lists "${slug}", which is not a class in src/content/videos/. ` +
          `Fix the slug in src/data/audiences.ts or remove it.`,
      );
    }
    if (!found.data.enriched) {
      throw new Error(
        `AUDIENCES["${audience.key}"] lists "${slug}", which is still a skeleton (enriched: false). ` +
          `An indexable hub must not link to a noindex page — enrich the class or drop it from the list.`,
      );
    }
    return found;
  });
}
