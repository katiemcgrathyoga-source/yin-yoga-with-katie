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
   The benefit-led set (v2). Eight templates that lead with the reader's reason
   rather than the pose name. Spec, character limits and the five headline
   formulas: design/pin-system.html.

   Two things every one of them assumes:
     - copy is already within limits. Satori cannot shrink type to fit, so the
       schema (`pin_angles`) fails the build rather than letting a headline run
       off the canvas here.
     - the photo is subject-centred. scripts/gen-pin-crops.mjs recomposes each
       pose around Katie once, into /poses/pin/, so these only set a vertical
       focal and can trust the horizontal.
   ═══════════════════════════════════════════════════════════════════════════ */

const CARD_DARK = '#3F4B45';
const SCRIM = 'rgba(38,44,39,';

// The v2 token set. Kept separate from pal() so the older templates are untouched.
const pal2 = (tone) =>
  tone === 'dark'
    ? { g: SAGE, i: OAT, acc: QUARTZ, ln: 'rgba(249,241,234,0.24)', soft: 'rgba(249,241,234,0.74)', card: CARD_DARK, pill: OAT, pi: SAGE }
    : { g: OAT, i: SAGE, acc: ROSEWOOD, ln: LINE, soft: MUTED, card: CARD, pill: SAGE, pi: OAT };

// Satori has no text-transform, so caps are applied in JS, and no em units, so
// tracking is resolved to px at the call site.
const caps = (t) => (t || '').toUpperCase();
const eye = (text, color, size = 30, track = 0.26) =>
  box({ fontFamily: 'Cabin', fontWeight: 600, fontSize: `${size}px`, letterSpacing: `${(size * track).toFixed(1)}px`, color }, caps(text));
const hl = (text, color, size, extra = {}) =>
  box({ fontFamily: 'Serif', fontSize: `${size}px`, lineHeight: 1.03, letterSpacing: '-1px', color, ...extra }, text);
const sub = (text, color, size = 34) =>
  box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: `${size}px`, lineHeight: 1.35, color }, text);
const wordmark2 = (color, opacity = 0.8) =>
  box({ fontFamily: 'Cabin', fontWeight: 600, fontSize: '23px', letterSpacing: '4.6px', color, opacity }, 'yinyogawithkatie.com');
const idLine = (text, color) => box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '26px', color }, text);
// Identifier and wordmark on one rule. Baseline-aligned so the two sizes sit together.
const footRow = (id, p, { border = true, mark = p.i, markOpacity = 0.8 } = {}) =>
  box(
    {
      alignItems: 'baseline', justifyContent: 'space-between', gap: '20px',
      ...(border ? { paddingTop: '26px', borderTop: `1px solid ${p.ln}` } : {}),
    },
    [idLine(id || '', p.acc), wordmark2(mark, markOpacity)],
  );
const spacer = () => box({ flexGrow: 1 });
const cover = (w, h, img, focal, style = {}) =>
  img
    ? { type: 'img', props: { src: img, style: { width: `${w}px`, height: `${h}px`, objectFit: 'cover', objectPosition: focal || '50% 52%', ...style } } }
    : box({ width: `${w}px`, height: `${h}px`, backgroundColor: LINE, ...style });

// 01 Benefit hook — full-bleed photograph, long scrim, headline over it.
function tplHook({ headline, audience, proof, identifier, img, focal }) {
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: SAGE }, [
    cover(1000, 1500, img, focal, { position: 'absolute', top: '0', left: '0' }),
    box({
      position: 'absolute', top: '0', left: '0', width: '1000px', height: '1500px',
      backgroundImage: `linear-gradient(to top, ${SCRIM}0.94) 0%, ${SCRIM}0.80) 26%, ${SCRIM}0.28) 50%, ${SCRIM}0) 68%)`,
    }),
    box({ position: 'absolute', left: '72px', right: '72px', bottom: '64px', flexDirection: 'column', gap: '28px' }, [
      eye(audience, '#E6D2CF'),
      hl(headline, CARD, 112),
      sub(proof, 'rgba(249,241,234,0.88)'),
      box({ alignItems: 'baseline', justifyContent: 'space-between', gap: '20px', paddingTop: '24px', borderTop: '1px solid rgba(249,241,234,0.4)' }, [
        idLine(identifier || '', 'rgba(249,241,234,0.8)'),
        wordmark2(OAT, 1),
      ]),
    ]),
  ]);
}

// 02 Benefit card — no photograph. The most legible pin in the set at 236px.
function tplCard({ headline, audience, proof, identifier, tone }) {
  const p = pal2(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g, padding: '66px' }, [
    box({ flexGrow: 1, flexDirection: 'column', justifyContent: 'center', gap: '38px', border: `1px solid ${p.ln}`, padding: '76px 62px 62px' }, [
      eye(audience, p.acc),
      hl(headline, p.i, 146, { lineHeight: 0.99 }),
      sub(proof, p.soft, 36),
      box({ alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', paddingTop: '34px', borderTop: `1px solid ${p.ln}` }, [
        idLine(identifier || '', p.acc),
        box({ fontFamily: 'Script', fontSize: '74px', lineHeight: 1, color: p.acc }, 'katie'),
      ]),
    ]),
  ]);
}

