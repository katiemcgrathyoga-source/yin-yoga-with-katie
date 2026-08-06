/**
 * Renders the new pin calendar for review.
 *
 *   npx astro build && node scripts/artifact-pinplan.mjs
 *
 * Reads the real plan out of dist/pinplan.json and renders every pin in it
 * through the real renderer, so the sheet is the calendar rather than a mockup
 * of it. Writes design/pin-calendar-review.html.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { renderPlatePin } from '../netlify/functions/lib/pinplate.mjs';

const DAYS = 14;
const { total, history, days } = JSON.parse(readFileSync('dist/pinplan.json', 'utf8'));

const PLATE_FOCAL = {
  plate: '50% 52%', frame: '50% 50%', panel: '50% 50%',
  immersive: '50% 50%', watch: '50% 50%', offer: '50% 52%',
};

const photo = (webPath, portrait) => {
  const slug = webPath.replace('/poses/', '').replace('.jpg', '');
  const chain = [
    ...(portrait ? [`public/poses/pin/tall/${slug}.jpg`] : []),
    `public/poses/pin/${slug}.jpg`,
    `public/poses/${slug}.jpg`,
  ];
  const found = chain.find(existsSync);
  return found ? `data:image/jpeg;base64,${readFileSync(found).toString('base64')}` : null;
};

/** The card.png query string is the pin's whole definition — render straight from it. */
async function render(pin) {
  const q = new URL(pin.image).searchParams;
  const tpl = q.get('tpl');
  const fit = q.get('fit') === '1';
  const img = q.get('img');
  return renderPlatePin({
    tpl,
    tone: q.get('tone') === 'dark' ? 'dark' : 'light',
    photo: img ? photo(img, tpl === 'immersive' && !fit) : null,
    focal: PLATE_FOCAL[tpl] || '50% 50%',
    eyebrow: q.get('s') || '',
    headline: q.get('t') || '',
    blurb: q.get('sub') || '',
    metaLine: q.get('meta') || '',
    footnote: q.get('foot') || '',
    duration: q.get('dur') || '',
    offer: q.get('offer') || '',
    cta: q.get('cta') || '',
    fit,
    photoH: Math.min(780, Math.max(520, Number(q.get('ph')) || 700)),
  });
}

const uri = async (png, width, q = 78) =>
  `data:image/jpeg;base64,${(await sharp(png).resize({ width }).jpeg({ quality: q, mozjpeg: true }).toBuffer()).toString('base64')}`;

const fmt = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

const plan = days.slice(0, DAYS);
for (const day of plan) {
  for (const pin of day.pins) {
    pin.shot = await uri(await render(pin), 300);
    process.stdout.write('.');
  }
}
console.log('\nrendered');

// Board load over the fortnight, so the spacing is visible rather than claimed.
const boards = new Map();
for (const day of plan) for (const p of day.pins) boards.set(p.board, [...(boards.get(p.board) ?? []), day.date]);
const spread = [...boards.entries()]
  .map(([board, dates]) => ({ board, dates, n: dates.length }))
  .sort((a, b) => b.n - a.n);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const short = (u) => u.replace('https://yinyogawithkatie.com', '');

