import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { CABIN_SEMIBOLD } from './fonts.mjs';
import { CABIN_400 } from './journalfonts.mjs';
import { CORMORANT, AURELLIE } from './pinfonts.mjs';

/**
 * The Plate set — drawn only from the pins Katie has picked out as ones she
 * likes, several of which are already earning traction on Pinterest.
 *
 * THE RULE THAT SHAPES ALL OF IT
 * Every pin type must be able to use every photograph. The library is 3:2
 * landscape with Katie small in a wide room, so the earlier sets kept running
 * into poses that physically could not fill a portrait window, and templates
 * ended up with eligibility lists. Here, five of the six templates put the
 * photograph in a landscape band — which every photo fits by definition — and
 * the sixth letterboxes rather than excluding. No pose is ever turned away.
 *
 * THREE FAMILIES, from the reference pins
 *   Plate   — title above, photograph banded, air below     (pose, practice)
 *   Frame   — a bordered card, centred stack, inset photo    (routine, practice, offer)
 *   Panel   — photograph on top, coloured panel beneath      (journal, video, routine)
 * plus Immersive (type over a full-bleed photograph) and Watch (the video pin),
 * both of which Katie flagged as working.
 */

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

/** Ground, ink, accent and rule per colourway. */
const pal = (tone) =>
  tone === 'dark'
    ? { g: SAGE, i: OAT, acc: QUARTZ, soft: 'rgba(249,241,234,0.74)', rule: 'rgba(249,241,234,0.30)', gRGB: '72,84,76' }
    : { g: OAT, i: SAGE, acc: ROSEWOOD, soft: MUTED, rule: LINE, gRGB: '249,241,234' };

const box = (style, children) => ({ type: 'div', props: { style: { display: 'flex', ...style }, ...(children !== undefined ? { children } : {}) } });
const caps = (t) => (t || '').toUpperCase();

/* ── The shared voice ─────────────────────────────────────────────────────
   Taken from the reference pins: a small tracked accent eyebrow, a Cormorant
   title with real air around it, quiet body copy, and the wordmark last. */
const eyebrow = (text, color, { center = true } = {}) =>
  box({
    fontFamily: 'Cabin', fontWeight: 600, fontSize: '26px', letterSpacing: '5.2px',
    lineHeight: 1, color, ...(center ? { justifyContent: 'center' } : {}),
  }, caps(text));

const title = (text, color, size = 76, { center = true, width = '820px', ...extra } = {}) =>
  box({
    fontFamily: 'Serif', fontSize: `${size}px`, lineHeight: 1.14, letterSpacing: '-0.5px',
    color, width, ...(center ? { justifyContent: 'center', textAlign: 'center' } : {}), ...extra,
  }, text);

const body = (text, color, { center = true, size = 30, width = '760px', ...extra } = {}) =>
  box({
    fontFamily: 'Cabin', fontWeight: 400, fontSize: `${size}px`, lineHeight: 1.5,
    color, width, ...(center ? { justifyContent: 'center', textAlign: 'center' } : {}), ...extra,
  }, text);

const meta = (text, color) =>
  box({ fontFamily: 'Cabin', fontWeight: 600, fontSize: '23px', letterSpacing: '3.4px', color, justifyContent: 'center' }, caps(text));

const wordmark = (color, { center = true, opacity = 0.75 } = {}) =>
  box({
    fontFamily: 'Cabin', fontWeight: 400, fontSize: '24px', letterSpacing: '3.6px',
    color, opacity, ...(center ? { justifyContent: 'center' } : {}),
  }, 'yinyogawithkatie.com');

/** The short centred divider the reference pins use between blocks. */
const divider = (p, width = 72) =>
  box({ justifyContent: 'center' }, [box({ width: `${width}px`, height: '1px', backgroundColor: p.rule })]);

const spacer = () => box({ flexGrow: 1 });

/**
 * A photograph in a landscape band.
 *
 * `cover` on a band that is itself landscape keeps the whole pose for every
 * photo in the library — this is the mechanism that removes eligibility from
 * the system entirely.
 */
const band = (w, h, img, focal = '50% 50%', style = {}) =>
  img
    ? { type: 'img', props: { src: img, style: { width: `${w}px`, height: `${h}px`, objectFit: 'cover', objectPosition: focal, ...style } } }
    : box({ width: `${w}px`, height: `${h}px`, backgroundColor: LINE, ...style });

/* ═══ 01 · Plate ══════════════════════════════════════════════════════════
   Eyebrow and title above, the photograph in a full-width band, and air below.
   The quietest pin in the set and the one already earning traction. */
