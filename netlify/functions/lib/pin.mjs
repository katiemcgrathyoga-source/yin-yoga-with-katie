import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { CABIN_SEMIBOLD } from './fonts.mjs';
import { CORMORANT, AURELLIE } from './pinfonts.mjs';

// Cormorant Garamond (light display serif) for titles, Cabin for eyebrows/wordmark,
// Aurellie Calestion for the signed "katie" signature only.
const FONTS = [
  { name: 'Serif', data: Buffer.from(CORMORANT, 'base64'), weight: 500, style: 'normal' },
  { name: 'Cabin', data: CABIN_SEMIBOLD, weight: 600, style: 'normal' },
  { name: 'Script', data: Buffer.from(AURELLIE, 'base64'), weight: 400, style: 'normal' },
];

const OAT = '#F9F1EA';
const CARD = '#FDF8F2';
const SAGE = '#48544C';
const ROSEWOOD = '#89494B';
const QUARTZ = '#BC9D9A';
const LINE = '#E4DACF';
const MUTED = '#6E756F';
const INK = '#2E342F';
const WASH = '#F0E4E2';

const OAT_70 = 'rgba(249,241,234,0.72)';
const OAT_LINE = 'rgba(249,241,234,0.24)';

// Light/dark palette pair for the tone-twinned templates. Light keeps the
// original oat-ground look; dark swaps to the deep-sage ground with oat ink so
// each template ships in two colourways from one param.
const pal = (tone) =>
  tone === 'dark'
    ? { ground: SAGE, ink: OAT, eyebrow: QUARTZ, num: QUARTZ, mark: OAT, line: OAT_LINE, note: OAT_70, border: 'rgba(249,241,234,0.32)' }
    : { ground: OAT, ink: SAGE, eyebrow: ROSEWOOD, num: ROSEWOOD, mark: SAGE, line: LINE, note: MUTED, border: LINE };

const box = (style, children) => ({ type: 'div', props: { style: { display: 'flex', ...style }, ...(children !== undefined ? { children } : {}) } });
const wordmark = (color) => box({ fontFamily: 'Cabin', fontSize: '23px', letterSpacing: '2px', color }, 'yinyogawithkatie.com');
const eyebrow = (text, color, size = 24, tracking = '5px') => box({ fontFamily: 'Cabin', fontSize: `${size}px`, letterSpacing: tracking, color }, (text || '').toUpperCase());
// Real <img> with object-fit cover + object-position focal (reliable in satori; matches the crop spec).
const photo = (w, h, img, focal, style = {}) =>
  img
    ? { type: 'img', props: { src: img, style: { width: `${w}px`, height: `${h}px`, objectFit: 'cover', objectPosition: focal || 'center', ...style } } }
    : box({ width: `${w}px`, height: `${h}px`, backgroundColor: LINE, ...style });
const bottomWordmark = (color, bottom) => box({ position: 'absolute', bottom, left: '0', right: '0', justifyContent: 'center' }, [wordmark(color)]);

// 1a — photo-led (upright): square-ish photo on top, title band (light oat / dark sage).
function photoLed({ title, eyebrow: eb, img, focal, tone }) {
  const p = pal(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.ground }, [
    photo(1000, 1010, img, focal),
    box({ flexDirection: 'column', flexGrow: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '52px 64px 48px', borderTop: `2px solid ${p.line}`, position: 'relative' }, [
      eb ? box({ fontFamily: 'Cabin', fontSize: '24px', letterSpacing: '5px', color: p.eyebrow, marginBottom: '24px' }, eb.toUpperCase()) : box({ width: '0', height: '0' }),
      box({ fontFamily: 'Serif', fontSize: '64px', lineHeight: 1.25, color: p.ink, maxWidth: '760px', textAlign: 'center' }, title),
      bottomWordmark(p.mark, '48px'),
    ]),
  ]);
}

// 3a — photo-led landscape band (lying poses): header, photo band, footer (light / dark).
function landscapeBand({ title, eyebrow: eb, img, focal, tone }) {
  const p = pal(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.ground }, [
    box({ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '92px 72px 66px', gap: '24px' }, [
      eb ? box({ fontFamily: 'Cabin', fontSize: '24px', letterSpacing: '5px', color: p.eyebrow }, eb.toUpperCase()) : box({ width: '0', height: '0' }),
      box({ fontFamily: 'Serif', fontSize: '62px', lineHeight: 1.25, color: p.ink, maxWidth: '800px', textAlign: 'center' }, title),
    ]),
    photo(1000, 620, img, focal, { borderTop: `2px solid ${p.line}`, borderBottom: `2px solid ${p.line}` }),
    box({ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }, [wordmark(p.mark)]),
  ]);
}

