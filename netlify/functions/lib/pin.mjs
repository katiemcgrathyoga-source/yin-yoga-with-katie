import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { CABIN_SEMIBOLD } from './fonts.mjs';
import { CABIN_400 } from './journalfonts.mjs';
import { CORMORANT, AURELLIE } from './pinfonts.mjs';

// Cormorant Garamond (light display serif) for titles, Cabin for eyebrows/wordmark,
// Aurellie Calestion for the signed "katie" signature only.
const FONTS = [
  { name: 'Serif', data: Buffer.from(CORMORANT, 'base64'), weight: 500, style: 'normal' },
  { name: 'Cabin', data: CABIN_400, weight: 400, style: 'normal' },
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

/* ═══════════════════════════════════════════════════════════════════════════
   The benefit-led set (v2), after the second design pass.
   Spec: design/pin-second-pass.md. Every number here came from that document.

   Three things every template assumes:
     - copy is already within limits. Satori cannot shrink type to fit, so the
       schema (`pin_angles`) fails the build rather than letting a headline run
       off the canvas here.
     - the photo is subject-centred. scripts/gen-pin-crops.mjs recomposes each
       pose around Katie once, so these only set a vertical focal.
     - a pose only reaches a template whose crop can hold it. The windows below
       are tighter than the first pass, so src/lib/pinInventory.ts recomputes
       eligibility from these exact numbers — see TEMPLATE_ASPECT there.
   ═══════════════════════════════════════════════════════════════════════════ */

const CARD_DARK = '#3F4B45';
/** Ground, accent and rule as raw RGB, for building gradients per colourway. */
const RGB = {
  dark:  { g: '72,84,76',      a: '188,157,154', r: '249,241,234' },
  light: { g: '249,241,234',   a: '137,73,75',   r: '228,218,207' },
};
const rgbFor = (tone) => RGB[tone === 'dark' ? 'dark' : 'light'];

const pal2 = (tone) =>
  tone === 'dark'
    ? { g: SAGE, i: OAT, acc: QUARTZ, ln: 'rgba(249,241,234,0.24)', soft: 'rgba(249,241,234,0.74)', card: CARD_DARK, pill: OAT, pi: SAGE, rim: 'rgba(249,241,234,0.30)' }
    : { g: OAT, i: SAGE, acc: ROSEWOOD, ln: LINE, soft: MUTED, card: CARD, pill: SAGE, pi: OAT, rim: 'rgba(228,218,207,0.95)' };

// Satori has no em units, so tracking is resolved to px at the call site.
const caps = (t) => (t || '').toUpperCase();

/* ── The shared type scale ────────────────────────────────────────────────
   One modular scale all eight inherit. Eight templates that share a scale read
   as one system in a feed; per-template tuning is what made the first pass
   inconsistent. The character limits are derived from these sizes — move one
   and the limits in src/lib/pinBoards.ts have to be re-measured. */
const eye = (text, color) =>
  box({ fontFamily: 'Cabin', fontWeight: 600, fontSize: '26px', letterSpacing: '5.2px', lineHeight: 1, color }, caps(text));
const hl = (text, color, size = 80, extra = {}) =>
  box({ fontFamily: 'Serif', fontSize: `${size}px`, lineHeight: 1.06, letterSpacing: '-0.8px', color, ...extra }, text);
const sub = (text, color, extra = {}) =>
  box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '32px', lineHeight: 1.45, color, ...extra }, text);
const idLine = (text, color) =>
  box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '26px', letterSpacing: '1.6px', color }, text);
const wordmark2 = (color, opacity = 0.8) =>
  box({ fontFamily: 'Cabin', fontWeight: 600, fontSize: '23px', letterSpacing: '4.6px', color, opacity }, 'yinyogawithkatie.com');
const signature = (color, size = 62) =>
  box({ fontFamily: 'Script', fontSize: `${size}px`, lineHeight: 0.8, color }, 'katie');

/** A hairline that fades out before it reaches either margin. */
const fadedRule = (tone, extra = {}) =>
  box({
    height: '1px', flexShrink: 0,
    backgroundImage: `linear-gradient(90deg, rgba(${rgbFor(tone).r},0) 0%, rgba(${rgbFor(tone).r},0.5) 14%, rgba(${rgbFor(tone).r},0.5) 86%, rgba(${rgbFor(tone).r},0) 100%)`,
    ...extra,
  });

const footRow = (id, p, { border = true, tone = 'light' } = {}) =>
  box({ flexDirection: 'column' }, [
    ...(border ? [fadedRule(tone, { marginBottom: '26px' })] : []),
    box({ alignItems: 'baseline', justifyContent: 'space-between', gap: '20px' }, [
      idLine(id || '', p.acc),
      wordmark2(p.i, 0.8),
    ]),
  ]);

