import type { VideoData } from './video';

/**
 * The library's browse axes, in one place.
 *
 * These buckets used to live inside `src/pages/index.astro`, which was fine when
 * the homepage was the only place you could browse classes. It no longer is:
 * `/videos` is the library hub and `/videos/for/[focus]` are the topic hubs, and
 * all three have to agree on what "Hips" means or the same class shows up under
 * different labels depending on where you found it.
 */

/** Site rule: classes under 10 minutes are shorts/promos and get no page. */
export const isClass = (d: VideoData) => d.length_minutes >= 10;

// --- Length ------------------------------------------------------------------
// Displayed longest-first: subscribers reliably choose the longer class.
export const LENGTH_BUCKETS = [
  { key: '60-90', label: '60–90 min', test: (m: number) => m >= 60 },
  { key: '40-60', label: '40–60 min', test: (m: number) => m >= 40 && m < 60 },
  { key: '20-40', label: '20–40 min', test: (m: number) => m >= 20 && m < 40 },
  { key: 'under-20', label: 'Under 20 min', test: (m: number) => m < 20 },
];
export const lengthKey = (m: number) => LENGTH_BUCKETS.find((b) => b.test(m))!.key;

// --- Body areas --------------------------------------------------------------
// Raw `body_areas` are free text, so they're matched into a small fixed set that
// the Focus filter below is built from.
const AREA_BUCKETS = [
  { key: 'hips', match: (a: string) => /hip|groin/.test(a) },
  { key: 'lower-back', match: (a: string) => /lower back|low back|sacrum/.test(a) },
  { key: 'shoulders', match: (a: string) => /shoulder|neck|upper back|chest/.test(a) },
  // Everything below the hip. Note "hip flexor" is caught by `hips` above and
  // stays there — it's the joint, not the leg.
  {
    key: 'legs',
    match: (a: string) => /hamstring|quad|calf|calves|ankle|shin|feet|foot|\blegs?\b|it band|iliotibial/.test(a),
  },
];
const areaKeys = (d: VideoData) => {
  const set = new Set<string>();
  for (const raw of d.body_areas) {
    // Hyphens become spaces before matching. The field is free text and both
    // spellings are in the data — 34 classes say "lower back", 4 say
    // "lower-back" — and the hyphenated four were silently missing from the
    // lower-back hub, two of them classes literally titled "for your back".
    const a = raw.toLowerCase().replace(/-/g, ' ');
    for (const b of AREA_BUCKETS) if (b.match(a)) set.add(b.key);
  }
  // A class tagged hips-lower-back covers both, whatever its body_areas say.
  if (d.intent_tags.includes('hips-lower-back')) {
    set.add('hips');
    set.add('lower-back');
  }
  return [...set];
};

// --- Focus: intent + body area merged into one axis --------------------------
/**
 * Each focus is also a landing page at `/videos/for/[key]`, so the entries carry
 * the copy those pages need. `title`/`description` are the SEO pair; `intro` is
 * the paragraph under the H1.
 *
 * Ordered most-practised-first (by watch-hours signal), which is also the order
 * the filter chips appear in.
 */