// 1b — text-led: deep-sage field, arch hairline frame, small photo, oat title.
function textLed({ title, eyebrow: eb, img, focal }) {
  const inner = [];
  if (img) inner.push(photo(500, 300, img, focal, { marginTop: '54px', borderRadius: '16px' }));
  if (eb) inner.push(box({ fontFamily: 'Cabin', fontSize: '26px', letterSpacing: '6px', color: QUARTZ, marginTop: '52px' }, eb.toUpperCase()));
  inner.push(box({ fontFamily: 'Serif', fontSize: '82px', lineHeight: 1.2, color: OAT, maxWidth: '640px', textAlign: 'center', marginTop: '30px' }, title));
  inner.push(bottomWordmark(OAT, '4px'));
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: SAGE }, [
    box({ position: 'absolute', top: '70px', left: '70px', right: '70px', bottom: '70px', border: '2px solid rgba(249,241,234,0.35)', borderRadius: '430px 430px 20px 20px' }),
    box({ position: 'absolute', top: '70px', left: '70px', right: '70px', bottom: '70px', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '84px 70px 70px' }, inner),
  ]);
}

// 1c — list / how-to: sage header + up to 3 numbered rows.
function listPin({ title, eyebrow: eb, items = [] }) {
  const rows = items.slice(0, 3).map((it, i, arr) =>
    box({ alignItems: 'center', gap: '40px', padding: '40px 0', ...(i < arr.length - 1 ? { borderBottom: `2px solid ${LINE}` } : {}) }, [
      box({ fontFamily: 'Serif', fontSize: '72px', color: ROSEWOOD, flexShrink: 0 }, String(i + 1).padStart(2, '0')),
      box({ flexGrow: 1, flexDirection: 'column' }, [
        box({ fontFamily: 'Serif', fontSize: '42px', color: SAGE }, it.name || ''),
        it.note ? box({ fontFamily: 'Cabin', fontSize: '25px', color: MUTED, marginTop: '6px' }, it.note) : box({ width: '0', height: '0' }),
      ]),
      ...(it.thumb ? [photo(200, 144, it.thumb, it.focal, { borderRadius: '14px', flexShrink: 0 })] : []),
    ]),
  );
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: OAT }, [
    box({ flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: SAGE, padding: '84px 80px 66px' }, [
      eb ? box({ fontFamily: 'Cabin', fontSize: '26px', letterSpacing: '6px', color: QUARTZ, marginBottom: '26px' }, eb.toUpperCase()) : box({ width: '0', height: '0' }),
      box({ fontFamily: 'Serif', fontSize: '66px', lineHeight: 1.25, color: OAT, maxWidth: '760px', textAlign: 'center' }, title),
    ]),
    box({ flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', padding: '24px 90px 24px' }, rows),
    box({ justifyContent: 'center', padding: '0 0 60px' }, [wordmark(SAGE)]),
  ]);
}

// 1d — quote: blush wash (light) or deep-sage (dark), big quote mark, script signature.
function quotePin({ quote, eyebrow: eb, tone }) {
  const dark = tone === 'dark';
  const ground = dark ? SAGE : WASH;
  const eyeC = dark ? QUARTZ : ROSEWOOD;
  const quoteC = dark ? OAT : SAGE;
  const sigC = dark ? QUARTZ : ROSEWOOD;
  const markC = dark ? OAT : SAGE;
  return box({ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: ground, padding: '120px 100px 90px', position: 'relative' }, [
    eyebrow(eb || 'from the journal', eyeC),
    box({ fontFamily: 'Serif', fontSize: '200px', lineHeight: 1, height: '120px', color: QUARTZ, marginTop: '40px' }, '“'),
    box({ fontFamily: 'Serif', fontSize: '84px', lineHeight: 1.3, color: quoteC, maxWidth: '560px', textAlign: 'center', marginTop: '14px' }, quote),
    box({ fontFamily: 'Script', fontSize: '82px', color: sigC, marginTop: '40px' }, 'katie'),
    bottomWordmark(markC, '84px'),
  ]);
}

