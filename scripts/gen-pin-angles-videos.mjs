/**
 * Generates design/pin-angles-routines-videos.yaml.
 *
 *   node scripts/gen-pin-angles-videos.mjs
 *
 * Routine angles are hand-written below. Video angles are half hand-written and
 * half derived: the audience tag comes from `intent_tags` (every enriched video
 * already has them, so there is nothing to write), and the headline and proof
 * come from the HEADLINES table. Anything missing from that table is reported
 * rather than silently skipped.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { parse, stringify } from 'yaml';

const LIMITS = { audience: 22, headline: 40, proof: 54 };

/* ── Audience from intent_tags ──────────────────────────────────────────────
   Order matters: it is priority, not preference. A bedtime shoulder class is
   pinned to Sleep, not Desk Workers, because "can't sleep" is the stronger
   reason to click. */
const AUDIENCE_RULES = [
  ['runners', 'for runners'],
  ['sleep', 'for restless nights'],
  ['beginner', 'for beginners'],
  ['shoulders', 'for stiff shoulders'],
  ['back', 'for a stiff back'],
  ['hips-lower-back', 'for a stiff back'],
  ['digestion', 'for a full-body reset'],
  ['energy', 'to start the day'],
  ['hips', 'for tight hips'],
  ['stress', "when you're wound up"],
  ['nervous-system', "when you're wound up"],
];
const audienceFor = (tags) =>
  AUDIENCE_RULES.find(([tag]) => tags.includes(tag))?.[1] ?? 'for a full-body reset';

/* ── Routines — hand-written, two angles each on two different boards ─────── */
const ROUTINES = {
  'bedtime-wind-down': [
    ['for restless nights', 'Twenty-five minutes toward sleep', 'Soft, supported shapes. Nothing to hold.'],
    ["when you're wound up", 'The day, put down in twenty-five', 'Gentle shapes and a timer that counts for you.'],
  ],
  'deep-hips-lower-body': [
    ['for tight hips', 'Thirty-seven minutes of hip opening', 'Inner thighs, outer hips, flexors, hamstrings.'],
    ['for runners', 'The hips a week of running tightens', 'Thirty-seven slow minutes, with a hold timer.'],
  ],
  'deep-legs-hamstrings': [
    ['for runners', 'Legs that move again, in eight poses', 'Twenty-six minutes, the evening after a run.'],
    ['for tight hips', 'Twenty-six minutes on the back line', 'Hamstrings, calves, inner thighs and feet.'],
  ],
  'full-body-reset': [
    ['for a full-body reset', 'Thirty-seven minutes, head to toe', 'Back, shoulders, hips and spine, held long.'],
    ['for beginners', 'One practice when nothing feels good', 'Balanced, all-levels, with the timer built in.'],
  ],
  'gentle-beginner-yin': [
    ['for beginners', 'Nineteen minutes, and no experience', 'An easier option in every single pose.'],
    ['for a full-body reset', 'The practice to start with', 'Simple shapes, well supported, nothing forced.'],
  ],
  'heart-chest-opener': [
    ['if you sit all day', 'Twenty-four minutes to undo the hunch', 'Supported backbends for chest and upper back.'],
    ['for stiff shoulders', 'Open a chest that closed at nine', 'Gentle, propped, twenty-four minutes.'],
  ],
  'lower-back-release': [
    ['for a stiff back', 'Twenty-five minutes for a tired back', 'Length, decompression, and the hips behind it.'],
    ['if you sit all day', 'The back a chair leaves aching', 'Gentle, all-levels, twenty-five minutes.'],
  ],
  'morning-wake-up': [
    ['to start the day', 'Twenty-one minutes before anything else', 'Soft backbends, an easy twist, gentle hips.'],
    ['for beginners', 'A gentle way into the morning', 'Nothing strenuous. Twenty-one slow minutes.'],
  ],
  'shoulders-neck-desk-relief': [
    ['if you sit all day', 'Nineteen minutes to undo a desk day', 'Chest open, shoulders unstuck, neck soft.'],
    ['for stiff shoulders', "Five poses for shoulders that won't drop", 'Nineteen minutes, and nothing to buy.'],
  ],
  'stress-overwhelm-relief': [
    ["when you're wound up", 'Twenty-five minutes to come back down', 'Slow, supported shapes and a timer that waits.'],
    ['for restless nights', 'For the days that got away from you', 'Grounding, all-levels, nothing to achieve.'],
  ],
  'yin-for-digestion': [
    ['for a full-body reset', 'Thirty-one minutes for a heavy middle', 'Forward folds and slow twists for the belly.'],
    ['for a stiff back', 'Twists and folds, thirty-one minutes', 'Works the digestive lines and the whole spine.'],
  ],
};

