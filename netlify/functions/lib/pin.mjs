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

const box = (style, children) => ({ type: 'div', props: { style: { display: 'flex', ...style }, ...(children !== undefined ? { children } : {}) } });
const wordmark = (color) => box({ fontFamily: 'Cabin', fontSize: '23px', letterSpacing: '2px', color }, 'yinyogawithkatie.com');
const eyebrow = (text, color, size = 24, tracking = '5px') => box({ fontFamily: 'Cabin', fontSize: `${size}px`, letterSpacing: tracking, color }, (text || '').toUpperCase());
// Real <img> with object-fit cover + object-position focal (reliable in satori; matches the crop spec).
const photo = (w, h, img, focal, style = {}) =>
  img
    ? { type: 'img', props: { src: img, style: { width: `${w}px`, height: `${h}px`, objectFit: 'cover', objectPosition: focal || 'center', ...style } } }
    : box({ width: `${w}px`, height: `${h}px`, backgroundColor: LINE, ...style });
const bottomWordmark = (color, bottom) => box({ position: 'absolute', bottom, left: '0', right: '0', justifyContent: 'center' }, [wordmark(color)]);

// 1a — photo-led (upright): square-ish photo on top, oat title band.
function photoLed({ title, eyebrow: eb, img, focal }) {
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: OAT }, [
    photo(1000, 1010, img, focal),
    box({ flexDirection: 'column', flexGrow: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '52px 64px 48px', borderTop: `2px solid ${LINE}`, position: 'relative' }, [
      eb ? box({ fontFamily: 'Cabin', fontSize: '24px', letterSpacing: '5px', color: ROSEWOOD, marginBottom: '24px' }, eb.toUpperCase()) : box({ width: '0', height: '0' }),
      box({ fontFamily: 'Serif', fontSize: '64px', lineHeight: 1.25, color: SAGE, maxWidth: '760px', textAlign: 'center' }, title),
      bottomWordmark(SAGE, '48px'),
    ]),
  ]);
}

// 3a — photo-led landscape band (lying poses): oat header, photo band, footer.
function landscapeBand({ title, eyebrow: eb, img, focal }) {
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: OAT }, [
    box({ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '92px 72px 66px', gap: '24px' }, [
      eb ? box({ fontFamily: 'Cabin', fontSize: '24px', letterSpacing: '5px', color: ROSEWOOD }, eb.toUpperCase()) : box({ width: '0', height: '0' }),
      box({ fontFamily: 'Serif', fontSize: '62px', lineHeight: 1.25, color: SAGE, maxWidth: '800px', textAlign: 'center' }, title),
    ]),
    photo(1000, 620, img, focal, { borderTop: `2px solid ${LINE}`, borderBottom: `2px solid ${LINE}` }),
    box({ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }, [wordmark(SAGE)]),
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
      box({ fontFamily: 'Serif', fontSize: '72px', color: ROSEWOOD }, String(i + 1).padStart(2, '0')),
      box({ flexDirection: 'column' }, [
        box({ fontFamily: 'Serif', fontSize: '42px', color: SAGE }, it.name || ''),
        it.note ? box({ fontFamily: 'Cabin', fontSize: '25px', color: MUTED, marginTop: '6px' }, it.note) : box({ width: '0', height: '0' }),
      ]),
    ]),
  );
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: OAT }, [
    box({ flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: SAGE, padding: '84px 80px 66px' }, [
      eb ? box({ fontFamily: 'Cabin', fontSize: '26px', letterSpacing: '6px', color: QUARTZ, marginBottom: '26px' }, eb.toUpperCase()) : box({ width: '0', height: '0' }),
      box({ fontFamily: 'Serif', fontSize: '66px', lineHeight: 1.25, color: OAT, maxWidth: '760px', textAlign: 'center' }, title),
    ]),
    box({ flexDirection: 'column', flexGrow: 1, justifyContent: 'center', padding: '30px 90px 0' }, rows),
    box({ justifyContent: 'center', padding: '0 0 60px' }, [wordmark(SAGE)]),
  ]);
}

