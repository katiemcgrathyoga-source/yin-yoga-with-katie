/**
 * Renders every Plate template at its worst realistic copy length.
 *
 *   node scripts/check-plate-fit.mjs
 *
 * Satori cannot shrink type to fit and it will not tell you when a block runs
 * off the canvas — it simply draws past the edge. So the guard is visual: this
 * writes one PNG per template using copy at the schema's limits (40-char
 * headline, 54-char proof) plus the longest real titles in the collections,
 * which is the case that actually breaks.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { renderPlatePin } from '../netlify/functions/lib/pinplate.mjs';

const photo = (slug) => {
  const chain = [`public/poses/pin/${slug}.jpg`, `public/poses/${slug}.jpg`];
  const found = chain.find(existsSync);
  if (!found) throw new Error(`no photo for ${slug}`);
  return `data:image/jpeg;base64,${readFileSync(found).toString('base64')}`;
};

const H40 = 'The hip that quietly ruins your week';   // 36 — near the 40 limit
const P54 = 'Three minutes a side, and gravity does all of it.'; // 48
const LONG_TITLE = 'Yoga for Desk Workers: The Best Yin Poses for Neck, Shoulders & Posture';

const panelH = (headline, blurb) => {
  const t = Math.max(1, Math.ceil(headline.length / 26));
  const b = blurb ? Math.max(1, Math.ceil(blurb.length / 42)) : 0;
  return Math.round(Math.min(780, Math.max(520, 1500 - (319 + t * 82 + b * 45))));
};

const CASES = [
  ['plate-worst', { tpl: 'plate', tone: 'light', eyebrow: 'for tight hips', headline: H40, photo: photo('dragon'), focal: '50% 52%', footnote: 'Twisted Dragon · 3–5 minutes per side' }],
  ['frame-worst', { tpl: 'frame', tone: 'dark', eyebrow: 'if you sit all day', headline: 'Shoulders, Neck & Desk Relief', metaLine: '22 minutes · all levels', blurb: P54, photo: photo('melting-heart'), focal: '50% 50%' }],
  ['panel-longtitle', { tpl: 'panel', tone: 'dark', eyebrow: 'from the journal', headline: LONG_TITLE, blurb: P54, photo: photo('supported-fish'), focal: '50% 50%', photoH: panelH(LONG_TITLE, P54) }],
  ['panel-short', { tpl: 'panel', tone: 'light', eyebrow: 'for runners', headline: H40, blurb: P54, photo: photo('shoelace'), focal: '50% 50%', photoH: panelH(H40, P54) }],
  ['immersive-fill', { tpl: 'immersive', tone: 'dark', eyebrow: 'for tight hips', headline: H40, blurb: P54, photo: photo('squat'), focal: '50% 50%', footnote: 'Squat · 2–4 minutes' }],
  ['immersive-fit', { tpl: 'immersive', tone: 'light', eyebrow: 'for runners', headline: H40, blurb: P54, photo: photo('sleeping-swan'), focal: '50% 50%', fit: true, footnote: 'Sleeping Swan · 3–5 minutes per side' }],
  ['watch-worst', { tpl: 'watch', tone: 'dark', eyebrow: 'for restless nights', headline: H40, blurb: P54, photo: photo('childs-pose'), focal: '50% 50%', duration: '60 min', footnote: 'free on YouTube' }],
  ['offer-worst', { tpl: 'offer', tone: 'light', eyebrow: 'for runners', headline: 'The fifteen minutes after your run', blurb: 'One easy hold for each place a run tightens.', photo: photo('sleeping-swan'), focal: '50% 52%', offer: 'Free · 15 minutes · straight to your inbox', cta: 'Send it to me' }],
];

mkdirSync('design/pin-preview', { recursive: true });
for (const [name, props] of CASES) {
  writeFileSync(`design/pin-preview/fit-${name}.png`, await renderPlatePin(props));
  console.log(`  ${name}`);
}
console.log(`${CASES.length} rendered into design/pin-preview/`);