const spacer = () => box({ flexGrow: 1 });
const cover = (w, h, img, focal, style = {}) =>
  img
    ? { type: 'img', props: { src: img, style: { width: `${w}px`, height: `${h}px`, objectFit: 'cover', objectPosition: focal || '50% 52%', ...style } } }
    : box({ width: `${w}px`, height: `${h}px`, backgroundColor: LINE, ...style });

// 01 Benefit hook — full-bleed photograph. Contrast is bought with a shadow on
// the type rather than opacity on the veil, so the bottom of the frame survives.
function tplHook({ headline, audience, proof, identifier, img, focal, tone }) {
  const dark = tone === 'dark';
  const { g } = rgbFor(tone);
  const ink = dark ? CARD : SAGE;
  const c = dark
    ? { eye: '#E6D2CF', sub: 'rgba(249,241,234,0.88)', id: 'rgba(249,241,234,0.78)', mark: OAT }
    : { eye: ROSEWOOD, sub: MUTED, id: ROSEWOOD, mark: SAGE };
  const shadow = dark ? '0 2px 30px rgba(46,52,47,0.45)' : '0 2px 24px rgba(249,241,234,0.75)';
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: dark ? SAGE : OAT }, [
    cover(1000, 1500, img, focal, { position: 'absolute', top: '0', left: '0' }),
    // Two parts: a long ramp for overall legibility, and a radial pocket that
    // puts the density under the words and lets the right of the frame stay
    // photographic.
    box({
      position: 'absolute', left: '0', bottom: '0', width: '1000px', height: '780px',
      backgroundImage: `linear-gradient(180deg, rgba(${g},0) 0%, rgba(${g},0.16) 18%, rgba(${g},0.44) 38%, rgba(${g},0.70) 56%, rgba(${g},0.86) 74%, rgba(${g},0.93) 100%)`,
    }),
    box({
      position: 'absolute', left: '0', bottom: '0', width: '1000px', height: '640px',
      backgroundImage: `radial-gradient(115% 78% at 4% 94%, rgba(${g},0.70) 0%, rgba(${g},0.32) 46%, rgba(${g},0) 78%)`,
    }),
    box({ position: 'absolute', left: '72px', right: '72px', bottom: '64px', flexDirection: 'column', gap: '28px' }, [
      box({ fontFamily: 'Cabin', fontWeight: 600, fontSize: '26px', letterSpacing: '5.2px', lineHeight: 1, color: c.eye, textShadow: `0 1px 12px rgba(${g},0.8)` }, caps(audience)),
      hl(headline, ink, 100, { width: '860px', textShadow: shadow }),
      sub(proof, c.sub, { textShadow: `0 1px 14px rgba(${g},0.85)` }),
      box({ flexDirection: 'column' }, [
        fadedRule(tone, { marginBottom: '24px' }),
        box({ alignItems: 'baseline', justifyContent: 'space-between', gap: '20px' }, [
          idLine(identifier || '', c.id),
          wordmark2(c.mark, 1),
        ]),
      ]),
    ]),
  ]);
}

// 02 Benefit card — no photograph, so the surface itself carries the weight.
// Direction A: a pressed panel — inset rim, inset bloom, and a lit corner.
function tplCard({ headline, audience, proof, identifier, tone }) {
  const p = pal2(tone);
  const { a } = rgbFor(tone);
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    box({
      position: 'absolute', top: '40px', left: '40px', width: '920px', height: '1420px',
      borderRadius: '20px',
      backgroundImage: `radial-gradient(88% 58% at 10% 4%, rgba(${a},0.16) 0%, rgba(${a},0) 62%)`,
      boxShadow: `inset 0 0 0 1px ${p.rim}, inset 0 0 180px rgba(${a},0.14)`,
    }),
    box({
      position: 'absolute', left: '104px', right: '104px', top: '132px', bottom: '112px',
      flexDirection: 'column', gap: '36px',
    }, [
      // A spacer either side of the type: the block centres in the space above
      // the footer instead of hanging off the top edge with a void beneath it.
      spacer(),
      eye(audience, p.acc),
      hl(headline, p.i, 125, { lineHeight: 1.02, width: '792px' }),
      sub(proof, p.soft),
      spacer(),
      box({ alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }, [
        idLine(identifier || '', p.acc),
        signature(p.acc, 112),
      ]),
    ]),
  ]);
}