// 1d — quote: rose-quartz wash, big quote mark, script signature.
function quotePin({ quote, eyebrow: eb }) {
  return box({ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: WASH, padding: '120px 100px 90px', position: 'relative' }, [
    eyebrow(eb || 'from the journal', ROSEWOOD),
    box({ fontFamily: 'Serif', fontSize: '200px', lineHeight: 1, height: '120px', color: QUARTZ, marginTop: '40px' }, '“'),
    box({ fontFamily: 'Serif', fontSize: '84px', lineHeight: 1.3, color: SAGE, maxWidth: '560px', textAlign: 'center', marginTop: '14px' }, quote),
    box({ fontFamily: 'Script', fontSize: '82px', color: ROSEWOOD, marginTop: '40px' }, 'katie'),
    bottomWordmark(SAGE, '84px'),
  ]);
}

// 4a — numbered poses ("5 poses for…") with thumbnails.
function numberedPoses({ title, eyebrow: eb, items = [] }) {
  const rows = items.slice(0, 5).map((it, i, arr) =>
    box({ alignItems: 'center', gap: '32px', padding: '24px 0', ...(i < arr.length - 1 ? { borderBottom: `1.5px solid ${LINE}` } : {}) }, [
      box({ fontFamily: 'Serif', fontSize: '52px', color: ROSEWOOD, width: '58px', flexShrink: 0 }, String(i + 1)),
      box({ flexGrow: 1, flexDirection: 'column' }, [
        box({ fontFamily: 'Serif', fontSize: '36px', color: SAGE }, it.name || ''),
        it.note ? box({ fontFamily: 'Cabin', fontSize: '24px', color: MUTED, marginTop: '2px' }, it.note) : box({ width: '0', height: '0' }),
      ]),
      photo(96, 96, it.thumb, it.focal, { borderRadius: '14px', flexShrink: 0 }),
    ]),
  );
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: OAT }, [
    box({ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '84px 80px 0' }, [
      eb ? box({ fontFamily: 'Cabin', fontSize: '24px', letterSpacing: '5px', color: ROSEWOOD, marginBottom: '20px' }, eb.toUpperCase()) : box({ width: '0', height: '0' }),
      box({ fontFamily: 'Serif', fontSize: '72px', lineHeight: 1.2, color: SAGE, maxWidth: '780px', textAlign: 'center' }, title),
    ]),
    box({ flexDirection: 'column', flexGrow: 1, justifyContent: 'center', padding: '36px 84px 0' }, rows),
    box({ justifyContent: 'center', padding: '0 0 56px' }, [wordmark(SAGE)]),
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
    box({ flexDirection: 'column', flexGrow: 1, justifyContent: 'center', marginTop: '48px', textAlign: 'left' }, rows),
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
    box({ width: '100%', flexGrow: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: CARD, border: `1.5px solid ${LINE}`, borderRadius: '24px', padding: '40px 64px', marginTop: '48px', textAlign: 'left' }, rows),
    footer ? box({ fontFamily: 'Cabin', fontSize: '26px', color: MUTED, marginTop: '34px' }, footer) : box({ width: '0', height: '0' }),
    box({ marginTop: '26px' }, [wordmark(SAGE)]),
  ]);
}

/** Render a 1000×1500 (2:3) Pinterest pin to a PNG Buffer. */
export async function renderPin({ tpl, title, eyebrow: eb, img, focal, quote, items, footer }) {
  let tree;
  switch (tpl) {
    case 'text': tree = textLed({ title, eyebrow: eb, img, focal }); break;
    case 'band': tree = landscapeBand({ title, eyebrow: eb, img, focal }); break;
    case 'list': tree = listPin({ title, eyebrow: eb, items }); break;
    case 'quote': tree = quotePin({ quote: quote || title, eyebrow: eb }); break;
    case 'numbered': tree = numberedPoses({ title, eyebrow: eb, items }); break;
    case 'step': tree = stepByStep({ title, eyebrow: eb, img, focal, items }); break;
    case 'ritual': tree = eveningRitual({ title, eyebrow: eb, items }); break;
    case 'checklist': tree = checklist({ title, eyebrow: eb, items, footer }); break;
    default: tree = photoLed({ title, eyebrow: eb, img, focal });
  }
  const svg = await satori(tree, { width: 1000, height: 1500, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
}