function plate({ eyebrow: eb, headline, photo, focal, tone, footnote }) {
  const p = pal(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g }, [
    box({ flexDirection: 'column', alignItems: 'center', gap: '26px', padding: '96px 80px 0' }, [
      eyebrow(eb, p.acc),
      title(headline, p.i, 76),
    ]),
    box({ marginTop: '58px' }, [band(1000, 600, photo, focal)]),
    spacer(),
    box({ flexDirection: 'column', alignItems: 'center', gap: '22px', padding: '0 80px 92px' }, [
      ...(footnote ? [body(footnote, p.soft, { size: 27 }), divider(p)] : []),
      wordmark(p.i),
    ]),
  ]);
}

/* ═══ 02 · Frame ══════════════════════════════════════════════════════════
   A bordered card: everything centred, the photograph inset and rounded. The
   "Deep Hips" pin. Carries the most information of the set without crowding. */
function frame({ eyebrow: eb, headline, metaLine, blurb, photo, focal, tone, offer, cta }) {
  const p = pal(tone);
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    box({ position: 'absolute', top: '28px', left: '28px', right: '28px', bottom: '28px', border: `1px solid ${p.rule}` }),
    box({
      position: 'absolute', top: '28px', left: '28px', right: '28px', bottom: '28px',
      flexDirection: 'column', alignItems: 'center', padding: '108px 96px 76px', gap: '24px',
    }, [
      eyebrow(eb, p.acc),
      title(headline, p.i, 84, { width: '740px' }),
      ...(metaLine ? [meta(metaLine, p.soft)] : []),
      ...(blurb ? [box({ marginTop: '10px' }, [body(blurb, p.soft, { width: '700px' })])] : []),
      box({ marginTop: '14px' }, [divider(p)]),
      ...(photo ? [box({ marginTop: '30px' }, [band(700, 470, photo, focal, { borderRadius: '10px' })])] : []),
      ...(offer ? [box({ marginTop: '34px', flexDirection: 'column', alignItems: 'center', gap: '24px' }, [
        box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '28px', color: p.acc }, offer),
        box({
          backgroundColor: ROSEWOOD, color: CARD, borderRadius: '999px', padding: '24px 46px',
          fontFamily: 'Cabin', fontWeight: 600, fontSize: '30px', letterSpacing: '0.6px',
        }, cta || ''),
      ])] : []),
      spacer(),
      wordmark(p.i),
    ]),
  ]);
}

/* ═══ 03 · Panel ══════════════════════════════════════════════════════════
   Photograph on top, a coloured panel beneath carrying the whole message.
   The strongest of the three for anything with a sentence to say. */
function panel({ eyebrow: eb, headline, blurb, photo, focal, tone, photoH = 700 }) {
  const p = pal(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g }, [
    band(1000, photoH, photo, focal),
    box({ flexGrow: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', padding: '72px 88px 76px' }, [
      eyebrow(eb, p.acc),
      title(headline, p.i, 72, { width: '800px' }),
      ...(blurb ? [body(blurb, p.soft, { width: '740px' })] : []),
      divider(p),
      wordmark(p.i),
    ]),
  ]);
}

/* ═══ 04 · Immersive ══════════════════════════════════════════════════════
   Type over a full-bleed photograph. The one template a wide pose cannot fill,
   so a wide pose letterboxes into the ground instead of being excluded — the
   veil and the type are identical either way. */
function immersive({ eyebrow: eb, headline, blurb, photo, focal, tone, fit = false, footnote }) {
  const p = pal(tone);
  const dark = tone === 'dark';
  const ink = dark ? CARD : SAGE;
  const shade = dark ? '0 2px 30px rgba(46,52,47,0.45)' : '0 2px 24px rgba(249,241,234,0.75)';
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    fit
      // Too wide to fill: the photograph sits at its own shape, high in the
      // frame, and the ground carries the rest. Deliberate, not a fallback.
      ? box({ position: 'absolute', top: '210px', left: '0' }, [band(1000, 660, photo, focal)])
      : band(1000, 1500, photo, focal, { position: 'absolute', top: '0', left: '0' }),
    box({
      position: 'absolute', left: '0', bottom: '0', width: '1000px', height: '860px',
      backgroundImage: `linear-gradient(180deg, rgba(${p.gRGB},0) 0%, rgba(${p.gRGB},0.28) 26%, rgba(${p.gRGB},0.70) 52%, rgba(${p.gRGB},0.92) 74%, rgba(${p.gRGB},0.97) 100%)`,
    }),
    box({ position: 'absolute', top: '56px', left: '56px' }, [
      box({
        backgroundColor: dark ? CARD : SAGE, color: dark ? SAGE : OAT,
        fontFamily: 'Cabin', fontWeight: 600, fontSize: '25px', letterSpacing: '4.4px',
        padding: '16px 30px 14px', borderRadius: '999px',
      }, caps(eb)),
    ]),
    box({ position: 'absolute', left: '72px', right: '72px', bottom: '76px', flexDirection: 'column', gap: '26px' }, [
      title(headline, ink, 88, { center: false, width: '850px', textShadow: shade }),
      ...(blurb ? [body(blurb, p.soft, { center: false, size: 30, width: '790px' })] : []),
      box({ height: '1px', backgroundColor: p.rule, marginTop: '10px' }),
      box({ alignItems: 'baseline', justifyContent: 'space-between', gap: '20px' }, [
        box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '25px', color: p.acc }, footnote || ''),
        wordmark(p.i, { center: false, opacity: 0.8 }),
      ]),
    ]),
  ]);
}

