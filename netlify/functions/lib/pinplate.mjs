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
 * both of which Katie flagged as working, and two reference-card additions:
 *   Diagram — Plate's shape, but the air below carries the pose's own
 *             alignment cues instead of standing empty (pose)
 *   Roster  — the routine as a follow-along list: thumbnail, order badge,
 *             name and hold length per row (routine)
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

/* ═══ 01b · Hero ══════════════════════════════════════════════════════════
   Eyebrow, a big photograph, and the pose's own name below it — nothing
   else. Brought back deliberately: real Pinterest data on the pins it
   replaced showed this exact shape (no benefit headline, no cues, just the
   photo and the name) among the best performers in the whole library. Where
   Plate leads with a benefit and Diagram leads with how-to, Hero leads with
   nothing but recognition. */
function hero({ eyebrow: eb = 'A Yin Yoga Pose', name, photo, focal, tone }) {
  const p = pal(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g }, [
    box({ flexDirection: 'column', alignItems: 'center', padding: '70px 80px 0' }, [
      eyebrow(eb, p.acc),
    ]),
    box({ marginTop: '36px' }, [band(1000, 880, photo, focal)]),
    spacer(),
    box({ flexDirection: 'column', alignItems: 'center', gap: '22px', padding: '0 80px 84px' }, [
      title(name, p.i, 72, { width: '820px' }),
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
   Type over the photograph. The signature pin of the set.

   `photoH` is how tall the photograph may be before it starts cutting into
   her — src/data/poseTall.ts measures it per pose. At 1500 it is full bleed.
   Below that the photograph is anchored to the top and its bottom edge is
   dissolved into the ground, so a pin at 1100 still reads as type over an
   image rather than as an image with a caption under it.

   A pose that cannot reach roughly 1000 is not given this template at all —
   the type would have nothing to sit on. Those go to Panel, which is the same
   idea built for a wide photograph. Nothing letterboxes: the old version
   floated a short band in the middle of the ground and it looked like a
   mistake, because it was one. */
function immersive({ eyebrow: eb, headline, blurb, photo, focal, tone, photoH = 1500, footnote }) {
  const p = pal(tone);
  const dark = tone === 'dark';
  const ink = dark ? CARD : SAGE;
  const shade = dark ? '0 2px 30px rgba(46,52,47,0.45)' : '0 2px 24px rgba(249,241,234,0.75)';
  const h = Math.min(1500, Math.max(960, Math.round(photoH)));
  return box({ width: '100%', height: '100%', position: 'relative', backgroundColor: p.g }, [
    band(1000, h, photo, focal, {
      position: 'absolute', top: '0', left: '0',
      // A photograph that stops short of the bottom must not show where it
      // stops. The last twelfth dissolves, and since the ground is the same oat
      // as the room's wall the join is genuinely hard to find. The veil below
      // is ramping up across the same band, which finishes the job.
      ...(h < 1500
        ? { maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)' }
        : {}),
    }),
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

/* ═══ 06 · Diagram ════════════════════════════════════════════════════════
   The pose as a reference card, not a feeling. Same eyebrow/title/band as
   Plate up top, but the air below carries the pose's own alignment cues
   instead of standing empty — the thing worth pinning to come back to. */
function diagram({ eyebrow: eb, headline, photo, focal, tone, footnote, cues = [] }) {
  const p = pal(tone);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g }, [
    box({ flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '80px 76px 0' }, [
      eyebrow(eb, p.acc),
      title(headline, p.i, 72, { width: '880px' }),
    ]),
    box({ marginTop: '40px' }, [band(1000, 540, photo, focal)]),
    // Two cues, not three, and each capped to roughly a line — a wall of tiled
    // pins gets seen at thumbnail size, so this reads as a couple of bold
    // pointers rather than body copy nobody at that size can actually read.
    box({ flexDirection: 'column', gap: '30px', padding: '52px 88px 0' }, [
      ...cues.slice(0, 2).map((c, i) =>
        box({ flexDirection: 'row', alignItems: 'flex-start', gap: '24px' }, [
          box({
            width: '46px', height: '46px', borderRadius: '23px', flexShrink: 0,
            backgroundColor: p.acc, color: p.g, alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cabin', fontWeight: 600, fontSize: '22px',
          }, String(i + 1)),
          box({ fontFamily: 'Cabin', fontWeight: 500, fontSize: '34px', lineHeight: 1.35, color: p.i, width: '760px' }, c),
        ]),
      ),
    ]),
    spacer(),
    box({ flexDirection: 'column', alignItems: 'center', gap: '18px', padding: '0 80px 84px' }, [
      body('Ease in slowly — about 60–80% of your capacity.', p.soft, { size: 26 }),
      divider(p),
      ...(footnote ? [meta(footnote, p.acc)] : []),
      wordmark(p.i),
    ]),
  ]);
}

/* ═══ 07 · Roster ═════════════════════════════════════════════════════════
   The routine as a follow-along list: round thumbnail, order badge, name and
   hold length, one row per pose. Built for someone who wants to glance at the
   whole sequence at once rather than click through it. Named apart from the
   dead legacy `checklist` template in lib/pin.mjs so nothing shadows it. */
function roster({ eyebrow: eb, headline, blurb, tone, footnote, items = [] }) {
  const p = pal(tone);
  // Capped at 5, not however many a routine has — a thumbnail seen in a tiled
  // feed only has room to read a photo as a pose if it's genuinely large;
  // more rows than that would mean shrinking every photo back to unreadable.
  const rows = items.slice(0, 5);
  return box({ width: '100%', height: '100%', flexDirection: 'column', backgroundColor: p.g }, [
    box({ flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '66px 76px 0' }, [
      eyebrow(eb, p.acc),
      title(headline, p.i, 62, { width: '840px' }),
      ...(blurb ? [body(blurb, p.soft, { width: '760px', size: 24 })] : []),
    ]),
    box({ flexDirection: 'column', marginTop: '20px', padding: '0 76px' }, [
      ...rows.map((it, i) =>
        box({ flexDirection: 'row', alignItems: 'center', gap: '28px', padding: '14px 0', borderTop: `1px solid ${p.rule}` }, [
          // A circle forces a square crop out of a landscape photo, which for a
          // lying pose spread wide across the room crops the sides hard enough
          // to take her head or feet with them (see photo-crop-framing). A wide
          // window close to the source's own shape barely crops at all.
          box({ position: 'relative', flexShrink: 0 }, [
            band(248, 155, it.img, '50% 50%', { borderRadius: '18px' }),
            box({
              position: 'absolute', top: '-10px', left: '-10px', width: '44px', height: '44px', borderRadius: '22px',
              backgroundColor: p.i, color: p.g, alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Cabin', fontWeight: 600, fontSize: '20px',
            }, String(i + 1)),
          ]),
          // A class roster has no hold time, only a pose name — an empty
          // second line would just be dead space, so it's dropped rather
          // than rendered blank.
          box({ flexDirection: 'column', gap: '8px' }, [
            box({ fontFamily: 'Serif', fontSize: '38px', color: p.i }, it.name || ''),
            // meta() centers itself (right for a standalone stat, wrong for a
            // left-aligned list row), so this repeats its style without that.
            ...(it.time ? [box({ fontFamily: 'Cabin', fontWeight: 600, fontSize: '25px', letterSpacing: '3.4px', color: p.soft }, caps(it.time))] : []),
          ]),
        ]),
      ),
      // Most routines run longer than 5 poses, and silently dropping the rest
      // would just look broken on a routine someone can see is longer than
      // that. Say what's missing instead of hiding it.
      // "more poses", not "more in the routine" — this list stands in for a
      // routine's sequence AND a class's featured poses, and only the first
      // is honestly a "routine".
      ...(items.length > rows.length
        ? [box({ flexDirection: 'row', alignItems: 'center', padding: '18px 0 0' }, [
            box({ fontFamily: 'Cabin', fontWeight: 400, fontStyle: 'italic', fontSize: '24px', color: p.soft }, `+ ${items.length - rows.length} more pose${items.length - rows.length === 1 ? '' : 's'}`),
          ])]
        : []),
    ]),
    spacer(),
    box({ flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '0 80px 60px' }, [
      divider(p),
      ...(footnote ? [meta(footnote, p.acc)] : []),
      wordmark(p.i),
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

const TEMPLATES = { plate, frame, panel, immersive, watch, offer: offerPin, diagram, roster, hero };

/** Render a 1000×1500 Plate-set pin to a PNG Buffer. */
export async function renderPlatePin({ tpl = 'plate', ...props }) {
  const build = TEMPLATES[tpl];
  if (!build) throw new Error(`Unknown plate template: ${tpl}`);
  const svg = await satori(build(props), { width: 1000, height: 1500, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
}

export const PLATE_TEMPLATES = Object.keys(TEMPLATES);