// 03 Problem → poses — the thumbnails take the brand arch, the numerals become
// display type, and the rules stop hitting the margins. Rows fill the column
// rather than centring in it, which is what buys eight rows their legibility.
function tplPoseList({ headline, audience, proof, identifier, items = [], tone }) {
  const p = pal2(tone);
  const { g } = rgbFor(tone);
  const dense = items.length > 6;
  const th = dense ? 92 : 100;
  const rows = items.map((it, i) =>
    box({ flexGrow: 1, minHeight: `${dense ? 108 : 132}px`, flexDirection: 'column', justifyContent: 'center' }, [
      // The first row has no rule above it, so the block doesn't read as a table.
      i === 0 ? box({ height: '1px' }) : fadedRule(tone),
      box({ flexGrow: 1, alignItems: 'center' }, [
        box({ fontFamily: 'Serif', fontSize: '50px', lineHeight: 1, width: '54px', color: p.acc, flexShrink: 0 }, String(i + 1)),
        ...(it.thumb ? [cover(th, th, it.thumb, it.focal ?? '50% 42%', {
          borderRadius: `${th / 2}px ${th / 2}px 8px 8px`, marginRight: '30px', flexShrink: 0,
          boxShadow: `inset 0 0 0 1px rgba(${g},0.40)`,
        })] : []),
        box({ flexGrow: 1, flexDirection: 'column', gap: '2px' }, [
          box({ fontFamily: 'Cabin', fontWeight: 600, fontSize: '40px', lineHeight: 1.15, color: p.i }, it.name || ''),
          ...(it.note && !dense ? [box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '24px', color: p.soft }, it.note)] : []),
        ]),
        box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '32px', paddingLeft: '24px', color: p.soft, flexShrink: 0 }, it.hold || ''),
      ]),
    ]),
  );
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    box({ position: 'absolute', left: '64px', right: '64px', top: '72px', flexDirection: 'column', gap: '22px' }, [
      eye(audience, p.acc),
      hl(headline, p.i, 80, { width: '872px' }),
      sub(proof, p.soft),
    ]),
    box({ position: 'absolute', left: '64px', right: '64px', top: `${dense ? 452 : 500}px`, bottom: '158px', flexDirection: 'column' }, rows),
    box({ position: 'absolute', left: '64px', right: '64px', bottom: '64px', flexDirection: 'column' }, [footRow(identifier, p, { tone })]),
  ]);
}

// 04 Split — the arch is the one element genuinely lifted off the ground, so it
// is the one element allowed to cast a shadow.
function tplSplit({ headline, audience, proof, poseName, identifier, img, focal, tone }) {
  const p = pal2(tone);
  const { g, a } = rgbFor(tone);
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    box({ position: 'absolute', left: '64px', right: '64px', top: '70px', flexDirection: 'column', gap: '22px' }, [
      eye(audience, p.acc),
      hl(headline, p.i, 80, { width: '872px' }),
      sub(proof, p.soft),
    ]),
    cover(808, 1000, img, focal, {
      position: 'absolute', left: '96px', top: '436px',
      borderRadius: '404px 404px 16px 16px',
      // In paint order: the hairline, a top vignette so the empty upper wall
      // stops reading as a hole, a bottom lift in the ground colour so the mat
      // dissolves into the pin, and the only outer shadow in the set.
      boxShadow: `inset 0 0 0 1px rgba(${g},0.55), inset 0 70px 130px -70px rgba(46,52,47,0.30), inset 0 -90px 100px -50px rgba(${g},0.45), 0 30px 70px -34px rgba(46,52,47,0.38)`,
    }),
    box({
      position: 'absolute', left: '96px', top: '1236px', flexDirection: 'column', gap: '2px',
      backgroundColor: p.card, padding: '22px 36px 24px', borderRadius: '0 14px 0 0',
      boxShadow: `inset 0 0 0 1px rgba(${a},0.35), 0 14px 34px -14px rgba(46,52,47,0.40)`,
    }, [
      box({ fontFamily: 'Serif', fontSize: '40px', color: p.i }, poseName || ''),
      box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '22px', color: p.soft }, identifier || ''),
    ]),
    box({ position: 'absolute', left: '64px', right: '64px', bottom: '52px', alignItems: 'center', justifyContent: 'space-between' }, [
      wordmark2(p.i, 0.8),
      signature(p.acc, 62),
    ]),
  ]);
}