/* ── Videos — [headline, proof], keyed by slug ──────────────────────────────
   Ordered by watch hours, so the top of this list is the copy that matters
   most. The long tail of near-identical full-body and silent classes is varied
   mainly by duration, which is honest: that is what actually distinguishes
   them. Those are the first ones to rewrite. */
const P = {
  yt: 'Follow along on YouTube. No props needed.',
  ytFree: 'Free on YouTube. Nothing to set up.',
  ytLong: 'Press play and follow along. Nothing to plan.',
  ytBed: 'Follow along in bed clothes. Lights low.',
  ytProps: 'Follow along on YouTube. Props optional.',
};
const HEADLINES = {
  'bend-like-bamboo': ['The longest class on the channel', 'Ninety-four minutes, if you have them.'],
  '90-min-yin-yoga-class-full-body-yin-deep-stretches-long-holds-yin': ['Ninety minutes, head to toe', P.ytLong],
  'silent-yin-yoga-90-minutes-minimal-cues-long-holds-yin': ['Ninety minutes, almost no talking', 'Minimal cues. Long holds. Nothing to follow.'],
  'yin-yoga-for-sleep-challenge-day-1': ['Day one of thirty, before bed', P.ytBed],
  '90-minute-yin-yoga-class-full-body-deep-stretch-movie-night-yin-yoga': ['Ninety minutes you can put a film on for', 'Long holds. Nothing to concentrate on.'],
  '60-minute-yin-yoga-for-deep-relaxation-class-1-of-monthly-peaceful': ['An hour that asks nothing of you', P.ytFree],
  'melt-tension-fast-90-minute-deep-yin-yoga': ['Ninety minutes for a body that is done', P.ytLong],
  '60-min-yoga-for-spinal-health-full-yin-yoga-class-deep-back-stretches': ['An hour for the length of your spine', P.yt],
  'yoga-for-hips-lower-back-release-yin-yoga-for-lower-body-1-hour-yin': ['An hour on hips and the low back', 'The two that always go together.'],
  '70-min-reclined-yin-yoga-for-deep-stretches-relaxation-all-lying-down': ['Seventy minutes without getting up', 'Every shape is lying down. Really.'],
  '1-hour-yin-yoga-with-props-full-body-deep-stretch-release-yin-with': ['An hour where the props do the work', P.ytProps],
  '30-min-yin-yoga-for-sleep-full-body-evening-stretch-day-2-bedtime': ['Thirty minutes and then bed', P.ytBed],
  'yoga-for-digestion-90-minute-silent-yin-yoga-for-gut-health-and': ['Ninety silent minutes for the gut', 'Folds and twists that massage the belly.'],
  '60-min-yin-yoga-class-bedtime-full-body-stretch-silent-yin-for-sleep': ['An hour of quiet before sleep', 'Silent. Nothing to listen to, nothing to do.'],
  '1-hour-silent-yin-yoga-practice-deep-full-body-stretch-with-minimal': ['An hour, minimal cues, no props', P.ytFree],
  '30-minute-silent-yin-yoga-minimal-cues-yoga-for-a-full-body-stretch': ['Thirty silent minutes, head to toe', P.ytFree],
  '70-min-heart-opening-yoga-full-class-for-chest-shoulders-upper-back': ['Seventy minutes on the front of you', 'Chest, shoulders, upper back, neck.'],
  'yin-yoga-90-minutes-no-props-minimal-cues-yin-for-back-spine-silent': ['Ninety minutes for a spine that aches', 'No props, minimal cues, long holds.'],
  '60-min-yin-yoga-no-props-full-body-stretch-create-peaceful-moments': ['An hour, no props, nothing to buy', P.ytFree],
  '25-minute-yin-yoga-for-complete-beginners': ['Twenty-five minutes, never done yin', 'Every pose explained. Nothing assumed.'],
  '60-minute-yin-yoga-class-no-props-full-body-stretch-create-peaceful': ['An hour to put the week down', P.yt],
  '70-min-full-yin-class-yoga-for-digestion-detox-with-deep-stretches': ['Seventy minutes for a heavy middle', 'Folds and twists, held long and slow.'],
  'deep-stretch-yin-yoga-1-hour-silent-yin-full-body-flexibility-no': ['An hour of silence and long holds', P.ytFree],
  '30-min-yin-yoga-for-digestion-deep-stretches-to-strengthen-digestion': ['Thirty minutes when you feel heavy', 'Twists and folds that work the belly.'],
  '30-min-yin-yoga-for-thoracic-spine-shoulders-upper-back-long-holds': ['Thirty minutes on the upper back', 'The bit between the shoulder blades.'],
  'yin-yoga-class-digestion-better-digestion-yoga-for-liver-gall-bladder': ['Sixty-nine minutes for the gut', 'Liver and gall bladder lines, held long.'],
  '60-min-yin-yoga-no-props-full-body-stretch-create-peaceful-moments-ac7b78': ['Sixty minutes and a bare floor', P.ytFree],
  '60-minute-yin-yoga-class-full-body-stretch-relaxation-create-peaceful': ['An hour to soften everything', P.yt],
  '70-min-silent-yin-yoga-class-without-props-full-body-yin-yoga-minimal': ['Seventy silent minutes, no props', P.ytFree],
  '30-min-bedtime-yin-yoga-hips-legs-spine-stretch-challenge-day-4': ['Hips, legs and spine, then sleep', P.ytBed],
  'yin-yoga-bedtime-30-min-reclined-stretch-with-props-challenge-day-7': ['Thirty reclined minutes before bed', 'Props take the weight. You just lie there.'],
  '30-min-bedtime-yin-yoga-for-hips-shoulders-challenge-day-3': ['Hips and shoulders, then lights out', P.ytBed],
  '60-minute-beginner-yin-yoga-class-full-body-stretch-no-props-yin-yoga': ['A first full hour of yin', 'No props. Every pose talked through.'],
  '1-hour-silent-yin-yoga-full-body-stretch-with-minimal-cues-no-props': ['Sixty minutes, barely a word', P.ytFree],
  '60-min-yin-yoga-yin-yoga-full-body-stretch-create-peaceful-moments': ['An hour of long, quiet holds', P.yt],
  '90-minute-yin-yoga-class-minimum-cues-yin-yoga-full-body-stretch-with': ['Ninety minutes, minimum cues', P.ytLong],
  'yin-yoga-with-blocks-or-bolster-full-body-props-yin': ['Forty minutes propped up', 'Blocks or a bolster do most of the holding.'],
  'full-body-fascia-release-90-min-yin-yoga-deep-stretch': ['Ninety minutes into the fascia', 'The slow tissue only long holds reach.'],
  'yin-yoga-full-body-deep-stretch-no-props-5-min-holds-for-deep': ['Seventy minutes of five-minute holds', 'Long enough to reach past the muscle.'],
  '45-min-nervous-system-reset-yin-yoga-to-stretch-relax-katie-mcgrath': ['Forty-five minutes to reset', 'For the weeks that will not let go.'],
  '1-hour-yin-gentle-yin-yoga-class-total-body-stretch-w-5-min-holds': ['An hour of five-minute holds', P.yt],
  '30-min-bedtime-yin-yoga-full-body-stretch-challenge-day-5': ['Half an hour, then sleep', P.ytBed],
  '70-min-silent-yin-full-class-minimum-cues-to-enjoy-meditative-bliss': ['Seventy minutes of near silence', P.ytFree],
  '60-min-yin-yoga-no-props-full-body-stretch-create-peaceful-moments-11e440': ['Sixty minutes on the floor', P.ytFree],
  '60-min-legs-up-the-wall-yin-yoga-for-tired-legs-w-gentle-yoga-at-the': ['An hour with your legs up a wall', 'For legs that have had enough. No effort.'],
  '30-min-bedtime-yin-yoga-with-bolster-day-14-challenge': ['Thirty minutes over a bolster', 'The prop holds you. You let go.'],
  '35-min-yin-yoga-deep-stretch-for-glutes-hamstrings-lower-body-3-min': ['Thirty-five minutes on glutes and legs', 'Three-minute holds. Bend the knees.'],
  '70-min-hip-opening-yoga-full-class-of-yoga-for-tight-hips-yin-yoga': ['Seventy minutes on tight hips', 'The longest hip class on the channel.'],
  'yin-yoga-bedtime-30-minutes-with-props-full-body-deep-stretch-with': ['Thirty propped minutes before bed', P.ytProps],
  '75-minute-yin-yoga-class-for-full-body-stretch-relaxation-child-to': ['Seventy-five minutes, start to finish', P.ytLong],
  '1-hour-yin-yoga-class-minimal-cues-yin-yoga-back-spine-deep-back': ['An hour for the back and spine', P.ytFree],
  'silent-yin-yoga-class-no-extra-talking-minimal-cues-yoga-no-props': ['Forty minutes without the talking', P.ytFree],
  'yin-yoga-for-bedtime-deep-stretch-30-day-challenge-day-6': ['Twenty-five minutes before bed', P.ytBed],
  '60-min-yin-yoga-full-body-stretch-create-peaceful-moments-yoga': ['An hour to come back to yourself', P.yt],
  'total-body-deep-stretch-full-body-yoga-stretch-45-min-yin-yoga': ['Forty-five minutes, everything', P.yt],
  '70-min-yin-yoga-full-class-deep-stretches-long-holds-for-full-body': ['Seventy minutes of long holds', P.ytLong],
  'yin-yoga-1-hour-lower-body-focus-hips-spine-legs-deep-stretch-with': ['An hour below the waist', 'Hips, legs and the low back only.'],
  'yin-yoga-for-tight-hips-glutes-deep-stretch-yoga-stretches-for-hips': ['Twenty-five minutes on hips and glutes', P.yt],
  'yin-yoga-evening-30-min-hip-stretch-for-bedtime-challenge-day-8': ['Hips, and then sleep', P.ytBed],
  '10-min-guided-relaxation-in-corpse-savasana-after-yoga-30-day-bedtime': ['Ten minutes between you and sleep', 'Lie down. Nothing to hold, nothing to do.'],
  'yin-yoga-for-bedtime-shoulder-stretch-challenge-day-9': ['Shoulders down before you sleep', P.ytBed],
  'restful-relaxing-yin-yoga-with-bolster-blocks-40-min-yin-yoga-class': ['Forty minutes fully supported', 'Bolster and blocks. You barely move.'],
  '60-min-yin-yoga-no-props-full-body-stretch-create-peaceful-moments-4164be': ['Sixty minutes, nothing required', P.ytFree],
  '40-min-head-to-toe-deep-stretch-full-body-stretch-yin-yoga': ['Forty minutes, head to toe', P.yt],
  '25-min-bedtime-yin-yoga-for-sleep-no-props': ['Twenty-five minutes, no props, bed', P.ytBed],
  '50-minute-yin-yoga-class-we-can-do-hard-things-challenge-yourself': ['Fifty minutes, and it is not easy', 'Longer holds than usual. Stay anyway.'],
  'deep-stretch-full-body-yin-yoga-60-min-intermediate-yin-yoga-class': ['An hour once yin stops feeling new', 'Intermediate. Deeper shapes, longer holds.'],
  'yin-yoga-with-props-for-a-deep-back-stretch-yin-with-bolster-blocks': ['Forty propped minutes for the back', 'Bolster and blocks hold the shape for you.'],
  '30-minute-evening-yin-yoga-reclined-stretch-for-bedtime-challenge-day': ['Thirty reclined minutes at bedtime', P.ytBed],
  '35-min-leg-yin-yoga-deep-leg-stretch-poses-for-feet-ankles-calves': ['Thirty-five minutes below the knee', 'Feet, ankles and calves. Rarely stretched.'],
  'yin-yoga-for-peaceful-mind-inner-calm-no-props-full-body-stretch-yoga': ['Forty minutes for a loud head', P.ytFree],
  '35-min-yoga-for-cramps-lower-back-pain-yin-yoga-for-period-pain-pms': ['Thirty-five minutes for cramps', 'Gentle hips and low back. Nothing deep.'],
  '30-minute-leg-yin-yoga-silent-relaxing-deep-leg-stretch-minimal-cues': ['Thirty silent minutes on the legs', P.ytFree],
  'gentle-yin-yoga-30-min-back-stretch-for-bedtime-challenge-day-10': ['A back stretch before sleep', P.ytBed],
  '55-min-silent-yin-yoga-class-upper-body-minimum-cues-yin-yoga': ['Fifty-five minutes above the waist', 'Shoulders, chest, neck and spine.'],
  '30-min-silent-yin-yoga-with-bolster-fully-reclined-relaxation-minimal': ['Thirty minutes, reclined and silent', 'A bolster and no talking.'],
  '30-minute-yin-yoga-bedtime-deep-stretch-bedtime-yin-yoga-challenge': ['Thirty-nine minutes before bed', P.ytBed],
  'beginner-yin-yoga-back-stretch-no-props-35-min-yin': ['A back class if yin is new to you', 'Thirty-five minutes, no props, explained.'],
  '30-minute-inner-child-grounding-yin-yoga-bedtime-yoga-challenge-day-15': ['Thirty grounding minutes at night', P.ytBed],
  '30-minute-evening-yin-yoga-bedtime-stretch-for-legs-challenge-day-11': ['Legs, then bed', P.ytBed],
  '30-minute-evening-yin-yoga-twists-bends-for-bedtime-challenge-day-12': ['Twists and bends before sleep', P.ytBed],
  '25-min-lazy-yin-yoga-for-when-you-re-feeling-unmotivated-yoga-chill': ['For the days you cannot be bothered', 'Twenty-five minutes. Lazy on purpose.'],
  '30-min-yin-yoga-full-body-stretch-bedtime-yin-yoga-challenge-day-19': ['Everything, then sleep', P.ytBed],
  '35-min-beginner-yin-yoga-class-no-props': ['Thirty-five minutes, nothing needed', 'A first class. No props, no experience.'],
  'yin-yoga-for-upper-body-deep-stretch-for-shoulders-through-long-hold': ['Thirty-one minutes on the shoulders', 'Long holds where the tension sits.'],
  '30-min-nervous-system-reset-yin-yoga': ['Thirty minutes to take it down', 'For a system stuck in the on position.'],
  '30-min-evening-yin-yoga-stretch-full-body-relaxation-bedtime-yin-yoga': ['Half an hour before lights out', P.ytBed],
  '30-minute-full-body-yin-yoga-deep-stretch-no-props-yin-some': ['Thirty minutes on a bare floor', P.ytFree],
  'yin-yoga-to-go-inward-relax-30-min-bedtime-yin-yoga-challenge-day-23': ['Thirty minutes of going inward', P.ytBed],
  'yin-yoga-for-beginners-30-minutes-no-props': ['Thirty minutes, first time', 'No props. Every shape explained.'],
  '30-min-yin-yoga-neck-shoulders-upper-back-upper-body-yin-yoga-stretch': ['Neck, shoulders and upper back', 'Thirty minutes where the day collects.'],
  '20-min-morning-yin-yoga-stretch-without-props-calming-slow-morning': ['Twenty minutes before the day starts', 'Slow and calming. Not a wake-up workout.'],
  '30-min-bedtime-yin-yoga-for-sleep-no-props-bedtime-yin-yoga-challenge': ['Thirty minutes, no props, then bed', P.ytBed],
  '30-min-yin-yoga-for-quads-psoas-hip-flexors-lower-body-yoga-deep': ['Quads, psoas and hip flexors', 'The front of the hip, thirty minutes.'],
  '30-minute-bedtime-yin-yoga-for-sleep-bedtime-yin-yoga-challenge-day-29': ['Half an hour toward sleep', P.ytBed],
  '20-minute-yin-yoga-for-spine-hips-hamstrings': ['Twenty minutes, three tight places', 'Spine, hips and hamstrings.'],
  'evening-yin-yoga-for-sleep-full-body-stretch-bedtime-yin-yoga': ['Thirty-five minutes toward sleep', P.ytBed],
  'yin-yoga-backbends-relaxing-deep-back-stretch-bedtime-yin-yoga': ['Gentle backbends before bed', 'Thirty minutes. Nothing deep or sharp.'],
  '40-min-yin-yoga-class-lower-back-deep-stretch-yin-for-back-hamstring': ['Forty minutes on the lower back', 'And the hamstrings that pull on it.'],
  '30-min-neck-shoulder-stretch-bedtime-yin-yoga-challenge-day-20': ['Neck and shoulders, then sleep', P.ytBed],
  '30-minute-yin-yoga-back-shoulders-with-yoga-block-s-for-supported': ['Thirty minutes over a block', 'Back and shoulders, propped open.'],
  'relaxing-yin-yoga-stretch-bedtime-yin-yoga-challenge-day-27': ['Thirty-five slow minutes at night', P.ytBed],
  'grounding-evening-yin-yoga-30-minutes-bedtime-yin-yoga-challenge-day': ['Thirty grounding minutes', P.ytBed],
  'yin-yoga-bedtime-30-minutes-neck-shoulders-no-prop-deep-stretch-yoga': ['Neck and shoulders, no props, night', P.ytBed],
  '30-min-yin-yoga-for-flexibility-stretch-release-hips-hamstrings': ['Thirty minutes on hips and hamstrings', P.yt],
  '30-min-yin-yoga-for-upper-back-neck-relief-no-props': ['Thirty minutes for a stiff neck', 'Upper back and neck. No props.'],
  'yin-yoga-class-no-props-yin-yoga-full-body-deep-stretch-for-beginners': ['Forty-eight minutes, no experience', 'A full class, explained the whole way.'],
  'yin-yoga-class-lower-back-pain-beginner-yoga-yin-yoga-20-min-for': ['Twenty minutes for a sore low back', 'Gentle and beginner-friendly. Nothing deep.'],
  'yin-yoga-class-30-min-full-body-deep-stretch-with-minimum-cues-silent': ['Thirty minutes, minimum cues', P.ytFree],
  'yin-yoga-bedtime-30-minutes-hips-no-props-deep-stretch-yoga-before': ['Hips before bed, no props', P.ytBed],
  '30-minute-yin-yoga-bedtime-inversions-to-calm-the-mind-bedtime-yin': ['Legs up, mind down, then sleep', 'Twenty-six minutes of gentle inversions.'],
  '30-minute-evening-yin-yoga-stretch-bedtime-yin-yoga-challenge-day-26': ['Thirty-one minutes before sleep', P.ytBed],
  '30-minute-yin-lower-body-stretch-bedtime-yin-yoga-challenge-day-28': ['Lower body, then lights out', P.ytBed],
  'wall-yin-yoga-to-unwind-relax-bedtime-yin-yoga-challenge-day-24': ['Thirty minutes against a wall', 'The wall holds the shape. You unwind.'],
  '40-minute-yin-yoga-for-beginners': ['Forty minutes, and you are new', 'Every pose explained. Nothing assumed.'],
  '5-essential-yin-yoga-poses-for-relaxation-inner-calm': ['Five poses, forty-one minutes', 'If you only ever learn five, these.'],
  '20-min-yoga-for-feet-ankles-rejuvenate-tired-feet-and-tight-ankles': ['Twenty minutes for tired feet', 'The part of you that never gets stretched.'],
  '30-min-yoga-backbends-long-hold-yin-yoga-for-spinal-flexibility-open': ['Thirty minutes of long backbends', 'For a spine that only ever rounds forward.'],
  'deep-spinal-stretch-yoga-35-min-yin-yoga-for-back-spine-to-release': ['Thirty-five minutes on the spine', 'Length first, then release.'],
  '30-min-deep-stretch-yin-yoga-for-flexibility-hips-shoulders': ['Hips and shoulders, thirty minutes', 'The two places everything collects.'],
  '35-minute-yin-yoga-that-echoes-for-hours': ['The class you still feel at bedtime', 'Thirty-six minutes. It stays with you.'],
  '30-min-bedtime-yin-yoga-for-sleep-gentle-yoga-with-no-props': ['Thirty gentle minutes, no props', P.ytBed],
  'yoga-for-a-broken-heart-35-min-gentle-yoga-to-comfort-the-heart': ['For a week that hurt', 'Thirty-five gentle minutes. No pushing.'],
  '30-min-yin-yoga-deep-stretch-glutes-hamstrings-3-5-minute-hold-yoga': ['Glutes and hamstrings, held long', 'Twenty-eight minutes, three to five each.'],
  'grounding-yin-yoga-class-for-hips-lower-back-no-props-stretch-relax': ['Forty-five minutes, hips and low back', P.ytFree],
  '26-min-gentle-morning-yoga-easy-slow-calming-yin-yoga-morning-stretch': ['Twenty-six slow minutes to begin', 'Gentle. Nothing energetic about it.'],
  'yin-yoga-full-body-deep-stretch-30-min-for-beginners': ['Thirty minutes, everything, explained', 'A first full-body class. No props.'],
  '40-min-yin-yoga-front-body-openers-backbends-deep-stretch-back': ['Forty minutes on the front of you', 'Chest, shoulders, quads and belly.'],
  'yin-yoga-class-neck-shoulders-upper-back-deep-stretch-and-release-yin': ['Twenty-nine minutes, neck and up', 'Where a screen leaves everything tight.'],
  'yin-yoga-for-a-sore-back-yoga-stretches-to-release-back-tension-yoga': ['Thirty-nine minutes for a sore back', 'Slow and gentle. Ease off if it is sharp.'],
  'yin-yoga-for-neck-and-shoulders-25-min-yin-yoga-with-3-to-5-minute': ['Neck and shoulders, long holds', 'Twenty-nine minutes, three to five each.'],
  'yin-yoga-for-back-spine-deep-back-stretch-yin-to-release-sore-back': ['Forty minutes to release a back', 'Spine and hips, held long and slow.'],
  '25-min-yin-yoga-for-hips-lower-back-deep-stretch': ['Twenty-six minutes, hips and back', P.yt],
  'cat-inspired-yin-yoga-for-quiet-cats': ['Thirty-eight minutes, cat-inspired', 'Spine and shoulders, slow and curious.'],
  'yin-yoga-for-shoulders-and-upper-back-5-poses-for-flexible-shoulders': ['Five poses for stuck shoulders', 'Thirty-six minutes, upper back and chest.'],
  'yoga-for-your-back-beginner-friendly-35-min-yin-yoga-for-back': ['A back class for total beginners', 'Thirty-seven minutes, nothing assumed.'],
  '40-min-lazy-yin-yoga-to-unwind-relax-yoga-chill-for-when-you-re': ['Forty lazy minutes, on purpose', 'For when you cannot face a real class.'],
  'hip-flexibility-yin-5-poses-for-internal-external-rotation-adductors': ['Five poses for hips that will not open', 'Both rotations and the adductors.'],
  'yin-yoga-class-full-body-deep-stretch-to-connect-to-the-breath': ['Fifty-three minutes with the breath', P.yt],
  'yin-yoga-for-good-posture-increased-flexibility-25-min': ['Twenty-six minutes on your posture', 'Chest, shoulders and upper back.'],
  '25-min-yin-yoga-for-glutes-long-holds-for-deep-stretches': ['Twenty-six minutes on the glutes', 'Long holds. The muscle sitting shortens.'],
  'deep-hip-stretch-yoga-25-min-yin-yoga-to-open-tight-hips-increase-hip': ['Twenty-six minutes on tight hips', P.yt],
  '20-min-morning-yin-yoga-class-full-body-stretch-no-props-yin-yoga': ['Twenty-three minutes to start', 'Full body, no props, before the day.'],
  'yin-yoga-bedtime-30-minutes-no-props-gentle-yin-yoga': ['A gentle back class before bed', 'Thirty-two minutes, no props.'],
  '33-min-yoga-for-sleep-gentle-yin-yoga-for-bedtime-stretch-or-evening': ['Thirty-four minutes toward sleep', 'Hips, glutes and the low back.'],
  'after-running-yoga-10-min-post-run-stretches': ['Press play the night after a run', 'Eleven minutes, follow along, then sleep.'],
  'deep-stretch-yoga-for-runners-30-min-recovery-day': ['Twenty-nine minutes on a rest day', 'Hips, hamstrings and quads. For runners.'],
  'pre-run-yoga-10-min-warm-up-before-running': ['Eleven minutes before you head out', 'A warm-up, not a stretch. For runners.'],
  'runners-yoga-to-boost-recovery-35-min-rest-day-yin': ['Thirty-five minutes on a rest day', 'The recovery most runners skip.'],
};

