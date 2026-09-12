/**
 * The muscle map each runner routine shows under "Where it works".
 *
 * Front and back figures, the muscles the sequence works in rose quartz, the
 * rest plain. The masters are the Strava cards in design/strava-maps/ (see
 * STRAVA-SETUP.md for how they're made and edited); the web copies here are
 * the same images without the caption strip, resized to 880px.
 *
 * Re-export after editing a master:
 *   node -e "require('sharp')('design/strava-maps/<slug>.jpg').extract({left:0,top:0,width:1408,height:1408}).resize({width:880}).webp({quality:82}).toFile('public/bodymap/routines/<slug>.webp')"
 *
 * `photo` is the full-size JPEG for the Strava post (the finish screen links it,
 * since the API can't attach photos). A routine without an entry simply has no
 * map section. `works` is the caption,
 * so it reads as a sentence: "Where it works: the hips, glutes and outer hip."
 */
export const ROUTINE_MAPS: Record<string, { works: string }> = {
  'the-day-after':            { works: 'the glutes, hamstrings, side body, lower back and calves' },
  'the-outside-line':         { works: 'the outer hip, glutes and quads' },
  'deep-hips-lower-body':     { works: 'the hip flexors, glutes and outer hip' },
  'deep-legs-hamstrings':     { works: 'the hamstrings, calves and feet' },
  'lower-back-release':       { works: 'the lower back, upper back, glutes and hamstrings' },
  'full-body-reset':          { works: 'the shoulders, chest, back, glutes and thighs' },
  'tight-hips-after-running': { works: 'the hip flexors, quads, outer hip, glutes and lower back' },
  'rest-day-recovery':        { works: 'the chest, shoulders, hip flexors, quads, inner thighs, side body, glutes, lower back and the backs of the legs' },
  'after-the-run':            { works: 'the hip flexors, quads, glutes, hamstrings, calves and lower back' },
};

export const routineMap = (slug: string) =>
  ROUTINE_MAPS[slug]
    ? { src: `/bodymap/routines/${slug}.webp`, photo: `/bodymap/routines/${slug}.jpg`, works: ROUTINE_MAPS[slug].works }
    : null;
