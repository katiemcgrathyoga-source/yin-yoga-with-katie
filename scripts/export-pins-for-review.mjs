/**
 * Renders all eight templates in both colourways and writes upload-sized JPEGs.
 *
 *   node scripts/export-pins-for-review.mjs
 *
 * For handing the current state to a designer: real renderer, real photos, real
 * copy, downscaled so sixteen of them can be attached to a chat.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { renderPin } from '../netlify/functions/lib/pin.mjs';

const OUT = 'design/pin-review';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const photo = (slug, portrait = false) => {
  const chain = [
    ...(portrait ? [`public/poses/pin/tall/${slug}.jpg`] : []),
    `public/poses/pin/${slug}.jpg`,
    `public/poses/${slug}.jpg`,
  ];
  return `data:image/jpeg;base64,${readFileSync(chain.find(existsSync)).toString('base64')}`;
};

const SHOULDERS = [
  ['Melting Heart', 'chest melting, hips high', '3 min', 'melting-heart'],
  ['Thread the Needle', 'never crank the neck', '2 min each side', 'thread-the-needle'],
  ['Bow Tie', 'let the weight open it', '3 min', 'bow-tie'],
  ['Eagle Arms', 'lift the elbows', '1 min each side', 'eagle'],
  ['Reclined Twist', 'soften and be still', '2 min each side', 'reclined-twist'],
].map(([name, note, hold, slug]) => ({ name, note, hold, thumb: photo(slug), focal: '50% 45%' }));

const LEGS = [
  ['Dangling', '2 min', 'dangling'], ['Toe Squat', '1 min', 'toe-squat'],
  ['Ankle Stretch', '1 min', 'ankle-stretch'], ['Half Butterfly', '3 min each side', 'half-butterfly'],
  ['Caterpillar', '3 min', 'caterpillar'], ['Dragonfly', '4 min', 'dragonfly'],
  ['Squat', '2 min', 'squat'], ['Corpse', '3 min', 'corpse'],
].map(([name, hold, slug]) => ({ name, hold, thumb: photo(slug), focal: '50% 45%' }));

/** One representative set of copy per template; only `tone` changes per pair. */
const TEMPLATES = [
  ['01-hook', { tpl: 'hook', eyebrow: 'for tight hips', title: 'The position we stopped using',
    subline: 'Sink low for two minutes. Heels on a blanket.',
    identifier: 'Squat · a yin yoga pose', img: photo('squat', true), focal: '50% 50%' }],
  ['02-card', { tpl: 'card', eyebrow: 'if you sit all day', title: 'Eight hours sitting. Three minutes back.',
    subline: 'One pose, both sides, on the floor beside your desk.', identifier: 'yin for desk workers' }],
  ['03-poselist', { tpl: 'poselist', eyebrow: 'if you sit all day', title: "Five poses for shoulders that won't drop",
    subline: 'Nineteen minutes, and nothing to buy.', identifier: 'a 19-minute routine', items: SHOULDERS }],
  ['04-poselist-dense', { tpl: 'poselist', eyebrow: 'for runners', title: 'Legs that move again, in eight poses',
    subline: 'Twenty-six minutes, the evening after a run.', identifier: 'a 26-minute routine', items: LEGS }],
  // Camel is no longer eligible: the second pass narrowed the arch to 0.808 and
  // she spans 73% of her crop. Seal is one of the nine that still fit.
  ['05-split', { tpl: 'split', eyebrow: 'for a stiff back', title: 'The backbend a desk day earns you',
    subline: 'Arms straight, three minutes. Ease off if pinchy.',
    poseName: 'Seal', identifier: 'a yin yoga pose · hold 3 min', img: photo('seal', true), focal: '50% 50%' }],
  ['06-offer', { tpl: 'offer', eyebrow: 'for runners', title: 'The fifteen minutes after your run',
    subline: 'One easy hold for each place a run tightens.',
    offer: 'Free · 15 minutes · straight to your inbox', cta: 'Send it to me',
    identifier: 'yinyogawithkatie.com/runners', img: photo('caterpillar'), focal: '50% 48%' }],
  ['07-states', { tpl: 'states', eyebrow: 'if you sit all day', before: 'Hips stuck at 3pm', after: 'Hips open by 7',
    subline: 'Nineteen minutes on the floor when the working day ends.',
    identifier: 'a 19-minute routine', img: photo('butterfly'), focal: '50% 52%' }],
  ['08-video', { tpl: 'video', eyebrow: 'for restless nights', title: 'Ten minutes between you and sleep',
    subline: 'Follow along on YouTube. Nothing to set up, nothing to buy.',
    identifier: 'free on YouTube · 10 min', duration: '10 min', img: photo('childs-pose'), focal: '50% 48%' }],
  ['09-window', { tpl: 'window', eyebrow: 'for runners', title: 'The hip you notice at mile four',
    subline: 'Three minutes a side. Gravity does it, not you.',
    identifier: 'Sleeping Swan · a yin yoga pose', img: photo('sleeping-swan'), focal: '50% 52%' }],
];

for (const [name, params] of TEMPLATES) {
  for (const tone of ['light', 'dark']) {
    const png = await renderPin({ ...params, tone });
    const jpg = await sharp(png).resize({ width: 800 }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    writeFileSync(`${OUT}/${name}-${tone}.jpg`, jpg);
    console.log(`  ${name}-${tone}`.padEnd(28), `${(jpg.length / 1024).toFixed(0)} KB`);
  }
}
console.log(`\n${TEMPLATES.length * 2} pins written to ${OUT}/`);