// 03 Problem → poses — the save-this workhorse. Over six rows it goes dense and
// drops the thumbnails and notes; type never shrinks.
function tplPoseList({ headline, audience, proof, identifier, items = [], tone }) {
  const p = pal2(tone);
  const dense = items.length > 6;
  // The thumbnails shrink past six rows; they never drop. Eight of the eleven
  // public routines run seven poses or more, so dropping them turned the most
  // common routine pin into a wall of text — which is the one thing this whole
  // system is meant to avoid. The note is what goes; the photograph stays.
  const th = dense ? { w: 66, h: 48 } : { w: 96, h: 70 };
  const rows = items.map((it, i) =>
    box({ alignItems: 'center', gap: '26px', padding: `${dense ? 13 : 24}px 0`, borderBottom: `1px solid ${p.ln}` }, [
      box({ fontFamily: 'Serif', fontSize: '46px', color: p.acc, width: '46px', flexShrink: 0 }, String(i + 1)),
      ...(it.thumb ? [cover(th.w, th.h, it.thumb, it.focal, { borderRadius: '6px', flexShrink: 0 })] : []),
      box({ flexGrow: 1, flexDirection: 'column', gap: '2px' }, [
        box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '36px', color: p.i }, it.name || ''),
        ...(it.note && !dense ? [box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '24px', color: p.soft }, it.note)] : []),
      ]),
      box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '26px', color: p.soft, flexShrink: 0 }, it.hold || ''),
    ]),
  );
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g, padding: '72px 66px 62px' }, [
    eye(audience, p.acc),
    hl(headline, p.i, 96, { marginTop: '18px', marginBottom: '20px' }),
    sub(proof, p.soft),
    box({ flexGrow: 1, flexDirection: 'column', justifyContent: 'center', marginTop: '34px' }, rows),
    footRow(identifier, p),
  ]);
}

// 04 Split — headline block above, arched photograph below. Compact poses only:
// the arch is close to square, so a wide pose loses its ends.
function tplSplit({ headline, audience, proof, poseName, identifier, img, focal, tone }) {
  const p = pal2(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g, padding: '70px 66px 0' }, [
    eye(audience, p.acc),
    hl(headline, p.i, 104, { marginTop: '24px', marginBottom: '22px' }),
    sub(proof, p.soft),
    box({ flexGrow: 1, position: 'relative', marginTop: '34px', marginLeft: '-66px', marginRight: '-66px', overflow: 'hidden' }, [
      cover(1000, 1500, img, focal, { position: 'absolute', top: '0', left: '0', height: '100%', borderRadius: '500px 500px 0 0' }),
      box({ position: 'absolute', left: '0', right: '0', bottom: '0', height: '280px', backgroundImage: `linear-gradient(to top, ${SCRIM}0.82) 0%, ${SCRIM}0) 100%)` }),
      box({ position: 'absolute', left: '66px', bottom: '56px', flexDirection: 'column', gap: '4px' }, [
        box({ fontFamily: 'Serif', fontSize: '46px', color: CARD }, poseName || ''),
        box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '24px', color: 'rgba(249,241,234,0.88)' }, identifier || ''),
      ]),
      box({ position: 'absolute', right: '66px', bottom: '56px' }, [wordmark2(OAT, 1)]),
    ]),
  ]);
}

// 05 Offer — the only template that asks for something. It reads as an
// invitation because the offer sits in the brand's own card, not a badge.
function tplOffer({ headline, audience, proof, offer, cta, identifier, img, focal, tone }) {
  const p = pal2(tone);
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    cover(1000, 720, img, focal),
    box({ position: 'absolute', top: '56px', left: '64px', backgroundColor: p.pill, color: p.pi, fontFamily: 'Cabin', fontWeight: 600, fontSize: '26px', letterSpacing: '6.2px', padding: '14px 30px 11px', borderRadius: '999px' }, caps(audience)),
    box({ position: 'absolute', left: '64px', right: '64px', top: '604px', flexDirection: 'column', gap: '26px', backgroundColor: p.card, border: `1px solid ${p.ln}`, padding: '56px 54px' }, [
      hl(headline, p.i, 104, { lineHeight: 1 }),
      sub(proof, p.soft),
      box({ padding: '20px 0', borderTop: `1px solid ${p.ln}`, borderBottom: `1px solid ${p.ln}`, fontFamily: 'Cabin', fontWeight: 400, fontSize: '28px', color: p.acc }, offer || ''),
      box({ alignSelf: 'flex-start', backgroundColor: p.acc, color: CARD, fontFamily: 'Cabin', fontWeight: 600, fontSize: '28px', letterSpacing: '1.7px', padding: '18px 38px 15px', borderRadius: '999px' }, cta || ''),
    ]),
    // The destination URL stands in for the wordmark here — printing both would
    // put the domain on the pin twice.
    box({ position: 'absolute', left: '64px', right: '64px', bottom: '52px' }, [
      box({ fontFamily: 'Cabin', fontWeight: 600, fontSize: '25px', letterSpacing: '4.6px', color: p.i, opacity: 0.85 }, identifier || 'yinyogawithkatie.com'),
    ]),
  ]);
}