export const FOCUS = [
  {
    key: 'sleep',
    label: 'Sleep',
    match: (d: VideoData) => d.intent_tags.includes('sleep'),
    heading: 'Yin Yoga for Sleep',
    tagline: 'slow, quiet classes to practise before bed',
    title: 'Yin Yoga for Sleep — free bedtime classes',
    description:
      'Free Yin Yoga classes to practise before bed — slow, floor-based holds and Yoga Nidra to settle a busy mind and help you sleep. Full-length, all levels.',
    intro:
      "These are the classes I reach for at the end of the day. They're slow, mostly floor-based, and there's nothing in them that will wake you up again — long quiet holds, a soft voice, and permission to fall asleep partway through if that's what happens. Practise in bed if you like. Nobody is checking.",
  },
  {
    key: 'calm',
    label: 'Stress & calm',
    match: (d: VideoData) => d.intent_tags.some((t) => ['nervous-system', 'stress'].includes(t)),
    heading: 'Yin Yoga for Stress & Anxiety',
    tagline: 'classes to settle the nervous system',
    title: 'Yin Yoga for Stress & Anxiety — free calming classes',
    description:
      'Free Yin Yoga classes for stress and anxiety — long, supported holds that settle the nervous system and slow the breath. Full-length, all levels, no props needed.',
    intro:
      "When you're wound up, the last thing that helps is being asked to try harder. These classes do the opposite: long holds, plenty of support underneath you, and time for your breath to slow down on its own. This is the practice that changed things for me, and it's the one I come back to most.",
  },
  {
    key: 'hips',
    label: 'Hips',
    match: (d: VideoData) => areaKeys(d).includes('hips'),
    heading: 'Yin Yoga for Hips',
    tagline: 'deep hip openers, held long enough to work',
    title: 'Yin Yoga for Hips — free hip-opening classes',
    description:
      'Free Yin Yoga classes for tight hips — deep, held hip openers like Dragon, Swan and Butterfly. Full-length classes for sitting all day, running, and general tightness.',
    intro:
      "Tight hips are the reason most people find Yin in the first place — usually after a long stretch of sitting, or a lot of running. These classes hold the big shapes (Dragon, Swan, Butterfly, Shoelace) for three to five minutes, which is what it takes to reach the tissue that actually holds the tightness. Go gently: hips are honest, and they don't like being rushed.",
  },
  {
    key: 'legs',
    label: 'Legs',
    match: (d: VideoData) => areaKeys(d).includes('legs'),
    heading: 'Yin Yoga for Legs',
    tagline: 'hamstrings, quads and calves, held long',
    title: 'Yin Yoga for Legs — free classes for hamstrings, quads & calves',
    description:
      'Free Yin Yoga classes for tight legs — long, passive holds for hamstrings, quads, calves and feet. Full-length classes for runners, walkers, and anyone who sits all day.',
    intro:
      "Legs get tight from everything — running, walking, cycling — and just as much from doing none of those and sitting still all day. These classes work the long lines down the back and front of the leg: hamstrings, quads, calves, and the feet everybody forgets about. Most of it happens lying down or sitting, and none of it asks you to be flexible before you start. Hamstrings in particular don't like being hurried, so come in at about 60–80% of what you could reach and let the time do the rest.",
  },
  {
    key: 'full-body',
    label: 'Full body',
    match: (d: VideoData) => d.intent_tags.includes('full-body'),
    heading: 'Full-Body Yin Yoga',
    tagline: 'head-to-toe classes when you want everything covered',
    title: 'Full-Body Yin Yoga — free full-length classes',
    description:
      'Free full-body Yin Yoga classes — a head-to-toe stretch covering hips, spine, shoulders and hamstrings in one practice. 20 to 90 minutes, all levels.',
    intro:
      "For when nothing in particular hurts but everything feels a bit stuck. These work through the whole body in one go — hips, spine, shoulders, hamstrings — so you don't have to decide what needs attention. If you only practise once a week, make it one of these.",
  },
  {
    key: 'shoulders',
    label: 'Neck & shoulders',
    match: (d: VideoData) => areaKeys(d).includes('shoulders'),
    heading: 'Yin Yoga for Neck & Shoulders',
    tagline: 'for desk tension and a tight upper back',
    title: 'Yin Yoga for Neck & Shoulders — free classes for desk tension',
    description:
      'Free Yin Yoga classes for neck, shoulder and upper-back tension — gentle held shapes like Thread the Needle and Melting Heart. Full-length, all levels.',
    intro:
      "If you work at a desk, this is where the day collects. These classes open the chest and upper back and let the neck be heavy for a while — Thread the Needle, Melting Heart, supported twists. Keep a cushion nearby; a lot of these are kinder with something under your head.",
  },
  {
    key: 'flexibility',
    label: 'Flexibility',
    match: (d: VideoData) => d.intent_tags.includes('flexibility'),
    heading: 'Yin Yoga for Flexibility',
    tagline: 'long holds that change how far you can go',
    title: 'Yin Yoga for Flexibility — free classes for deep stretching',
    description:
      'Free Yin Yoga classes for flexibility — long, passive holds that work into connective tissue rather than muscle. Full-length classes for hamstrings, hips and spine.',
    intro:
      "Flexibility in Yin doesn't come from pushing further — it comes from staying longer. These classes hold each shape for several minutes so the change happens in the connective tissue rather than the muscle. Work at about 60–80% of what you could reach, and let the time do the rest. It's slower than it sounds, and it lasts longer too.",
  },
  {
    key: 'lower-back',
    label: 'Lower back',
    match: (d: VideoData) => areaKeys(d).includes('lower-back'),
    heading: 'Yin Yoga for Lower Back',
    tagline: 'gentle classes for a tired, aching back',
    title: 'Yin Yoga for Lower Back Pain — free gentle classes',
    description:
      'Free Yin Yoga classes for a tight or aching lower back — gentle, supported holds and hip work that takes the pull off the back. Full-length, all levels.',
    intro:
      "A tight lower back often isn't really about the back — it's the hips and hamstrings pulling on it. So these classes work both: some gentle direct release, and a lot of hip and hamstring time to take the tension off. Please go carefully, especially with forward folds, and stop with anything sharp. If you have a diagnosed back condition, check with your physio first.",
  },
] as const;