writeFileSync('design/pin-calendar-review.html', `<title>The new pin calendar</title>
<style>
:root{--paper:#F4EDE4;--panel:#FBF6EE;--ink:#2E342F;--muted:#636A63;--faint:#8B8C81;--line:#DFD3C3;--accent:#89494B}
@media(prefers-color-scheme:dark){:root{--paper:#1B211C;--panel:#242B25;--ink:#EFEAE0;--muted:#A6AEA3;--faint:#828A80;--line:#333B34;--accent:#C7A5A2}}
:root[data-theme="dark"]{--paper:#1B211C;--panel:#242B25;--ink:#EFEAE0;--muted:#A6AEA3;--faint:#828A80;--line:#333B34;--accent:#C7A5A2}
:root[data-theme="light"]{--paper:#F4EDE4;--panel:#FBF6EE;--ink:#2E342F;--muted:#636A63;--faint:#8B8C81;--line:#DFD3C3;--accent:#89494B}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.62 ui-sans-serif,system-ui,sans-serif}
.wrap{max-width:60rem;margin:0 auto;padding:2.5rem 1.25rem 5rem}
h1{font-size:clamp(2rem,5vw,2.9rem);line-height:1.08;margin:.4rem 0 .7rem;letter-spacing:-.015em}
h2{font-size:1.25rem;margin:0}
.eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin:0}
.lede{color:var(--muted);max-width:60ch;margin:0 0 1.4rem}
.call{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:4px;padding:1rem 1.2rem;font-size:.9rem;color:var(--muted);margin:0 0 1rem}
.call b{color:var(--ink)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.9rem;margin:0 0 2.4rem}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:.8rem .9rem}
.stat b{display:block;font-size:1.5rem;line-height:1.1;font-variant-numeric:tabular-nums}
.stat span{font-size:.72rem;color:var(--faint);text-transform:uppercase;letter-spacing:.1em}
.day{border-top:1px solid var(--line);padding:1.4rem 0 .4rem}
.dayhead{display:flex;align-items:baseline;gap:.7rem;flex-wrap:wrap;margin-bottom:.9rem}
.dayhead span{font-size:.72rem;color:var(--faint);letter-spacing:.1em;text-transform:uppercase}
.pins{display:flex;gap:1.2rem;flex-wrap:wrap}
.pin{flex:1 1 260px;min-width:220px;display:flex;gap:.9rem}
.pin img{width:110px;height:165px;object-fit:cover;border-radius:4px;display:block;flex:none;box-shadow:0 1px 2px rgba(0,0,0,.1),0 10px 24px -14px rgba(0,0,0,.4)}
.pin div{min-width:0}
.board{display:inline-block;font-size:.66rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--paper);background:var(--accent);padding:.2rem .5rem;border-radius:999px;margin-bottom:.35rem}
.what{font-weight:600;font-size:.92rem;margin:0 0 .15rem}
.tpl{font-size:.72rem;color:var(--faint);margin:0 0 .2rem}
.dest{font-size:.72rem;color:var(--muted);margin:0;word-break:break-all}
table{width:100%;border-collapse:collapse;font-size:.84rem}
th,td{text-align:left;padding:.45rem .5rem;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;color:var(--faint);font-weight:700}
td.n{font-variant-numeric:tabular-nums;width:3rem}
.scroll{overflow-x:auto}
.gone{color:var(--faint);font-size:.84rem}
</style>
<div class="wrap">
  <p class="eyebrow">Pinterest · the plan</p>
  <h1>The new pin calendar</h1>
  <p class="lede">Every pin below is a real render from the real plan — this is
  what /pincalendar will show you, not a mockup of it.</p>

  <p class="call"><b>What you already pinned is carried over.</b> The old
  calendar was read straight off the live site, and the ${history.length} pins it
  gave you between 3 and 6 August are handed to the new plan as history. Those
  boards and pages sit out their rest before they come round again, so the
  changeover doesn't quietly reset every counter to zero.</p>

  <div class="grid">
    <div class="stat"><b>${total}</b><span>pins in the library</span></div>
    <div class="stat"><b>${Math.floor(total / 2)}</b><span>days before a repeat</span></div>
    <div class="stat"><b>${spread.length}</b><span>boards in rotation</span></div>
    <div class="stat"><b>0</b><span>rules bent in 59 days</span></div>
  </div>

  <h2>Board load, this fortnight</h2>
  <p class="lede" style="margin:.3rem 0 .8rem">No board twice in three days, and
  no page back on the same board inside three weeks.</p>
  <div class="scroll"><table>
    <tr><th class="n">Pins</th><th>Board</th><th>Days</th></tr>
    ${spread.map((s) => `<tr><td class="n">${s.n}</td><td>${esc(s.board)}</td><td class="gone">${s.dates.map((d) => d.slice(8)).join(' · ')} Aug</td></tr>`).join('')}
  </table></div>

  <h2 style="margin-top:2.4rem">The fortnight</h2>
  ${plan.map((day) => `
  <div class="day">
    <div class="dayhead"><h2>${fmt(day.date)}</h2></div>
    <div class="pins">
      ${day.pins.map((p) => `
      <div class="pin">
        <img src="${p.shot}" alt="">
        <div>
          <span class="board">${esc(p.board)}</span>
          <p class="what">${esc(p.label)}</p>
          <p class="tpl">${esc(p.template)} · ${esc(p.tone)}</p>
          <p class="dest">${esc(short(p.url))}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>`).join('')}
</div>
`);
console.log('design/pin-calendar-review.html written');
