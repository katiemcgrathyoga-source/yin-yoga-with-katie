import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SERIF_SEMIBOLD, SERIF_ITALIC, CABIN_SEMIBOLD } from './fonts.mjs';

// Same embedded fonts as the OG card, so the function bundles with no extra files.
const FONTS = [
  { name: 'Serif', data: SERIF_SEMIBOLD, weight: 600, style: 'normal' },
  { name: 'Serif', data: SERIF_ITALIC, weight: 400, style: 'italic' },
  { name: 'Cabin', data: CABIN_SEMIBOLD, weight: 600, style: 'normal' },
];

const OAT = '#F9F1EA';
const SAGE = '#48544C';
const ROSEWOOD = '#89494B';
const QUARTZ = '#BC9D9A';
const LINE = '#E4DACF';
const INK_SOFT = '#6E756F';

const WORDMARK = 'yinyogawithkatie.com';

// 1a — photo-led: full-bleed photo on top, oat title band below.
function photoLed({ title, eyebrow, img }) {
  const band = [];
  if (eyebrow) {
    band.push({
      type: 'div',
      props: { style: { display: 'flex', fontFamily: 'Cabin', fontWeight: 600, fontSize: '24px', letterSpacing: '5px', color: ROSEWOOD, marginBottom: '22px' }, children: eyebrow.toUpperCase() },
    });
  }
  band.push({
    type: 'div',
    props: { style: { display: 'flex', fontFamily: 'Serif', fontWeight: 600, fontSize: '60px', lineHeight: 1.16, color: SAGE, textAlign: 'center', maxWidth: '820px' }, children: title },
  });
  band.push({
    type: 'div',
    props: { style: { position: 'absolute', bottom: '46px', display: 'flex', fontFamily: 'Cabin', fontSize: '23px', letterSpacing: '2px', color: INK_SOFT }, children: WORDMARK },
  });

  return {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: OAT, fontFamily: 'Cabin' },
      children: [
        {
          type: 'div',
          props: { style: { display: 'flex', width: '1000px', height: '1010px', backgroundColor: LINE, ...(img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}) } },
        },
        {
          type: 'div',
          props: { style: { display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: '0 64px', borderTop: `2px solid ${LINE}`, position: 'relative' }, children: band },
        },
      ],
    },
  };
}

// 1b — text-led: deep-sage field, big serif title, optional small arched photo.
function textLed({ title, eyebrow, img }) {
  const children = [];
  if (img) {
    children.push({
      type: 'div',
      props: { style: { display: 'flex', width: '360px', height: '430px', backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '180px 180px 20px 20px', marginBottom: '52px' } },
    });
  }
  if (eyebrow) {
    children.push({
      type: 'div',
      props: { style: { display: 'flex', fontFamily: 'Cabin', fontWeight: 600, fontSize: '24px', letterSpacing: '6px', color: QUARTZ, marginBottom: '26px' }, children: eyebrow.toUpperCase() },
    });
  }
  children.push({
    type: 'div',
    props: { style: { display: 'flex', fontFamily: 'Serif', fontWeight: 600, fontSize: '68px', lineHeight: 1.18, color: OAT, textAlign: 'center', maxWidth: '840px' }, children: title },
  });
  children.push({
    type: 'div',
    props: { style: { position: 'absolute', bottom: '58px', display: 'flex', fontFamily: 'Cabin', fontSize: '23px', letterSpacing: '2px', color: QUARTZ }, children: WORDMARK },
  });

  return {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: SAGE, fontFamily: 'Cabin', padding: '84px 80px', position: 'relative' },
      children,
    },
  };
}

/** Render a 1000×1500 (2:3) Pinterest pin to a PNG Buffer. */
export async function renderPin({ title, eyebrow, img, tpl }) {
  const tree = tpl === 'text' ? textLed({ title, eyebrow, img }) : photoLed({ title, eyebrow, img });
  const svg = await satori(tree, { width: 1000, height: 1500, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
}
