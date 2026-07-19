import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { NOTO_SERIF_TC_500, CABIN_400, CABIN_500, CABIN_600 } from './journalfonts.mjs';

/**
 * Journal Pin — the reusable 1000×1500 (2:3) Pinterest pin from the
 * `design_handoff_pinterest_pins` handoff. One template, four layout variants
 * (arch · oat-frame · split · card), recreated from `Journal Pin.dc.html`.
 *
 * Faithful to the handoff's two hard content rules:
 *   1. Photos are ALWAYS placed at their natural aspect ratio — never cropped.
 *      (We size each photo by its intrinsic dimensions; no object-fit: cover.)
 *   2. Copy teases, never answers — pages pass "Long hold" style meta, not times.
 *
 * Titles: Noto Serif TC (weight 500). Everything else: Cabin (400/500/600).
 */

const FONTS = [
  { name: 'Serif', data: NOTO_SERIF_TC_500, weight: 500, style: 'normal' },
  { name: 'Cabin', data: CABIN_400, weight: 400, style: 'normal' },
  { name: 'Cabin', data: CABIN_500, weight: 500, style: 'normal' },
  { name: 'Cabin', data: CABIN_600, weight: 600, style: 'normal' },
];

// Brand tokens (design_handoff .../tokens/colors.css).
const DEEP_SAGE = '#48544c';
const SOFT_OAT = '#f9f1ea';
const SANDSTONE = '#bea690';
const ROSEWOOD = '#89494b';
const ROSE_QUARTZ = '#bc9d9a';
const TEXT_MUTED = '#7d837e';
const TEXT_BODY = '#3f4741';
// Soft-oat at alpha, used for text/lines on the deep-sage field.
const OAT_35 = 'rgba(249, 241, 234, 0.35)';
const OAT_70 = 'rgba(249, 241, 234, 0.7)';
const OAT_75 = 'rgba(249, 241, 234, 0.75)';
const OAT_82 = 'rgba(249, 241, 234, 0.82)';

const box = (style, children) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, ...(children !== undefined ? { children } : {}) },
});
const spacer = () => box({ flexGrow: 1 });

// A photo at its natural aspect ratio. `w` is the rendered width; height is
// derived from the photo's own intrinsic ratio so the subject is never cropped.
const naturalPhoto = (photo, w, style = {}) => {
  const h = Math.round(w * (photo.h / photo.w));
  return { type: 'img', props: { src: photo.data, style: { display: 'block', width: `${w}px`, height: `${h}px`, ...style } } };
};

const eyebrowEl = (text, color) =>
  box({ fontFamily: 'Cabin', fontSize: '26px', fontWeight: 600, letterSpacing: '4.68px', textTransform: 'uppercase', color }, text);
const metaEl = (text, color) =>
  box({ marginTop: '40px', fontFamily: 'Cabin', fontSize: '23px', fontWeight: 500, letterSpacing: '3.22px', textTransform: 'uppercase', color }, text);
const excerptEl = (text, color, maxWidth) =>
  box({ marginTop: '36px', maxWidth: `${maxWidth}px`, fontFamily: 'Cabin', fontSize: '29px', fontWeight: 400, lineHeight: 1.55, color, textAlign: 'center' }, text);
const titleEl = (text, size, lineHeight, color) =>
  box({ marginTop: '0px', fontFamily: 'Serif', fontWeight: 500, fontSize: `${size}px`, lineHeight, color, textAlign: 'center' }, text);
// Footer: the url wordmark text, or the wordmark logo PNG (light/dark asset).
const footerEl = ({ footer, footerImg, color }) =>
  footer === 'wordmark' && footerImg
    ? { type: 'img', props: { src: footerImg.data, style: { display: 'block', width: '340px', height: `${Math.round(340 * (footerImg.h / footerImg.w))}px` } } }
    : box({ fontFamily: 'Cabin', fontSize: '22px', letterSpacing: '2.64px', color }, 'yinyogawithkatie.com');

// 1. arch — deep-sage field, arched hairline frame, oat-matted photo, text below.
function archPin({ title, eyebrow, meta, excerpt, photo, showEyebrow, footer, footerImg }) {
  const inner = [];
  if (photo) inner.push(box({ backgroundColor: SOFT_OAT, padding: '12px', borderRadius: '16px' }, [naturalPhoto(photo, 540, { borderRadius: '8px' })]));
  if (showEyebrow && eyebrow) inner.push(box({ marginTop: '64px' }, [eyebrowEl(eyebrow, ROSE_QUARTZ)]));
  inner.push(box({ marginTop: '32px' }, [titleEl(title, 76, 1.28, SOFT_OAT)]));
  if (meta) inner.push(metaEl(meta, OAT_70));
  if (excerpt) inner.push(excerptEl(excerpt, OAT_82, 640));
  inner.push(spacer());
  inner.push(footerEl({ footer, footerImg, color: OAT_75 }));
  return box({ width: '1000px', height: '1500px', backgroundColor: DEEP_SAGE, flexDirection: 'column', padding: '56px' }, [
    box({
      flexGrow: 1, border: `1.5px solid ${OAT_35}`,
      borderTopLeftRadius: '444px', borderTopRightRadius: '444px', borderBottomRightRadius: '20px', borderBottomLeftRadius: '20px',
      flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '150px 72px 56px',
    }, inner),
  ]);
}