// 05 Offer — the pill and the call to action are the only two filled shapes.
// Rosewood on oat is 5.2:1; the quartz-on-sage it replaced was 1.6:1.
function tplOffer({ headline, audience, proof, offer, cta, identifier, img, focal, tone }) {
  const p = pal2(tone);
  const { a } = rgbFor(tone);
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    // The band's last third masks to zero, so the card sits in a fade rather
    // than on a seam — which is what removes the slivers either side of it.
    cover(1000, 800, img, focal, {
      maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 64%, rgba(0,0,0,0.42) 86%, rgba(0,0,0,0) 100%)',
    }),
    box({
      position: 'absolute', top: '56px', left: '56px', backgroundColor: p.pill, color: p.pi,
      fontFamily: 'Cabin', fontWeight: 600, fontSize: '26px', letterSpacing: '5.2px',
      padding: '18px 32px', borderRadius: '999px',
      boxShadow: `inset 0 0 0 1px rgba(${a},0.40), 0 10px 26px -12px rgba(46,52,47,0.35)`,
    }, caps(audience)),
    box({
      position: 'absolute', left: '48px', right: '48px', bottom: '148px',
      flexDirection: 'column', gap: '24px',
      backgroundColor: p.card, borderRadius: '16px', padding: '76px 64px 64px',
      boxShadow: `0 40px 80px -32px rgba(46,52,47,0.45), inset 0 0 0 1px ${p.rim}`,
    }, [
      hl(headline, p.i, 80, { width: '760px' }),
      sub(proof, p.soft),
      fadedRule(tone, { marginTop: '40px' }),
      box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '28px', color: p.acc, marginTop: '20px' }, offer || ''),
      box({
        alignSelf: 'flex-start', alignItems: 'center', gap: '14px', marginTop: '10px',
        backgroundColor: ROSEWOOD, color: CARD, borderRadius: '999px', padding: '26px 44px',
        fontFamily: 'Cabin', fontWeight: 600, fontSize: '32px',
        boxShadow: 'inset 0 -3px 0 rgba(46,52,47,0.22), 0 16px 30px -14px rgba(137,73,75,0.55)',
      }, [
        box({}, cta || ''),
        // Two borders on a rotated square — an arrow Satori will actually draw.
        box({ width: '16px', height: '16px', borderTop: '2px solid #FDF8F2', borderRight: '2px solid #FDF8F2', transform: 'rotate(45deg)' }),
      ]),
    ]),
    box({ position: 'absolute', left: '64px', right: '64px', bottom: '52px' }, [
      box({ fontFamily: 'Cabin', fontWeight: 600, fontSize: '25px', letterSpacing: '4.6px', color: p.i, opacity: 0.85 }, identifier || 'yinyogawithkatie.com'),
    ]),
  ]);
}

// 06 Before → after — the 0.55 opacity on the first line does the work the
// separator cannot at 236px: a faint line becoming a solid one.
function tplStates({ audience, before, after, proof, identifier, img, focal, tone }) {
  const p = pal2(tone);
  const { r } = rgbFor(tone);
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    box({ position: 'absolute', left: '64px', right: '64px', top: '76px', flexDirection: 'column' }, [
      eye(audience, p.acc),
      box({ marginTop: '34px' }, [hl(before, p.i, 100, { width: '860px', opacity: 0.55 })]),
      box({ alignItems: 'center', gap: '26px', marginTop: '34px', marginBottom: '34px' }, [
        box({ flexGrow: 1, height: '1px', backgroundImage: `linear-gradient(90deg, rgba(${r},0) 0%, rgba(${r},0.6) 100%)` }),
        box({ width: '22px', height: '22px', flexShrink: 0, borderRight: `2px solid ${p.acc}`, borderBottom: `2px solid ${p.acc}`, transform: 'rotate(45deg)' }),
        box({ flexGrow: 1, height: '1px', backgroundImage: `linear-gradient(90deg, rgba(${r},0.6) 0%, rgba(${r},0) 100%)` }),
      ]),
      hl(after, p.i, 100, { width: '860px' }),
      box({ marginTop: '40px' }, [sub(proof, p.soft)]),
      box({ marginTop: '30px' }, [footRow(identifier, p, { tone })]),
    ]),
    box({ position: 'absolute', left: '0', bottom: '0', width: '1000px', height: '940px' }, [
      cover(1000, 940, img, focal, {
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 7%, rgba(0,0,0,1) 19%, rgba(0,0,0,1) 100%)',
      }),
    ]),
  ]);
}

