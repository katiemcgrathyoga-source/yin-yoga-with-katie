// Phone-sized screenshot of a routine's timer mid-hold, for Strava posts.
//   npm run build && python -m http.server 4400 --directory dist --bind 127.0.0.1 &
//   node scripts/shot-timer.mjs deep-legs-hamstrings design/strava-maps/timer-deep-legs.png 40
// Drives headless Edge over the DevTools protocol: opens the routine at iPhone size,
// presses Begin, waits <seconds> (15s lead-in, then the first hold), saves a PNG.
// Needs the BUILT site: the dev server hands out HTML whose hashed scripts it can't serve.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [slug, out, waitS = '40'] = process.argv.slice(2);
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9333;
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', '--user-data-dir=' + process.env.TEMP + '/edge-shot', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
try {
  let targets;
  for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(250); } }
  const page = targets.find((t) => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: `${process.env.BASE || 'http://127.0.0.1:4400'}/routines/${slug}/` });
  let clicked;
  for (let i = 0; i < 120; i++) {
    clicked = await send('Runtime.evaluate', { expression: `(() => { if (document.readyState !== 'complete') return 'loading'; const b = document.querySelector('.rp-toggle'); if (!b) return 'no button'; if (!getComputedStyle(b).fontFamily.includes('Cabin')) return 'css pending'; b.scrollIntoView(); b.click(); return 'clicked: ' + b.textContent.trim(); })()`, returnByValue: true });
    if (clicked.result.value.startsWith('clicked')) break;
    await sleep(500);
  }
  console.log(clicked.result.value);
  await sleep(Number(waitS) * 1000);
  const state = await send('Runtime.evaluate', { expression: `(() => { const t = document.querySelector('[data-rp-time], .rp-time, .rp-clock'); const n = document.querySelector('.rp-pose-name, .rp-name, .rp-current h2, .rp-current h3'); return (n ? n.textContent.trim() : '?') + ' | ' + (t ? t.textContent.trim() : '?') + ' | fullscreen=' + !!document.fullscreenElement + ' | class=' + document.body.className; })()`, returnByValue: true });
  console.log(state.result.value);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log('wrote', out);
} finally { edge.kill(); }