// 06 Before → after — same face, same size, only the colour changes. Both state
// lines must break the same way or the device stops reading.
function tplStates({ audience, before, after, proof, identifier, img, focal, tone }) {
  const p = pal2(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g, padding: '76px 66px 0' }, [
    eye(audience, p.acc),
    box({ marginTop: '34px' }, [hl(before, p.soft, 108, { lineHeight: 1.02 })]),
    // A drawn dot, not an arrow glyph: Cabin has no ↓ and Satori renders a
    // missing glyph as nothing at all rather than tofu, so it fails silently.
    box({ alignItems: 'center', gap: '20px', marginTop: '34px', marginBottom: '34px' }, [
      box({ flexGrow: 1, height: '1px', backgroundColor: p.ln }),
      box({ width: '11px', height: '11px', borderRadius: '999px', backgroundColor: p.acc, flexShrink: 0 }),
      box({ flexGrow: 1, height: '1px', backgroundColor: p.ln }),
    ]),
    hl(after, p.i, 108, { lineHeight: 1.02 }),
    box({ marginTop: '40px' }, [sub(proof, p.soft)]),
    box({ marginTop: '26px', marginBottom: '34px' }, [footRow(identifier, p)]),
    // The photo takes whatever the type leaves, so there is never a gap above it.
    box({ flexGrow: 1, marginLeft: '-66px', marginRight: '-66px', overflow: 'hidden' }, [
      cover(1000, 1500, img, focal, { height: '100%' }),
    ]),
  ]);
}

// 07 Watch with me — the pin whose job is a click to YouTube, not a save.
function tplVideo({ headline, audience, proof, identifier, duration, img, focal, tone }) {
  const p = pal2(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g }, [
    box({ position: 'relative', flexShrink: 0 }, [
      cover(1000, 860, img, focal),
      box({ position: 'absolute', left: '0', right: '0', bottom: '0', height: '220px', backgroundImage: `linear-gradient(to top, ${SCRIM}0.8) 0%, ${SCRIM}0) 100%)` }),
      box({ position: 'absolute', top: '52px', right: '56px', backgroundColor: 'rgba(38,44,39,0.86)', color: OAT, fontFamily: 'Cabin', fontWeight: 600, fontSize: '26px', letterSpacing: '2.6px', padding: '13px 26px 11px', borderRadius: '999px' }, duration || ''),
      box({ position: 'absolute', left: '56px', bottom: '44px' }, [eye(audience, CARD, 28, 0.24)]),
    ]),
    box({ flexGrow: 1, flexDirection: 'column', gap: '24px', padding: '52px 66px 56px' }, [
      hl(headline, p.i, 104),
      sub(proof, p.soft),
      spacer(),
      footRow(identifier, p),
    ]),
  ]);
}

// 08 Window — the one photo template that takes any pose without a crop
// decision. Lying and reclined poses live here.
function tplWindow({ headline, audience, proof, identifier, img, focal, tone }) {
  const p = pal2(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g }, [
    box({ flexDirection: 'column', gap: '28px', padding: '70px 66px 46px' }, [
      box({ alignSelf: 'flex-start', backgroundColor: p.pill, color: p.pi, fontFamily: 'Cabin', fontWeight: 600, fontSize: '27px', letterSpacing: '6.5px', padding: '15px 32px 12px', borderRadius: '999px' }, caps(audience)),
      hl(headline, p.i, 92),
    ]),
    cover(1000, 660, img, focal, { borderTop: `1px solid ${p.ln}`, borderBottom: `1px solid ${p.ln}` }),
    box({ flexGrow: 1, flexDirection: 'column', justifyContent: 'space-between', gap: '28px', padding: '44px 66px 60px' }, [
      sub(proof, p.soft),
      footRow(identifier, p),
    ]),
  ]);
}

/** Rasterise one finished tree at 1000×1500. */
async function png(tree) {
  const svg = await satori(tree, { width: 1000, height: 1500, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
}

/** Render a 1000×1500 (2:3) Pinterest pin to a PNG Buffer. */
export async function renderPin({ tpl, title, eyebrow: eb, subline, img, focal, quote, items, footer, tone, poseName, identifier, duration, offer, cta, before, after }) {
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
    case 'window': return png(tplWindow(v2));
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
