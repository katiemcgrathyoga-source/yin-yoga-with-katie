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
    intro: "Some days the choice is not between a good practice and a better one — it is between five minutes and nothing at all. This is seven minutes. Two shapes, on your back, on the floor beside your bed — though the first of them travels through three positions without stopping, so it covers more ground than it looks. Little and often genuinely beats long and rare, and this is what little looks like.",
    summary: 'A seven-minute Yin practice for the days when the real choice is between this and nothing.',
    steps: [
      // Reclined Hamstring is held in three parts (up, out to the side, across the
      // body) with no break between them, so this side needs enough time to give
      // each part a real hold. The twist gives the time back — still seven minutes.
      { pose: 'reclined-hamstring', seconds: 105, sides: 2, note: 'On your back, one leg up. Knee as bent as it needs to be.' },
      { pose: 'reclined-twist', seconds: 60, sides: 2, note: 'Knees across. Then the other side, and you are done.' },
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

/**
 * The teaching kit each routine page shows beside the timer, matching a
 * practice page: why it helps, how to scale it, when to use it. Katie's voice,
 * drafted 2026-09-13 from the intros and the pose files — flagged for her
 * review like all drafted copy. Keyed by slug so the sequences above stay
 * readable.
 */
const COPY = {
  'up-the-wall': {
    why: "Legs up the wall lets gravity drain the legs and takes every bit of effort out of the picture. Heavy, tired legs after a long or hard run do not need stretching so much as they need to stop working, and five quiet minutes here does that better than anything more ambitious. The twist afterwards just lets the spine settle.",
    scale: [
      { level: 'New', note: "Keep the hips a hand's width from the wall and bend the knees a little if the hamstrings complain. A folded blanket under the head helps." },
      { level: 'Returning', note: 'Bring the hips closer to the wall and let the legs be truly heavy for the full five minutes.' },
      { level: 'Experienced', note: 'Add a second round of the twist, or stay in corpse for as long as you have. Nothing here needs to be deeper.' },
    ],
    when: ['Straight after a long or hard run, once you have eaten.', 'The evening before an early start, to settle the legs.', 'Any day the honest answer is "I have nothing left".'],
  },
  'the-deep-hamstring': {
    why: 'Hamstrings do the hardest braking work in every stride, and they shorten quietly week after week. Four long folds into the same tissue from slightly different angles reach further than any quick stretch can, because the deeper layers only let go with time. Soft knees the whole way through keep the load in the muscle rather than behind the knee.',
    scale: [
      { level: 'New', note: 'Bend the knees generously in every fold and sit on a cushion. Come out of the caterpillar at three minutes.' },
      { level: 'Returning', note: 'Let the folds deepen on their own and stay for the full holds. Use a strap in the reclined stretch.' },
      { level: 'Experienced', note: 'Straighten the legs a little more in the caterpillar, and add a minute to the dragonfly if it is quiet.' },
    ],
    when: ['On a rest day, when the hamstrings feel short and braced.', 'The day after speed work or hills.', 'When a forward fold has stopped feeling like a stretch and started feeling like a wall.'],
  },
  'feet-toes-ankles': {
    why: 'Everything above the ankles is standing on them, and stiff feet change your stride before you notice. The soles, the tops of the feet and the ankles each get their own shape here, in both directions, so the whole base loosens rather than one side of it. It is short because it is intense, and intense is fine in small doses.',
    scale: [
      { level: 'New', note: 'Take most of your weight into the hands in toe squat and ankle stretch, and come out early. Sit on a block in the squat.' },
      { level: 'Returning', note: 'Let the hands rest lighter and stay for the full holds. Heels on a rolled blanket in the squat.' },
      { level: 'Experienced', note: 'Build toe squat toward two minutes over a few weeks, and let the heels settle toward the floor.' },
    ],
    when: ['After a run on hard roads or trails.', 'When the feet, ankles or calves feel stiff first thing.', 'Before a day on your feet.'],
  },
  'inner-thigh-opener': {
    why: 'Tight adductors pull on the pelvis and show up as groin niggles and a stride that will not open, yet almost nobody stretches them. Every shape here is a beginner shape and most of it is on your back, so the inner thigh can let go without the rest of you bracing. Props under the knees are what make the long holds possible.',
    scale: [
      { level: 'New', note: 'Cushions under both knees in butterfly and frog, and keep the frog narrow. Come out whenever it stops being dull.' },
      { level: 'Returning', note: 'Let the knees settle a little wider in the frog and fold a bit further in the half butterfly.' },
      { level: 'Experienced', note: 'Stay for the full holds and let the fold in butterfly come from the hips, not the back.' },
    ],
    when: ['When the groin or inner thigh feels tight or twingy.', 'On an easy day, when the hips feel narrow.', 'After a rest day, to open the stride gently.'],
  },
  'the-front-line': {
    why: 'Running and sitting both shorten the front of the body, and the quads and hip flexors are what pull the pelvis forward when they are tight. These shapes lengthen the whole front line, from the thigh up through the hip and belly to the chest. It asks a lot, which is why it comes after the shorter hip work and not before it.',
    scale: [
      { level: 'New', note: 'This is not the place to start; do the shorter hip practices for a few weeks first. If you are here anyway, skip the seal and the camel and stay upright on your hands in saddle.' },
      { level: 'Returning', note: 'Saddle on the elbows or over a bolster, and keep the camel brief. Come out of anything sharp.' },
      { level: 'Experienced', note: 'Take saddle all the way down if the knees are happy, and stay the full three minutes.' },
    ],
    when: ['On a rest day, when the front of the hips feels short.', 'After a week of long sitting.', 'Never the night before a race.'],
  },
  'twists-for-a-tight-back': {
    why: 'Running loads the spine with impact and almost never rotates it, so the back stiffens in one direction. Gentle twists move it the other way, and doing them lying down means the back muscles can stay soft while the spine turns. Nothing here is strong; the length of the hold is what does the work.',
    scale: [
      { level: 'New', note: 'A cushion between the knees in the reclined twist, and keep the seated twist small. If the low back is sore rather than stiff, stay with the crocodile and the reclined twist only.' },
      { level: 'Returning', note: 'Let the knees drop all the way in the reclined twist and hold the seated twist for the full time.' },
      { level: 'Experienced', note: 'Stay longer in the reclined twist, up to five minutes a side, and let the breath do the rotating.' },
    ],
    when: ['After a long run, when the low back feels compressed.', 'At the end of a day at a desk.', 'Any evening the back feels stiff rather than sore.'],
  },
  'outer-hip-and-it-band': {
    why: 'You cannot stretch an IT band, but you can release the muscles that tension it: the glutes, the outer hip and the side body. That is where a sharp line down the outside of the knee usually starts, and it is what these four shapes work, each from a different angle. Twice a week is enough to notice.',
    scale: [
      { level: 'New', note: 'Sit on a block in shoelace and keep the twisted dragon shallow, with the back knee padded. Skip the banana if the side body complains.' },
      { level: 'Returning', note: 'Fold a little further in shoelace and let the banana lengthen. Hold the reclined swan for the full time.' },
      { level: 'Experienced', note: 'Take the twisted dragon deeper and add a minute to the shoelace on the tighter side.' },
    ],
    when: ['When there is a pull down the outside of the knee or thigh.', 'After hilly or cambered runs.', 'On an easy day, twice a week, while a niggle settles.'],
  },
  'upper-body-for-runners': {
    why: 'By hour two of a long run the shoulders creep up and the chest closes, and a desk finishes the job. A closed chest makes breathing harder than it needs to be, and stiff shoulders cost you a relaxed arm swing. These shapes open the chest and free the upper back, all of them gentle enough for any day.',
    scale: [
      { level: 'New', note: 'A cushion under the head in thread the needle and a bolster under the chest in melting heart. Keep the eagle arms loose.' },
      { level: 'Returning', note: 'Let the chest sink further in melting heart and stay the full time in the fish.' },
      { level: 'Experienced', note: 'Add a second round of thread the needle and stay longer in the supported fish.' },
    ],
    when: ['After a long run, when the shoulders have crept up.', 'At the end of a desk day.', 'Before bed, if the chest feels tight.'],
  },
  'long-hold-hips': {
    why: 'The interesting part of a five-minute hold happens after minute three, once the muscles have stopped guarding and the deeper tissue around the hip starts to move. Dragon, sleeping swan and deer cover the front, back and sides of the hip, so nothing is missed. It is long because there is no way to get there quickly.',
    scale: [
      { level: 'New', note: 'Do the shorter hip practices first for a few weeks. If you are here anyway, halve every hold and pad everything.' },
      { level: 'Returning', note: 'Hold for three or four minutes rather than five, with a cushion under the front hip in sleeping swan.' },
      { level: 'Experienced', note: 'The full five minutes, and let the breath slow down with the hold. Do not chase depth; wait for it.' },
    ],
    when: ['On a proper rest day, with nothing after it.', 'When the hips have felt tight for weeks rather than days.', 'Not the day before a hard session or a race.'],
  },
  'pre-race-calm': {
    why: 'Deep stretching the night before a race can leave you loose and a little less springy, which is the last thing you want on a start line. Everything here is supported by a prop, so nothing is being opened; the point is to bring the nervous system down so you can sleep. Legs up the wall does most of the work.',
    scale: [
      { level: 'New', note: 'Keep every shape fully supported and come out whenever you like. Skip the twist if it feels like anything at all.' },
      { level: 'Returning', note: 'Stay a little longer in legs up the wall, up to eight minutes, and let the corpse run as long as you have.' },
      { level: 'Experienced', note: 'The same as everyone else. There is nothing to go deeper into the night before a race, and that is the point.' },
    ],
    when: ['The night before a race.', 'The evening after a hard session, to settle.', 'Any night the mind will not slow down.'],
  },
  'seven-honest-minutes': {
    why: 'Little and often beats long and rare, and this is what little looks like. One shape for the back of the legs, one for the spine, both lying down, both gentle enough to do on the floor beside the bed. It counts, and on the days it is the only thing that happens, it counts more.',
    scale: [
      { level: 'New', note: 'Bend the knee as much as you need in the hamstring stretch, and hold the thigh rather than the foot.' },
      { level: 'Returning', note: 'Let the leg straighten a little and the knees drop fully in the twist.' },
      { level: 'Experienced', note: 'Add thirty seconds to each side if you have it. If you do not, seven minutes was the point.' },
    ],
    when: ['The days you would otherwise do nothing.', 'Straight after a run, before the shower.', 'Last thing at night, on the bedroom floor.'],
  },
  'the-long-reset': {
    why: 'It works down the whole chain running loads, in order, so each shape sets up the next: the low back first, then the front of the hip, the glute, the back of the leg, the inner thigh and the side. Long holds and a proper rest at the end are what make it a reset rather than a stretch. Give it a rest day.',
    scale: [
      { level: 'New', note: 'Halve the longer holds and use a cushion in everything. Skip the banana if the side body objects.' },
      { level: 'Returning', note: 'Take the holds as written and pad the back knee in dragon. Come out of the caterpillar early if the hamstrings are loud.' },
      { level: 'Experienced', note: 'Stay for the full holds and let the four minutes of corpse be four minutes. Nothing here needs to be deeper.' },
    ],
    when: ['On a rest day, with nothing after it.', 'The day after a long run, once you have eaten.', 'Once a week, if you can manage it.'],
  },
};

/** The why / scale / when block, or nothing for a routine without copy yet. */
const kit = (slug) => {
  const c = COPY[slug];
  if (!c) return '';
  return [
    `why: ${q(c.why)}`,
    'scale:',
    ...c.scale.map((l) => `  - level: ${q(l.level)}\n    note: ${q(l.note)}`),
    'when:',
    ...c.when.map((w) => `  - ${q(w)}`),
    '',
  ].join('\n');
};

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
${kit(r.slug)}membership_cta: "This routine is part of The Runner's Reset — yours for good."
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