// 4a — numbered poses ("5 poses for…") with thumbnails. Shows EVERY pose; the
// thumbnail keeps the approved 200×144 up to 7 rows, then scales down (same 0.72
// aspect) so an 8–10 pose sequence still fits the 1500px canvas. Type never shrinks.
function numberedPoses({ title, eyebrow: eb, items = [], tone }) {
  const p = pal(tone);
  const n = Math.max(1, items.length);
  const thumbH = n <= 7 ? 144 : n <= 8 ? 122 : n <= 9 ? 110 : 98;
  const thumbW = Math.round(thumbH / 0.72); // 144→200, preserves the landscape crop
  const rowPad = n <= 5 ? 24 : n <= 7 ? 16 : 9;
  const rows = items.map((it, i, arr) =>
    box({ alignItems: 'center', gap: '32px', padding: `${rowPad}px 0`, ...(i < arr.length - 1 ? { borderBottom: `1.5px solid ${p.line}` } : {}) }, [
      box({ fontFamily: 'Serif', fontSize: '52px', color: p.num, width: '58px', flexShrink: 0 }, String(i + 1)),
      box({ flexGrow: 1, flexDirection: 'column' }, [
        box({ fontFamily: 'Serif', fontSize: '36px', color: p.ink }, it.name || ''),
        it.note ? box({ fontFamily: 'Cabin', fontSize: '24px', color: p.note, marginTop: '2px' }, it.note) : box({ width: '0', height: '0' }),
      ]),
      photo(thumbW, thumbH, it.thumb, it.focal, { borderRadius: '14px', flexShrink: 0 }),
    ]),
  );
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.ground }, [
    box({ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '84px 80px 0' }, [
      eb ? box({ fontFamily: 'Cabin', fontSize: '24px', letterSpacing: '5px', color: p.eyebrow, marginBottom: '20px' }, eb.toUpperCase()) : box({ width: '0', height: '0' }),
      box({ fontFamily: 'Serif', fontSize: '72px', lineHeight: 1.2, color: p.ink, maxWidth: '780px', textAlign: 'center' }, title),
    ]),
    box({ flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', padding: '30px 84px 18px' }, rows),
    box({ justifyContent: 'center', padding: '0 0 56px' }, [wordmark(p.mark)]),
  ]);
}

// 4c — step-by-step: photo band + 3 numbered steps.
function stepByStep({ title, eyebrow: eb, img, focal, items = [] }) {
  const steps = items.slice(0, 3).map((it) =>
    box({ gap: '30px', padding: '20px 0', alignItems: 'flex-start' }, [
      box({ width: '64px', height: '64px', flexShrink: 0, borderRadius: '999px', border: `1.5px solid ${QUARTZ}`, alignItems: 'center', justifyContent: 'center', fontFamily: 'Serif', fontSize: '34px', color: ROSEWOOD }, it.n || ''),
      box({ flexGrow: 1, fontFamily: 'Cabin', fontSize: '29px', lineHeight: 1.5, color: INK }, it.text || ''),
    ]),
  );
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: CARD }, [
    photo(1000, 540, img, focal),
    box({ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '52px 90px 0' }, [
      eb ? box({ fontFamily: 'Cabin', fontSize: '24px', letterSpacing: '5px', color: ROSEWOOD, marginBottom: '16px' }, eb.toUpperCase()) : box({ width: '0', height: '0' }),
      box({ fontFamily: 'Serif', fontSize: '64px', lineHeight: 1.2, color: SAGE, maxWidth: '780px', textAlign: 'center' }, title),
    ]),
    box({ flexDirection: 'column', flexGrow: 1, justifyContent: 'center', padding: '30px 110px 0' }, steps),
    box({ justifyContent: 'center', padding: '0 0 56px' }, [wordmark(SAGE)]),
  ]);
}