// 2. oat-frame — soft-oat field, thin sandstone frame, text over full-width photo.
function oatFramePin({ title, eyebrow, meta, excerpt, photo, showEyebrow, footer, footerImg }) {
  const inner = [];
  if (showEyebrow && eyebrow) inner.push(eyebrowEl(eyebrow, ROSEWOOD));
  inner.push(box({ marginTop: '44px' }, [titleEl(title, 84, 1.24, DEEP_SAGE)]));
  if (meta) inner.push(metaEl(meta, TEXT_MUTED));
  if (excerpt) inner.push(excerptEl(excerpt, TEXT_BODY, 660));
  inner.push(box({ marginTop: '52px', width: '64px', height: '1px', backgroundColor: SANDSTONE }));
  inner.push(spacer());
  if (photo) inner.push(naturalPhoto(photo, 758, { borderRadius: '20px' }));
  inner.push(spacer());
  inner.push(footerEl({ footer, footerImg, color: TEXT_MUTED }));
  return box({ width: '1000px', height: '1500px', backgroundColor: SOFT_OAT, padding: '48px' }, [
    box({ flexGrow: 1, border: `1px solid ${SANDSTONE}`, flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '110px 72px 72px' }, inner),
  ]);
}

// 3. split — full-bleed photo up top, deep-sage text field below.
function splitPin({ title, eyebrow, meta, excerpt, photo, showEyebrow, footer, footerImg }) {
  const below = [];
  if (showEyebrow && eyebrow) below.push(eyebrowEl(eyebrow, ROSE_QUARTZ));
  below.push(box({ marginTop: '40px' }, [titleEl(title, 82, 1.26, SOFT_OAT)]));
  if (meta) below.push(metaEl(meta, OAT_70));
  if (excerpt) below.push(excerptEl(excerpt, OAT_82, 680));
  below.push(box({ marginTop: '48px', width: '64px', height: '1px', backgroundColor: ROSE_QUARTZ }));
  below.push(spacer());
  below.push(footerEl({ footer, footerImg, color: OAT_75 }));
  return box({ width: '1000px', height: '1500px', backgroundColor: DEEP_SAGE, flexDirection: 'column', overflow: 'hidden' }, [
    photo ? naturalPhoto(photo, 1000, { flexShrink: 0 }) : box({ width: '1000px', height: '560px', backgroundColor: '#3a443d' }),
    box({ flexGrow: 1, flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '88px 88px 72px' }, below),
  ]);
}

// 4. card — deep-sage field, floated soft-oat card, photo inside the card.
function cardPin({ title, eyebrow, meta, excerpt, photo, showEyebrow, footer, footerImg }) {
  const inner = [];
  if (photo) inner.push(naturalPhoto(photo, 752, { borderRadius: '12px' }));
  if (showEyebrow && eyebrow) inner.push(box({ marginTop: '80px' }, [eyebrowEl(eyebrow, ROSEWOOD)]));
  inner.push(box({ marginTop: '40px' }, [titleEl(title, 80, 1.26, DEEP_SAGE)]));
  if (meta) inner.push(metaEl(meta, TEXT_MUTED));
  if (excerpt) inner.push(excerptEl(excerpt, TEXT_BODY, 680));
  inner.push(spacer());
  inner.push(footerEl({ footer, footerImg, color: TEXT_MUTED }));
  return box({ width: '1000px', height: '1500px', backgroundColor: DEEP_SAGE, padding: '60px' }, [
    box({ flexGrow: 1, backgroundColor: SOFT_OAT, borderRadius: '20px', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '64px' }, inner),
  ]);
}

const VARIANTS = { arch: archPin, 'oat-frame': oatFramePin, split: splitPin, card: cardPin };

/** Render a Journal Pin (1000×1500, 2:3) to a PNG Buffer. */
export async function renderJournalPin({ variant = 'arch', title, eyebrow, meta, excerpt, photo, showEyebrow = true, footer = 'url', footerImg }) {
  const build = VARIANTS[variant] ?? archPin;
  const tree = build({ title, eyebrow, meta, excerpt, photo, showEyebrow, footer, footerImg });
  const svg = await satori(tree, { width: 1000, height: 1500, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
}

export const JOURNAL_PIN_VARIANTS = Object.keys(VARIANTS);
