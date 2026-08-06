/**
 * Renders the Plate set and builds the review artifact.
 *
 *   node scripts/artifact-plate.mjs
 *
 * Real renderer, real photographs, real copy from the collections.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { renderPlatePin } from '../netlify/functions/lib/pinplate.mjs';

const photo = (slug) => {
  const chain = [`public/poses/pin/${slug}.jpg`, `public/poses/${slug}.jpg`];
  return `data:image/jpeg;base64,${readFileSync(chain.find(existsSync)).toString('base64')}`;
};
const uri = async (png, width, q = 80) =>
  `data:image/jpeg;base64,${(await sharp(png).resize({ width }).jpeg({ quality: q, mozjpeg: true }).toBuffer()).toString('base64')}`;

/* Each entry: the pin type it serves, and one real example per colourway. */
const SET = [
  {
    name: '01 · Plate',
    serves: 'Poses · Practices',
    note: 'The pin already earning traction. Title above, photograph in a full-width band, air below. The band is landscape, so every photo in the library fits it — a wide lying pose and an upright one sit in the same frame without either being cropped.',
    light: { tpl: 'plate', eyebrow: 'a yin yoga pose', headline: 'Broken Wing', photo: photo('broken-wing'), focal: '50% 50%', footnote: 'Two to four minutes each side' },
    dark: { tpl: 'plate', eyebrow: 'a yin yoga pose', headline: 'Camel', photo: photo('camel'), focal: '50% 46%', footnote: 'Thirty seconds to two minutes' },
  },
  {
    name: '02 · Frame',
    serves: 'Routines · Practices',
    note: 'The "Deep Hips" pin. A bordered card, everything centred, the photograph inset and rounded. Carries the most information of the set — length, level, and a sentence — without crowding.',
    light: { tpl: 'frame', eyebrow: 'routines', headline: 'Deep Hips & Lower Body', metaLine: '37 minutes · intermediate', blurb: 'Inner thighs, outer hips, hip flexors and hamstrings, opened slowly with a built-in hold timer.', photo: photo('dragonfly'), focal: '50% 50%' },
    dark: { tpl: 'frame', eyebrow: "the runner's reset", headline: 'Calves, Ankles & Feet', metaLine: '14 minutes · all levels', blurb: 'It all starts at your feet — stiff ankles change everything above them.', photo: photo('toe-squat'), focal: '50% 48%' },
  },
  {
    name: '03 · Panel',
    serves: 'Journal · Classes · Routines',
    note: 'Photograph on top, a coloured panel beneath carrying the whole message. The strongest of the three for anything with a sentence to say, and the only one that puts the sage ground to work.',
    light: { tpl: 'panel', eyebrow: 'start tonight', headline: 'Yin Yoga for Beginners: How to Start Tonight', blurb: 'What it is, what you need, and the three cues that make it work.', photo: photo('butterfly'), focal: '50% 46%', photoH: 760 },
    dark: { tpl: 'panel', eyebrow: 'from the journal', headline: 'Yin Yoga for Sleep: A Gentle Practice for Deeper Rest', blurb: 'Why the long, slow holds calm a racing mind, and the best poses to do before bed.', photo: photo('corpse'), focal: '50% 50%', photoH: 660 },
  },
  {
    name: '04 · Immersive',
    serves: 'Poses · Journal',
    note: 'Type over a full-bleed photograph. The one shape a wide pose cannot fill — so a wide pose letterboxes into the ground instead of being excluded. Left is filled (Squat), right is fitted (Sleeping Swan, 93% of her frame). Same veil, same type, no pose turned away.',
    light: { tpl: 'immersive', eyebrow: 'for tight hips', headline: 'The position we stopped using', blurb: 'Sink low for two minutes. Heels on a blanket.', photo: photo('squat'), focal: '50% 46%', footnote: 'Squat · a yin yoga pose' },
    dark: { tpl: 'immersive', eyebrow: 'for runners', headline: 'The hip you notice at mile four', blurb: 'Three minutes a side. Gravity does it, not you.', photo: photo('sleeping-swan'), focal: '50% 50%', fit: true, footnote: 'Sleeping Swan · a yin yoga pose' },
  },
  {
    name: '05 · Watch',
    serves: 'YouTube classes',
    note: 'A run-time badge with a play mark, the audience on a tab entering from the left edge, and the message on solid ground beneath. The only pin whose job is a click rather than a save.',
    light: { tpl: 'watch', eyebrow: 'for restless nights', headline: 'Ten quiet minutes before bed', blurb: 'Follow along on YouTube. Nothing to set up, nothing to buy.', photo: photo('childs-pose'), focal: '50% 46%', duration: '10 min', footnote: 'free on YouTube' },
    dark: { tpl: 'watch', eyebrow: 'for runners', headline: 'For legs that just ran too far', blurb: 'Follow along the evening after your run.', photo: photo('caterpillar'), focal: '50% 50%', duration: '11 min', footnote: 'free on YouTube' },
  },
  {
    name: '06 · Offer',
    serves: 'Lead magnets · Sales pages',
    note: 'Built in the Frame language rather than as a new shape, so the one pin that asks for something still looks like the rest. The photograph fades into the ground and the signature is what marks it as personal.',
    light: { tpl: 'offer', eyebrow: 'free · for runners', headline: 'The fifteen minutes after your run', blurb: 'One easy hold for each place a run tightens — hips, glutes, hamstrings, spine.', photo: photo('sleeping-swan'), focal: '50% 48%', offer: 'Free · 15 minutes · straight to your inbox', cta: 'Send it to me' },
    dark: { tpl: 'offer', eyebrow: "the runner's reset", headline: 'The recovery most runners skip', blurb: 'Eight sessions for the places running tightens, yours to keep.', photo: photo('dragon'), focal: '50% 46%', offer: 'A complete yin library for runners', cta: 'See what’s inside' },
  },
];

