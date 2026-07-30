/**
 * Generates the bonus routines for The Runner's Reset.
 *
 * Why a generator rather than twelve hand-written files: `minutes` must equal
 * what the timer actually runs, and hand-counting holds plus rebounds plus side
 * switches across twelve sequences is exactly the arithmetic that was wrong
 * across the whole library before the duration guard existed. Here it is
 * computed once, and content.config.ts re-checks every number at build time —
 * so a mistake in this file fails the build rather than shipping.
 *
 * Re-run:  node scripts/gen-course-routines.mjs
 * It overwrites the twelve files below and touches nothing else.
 */
import fs from 'fs';

// Mirrors src/lib/duration.ts. Kept in step by the build guard, not by hope.
const PREP = 15, REBOUND = 45, SIDE = 15;
const mins = (steps) =>
  Math.round(
    steps.reduce((t, s, i) => {
      const sides = s.sides ?? 1;
      return t + s.seconds * sides + (sides - 1) * SIDE + (i < steps.length - 1 ? (s.rebound ?? REBOUND) : 0);
    }, PREP) / 60,
  );

const ROUTINES = [
  {
    slug: 'up-the-wall', title: 'Up the Wall', intent: 'legs', area: 'legs',
    level: 'beginner', hero: 'legs-up-the-wall',
    tagline: 'Twelve minutes with your legs up, for the days you have nothing left',
    intro: "The smallest useful thing you can do after a hard run. Legs up the wall, a slow twist, and done. No flexibility required and nothing to get right — if you only ever do one practice from this library on a heavy week, make it this one.",
    summary: 'A twelve-minute legs-up-the-wall reset for tired legs after a long or hard run.',
    steps: [
      { pose: 'legs-up-the-wall', seconds: 300, note: 'Hips close to the wall or a little away, whichever your low back prefers. Let the legs be completely heavy.' },
      { pose: 'reclined-twist', seconds: 90, sides: 2, note: 'Knees across to one side. Nothing to open here — just let the spine unwind.' },
      { pose: 'corpse', seconds: 120, note: 'Flat and still. This is the part that does the recovering.' },
    ],
  },
  {
    slug: 'the-deep-hamstring', title: 'The Deep Hamstring', intent: 'hamstrings', area: 'hamstrings',
    level: 'intermediate', hero: 'caterpillar',
    tagline: 'Twenty minutes on the back line, and nothing else',
    intro: "When it is specifically your hamstrings — not your hips, not your back — this is the one. Four shapes into the same tissue from slightly different angles, held long enough to actually reach it. Keep the knees softly bent the whole way through; a straight leg is not the goal and never was.",
    summary: 'A focused Yin practice for the hamstrings and the whole back line.',
    steps: [
      { pose: 'half-butterfly', seconds: 180, sides: 2, note: 'One leg long. Fold over the straight leg, back rounded and soft.' },
      { pose: 'caterpillar', seconds: 240, note: 'Both legs long, a long slow fold. Let the head hang heavy.' },
      { pose: 'dragonfly', seconds: 180, note: 'Wide legs, fold forward. Inner hamstring and adductor at once.' },
      { pose: 'reclined-hamstring', seconds: 120, sides: 2, note: 'On your back with a strap or hands behind the thigh. The gentlest of the four — finish here.' },
    ],
  },
  {
    slug: 'feet-toes-ankles', title: 'Feet, Toes & Ankles', intent: 'feet', area: 'calves',
    level: 'intermediate', hero: 'toe-squat',
    tagline: 'Twelve minutes at the base almost no runner works',
    intro: "Everything above your ankles is standing on them. Stiff feet and ankles change your stride before you notice, and almost nobody stretches here. This is short and, honestly, intense — Toe Squat is a lot the first few times. Come out whenever you need to and build up.",
    summary: 'A short, intense Yin practice for the feet, toes and ankles — the base most runners never work.',
    steps: [
      { pose: 'toe-squat', seconds: 90, note: 'Toes tucked, sitting back on the heels. Fierce. Hands on the floor to take weight off.' },
      { pose: 'ankle-stretch', seconds: 90, note: 'Tops of the feet down now — the other direction entirely.' },
      { pose: 'squat', seconds: 120, note: 'Feet wide, heels down if they reach. Ankles, hips and low back together.' },
      { pose: 'dangling', seconds: 120, note: 'Standing fold, knees bent, hanging heavy. Calves and the back line.' },
      { pose: 'childs-pose', seconds: 120, note: 'Rest. The feet will be talking to you — let them settle.' },
    ],
  },
  {
    slug: 'inner-thigh-opener', title: 'The Inner Thigh Opener', intent: 'hips', area: 'hips',
    level: 'beginner', hero: 'butterfly',
    tagline: 'Into the adductors, the quiet cause of a lot of hip trouble',
    intro: "Runners think about hamstrings and hip flexors and almost never about the inner thigh — yet tight adductors pull on the pelvis and show up as groin niggles and a stride that will not open. This one is all beginner shapes and mostly reclined. Props under the knees are a good idea, not a compromise.",
    summary: 'A gentle Yin practice for the inner thighs and groin.',
    steps: [
      { pose: 'butterfly', seconds: 240, note: 'Soles together, fold from the hips. Let the knees be wherever they are.' },
      { pose: 'frog', seconds: 180, note: 'Knees wide. Go slowly and put something soft under them — this one asks for patience.' },
      { pose: 'happy-baby', seconds: 150, note: 'On your back, soles up. Easy and forgiving after the frog.' },
      { pose: 'half-butterfly', seconds: 120, sides: 2, note: 'One leg folded in, fold over the long leg. Inner thigh and hamstring together.' },
      { pose: 'corpse', seconds: 120, note: 'Rest and let the hips settle back to neutral.' },
    ],
  },
  {
    slug: 'the-front-line', title: 'The Front Line', intent: 'quads', area: 'quads',
    level: 'advanced', hero: 'saddle',
    tagline: 'The deep one, into the quads and hip flexors',
    intro: "This is the most demanding practice in the library and it is not where to start. Saddle in particular asks a lot of the knees and the low back. Build up to it with the shorter hip work first, use props generously, and come out of anything that feels sharp rather than dull. When you can meet it, nothing gives the front of the body back like this.",
    summary: 'A demanding Yin practice for the quadriceps, hip flexors and the whole front line.',
    steps: [
      { pose: 'sphinx', seconds: 120, note: 'Forearms down. Wake the low back up gently before asking more of it.' },
      { pose: 'seal', seconds: 90, note: 'Arms straighter. Only if the sphinx felt easy.' },
      { pose: 'dragon', seconds: 150, sides: 2, note: 'Low lunge, back knee padded. Sink the hip forward and down.' },
      { pose: 'saddle', seconds: 180, note: 'Lean back over the feet — on elbows, a bolster, or all the way down. Any knee complaint means come out.' },
      { pose: 'camel', seconds: 60, note: 'Brief and upright. Hands on the low back if reaching the heels is too much.' },
      { pose: 'childs-pose', seconds: 150, note: 'The counterpose, and non-negotiable after the two backbends.' },
    ],
  },
  {
    slug: 'twists-for-a-tight-back', title: 'Twists for a Tight Back', intent: 'back', area: 'back',
    level: 'beginner', hero: 'reclined-twist',
    tagline: 'Gentle rotation, all of it on the floor',
    intro: "Every run is impact your spine absorbs, and running is relentlessly forward — you almost never rotate. This is the antidote, and it is all done lying down or sitting. Nothing here is strong. If your back is genuinely sore rather than stiff, this is still probably fine, but go carefully and skip anything that objects.",
    summary: 'Gentle Yin twists and spinal work for a stiff lower back.',
    steps: [
      { pose: 'crocodile', seconds: 120, note: 'Face down, completely passive. Let the low back soften first.' },
      { pose: 'sphinx', seconds: 120, note: 'A small, supported extension. The opposite of sitting all day.' },
      { pose: 'reclined-twist', seconds: 180, sides: 2, note: 'Knees across, shoulders heavy. The long one — stay past where it gets interesting.' },
      { pose: 'seated-twist', seconds: 120, sides: 2, note: 'Upright now. Rotate from the belly, not the shoulders.' },
      { pose: 'wind-relieving', seconds: 90, note: 'Knees hugged in. Squeeze the low back closed to finish.' },
    ],
  },
  {
    slug: 'outer-hip-and-it-band', title: 'The Outer Hip', intent: 'hips', area: 'quads',
    level: 'intermediate', hero: 'shoelace',
    tagline: 'The tissue behind most IT band complaints',
    intro: "You cannot stretch an IT band — it is a tough sheet of fascia and it is not going to lengthen for you. What you can do is release the muscles that pull on it, which is exactly what these four shapes do. If you get a sharp line down the outside of the knee when you run, start here, twice a week.",
    summary: 'A Yin practice for the outer hip, glutes and the muscles that tension the IT band.',
    steps: [
      { pose: 'shoelace', seconds: 150, sides: 2, note: 'Knees stacked, fold forward. Sit on something if the hips are tight.' },
      { pose: 'twisted-dragon', seconds: 150, sides: 2, note: 'From the low lunge, thread the shoulder across. Straight into the outer hip.' },
      { pose: 'banana', seconds: 120, sides: 2, note: 'A long crescent on your back. The side line, which nothing else here reaches.' },
      { pose: 'reclined-swan', seconds: 120, sides: 2, note: 'Figure four on your back. The gentlest way into the glute — finish here.' },
    ],
  },
  {
    slug: 'upper-body-for-runners', title: 'Upper Body for Runners', intent: 'shoulders', area: 'back',
    level: 'beginner', hero: 'melting-heart',
    tagline: 'The half of you that also runs',
    intro: "Nobody thinks of running as an upper-body sport until hour two of a long one, when the shoulders are up by the ears and the neck has had enough. Add a desk to that and the chest closes down, which quietly makes breathing harder. All beginner shapes.",
    summary: 'A Yin practice for the shoulders, upper back and chest.',
    steps: [
      { pose: 'thread-the-needle', seconds: 120, sides: 2, note: 'Shoulder and arm threading under. Upper back and the back of the shoulder.' },
      { pose: 'melting-heart', seconds: 180, note: 'Hips high, chest melting toward the floor. The big one for the upper back.' },
      { pose: 'puppy', seconds: 120, note: 'Similar shape, less intense — stay if melting heart was plenty.' },
      { pose: 'supported-fish', seconds: 180, note: 'Over a bolster or a rolled blanket. Opens everything running closes.' },
      { pose: 'eagle', seconds: 90, sides: 2, note: 'Arms wrapped, sitting tall. Between the shoulder blades.' },
    ],
  },
  {
    slug: 'long-hold-hips', title: 'Long Hold Hips', intent: 'hips', area: 'hips',
    level: 'advanced', hero: 'sleeping-swan',
    tagline: 'Five-minute holds, hips only',
    intro: "Four shapes, and you stay in each one for a long time. This is where Yin stops being a stretch and starts being a practice — the interesting part of a five-minute hold happens after minute three, and there is no way to get there quickly. Set aside a rest day for it and do not rush.",
    summary: 'A deep hip practice with five-minute holds, for experienced practitioners.',
    steps: [
      { pose: 'dragon', seconds: 300, sides: 2, note: 'Five minutes each side. Pad the back knee and settle in properly.' },
      { pose: 'sleeping-swan', seconds: 300, sides: 2, note: 'Front shin across. The one runners feel most — breathe and wait.' },
      { pose: 'deer', seconds: 180, sides: 2, note: 'Both knees to one side. Internal and external rotation together.' },
      { pose: 'childs-pose', seconds: 180, note: 'Fold in and let the hips close after all that opening.' },
    ],
  },
  {
    slug: 'pre-race-calm', title: 'Pre-Race Calm', intent: 'stress', area: 'full',
    level: 'beginner', hero: 'supported-bridge',
    tagline: 'Fully supported, for the night before',
    intro: "The night before a race is not the time to open your hips. Deep stretching can leave you feeling loose and a little less springy, which is the last thing you want on a start line. So this is entirely supported — nothing deep, nothing new, just props and stillness to bring your nervous system down so you can actually sleep.",
    summary: 'A fully supported Yin practice for the night before a race.',
    steps: [
      { pose: 'supported-bridge', seconds: 180, note: 'Block under the sacrum. Passive, no effort in the legs at all.' },
      { pose: 'legs-up-the-wall', seconds: 300, note: 'Legs heavy. This is the one that does the work tonight.' },
      { pose: 'supported-fish', seconds: 180, note: 'Chest open over a bolster. Easier breathing, calmer head.' },
      { pose: 'reclined-twist', seconds: 90, sides: 2, note: 'A small, easy twist. Nothing deep the night before.' },
      { pose: 'corpse', seconds: 180, note: 'Stay as long as you like. Falling asleep here is a perfectly good outcome.' },
    ],
  },
  {
    slug: 'seven-honest-minutes', title: 'Seven Honest Minutes', intent: 'quick', area: 'full',
    level: 'beginner', hero: 'reclined-twist',
    tagline: 'The one for the days you would otherwise do nothing',
    intro: "Some days the choice is not between a good practice and a better one — it is between five minutes and nothing at all. This is seven minutes. Two shapes, on your back, on the floor beside your bed. Little and often genuinely beats long and rare, and this is what little looks like.",
    summary: 'A seven-minute Yin practice for the days when the real choice is between this and nothing.',
    steps: [
      { pose: 'reclined-hamstring', seconds: 75, sides: 2, note: 'On your back, one leg up. Knee as bent as it needs to be.' },
      { pose: 'reclined-twist', seconds: 75, sides: 2, note: 'Knees across. Then the other side, and you are done.' },
    ],
  },
  {
    slug: 'the-long-reset', title: 'The Long Reset', intent: 'full-body', area: 'full',
    level: 'advanced', hero: 'dragonfly',
    tagline: 'The whole chain, unhurried',
    intro: "The longest practice here, and the one to give a proper rest day to. It works down the chain in order — back, hips, hamstrings, inner thigh, outer hip — so nothing gets left behind and each shape sets up the next. No video for this one; it is you, the timer and a lot of quiet.",
    summary: 'A long full-body Yin practice working down the whole chain running loads.',
    steps: [
      { pose: 'childs-pose', seconds: 180, note: 'Arrive. Nothing to do here but land.' },
      { pose: 'sphinx', seconds: 150, note: 'Gentle extension through the low back.' },
      { pose: 'dragon', seconds: 210, sides: 2, note: 'Front of the hip. Settle in properly, this is a long one.' },
      { pose: 'sleeping-swan', seconds: 210, sides: 2, note: 'Glute and outer hip.' },
      { pose: 'caterpillar', seconds: 240, note: 'The whole back line at once.' },
      { pose: 'dragonfly', seconds: 180, note: 'Wide fold — inner thigh and hamstring.' },
      { pose: 'banana', seconds: 120, sides: 2, note: 'The side line, which the rest of this misses.' },
      { pose: 'reclined-twist', seconds: 120, sides: 2, note: 'Unwind everything you just opened.' },
      { pose: 'corpse', seconds: 240, note: 'Four minutes, properly still. This is part of the practice, not the end of it.' },
    ],
  },
];

