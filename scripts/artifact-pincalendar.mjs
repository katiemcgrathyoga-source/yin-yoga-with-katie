/**
 * Snapshots /pincalendar into a self-contained review artifact.
 *
 *   npx astro dev --port 4340 &
 *   node scripts/artifact-pincalendar.mjs [days] [port]
 *
 * The real page is private and its pins render on demand, so it can't just be
 * shared. This fetches it, downloads each scheduled pin, downscales it and
 * inlines everything — an Artifact can't reach an external host.
 */
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const DAYS = Number(process.argv[2] ?? 7);
const PORT = Number(process.argv[3] ?? 4340);
const BASE = `http://localhost:${PORT}`;

const html = await (await fetch(`${BASE}/pincalendar`)).text();

const decode = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const grab = (block, re) => decode((block.match(re) ?? [, ''])[1].trim());

// Split into day sections, then pins within each.
const daySections = html.split('<section class="pc-day').slice(1, DAYS + 1);
const days = daySections.map((section) => {
  const heading = grab(section, /<h2[^>]*>([\s\S]*?)<\/h2>/);
  const date = grab(section, /class="pc-day-date"[^>]*>([\s\S]*?)<\/span>/);
  const pins = section.split('<article class="pc-pin"').slice(1).map((block) => ({
    image: grab(block, /<img src="([^"]+)"/),
    board: grab(block, /class="pc-board"[^>]*>([\s\S]*?)<\/span>/),
    kind: grab(block, /class="pc-kind"[^>]*>([\s\S]*?)<\/span>/).replace(/\s+/g, ' '),
    label: grab(block, /<h3[^>]*>([\s\S]*?)<\/h3>/),
    dest: grab(block, /class="pc-dest"[^>]*>([\s\S]*?)<\/p>/),
    desc: grab(block, /data-desc="([^"]*)"/),
  }));
  return { heading, date, pins };
});

// Fetch and shrink each pin. 260px is twice its display size here.
const seen = new Map();
for (const day of days) {
  for (const pin of day.pins) {
    if (seen.has(pin.image)) { pin.data = seen.get(pin.image); continue; }
    const url = pin.image.replace('https://yinyogawithkatie.com', BASE);
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const small = await sharp(buf).resize({ width: 260 }).jpeg({ quality: 74, mozjpeg: true }).toBuffer();
    pin.data = `data:image/jpeg;base64,${small.toString('base64')}`;
    seen.set(pin.image, pin.data);
    process.stdout.write('.');
  }
}
console.log(`\n${seen.size} pins fetched`);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stats = grab(html, /class="pc-stats"[^>]*>([\s\S]*?)<\/p>/).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
const boards = [...html.matchAll(/<li[^>]*>([^<]+)<\/li>/g)].map((m) => decode(m[1].trim()));

const body = days.map((day) => `
  <section class="day">
    <div class="day-head">
      <h2>${esc(day.heading)}</h2>${day.date ? `<span>${esc(day.date)}</span>` : ''}
    </div>
    ${day.pins.map((pin) => `
    <article class="pin">
      <img src="${pin.data}" alt="">
      <div class="meta">
        <div class="row"><span class="board">${esc(pin.board)}</span><span class="kind">${esc(pin.kind)}</span></div>
        <h3>${esc(pin.label)}</h3>
        <p class="dest">${esc(pin.dest)}</p>
        <p class="desc">${esc(pin.desc)}</p>
      </div>
    </article>`).join('')}
  </section>`).join('');

writeFileSync('design/pincalendar-review.html', `<title>Pin calendar — ${DAYS}-day review</title>
<style>
:root{--paper:#F4EDE4;--panel:#FBF6EE;--ink:#2E342F;--muted:#636A63;--faint:#8B8C81;--line:#DFD3C3;--accent:#89494B;--sage:#48544C}
@media(prefers-color-scheme:dark){:root{--paper:#1B211C;--panel:#242B25;--ink:#EFEAE0;--muted:#A6AEA3;--faint:#828A80;--line:#333B34;--accent:#C7A5A2;--sage:#BFC7BD}}
:root[data-theme="dark"]{--paper:#1B211C;--panel:#242B25;--ink:#EFEAE0;--muted:#A6AEA3;--faint:#828A80;--line:#333B34;--accent:#C7A5A2;--sage:#BFC7BD}
:root[data-theme="light"]{--paper:#F4EDE4;--panel:#FBF6EE;--ink:#2E342F;--muted:#636A63;--faint:#8B8C81;--line:#DFD3C3;--accent:#89494B;--sage:#48544C}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 ui-sans-serif,system-ui,sans-serif}
.wrap{max-width:56rem;margin:0 auto;padding:2.5rem 1.25rem 5rem}
h1{font-size:clamp(2rem,5vw,2.8rem);line-height:1.1;margin:.4rem 0 .6rem;letter-spacing:-.01em}
.eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin:0}
.lede{color:var(--muted);margin:0 0 1rem;max-width:52ch}
.stats{font-size:.82rem;color:var(--muted);margin:0 0 .5rem}
.boards{background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:1rem 1.2rem;margin:1.25rem 0 2.5rem;font-size:.85rem}
.boards h4{margin:0 0 .5rem;font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--faint)}
.boards ul{margin:0;padding-left:1.1rem;color:var(--muted)}
.day{margin-bottom:2.5rem}
.day-head{display:flex;align-items:baseline;gap:.7rem;padding-bottom:.5rem;margin-bottom:.9rem;border-bottom:1px solid var(--line)}
.day-head h2{margin:0;font-size:1.3rem}
.day-head span{font-size:.82rem;color:var(--muted)}
.pin{display:flex;gap:1.1rem;padding:1rem 0;border-bottom:1px solid var(--line)}
.pin:last-child{border-bottom:0}
.pin img{width:130px;height:195px;object-fit:cover;border-radius:4px;flex:none;background:var(--panel)}
.meta{min-width:0}
.row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin-bottom:.35rem}
.board{font-size:.64rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:.22rem .6rem;border-radius:999px;background:var(--sage);color:var(--paper)}
.kind{font-size:.72rem;color:var(--muted)}
.meta h3{margin:0 0 .15rem;font-size:1.02rem}
.dest{font-size:.74rem;color:var(--faint);margin:0 0 .45rem;word-break:break-all}
.desc{font-size:.8rem;color:var(--muted);margin:0;padding-left:.7rem;border-left:2px solid var(--line)}
@media(max-width:34rem){.pin{flex-direction:column}}
</style>
<div class="wrap">
  <p class="eyebrow">Pin calendar · review copy</p>
  <h1>${DAYS} days, as the calendar plans them</h1>
  <p class="lede">A snapshot of the real page, pins and all. Every pin below is the
  actual image the save button would send to Pinterest.</p>
  <p class="stats">${esc(stats)}</p>
  <div class="boards">
    <h4>Boards this plan uses</h4>
    <ul>${boards.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
  </div>
  ${body}
</div>
`);
console.log('design/pincalendar-review.html written');