/* ═══ 05 · Watch ══════════════════════════════════════════════════════════
   The video pin: a run-time badge with a play mark, the audience on a tab that
   enters from the left edge, and the message on solid ground beneath. */
function watch({ eyebrow: eb, headline, blurb, photo, focal, tone, duration, footnote }) {
  const p = pal(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g }, [
    box({ position: 'relative', flexShrink: 0 }, [
      band(1000, 820, photo, focal),
      box({
        position: 'absolute', top: '52px', right: '56px', alignItems: 'center', gap: '16px',
        backgroundColor: 'rgba(46,52,47,0.90)', color: OAT, borderRadius: '999px',
        padding: '18px 34px 18px 28px', fontFamily: 'Cabin', fontWeight: 600, fontSize: '26px', letterSpacing: '2.6px',
        boxShadow: 'inset 0 0 0 1px rgba(249,241,234,0.30)',
      }, [
        box({ width: '16px', height: '18px', backgroundColor: OAT, clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)' }),
        box({}, duration || ''),
      ]),
      box({
        position: 'absolute', left: '0', bottom: '46px',
        backgroundColor: CARD, color: ROSEWOOD,
        fontFamily: 'Cabin', fontWeight: 600, fontSize: '25px', letterSpacing: '4.4px',
        padding: '17px 34px 15px 56px', borderRadius: '0 999px 999px 0',
      }, caps(eb)),
    ]),
    box({ flexGrow: 1, flexDirection: 'column', gap: '24px', padding: '62px 72px 0' }, [
      title(headline, p.i, 72, { center: false, width: '856px' }),
      ...(blurb ? [body(blurb, p.soft, { center: false, size: 30, width: '820px' })] : []),
    ]),
    box({ flexDirection: 'column', gap: '26px', padding: '0 72px 68px' }, [
      box({ height: '1px', backgroundColor: p.rule }),
      box({ alignItems: 'baseline', justifyContent: 'space-between', gap: '20px' }, [
        box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '25px', color: p.acc }, footnote || ''),
        wordmark(p.i, { center: false, opacity: 0.8 }),
      ]),
    ]),
  ]);
}

/* ═══ 06 · Offer ══════════════════════════════════════════════════════════
   Lead magnets and the course. Built in the Frame language rather than as a
   new shape, so the one pin that asks for something still looks like the rest.
   The signature is the only thing that marks it as personal. */
function offerPin({ eyebrow: eb, headline, blurb, photo, focal, tone, offer, cta, footnote }) {
  const p = pal(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g }, [
    band(1000, 560, photo, focal, {
      maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
    }),
    box({ flexGrow: 1, flexDirection: 'column', alignItems: 'center', gap: '26px', padding: '20px 88px 68px' }, [
      eyebrow(eb, p.acc),
      title(headline, p.i, 80, { width: '780px' }),
      ...(blurb ? [body(blurb, p.soft, { width: '720px' })] : []),
      box({ marginTop: '6px' }, [divider(p)]),
      box({ fontFamily: 'Cabin', fontWeight: 400, fontSize: '28px', color: p.acc }, offer || ''),
      box({
        marginTop: '4px', alignItems: 'center', gap: '14px',
        backgroundColor: ROSEWOOD, color: CARD, borderRadius: '999px', padding: '25px 46px',
        fontFamily: 'Cabin', fontWeight: 600, fontSize: '30px',
      }, [
        box({}, cta || ''),
        box({ width: '15px', height: '15px', borderTop: `2px solid ${CARD}`, borderRight: `2px solid ${CARD}`, transform: 'rotate(45deg)' }),
      ]),
      spacer(),
      box({ fontFamily: 'Script', fontSize: '76px', lineHeight: 0.9, color: p.acc }, 'katie'),
      box({ marginTop: '6px' }, [wordmark(p.i)]),
    ]),
  ]);
}

const TEMPLATES = { plate, frame, panel, immersive, watch, offer: offerPin };

/** Render a 1000×1500 Plate-set pin to a PNG Buffer. */
export async function renderPlatePin({ tpl = 'plate', ...props }) {
  const build = TEMPLATES[tpl];
  if (!build) throw new Error(`Unknown plate template: ${tpl}`);
  const svg = await satori(build(props), { width: 1000, height: 1500, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
}

export const PLATE_TEMPLATES = Object.keys(TEMPLATES);