// 4d — evening ritual: timed wind-down on deep sage.
function eveningRitual({ title, eyebrow: eb, items = [] }) {
  const rows = items.slice(0, 5).map((it, i, arr) =>
    box({ alignItems: 'baseline', gap: '36px', padding: '28px 0', ...(i < arr.length - 1 ? { borderBottom: '1px solid rgba(249,241,234,0.22)' } : {}) }, [
      box({ fontFamily: 'Serif', fontSize: '40px', color: QUARTZ, width: '150px', flexShrink: 0 }, it.time || ''),
      box({ flexGrow: 1, fontFamily: 'Cabin', fontSize: '30px', color: OAT }, it.text || ''),
    ]),
  );
  return box({ width: '100%', height: '100%', flexDirection: 'column', textAlign: 'center', backgroundColor: SAGE, padding: '100px 90px 90px' }, [
    eyebrow(eb || 'tonight', QUARTZ),
    box({ fontFamily: 'Serif', fontSize: '72px', lineHeight: 1.22, color: OAT, marginTop: '22px', justifyContent: 'center', textAlign: 'center' }, title),
    box({ flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', marginTop: '40px', textAlign: 'left' }, rows),
    box({ justifyContent: 'center', marginTop: '30px' }, [wordmark(OAT)]),
  ]);
}

// 4e — beginner checklist: reassurance utility pin on rose-quartz wash.
function checklist({ title, eyebrow: eb, items = [], footer }) {
  const rows = items.slice(0, 4).map((it, i, arr) =>
    box({ alignItems: 'center', gap: '28px', padding: '24px 0', ...(i < arr.length - 1 ? { borderBottom: `1px solid ${LINE}` } : {}) }, [
      box({ width: '40px', height: '40px', flexShrink: 0, borderRadius: '999px', border: `1.5px solid ${QUARTZ}`, alignItems: 'center', justifyContent: 'center', color: ROSEWOOD, fontFamily: 'Cabin', fontSize: '22px' }, '✓'),
      box({ flexGrow: 1, fontFamily: 'Cabin', fontSize: '30px', color: INK }, it.aside ? `${it.text}  ${it.aside}` : it.text || ''),
    ]),
  );
  return box({ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: WASH, padding: '90px 80px 80px' }, [
    eyebrow(eb || 'save this — start tonight', ROSEWOOD),
    box({ fontFamily: 'Serif', fontSize: '70px', lineHeight: 1.22, color: SAGE, maxWidth: '600px', marginTop: '22px', justifyContent: 'center', textAlign: 'center' }, title),
    box({ width: '100%', flexGrow: 1, flexDirection: 'column', justifyContent: 'space-between', backgroundColor: CARD, border: `1.5px solid ${LINE}`, borderRadius: '24px', padding: '48px 64px', marginTop: '44px', textAlign: 'left' }, rows),
    footer ? box({ fontFamily: 'Cabin', fontSize: '26px', color: MUTED, marginTop: '34px' }, footer) : box({ width: '0', height: '0' }),
    box({ marginTop: '26px' }, [wordmark(SAGE)]),
  ]);
}

// ─── New "feed-first" templates (2026 redesign) — Cormorant + Cabin ───────────
// Photo hook: full-bleed photo + dark bottom scrim + keyword pill + hook.
function photoHook({ title, eyebrow: eb, subline, img, focal }) {
  const bg = img
    ? { type: 'img', props: { src: img, style: { position: 'absolute', top: '0', left: '0', width: '1000px', height: '1500px', objectFit: 'cover', objectPosition: focal || 'center' } } }
    : box({ position: 'absolute', top: '0', left: '0', width: '1000px', height: '1500px', backgroundColor: LINE });
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: SAGE, overflow: 'hidden' }, [
    bg,
    box({ position: 'absolute', top: '0', left: '0', width: '1000px', height: '1500px', backgroundImage: 'linear-gradient(to top, rgba(38,44,39,0.92) 0%, rgba(38,44,39,0.76) 24%, rgba(38,44,39,0) 60%)' }),
    box({ position: 'absolute', top: '64px', left: '64px', backgroundColor: SAGE, color: OAT, fontFamily: 'Cabin', fontSize: '30px', letterSpacing: '6px', padding: '16px 34px', borderRadius: '999px' }, (eb || 'For runners').toUpperCase()),
    box({ position: 'absolute', left: '64px', right: '64px', bottom: '56px', flexDirection: 'column' }, [
      box({ fontFamily: 'Serif', fontSize: '100px', lineHeight: 1.04, color: CARD }, title),
      subline ? box({ fontFamily: 'Cabin', fontSize: '40px', lineHeight: 1.35, color: OAT, marginTop: '30px' }, subline) : box({ width: '0', height: '0' }),
      box({ height: '2px', backgroundColor: 'rgba(249,241,234,0.55)', marginTop: '32px' }),
      box({ fontFamily: 'Cabin', fontSize: '30px', letterSpacing: '4px', color: OAT, marginTop: '30px' }, 'yinyogawithkatie.com'),
    ]),
  ]);
}

