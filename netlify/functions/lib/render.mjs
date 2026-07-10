import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SERIF_SEMIBOLD, SERIF_ITALIC, CABIN_SEMIBOLD } from './fonts.mjs';

// Fonts are embedded (base64) so the function has no path/bundling dependency.
const FONTS = [
  { name: 'Serif', data: SERIF_SEMIBOLD, weight: 600, style: 'normal' },
  { name: 'Serif', data: SERIF_ITALIC, weight: 400, style: 'italic' },
  { name: 'Cabin', data: CABIN_SEMIBOLD, weight: 600, style: 'normal' },
];

const OAT = '#F9F1EA';
const SAGE = '#48544C';
const ROSEWOOD = '#89494B';
const INK_SOFT = '#6E756F';

// A branded 1200×630 card: kicker · title · subtitle · url, framed in rosewood.
function card({ title, subtitle }) {
  const children = [
    {
      type: 'div',
      props: {
        style: { position: 'absolute', top: '32px', left: '32px', right: '32px', bottom: '32px', border: `3px solid ${ROSEWOOD}`, borderRadius: '20px' },
      },
    },
    {
      type: 'div',
      props: {
        style: { display: 'flex', fontFamily: 'Cabin', fontSize: '26px', letterSpacing: '9px', color: INK_SOFT },
        children: 'YIN YOGA WITH KATIE',
      },
    },
    {
      type: 'div',
      props: {
        style: { display: 'flex', fontFamily: 'Serif', fontWeight: 600, fontSize: '80px', color: SAGE, textAlign: 'center', marginTop: '28px', lineHeight: 1.08, maxWidth: '960px' },
        children: title,
      },
    },
  ];
  if (subtitle) {
    children.push({
      type: 'div',
      props: {
        style: { display: 'flex', fontFamily: 'Serif', fontStyle: 'italic', fontWeight: 400, fontSize: '34px', color: ROSEWOOD, marginTop: '24px' },
        children: subtitle,
      },
    });
  }
  children.push({
    type: 'div',
    props: {
      style: { display: 'flex', fontFamily: 'Cabin', fontSize: '26px', color: INK_SOFT, marginTop: '42px' },
      children: 'yinyogawithkatie.com',
    },
  });

  return {
    type: 'div',
    props: {
      style: {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', backgroundColor: OAT,
        fontFamily: 'Cabin', position: 'relative', padding: '70px',
      },
      children,
    },
  };
}

/** Render the branded card to a PNG Buffer. */
export async function renderCard({ title, subtitle }) {
  const svg = await satori(card({ title, subtitle }), { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