/* Proof that one template takes every shape of photograph in the library. */
const SHAPES = [
  ['Sleeping Swan', 'sleeping-swan', 'widest in the library, 93% of frame'],
  ['Bow Tie', 'bow-tie', 'full frame, 100%'],
  ['Camel', 'camel', 'upright, 62%'],
  ['Legs Up the Wall', 'legs-up-the-wall', 'narrow, 34%'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const blocks = [];
const feed = [];
for (const t of SET) {
  const shots = {};
  for (const tone of ['light', 'dark']) {
    const png = await renderPlatePin({ ...t[tone], tone });
    shots[tone] = await uri(png, 430);
    if (tone === 'light') feed.push({ name: t.name, img: await uri(png, 236, 72) });
    process.stdout.write('.');
  }
  blocks.push({ ...t, shots });
}

const shapes = [];
for (const [name, slug, note] of SHAPES) {
  const png = await renderPlatePin({ tpl: 'plate', tone: 'light', eyebrow: 'a yin yoga pose', headline: name, photo: photo(slug), focal: '50% 50%' });
  shapes.push({ name, note, img: await uri(png, 260) });
  process.stdout.write('.');
}
console.log('\nrendered');

writeFileSync('design/pin-plate-review.html', `<title>Pin templates — the Plate set</title>
<style>
:root{--paper:#F4EDE4;--panel:#FBF6EE;--ink:#2E342F;--muted:#636A63;--faint:#8B8C81;--line:#DFD3C3;--accent:#89494B}
@media(prefers-color-scheme:dark){:root{--paper:#1B211C;--panel:#242B25;--ink:#EFEAE0;--muted:#A6AEA3;--faint:#828A80;--line:#333B34;--accent:#C7A5A2}}
:root[data-theme="dark"]{--paper:#1B211C;--panel:#242B25;--ink:#EFEAE0;--muted:#A6AEA3;--faint:#828A80;--line:#333B34;--accent:#C7A5A2}
:root[data-theme="light"]{--paper:#F4EDE4;--panel:#FBF6EE;--ink:#2E342F;--muted:#636A63;--faint:#8B8C81;--line:#DFD3C3;--accent:#89494B}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.62 ui-sans-serif,system-ui,sans-serif}
.wrap{max-width:64rem;margin:0 auto;padding:2.5rem 1.25rem 5rem}
h1{font-size:clamp(2rem,5vw,2.9rem);line-height:1.08;margin:.4rem 0 .7rem;letter-spacing:-.015em}
h2{font-size:1.4rem;margin:0}
.eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin:0}
.lede{color:var(--muted);max-width:60ch;margin:0 0 1.4rem}
.call{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:4px;padding:1rem 1.2rem;font-size:.9rem;color:var(--muted);margin:0 0 2.6rem}
.call b{color:var(--ink)}
.t{margin:0 0 2.8rem;padding-bottom:2rem;border-bottom:1px solid var(--line)}
.head{display:flex;flex-wrap:wrap;align-items:baseline;gap:.7rem;margin-bottom:.4rem}
.serves{font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--paper);background:var(--accent);padding:.24rem .6rem;border-radius:999px}
.note{font-size:.9rem;color:var(--muted);margin:0 0 1.1rem;max-width:68ch}
.pair{display:flex;gap:1.4rem;flex-wrap:wrap}
.shot{flex:1 1 300px;min-width:250px}
.shot img{width:100%;border-radius:4px;display:block;box-shadow:0 1px 2px rgba(0,0,0,.08),0 12px 30px -14px rgba(0,0,0,.35)}
.shot span{display:block;font-size:.68rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);margin-top:.5rem}
.row{display:flex;flex-wrap:wrap;gap:1rem;background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:1.2rem}
.row figure{margin:0;width:180px}
.row img{width:100%;border-radius:4px;display:block}
.row figcaption{font-size:.7rem;color:var(--faint);margin-top:.4rem;line-height:1.4}
.row figcaption b{display:block;color:var(--muted);font-size:.74rem}
.feed figure{width:150px}
.feed img{border-radius:8px}
</style>
<div class="wrap">
  <p class="eyebrow">Pin templates · the Plate set</p>
  <h1>Six templates, drawn from the pins you picked</h1>
  <p class="lede">Every image is a real render — same photographs, same fonts, copy
  pulled from the actual pose, routine, practice, class and journal entries.</p>

  <p class="call"><b>Every pin type can use every photograph.</b> That was the
  requirement, and it is what shaped the set. Five of the six put the photograph
  in a landscape band, which every photo in a 3:2 library fits by definition —
  so there are no eligibility lists and no pose is ever turned away. The sixth,
  Immersive, letterboxes a too-wide pose into the ground rather than cropping
  her. Proof of that is the last section.</p>

  ${blocks.map((b) => `
  <div class="t">
    <div class="head"><h2>${esc(b.name)}</h2><span class="serves">${esc(b.serves)}</span></div>
    <p class="note">${esc(b.note)}</p>
    <div class="pair">
      <div class="shot"><img src="${b.shots.light}" alt=""><span>Light</span></div>
      <div class="shot"><img src="${b.shots.dark}" alt=""><span>Dark</span></div>
    </div>
  </div>`).join('')}

  <div class="t">
    <h2>Every shape of photograph, same template</h2>
    <p class="note">The Plate, unchanged, with the four most awkward frames in the
    library. Nothing is cropped, nothing is excluded, and no per-pose decision was
    made — the band simply takes what it is given.</p>
    <div class="row">
      ${shapes.map((s) => `<figure><img src="${s.img}" alt=""><figcaption><b>${esc(s.name)}</b>${esc(s.note)}</figcaption></figure>`).join('')}
    </div>
  </div>

  <div class="t" style="border-bottom:0">
    <h2>At 236px — feed size</h2>
    <p class="note">The only view that decides whether someone stops scrolling.</p>
    <div class="row feed">
      ${feed.map((f) => `<figure><img src="${f.img}" alt=""><figcaption><b>${esc(f.name)}</b></figcaption></figure>`).join('')}
    </div>
  </div>
</div>
`);
console.log('design/pin-plate-review.html written');