/* ── Build ─────────────────────────────────────────────────────────────────── */
const fm = (path) => parse(readFileSync(path, 'utf8').split(/^---$/m)[1] ?? '') ?? {};

const out = { routines: {}, videos: {} };
const problems = [];
const check = (where, a) => {
  for (const [field, value] of Object.entries(a)) {
    if (value.length > LIMITS[field]) {
      problems.push(`${where}: ${field} ${value.length}/${LIMITS[field]} — "${value}"`);
    }
  }
};

for (const [slug, angles] of Object.entries(ROUTINES)) {
  out.routines[slug] = {
    pin_angles: angles.map(([audience, headline, proof]) => {
      const a = { audience, headline, proof };
      check(`routine ${slug}`, a);
      return a;
    }),
  };
}

let missing = 0;
for (const file of readdirSync('src/content/videos')) {
  const data = fm(`src/content/videos/${file}`);
  if (!data.enriched || data.membership) continue;
  const written = HEADLINES[data.slug];
  if (!written) {
    problems.push(`video ${data.slug}: no headline written`);
    missing++;
    continue;
  }
  const a = {
    audience: audienceFor(data.intent_tags ?? []),
    headline: written[0],
    proof: written[1],
  };
  check(`video ${data.slug}`, a);
  out.videos[data.slug] = { pin_angles: [a] };
}

