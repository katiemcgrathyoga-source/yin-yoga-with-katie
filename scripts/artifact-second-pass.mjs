/**
 * Builds the second-pass review artifact.
 *
 *   node scripts/artifact-second-pass.mjs
 *
 * Renders every template in both colourways plus both Benefit card directions,
 * straight from the production renderer, and inlines them.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { renderPin } from '../netlify/functions/lib/pin.mjs';

const photo = (slug, portrait = false) => {
  const chain = [
    ...(portrait ? [`public/poses/pin/tall/${slug}.jpg`] : []),
    `public/poses/pin/${slug}.jpg`,
    `public/poses/${slug}.jpg`,
  ];
  return `data:image/jpeg;base64,${readFileSync(chain.find(existsSync)).toString('base64')}`;
};
const uri = async (png, width, q = 80) =>
  `data:image/jpeg;base64,${(await sharp(png).resize({ width }).jpeg({ quality: q, mozjpeg: true }).toBuffer()).toString('base64')}`;

const SHOULDERS = [
  ['Melting Heart', 'chest melting, hips high', '3 min', 'melting-heart'],
  ['Thread the Needle', 'never crank the neck', '2 min each side', 'thread-the-needle'],
  ['Bow Tie', 'let the weight open it', '3 min', 'bow-tie'],
  ['Eagle Arms', 'lift the elbows', '1 min each side', 'eagle'],
  ['Reclined Twist', 'soften and be still', '2 min each side', 'reclined-twist'],
].map(([name, note, hold, slug]) => ({ name, note, hold, thumb: photo(slug), focal: '50% 42%' }));
const LEGS = [
  ['Dangling', '2 min', 'dangling'], ['Toe Squat', '1 min', 'toe-squat'],
  ['Ankle Stretch', '1 min', 'ankle-stretch'], ['Half Butterfly', '3 min each side', 'half-butterfly'],
  ['Caterpillar', '3 min', 'caterpillar'], ['Dragonfly', '4 min', 'dragonfly'],
  ['Squat', '2 min', 'squat'], ['Corpse', '3 min', 'corpse'],
].map(([name, hold, slug]) => ({ name, hold, thumb: photo(slug), focal: '50% 42%' }));

const CARD_COPY = {
  tpl: 'card', eyebrow: 'if you sit all day', title: 'Eight hours sitting. Three minutes back.',
  subline: 'One pose, both sides, on the floor beside your desk.', identifier: 'yin for desk workers',
};

const SET = [
  ['Benefit hook', 'Full-bleed. Contrast comes from a shadow on the type and a radial pocket under the words, not opacity on the veil — so the bottom of the photograph survives.', {
    tpl: 'hook', eyebrow: 'for tight hips', title: 'The position we stopped using',
    subline: 'Sink low for two minutes. Heels on a blanket.',
    identifier: 'Squat · a yin yoga pose', img: photo('squat', true), focal: '50% 50%' }],
  ['Problem → poses · five rows', 'Thumbnails take the brand arch, numerals become display type, and the rules fade before they reach the margins.', {
    tpl: 'poselist', eyebrow: 'if you sit all day', title: "Five poses for shoulders that won't drop",
    subline: 'Nineteen minutes, and nothing to buy.', identifier: 'a 19-minute routine', items: SHOULDERS }],
  ['Problem → poses · eight rows', 'The dead space at each end is gone: rows grow to fill the column. This is the most-used routine pin.', {
    tpl: 'poselist', eyebrow: 'for runners', title: 'Legs that move again, in eight poses',
    subline: 'Twenty-six minutes, the evening after a run.', identifier: 'a 26-minute routine', items: LEGS }],
  ['Split', 'A hairline, two inset vignettes and the only outer shadow in the set — the arch is the one element genuinely lifted off the ground. Seal, because the narrower arch no longer holds Camel.', {
    tpl: 'split', eyebrow: 'for a stiff back', title: 'The backbend a desk day earns you',
    subline: 'Arms straight, three minutes. Ease off if pinchy.',
    poseName: 'Seal', identifier: 'a yin yoga pose · hold 3 min', img: photo('seal', true), focal: '50% 50%' }],
  ['Offer', 'The photo band masks to zero, so the card sits in a fade rather than on a seam and the slivers either side are gone. Rosewood on oat is 5.2:1; the quartz it replaces was 1.6:1.', {
    tpl: 'offer', eyebrow: 'for runners', title: 'The fifteen minutes after your run',
    subline: 'One easy hold for each place a run tightens.',
    offer: 'Free · 15 minutes · straight to your inbox', cta: 'Send it to me',
    identifier: 'yinyogawithkatie.com/runners', img: photo('caterpillar'), focal: '50% 48%' }],
  ['Before → after', 'A drawn chevron the rules converge on, and the first state dimmed to 0.55 — you see a faint line become a solid one, which is the promise of the template.', {
    tpl: 'states', eyebrow: 'if you sit all day', before: 'Hips stuck at 3pm', after: 'Hips open by 7',
    subline: 'Nineteen minutes on the floor when the working day ends.',
    identifier: 'a 19-minute routine', img: photo('butterfly'), focal: '50% 52%' }],
  ['Watch with me', 'A clipPath play mark in the badge, and the audience tag becomes a tab entering from outside the frame — which removed the scrim it used to need.', {
    tpl: 'video', eyebrow: 'for restless nights', title: 'Ten minutes between you and sleep',
    subline: 'Follow along on YouTube. Nothing to set up, nothing to buy.',
    identifier: 'free on YouTube · 10 min', duration: '10 min', img: photo('childs-pose'), focal: '50% 48%' }],
  ['Window', 'The photograph took the surplus the old layout wasted. Its height adapts per pose, so a wide shape like Sleeping Swan keeps its ends.', {
    tpl: 'window', eyebrow: 'for runners', title: 'The hip you notice at mile four',
    subline: 'Three minutes a side. Gravity does it, not you.',
    identifier: 'Sleeping Swan · a yin yoga pose', img: photo('sleeping-swan'), focal: '50% 52%', photoH: 747 }],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const render = async (params, tone) => renderPin({ ...params, tone });

// Card directions first — the decision this artifact exists for.
const cards = {};
for (const v of ['a', 'b']) {
  for (const tone of ['light', 'dark']) {
    const png = await render({ ...CARD_COPY, variant: v }, tone);
    cards[`${v}-${tone}`] = { big: await uri(png, 430), feed: await uri(png, 236, 72) };
    process.stdout.write('.');
  }
}

const blocks = [];
const feed = [];
for (const [name, note, params] of SET) {
  const shots = {};
  for (const tone of ['light', 'dark']) {
    const png = await render(params, tone);
    shots[tone] = await uri(png, 430);
    if (tone === 'light') feed.push({ name, img: await uri(png, 236, 72) });
    process.stdout.write('.');
  }
  blocks.push({ name, note, shots });
}
console.log('\nrendered');

writeFileSync('design/pin-second-pass-review.html', `<title>Pin templates — second pass</title>
<style>
:root{--paper:#F4EDE4;--panel:#FBF6EE;--ink:#2E342F;--muted:#636A63;--faint:#8B8C81;--line:#DFD3C3;--accent:#89494B}
@media(prefers-color-scheme:dark){:root{--paper:#1B211C;--panel:#242B25;--ink:#EFEAE0;--muted:#A6AEA3;--faint:#828A80;--line:#333B34;--accent:#C7A5A2}}
:root[data-theme="dark"]{--paper:#1B211C;--panel:#242B25;--ink:#EFEAE0;--muted:#A6AEA3;--faint:#828A80;--line:#333B34;--accent:#C7A5A2}
:root[data-theme="light"]{--paper:#F4EDE4;--panel:#FBF6EE;--ink:#2E342F;--muted:#636A63;--faint:#8B8C81;--line:#DFD3C3;--accent:#89494B}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.62 ui-sans-serif,system-ui,sans-serif}
.wrap{max-width:64rem;margin:0 auto;padding:2.5rem 1.25rem 5rem}
h1{font-size:clamp(2rem,5vw,2.9rem);line-height:1.08;margin:.4rem 0 .7rem;letter-spacing:-.015em}
h2{font-size:1.45rem;margin:0 0 .3rem}
.eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin:0}
.lede{color:var(--muted);max-width:58ch;margin:0 0 1.4rem}
.call{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:4px;padding:1rem 1.2rem;font-size:.9rem;color:var(--muted);margin:0 0 2.5rem}
.call b{color:var(--ink)}
.t{margin:0 0 2.8rem;padding-bottom:2rem;border-bottom:1px solid var(--line)}
.note{font-size:.9rem;color:var(--muted);margin:0 0 1rem;max-width:66ch}
.pair{display:flex;gap:1.4rem;flex-wrap:wrap}
.shot{flex:1 1 300px;min-width:250px}
.shot img{width:100%;border-radius:4px;display:block;box-shadow:0 1px 2px rgba(0,0,0,.08),0 12px 30px -14px rgba(0,0,0,.35)}
.shot span{display:block;font-size:.68rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);margin-top:.5rem}
.feed{display:flex;flex-wrap:wrap;gap:1rem;background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:1.2rem}
.feed figure{margin:0;width:160px}
.feed img{width:100%;border-radius:8px;display:block}
.feed figcaption{font-size:.66rem;color:var(--faint);margin-top:.4rem}
</style>
<div class="wrap">
  <p class="eyebrow">Pin templates · second pass</p>
  <h1>Eight templates, rebuilt to the design spec</h1>
  <p class="lede">Every image is a real render from the production renderer —
  same photographs, same copy, same fonts as the live pins.</p>

  <div class="call"><b>The decision this is for:</b> the Benefit card has two
  directions below. You chose <b>A</b>; the designer recommended <b>B</b>, on the
  grounds that at 236px A's inset bloom is invisible while B's bar and ruled foot
  still register as two hard shapes. Both are built — switching is one constant
  in <code>src/lib/pinInventory.ts</code>. The feed row at the bottom is where
  the argument is settled.</p>

  <div class="t">
    <h2>Benefit card · A — pressed panel</h2>
    <p class="note">An inset rim, an inset bloom and a lit corner from the top-left.
    Currently shipping.</p>
    <div class="pair">
      <div class="shot"><img src="${cards['a-light'].big}" alt=""><span>A · light</span></div>
      <div class="shot"><img src="${cards['a-dark'].big}" alt=""><span>A · dark</span></div>
    </div>
  </div>

  <div class="t">
    <h2>Benefit card · B — rule-anchored</h2>
    <p class="note">A 14px accent bar on the top edge, the label ticked off it, and a
    ruled band fading up from the foot.</p>
    <div class="pair">
      <div class="shot"><img src="${cards['b-light'].big}" alt=""><span>B · light</span></div>
      <div class="shot"><img src="${cards['b-dark'].big}" alt=""><span>B · dark</span></div>
    </div>
  </div>

  ${blocks.map((b) => `
  <div class="t">
    <h2>${esc(b.name)}</h2>
    <p class="note">${esc(b.note)}</p>
    <div class="pair">
      <div class="shot"><img src="${b.shots.light}" alt=""><span>Light</span></div>
      <div class="shot"><img src="${b.shots.dark}" alt=""><span>Dark</span></div>
    </div>
  </div>`).join('')}

  <div class="t" style="border-bottom:0">
    <h2>At 236px — feed size</h2>
    <p class="note">Where the card decision is settled, and the only view that
    matters for whether someone stops scrolling.</p>
    <div class="feed">
      <figure><img src="${cards['a-feed'] ?? cards['a-light'].feed}" alt=""><figcaption>Card A</figcaption></figure>
      <figure><img src="${cards['b-light'].feed}" alt=""><figcaption>Card B</figcaption></figure>
      ${feed.map((f) => `<figure><img src="${f.img}" alt=""><figcaption>${esc(f.name)}</figcaption></figure>`).join('')}
    </div>
  </div>
</div>
`);
console.log('design/pin-second-pass-review.html written');