export type FocusKey = (typeof FOCUS)[number]['key'];

/**
 * Every enriched class must belong to at least one focus hub.
 *
 * `/videos` used to list all 149 of them, so this was academic. It no longer
 * does — it lists the hubs, and the hubs are the only indexable route to a class
 * page. A class matching no hub is therefore unreachable from any indexable
 * page: still in the sitemap, still rendering `index`, and linked from nowhere.
 * That is a silent regression, so it fails the build instead.
 *
 * If this throws, the fix is usually a tag: `energy` and `digestion` exist as
 * intent_tags with no hub behind them, and a class carrying only one of those
 * plus no matching body_areas will land here. Either tag it with something a hub
 * matches, or add the hub.
 */
export function assertEveryClassHasAHub(classes: { data: VideoData }[]): void {
  const orphans = classes.filter((c) => !FOCUS.some((f) => f.match(c.data)));
  if (orphans.length) {
    const lines = orphans
      .map((c) => `  · ${c.data.slug}  intent_tags=[${c.data.intent_tags}] body_areas=[${c.data.body_areas}]`)
      .join('\n');
    throw new Error(
      `${orphans.length} enriched class(es) match no focus hub, so nothing indexable links to them:\n${lines}\n` +
        `See assertEveryClassHasAHub in src/lib/videoFacets.ts.`,
    );
  }
}

export const focusKeys = (d: VideoData) => FOCUS.filter((f) => f.match(d)).map((f) => f.key);
export const focusLabels = (d: VideoData) => FOCUS.filter((f) => f.match(d)).map((f) => f.label);

// --- Format: how the class is taught (a separate axis from Focus) ------------
// Silent and Yoga Nidra are strong subscriber preferences, so they earn filters.
export const FORMAT = [
  {
    key: 'silent',
    label: 'Silent',
    match: (d: VideoData) => /silent|minimal cues|no.?talking/i.test(d.title),
  },
  {
    key: 'yoga-nidra',
    label: 'Yoga Nidra',
    match: (d: VideoData) => /nidra|nsdr/i.test(d.title),
  },
  {
    key: 'no-props',
    label: 'No props',
    match: (d: VideoData) =>
      d.props.length === 0 ||
      d.props.every((p) => /^none$/i.test(p)) ||
      /no.?props|without props|prop.?free/i.test(d.title),
  },
];
export const formatKeys = (d: VideoData) => FORMAT.filter((f) => f.match(d)).map((f) => f.key);