const header = `# Pin angles — routines and videos, first draft
# =============================================
# Generated by scripts/gen-pin-angles-videos.mjs. Edit the copy there, not here.
#
# ROUTINES — 11 public ones, two angles each on two different boards. The
# course-only routines are deliberately absent: they are filtered off the public
# site, so a pin would land on nothing.
#
# VIDEOS — 149 enriched, public classes, one angle each. The audience tag is
# derived from intent_tags (every enriched video has them), so only the headline
# and proof were written. Priority order is in the script: a bedtime shoulder
# class goes to Sleep, not Desk Workers, because "can't sleep" is the stronger
# reason to click.
#
# WHERE TO SPEND YOUR EDITING TIME
# The library has a long tail of near-identical full-body and silent classes.
# Their headlines are varied mainly by duration, because duration is honestly
# what distinguishes them. They are the weakest copy here and the first worth
# rewriting — or the first worth not pinning.
`;
writeFileSync('design/pin-angles-routines-videos.yaml', `${header}\n${stringify(out)}`);

console.log(`routines: ${Object.keys(out.routines).length} × 2 angles`);
console.log(`videos:   ${Object.keys(out.videos).length} × 1 angle${missing ? ` (${missing} missing)` : ''}`);
const boards = {};
for (const group of Object.values(out)) {
  for (const { pin_angles } of Object.values(group)) {
    for (const a of pin_angles) boards[a.audience] = (boards[a.audience] ?? 0) + 1;
  }
}
console.log('\naudience spread:');
for (const [k, v] of Object.entries(boards).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(3)}  ${k}`);
}
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\nAll angles within limits.');