// 07 Watch with me — a clipPath triangle is the difference between a time and a
// video, and the tab is the one element that ignores the colourway: a sage tab
// on a photograph is a grey blob.
function tplVideo({ headline, audience, proof, identifier, duration, img, focal, tone }) {
  const p = pal2(tone);
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    cover(1000, 900, img, focal, {
      maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 82%, rgba(0,0,0,0.4) 94%, rgba(0,0,0,0) 100%)',
    }),
    box({
      position: 'absolute', top: '56px', right: '56px', alignItems: 'center', gap: '16px',
      backgroundColor: 'rgba(46,52,47,0.90)', color: OAT, borderRadius: '999px',
      padding: '18px 34px 18px 28px',
      fontFamily: 'Cabin', fontWeight: 600, fontSize: '26px', letterSpacing: '2.6px',
      boxShadow: 'inset 0 0 0 1px rgba(249,241,234,0.30), 0 12px 30px -12px rgba(46,52,47,0.55)',
    }, [
      box({ width: '16px', height: '18px', backgroundColor: '#F9F1EA', clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)' }),
      box({}, duration || ''),
    ]),
    box({
      position: 'absolute', left: '0', top: '766px',
      backgroundColor: '#FDF8F2', color: ROSEWOOD,
      fontFamily: 'Cabin', fontWeight: 600, fontSize: '26px', letterSpacing: '5.2px',
      padding: '18px 36px 18px 56px', borderRadius: '0 999px 999px 0',
      boxShadow: '0 14px 32px -14px rgba(46,52,47,0.45)',
    }, caps(audience)),
    box({ position: 'absolute', left: '64px', right: '64px', top: '960px', flexDirection: 'column', gap: '24px' }, [
      hl(headline, p.i, 80, { width: '872px' }),
      sub(proof, p.soft),
    ]),
    box({ position: 'absolute', left: '64px', right: '64px', bottom: '64px', flexDirection: 'column' }, [footRow(identifier, p, { tone })]),
  ]);
}

// 08 Window — a large calm image with a caption under it. The surplus the old
// space-between was distributing went to the photograph.
function tplWindow({ headline, audience, proof, identifier, img, focal, tone, photoH = 850 }) {
  const p = pal2(tone);
  const { a } = rgbFor(tone);
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    box({ position: 'absolute', left: '64px', right: '64px', top: '70px', flexDirection: 'column', gap: '28px' }, [
      box({
        alignSelf: 'flex-start', backgroundColor: p.pill, color: p.pi,
        fontFamily: 'Cabin', fontWeight: 600, fontSize: '26px', letterSpacing: '5.2px',
        padding: '16px 30px', borderRadius: '999px',
        boxShadow: `inset 0 0 0 1px rgba(${a},0.45)`,
      }, caps(audience)),
      hl(headline, p.i, 80, { width: '872px' }),
    ]),
    // The height adapts to the pose. 850 is the design's figure, but a wide
    // shape cropped to 1000x850 loses its ends — Sleeping Swan is 93% of her
    // frame — so the inventory sends the tallest window that still holds her.
    box({ position: 'absolute', left: '0', top: '340px', width: '1000px', height: `${photoH}px` }, [
      cover(1000, photoH, img, focal, {
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 9%, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%)',
      }),
    ]),
    box({ position: 'absolute', left: '64px', right: '64px', bottom: '64px', flexDirection: 'column' }, [
      sub(proof, p.soft),
      fadedRule(tone, { marginTop: '44px', marginBottom: '26px' }),
      box({ alignItems: 'baseline', justifyContent: 'space-between', gap: '20px' }, [
        idLine(identifier || '', p.acc),
        wordmark2(p.i, 0.8),
      ]),
    ]),
  ]);
}

/** Rasterise one finished tree at 1000×1500. */
async function png(tree) {
  const svg = await satori(tree, { width: 1000, height: 1500, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
}

/** Render a 1000×1500 (2:3) Pinterest pin to a PNG Buffer. */
export async function renderPin({ tpl, title, eyebrow: eb, subline, img, focal, quote, items, footer, tone, poseName, identifier, duration, offer, cta, before, after, photoH }) {
  let tree;
  // The v2 set reads the same params under benefit-led names: title is the
  // headline, eyebrow the audience tag, subline the proof.
  const v2 = { headline: title, audience: eb, proof: subline, identifier, img, focal, tone };
  switch (tpl) {
    case 'hook': return png(tplHook(v2));
    case 'card': return png(tplCard(v2));
    case 'poselist': return png(tplPoseList({ ...v2, items }));
    case 'split': return png(tplSplit({ ...v2, poseName }));
    case 'offer': return png(tplOffer({ ...v2, offer, cta }));
    case 'states': return png(tplStates({ ...v2, before, after }));
    case 'video': return png(tplVideo({ ...v2, duration }));
    case 'window': return png(tplWindow({ ...v2, photoH }));
  }
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
