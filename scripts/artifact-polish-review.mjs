/**
 * Builds the before/after artifact for the visual polish pass.
 *
 *   node scripts/artifact-polish-review.mjs
 *
 * "Before" comes from design/pin-preview (rendered prior to the pass), "after"
 * from design/pin-review. Both are real renders, so the comparison is honest.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';

const uri = async (path, width) => {
  const buf = await sharp(readFileSync(path)).resize({ width }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
};

const CHANGED = [
  {
    name: 'Benefit hook',
    before: 'design/pin-preview/hook.png',
    after: 'design/pin-review/01-hook-light.jpg',
    what: 'The veil takes the colourway’s own ground instead of a fixed dark green, and travels from the bottom edge to 86% with six stops rather than four.',
    why: 'A “light” pin with a dark bottom third had stopped belonging to its colourway. The type is sage on cream now, and the gradient reads as light falling off rather than a bar behind the words.',
    css: "backgroundImage: linear-gradient(to top, rgba(249,241,234,0.97) 0%, rgba(249,241,234,0.94) 18%, rgba(249,241,234,0.78) 34%, rgba(249,241,234,0.46) 52%, rgba(249,241,234,0.16) 70%, rgba(249,241,234,0) 86%)",
  },
  {
    name: 'Split',
    before: 'design/pin-preview/split.png',
    after: 'design/pin-review/05-split-light.jpg',
    what: 'The arch is inset inside the page margin, framed with a hairline and lifted off the bottom edge. The pose name became a filled tab with a soft shadow, and the signature took the opposite corner.',
    why: 'Margin is what makes a photograph read as placed on a page rather than as a background the type happens to sit on. A label that is an object beats a caption that fell on top.',
    css: "borderRadius: 434px 434px 10px 10px; border: 1px solid #E4DACF; boxShadow: 0 2px 10px rgba(38,44,39,0.14)",
  },
  {
    name: 'Window',
    before: 'design/pin-preview/window.png',
    after: 'design/pin-review/09-window-light.jpg',
    what: 'The hairline rules above and below the photo band are gone. Both edges dissolve into the ground with a mask.',
    why: 'The rules boxed the photograph into a slot. Fading it means the picture is laid onto the page — the single change that most makes these feel printed rather than composed.',
    css: "maskImage: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 7%, rgba(0,0,0,1) 93%, rgba(0,0,0,0) 100%)",
  },
  {
    name: 'Before → after',
    before: 'design/pin-preview/states.png',
    after: 'design/pin-review/07-states-light.jpg',
    what: 'The photograph’s top edge fades in over the first 11% instead of starting on a hard line.',
    why: 'Same reasoning as the Window, and it matters more here because the photo takes half the canvas and met the type block edge-on.',
    css: "maskImage: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 11%)",
  },
];

const UNCHANGED = ['02-card', '03-poselist', '04-poselist-dense', '06-offer', '08-video'];

const rows = [];
for (const t of CHANGED) {
  if (!existsSync(t.before) || !existsSync(t.after)) continue;
  rows.push({ ...t, beforeImg: await uri(t.before, 420), afterImg: await uri(t.after, 420) });
}
const others = [];
for (const name of UNCHANGED) {
  for (const tone of ['light', 'dark']) {
    const path = `design/pin-review/${name}-${tone}.jpg`;
    if (existsSync(path)) others.push({ label: `${name.replace(/^\d+-/, '')} · ${tone}`, img: await uri(path, 230) });
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

writeFileSync('design/pin-polish-review.html', `<title>Pin templates — polish pass</title>
<style>
:root{--paper:#F4EDE4;--panel:#FBF6EE;--ink:#2E342F;--muted:#636A63;--faint:#8B8C81;--line:#DFD3C3;--accent:#89494B;--sage:#48544C}
@media(prefers-color-scheme:dark){:root{--paper:#1B211C;--panel:#242B25;--ink:#EFEAE0;--muted:#A6AEA3;--faint:#828A80;--line:#333B34;--accent:#C7A5A2;--sage:#BFC7BD}}
:root[data-theme="dark"]{--paper:#1B211C;--panel:#242B25;--ink:#EFEAE0;--muted:#A6AEA3;--faint:#828A80;--line:#333B34;--accent:#C7A5A2;--sage:#BFC7BD}
:root[data-theme="light"]{--paper:#F4EDE4;--panel:#FBF6EE;--ink:#2E342F;--muted:#636A63;--faint:#8B8C81;--line:#DFD3C3;--accent:#89494B;--sage:#48544C}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.62 ui-sans-serif,system-ui,sans-serif}
.wrap{max-width:64rem;margin:0 auto;padding:2.5rem 1.25rem 5rem}
h1{font-size:clamp(2rem,5vw,2.9rem);line-height:1.08;margin:.4rem 0 .7rem;letter-spacing:-.015em}
h2{font-size:1.5rem;margin:0 0 .3rem}
.eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin:0}
.lede{color:var(--muted);max-width:56ch;margin:0 0 1.2rem}
.note{background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:1rem 1.2rem;font-size:.88rem;color:var(--muted);margin:0 0 2.5rem}
.note b{color:var(--ink)}
.t{margin:0 0 3rem;padding-bottom:2rem;border-bottom:1px solid var(--line)}
.pair{display:flex;gap:1.5rem;flex-wrap:wrap;margin:1rem 0 1.1rem}
.shot{flex:1 1 300px;min-width:260px}
.shot img{width:100%;border-radius:4px;display:block;box-shadow:0 1px 2px rgba(0,0,0,.08),0 12px 30px -14px rgba(0,0,0,.35)}
.shot span{display:block;font-size:.7rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);margin:.5rem 0 0}
.what{font-size:.92rem;margin:0 0 .5rem}
.why{font-size:.88rem;color:var(--muted);margin:0 0 .7rem;max-width:64ch}
code{display:block;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.72rem;line-height:1.5;background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:.6rem .8rem;color:var(--muted);overflow-x:auto;white-space:pre-wrap;word-break:break-all}
.grid{display:flex;flex-wrap:wrap;gap:1rem}
.grid figure{margin:0;width:150px}
.grid img{width:100%;border-radius:3px;display:block}
.grid figcaption{font-size:.68rem;color:var(--faint);margin-top:.35rem}
</style>
<div class="wrap">
  <p class="eyebrow">Pin templates · polish pass</p>
  <h1>Four changes, made possible by a constraint that wasn’t real</h1>
  <p class="lede">The original spec told the designer Satori supported no masks, no
  shadows, no filters and no transforms. That was wrong. These are the changes
  that were available the whole time.</p>
  <p class="note"><b>Everything below is a real render</b> from the production
  renderer — same photographs, same copy, same fonts. Only the visual treatment
  changed; no layout, copy or template was altered.</p>

  ${rows.map((t) => `
  <div class="t">
    <h2>${esc(t.name)}</h2>
    <p class="what">${t.what}</p>
    <p class="why">${t.why}</p>
    <div class="pair">
      <div class="shot"><img src="${t.beforeImg}" alt=""><span>Before</span></div>
      <div class="shot"><img src="${t.afterImg}" alt=""><span>After</span></div>
    </div>
    <code>${esc(t.css)}</code>
  </div>`).join('')}

  <div class="t" style="border-bottom:0">
    <h2>Unchanged</h2>
    <p class="why">These four were already doing their job. Nothing was added for
    its own sake.</p>
    <div class="grid">
      ${others.map((o) => `<figure><img src="${o.img}" alt=""><figcaption>${esc(o.label)}</figcaption></figure>`).join('')}
    </div>
  </div>
</div>
`);
console.log('design/pin-polish-review.html written');