// Numbered list: oat field, big title, up to 6 pose rows with hold times, save-prompt footer.
function numberList({ title, eyebrow: eb, items = [], footer, tone }) {
  const p = pal(tone);
  const rows = items.slice(0, 6).map((it, i) =>
    box({ alignItems: 'baseline', padding: '33px 0', borderBottom: `2px solid ${p.line}` }, [
      box({ fontFamily: 'Serif', fontSize: '58px', color: p.num, width: '70px', flexShrink: 0 }, String(i + 1)),
      box({ fontFamily: 'Cabin', fontSize: '42px', color: p.ink, marginLeft: '36px', flexGrow: 1 }, it.name || ''),
      it.note ? box({ fontFamily: 'Cabin', fontSize: '30px', color: p.ink, flexShrink: 0 }, it.note) : box({ width: '0', height: '0' }),
    ]),
  );
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.ground, padding: '96px 84px 72px' }, [
    eb ? box({ fontFamily: 'Cabin', fontSize: '30px', letterSpacing: '6px', color: p.eyebrow }, eb.toUpperCase()) : box({ width: '0', height: '0' }),
    box({ fontFamily: 'Serif', fontSize: '108px', lineHeight: 1.02, color: p.ink, marginTop: '28px' }, title),
    box({ flexDirection: 'column', marginTop: '52px' }, rows),
    box({ flexGrow: 1 }),
    box({ alignItems: 'center', justifyContent: 'space-between' }, [
      box({ fontFamily: 'Cabin', fontSize: '30px', letterSpacing: '4px', color: p.mark }, 'yinyogawithkatie.com'),
      footer ? box({ fontFamily: 'Cabin', fontSize: '30px', color: p.eyebrow }, footer) : box({ width: '0', height: '0' }),
    ]),
  ]);
}

// Benefit card: deep-sage field, arched hairline frame, big benefit line + keyword eyebrow.
function benefitCard({ title, eyebrow: eb }) {
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: SAGE, padding: '72px' }, [
    box({ flexGrow: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: `2px solid ${LINE}`, borderRadius: '424px 424px 18px 18px', padding: '96px 72px' }, [
      box({ fontFamily: 'Cabin', fontSize: '30px', letterSpacing: '7px', color: OAT, borderBottom: '2px solid rgba(249,241,234,0.6)', paddingBottom: '18px' }, (eb || 'Yin yoga for runners').toUpperCase()),
      box({ fontFamily: 'Serif', fontSize: '94px', lineHeight: 1.12, color: CARD, maxWidth: '700px', marginTop: '52px', justifyContent: 'center', textAlign: 'center' }, title),
      box({ fontFamily: 'Serif', fontSize: '36px', letterSpacing: '1px', color: OAT, marginTop: '52px' }, 'yin yoga with katie'),
    ]),
    box({ justifyContent: 'center', fontFamily: 'Cabin', fontSize: '30px', letterSpacing: '4px', color: OAT, marginTop: '48px' }, 'yinyogawithkatie.com'),
  ]);
}

/** Render a 1000×1500 (2:3) Pinterest pin to a PNG Buffer. */
export async function renderPin({ tpl, title, eyebrow: eb, subline, img, focal, quote, items, footer, tone }) {
  let tree;
  switch (tpl) {
    case 'photohook': tree = photoHook({ title, eyebrow: eb, subline, img, focal }); break;
    case 'numberlist': tree = numberList({ title, eyebrow: eb, items, footer, tone }); break;
    case 'benefit': tree = benefitCard({ title, eyebrow: eb }); break;
    case 'text': tree = textLed({ title, eyebrow: eb, img, focal }); break;
    case 'band': tree = landscapeBand({ title, eyebrow: eb, img, focal, tone }); break;
    case 'list': tree = listPin({ title, eyebrow: eb, items }); break;
    case 'quote': tree = quotePin({ quote: quote || title, eyebrow: eb, tone }); break;
    case 'numbered': tree = numberedPoses({ title, eyebrow: eb, items, tone }); break;
    case 'step': tree = stepByStep({ title, eyebrow: eb, img, focal, items }); break;
    case 'ritual': tree = eveningRitual({ title, eyebrow: eb, items }); break;
    case 'checklist': tree = checklist({ title, eyebrow: eb, items, footer }); break;
    default: tree = photoLed({ title, eyebrow: eb, img, focal, tone });
  }
  const svg = await satori(tree, { width: 1000, height: 1500, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
}
