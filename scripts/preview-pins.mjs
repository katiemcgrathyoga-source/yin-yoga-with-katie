/**
 * Renders one sample of every benefit-led template, straight from the real
 * renderer, so a template change can be eyeballed without deploying.
 *
 *   node scripts/preview-pins.mjs [outDir]
 *
 * Photos are read off disk rather than fetched, so this works offline.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { renderPin } from '../netlify/functions/lib/pin.mjs';

const OUT = process.argv[2] ?? 'design/pin-preview';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Same fallback chain the renderer uses: sharpest source first.
const photo = (slug, portrait = false) => {
  const chain = [
    ...(portrait ? [`public/poses/pin/tall/${slug}.jpg`] : []),
    `public/poses/pin/${slug}.jpg`,
    `public/poses/${slug}.jpg`,
  ];
  const path = chain.find(existsSync);
  return `data:image/jpeg;base64,${readFileSync(path).toString('base64')}`;
};

const SAMPLES = [
  // Only four poses are narrow enough for a full-bleed 2:3 crop; Squat is one.
  ['hook', {
    tpl: 'hook', tone: 'light', eyebrow: 'for tight hips',
    title: 'The position we stopped using',
    subline: 'Sink low for two minutes. Heels on a blanket.',
    identifier: 'Squat · a yin yoga pose', img: photo('squat', true), focal: '50% 50%',
  }],
  ['card', {
    tpl: 'card', tone: 'dark', eyebrow: 'if you sit all day',
    title: 'Eight hours sitting. Three minutes back.',
    subline: 'One pose, both sides, on the floor beside your desk.',
    identifier: 'yin for desk workers',
  }],
  ['poselist', {
    tpl: 'poselist', tone: 'light', eyebrow: 'if you sit all day',
    title: "Five poses for shoulders that won't drop",
    subline: 'Nineteen minutes, and nothing to buy.',
    identifier: 'a 19-minute routine',
    items: [
      { name: 'Melting Heart', note: 'chest melting, hips high', hold: '3 min', thumb: photo('melting-heart'), focal: '50% 45%' },
      { name: 'Thread the Needle', note: 'never crank the neck', hold: '2 min each side', thumb: photo('thread-the-needle'), focal: '50% 45%' },
      { name: 'Bow Tie', note: 'let the weight open it', hold: '3 min', thumb: photo('bow-tie'), focal: '50% 45%' },
      { name: 'Eagle Arms', note: 'lift the elbows', hold: '1 min each side', thumb: photo('eagle'), focal: '50% 45%' },
      { name: 'Reclined Twist', note: 'soften and be still', hold: '2 min each side', thumb: photo('reclined-twist'), focal: '50% 45%' },
    ],
  }],
  ['poselist-dense', {
    tpl: 'poselist', tone: 'dark', eyebrow: 'for runners',
    title: 'Legs that move again, in eight poses',
    subline: 'Twenty-six minutes, the evening after a run.',
    identifier: 'a 26-minute routine',
    items: [
      { name: 'Dangling', hold: '2 min' }, { name: 'Toe Squat', hold: '1 min' },
      { name: 'Ankle Stretch', hold: '1 min' }, { name: 'Half Butterfly', hold: '3 min each side' },
      { name: 'Caterpillar', hold: '3 min' }, { name: 'Dragonfly', hold: '4 min' },
      { name: 'Squat', hold: '2 min' }, { name: 'Corpse', hold: '3 min' },
    ],
  }],
  ['split', {
    tpl: 'split', tone: 'light', eyebrow: 'if you sit all day',
    title: 'Breathe properly again in two minutes',
    subline: 'The chest a desk chair closes a little more each hour.',
    poseName: 'Camel', identifier: 'a yin yoga pose · hold 2 min',
    img: photo('camel', true), focal: '50% 50%',
  }],
  ['offer', {
    tpl: 'offer', tone: 'light', eyebrow: 'for runners',
    title: 'The fifteen minutes after your run',
    subline: 'One easy hold for each place a run tightens.',
    offer: 'Free · 15 minutes · straight to your inbox', cta: 'Send it to me',
    identifier: 'yinyogawithkatie.com/runners',
    img: photo('caterpillar'), focal: '50% 48%',
  }],
  ['states', {
    tpl: 'states', tone: 'light', eyebrow: 'if you sit all day',
    before: 'Hips stuck at 3pm', after: 'Hips open by 7',
    subline: 'Nineteen minutes on the floor when the working day ends.',
    identifier: 'a 19-minute routine', img: photo('butterfly'), focal: '50% 52%',
  }],
  ['video', {
    tpl: 'video', tone: 'light', eyebrow: 'for restless nights',
    title: 'Ten minutes between you and sleep',
    subline: 'Follow along on YouTube. Nothing to set up, nothing to buy.',
    identifier: 'free on YouTube · 10 min', duration: '10 min',
    img: photo('childs-pose'), focal: '50% 48%',
  }],
  ['window', {
    tpl: 'window', tone: 'light', eyebrow: 'for runners',
    title: 'The hip you notice at mile four',
    subline: 'Three minutes a side. Gravity does it, not you.',
    identifier: 'Sleeping Swan · a yin yoga pose',
    img: photo('sleeping-swan'), focal: '50% 52%',
  }],
  ['window-dark', {
    tpl: 'window', tone: 'dark', eyebrow: 'for tired legs',
    title: 'The recovery pose that asks nothing',
    subline: 'Five minutes up a wall. No flexibility, no effort, no props.',
    identifier: 'Legs Up the Wall · a yin pose',
    img: photo('legs-up-the-wall'), focal: '50% 52%',
  }],
];

for (const [name, params] of SAMPLES) {
  const png = await renderPin(params);
  writeFileSync(`${OUT}/${name}.png`, png);
  console.log(`  ${name.padEnd(16)} ${(png.length / 1024).toFixed(0).padStart(4)} KB`);
}
console.log(`\n${SAMPLES.length} pins written to ${OUT}/`);