const q = (s) => JSON.stringify(String(s));

const toYaml = (r) => {
  const steps = r.steps
    .map((s) => [
      `  - pose: ${q(s.pose)}`,
      `    seconds: ${s.seconds}`,
      s.sides ? `    sides: ${s.sides}` : null,
      `    note: ${q(s.note)}`,
    ].filter(Boolean).join('\n'))
    .join('\n');

  return `---
title: ${q(r.title)}
slug: ${q(r.slug)}
tagline: ${q(r.tagline)}
intent: ${q(r.intent)}
hero_pose: ${q(r.hero)}
level: ${q(r.level)}
minutes: ${mins(r.steps)}
# GENERATED by scripts/gen-course-routines.mjs — edit there, not here.
# A bonus routine inside The Runner's Reset. Public /routines pages filter the
# course field OUT and the course pages filter it IN, so this can never surface
# on the free site by being forgotten.
course: "runner-reset"
area: ${q(r.area)}
intro: ${q(r.intro)}
props: []
steps:
${steps}
faq: []
membership_cta: "This routine is part of The Runner's Reset — yours for good."
summary: ${q(r.summary)}
seo_title: ${q(r.title + " — The Runner's Reset")}
seo_description: ${q(r.summary)}
---
`;
};

for (const r of ROUTINES) {
  fs.writeFileSync(`src/content/routines/${r.slug}.md`, toYaml(r));
  console.log(String(mins(r.steps)).padStart(3) + ' min   ' + r.level.padEnd(13) + r.area.padEnd(12) + r.slug);
}
console.log('\n' + ROUTINES.length + ' routines written');
