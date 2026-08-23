// One-off script — run manually (`node scripts/generate-pwa-icons.mjs`) and
// commit the output. Not part of `npm run build`; the icons don't change often
// enough to regenerate on every deploy.
//
// Generates a simple placeholder app icon: a 3-petal leaf motif in --oat on a
// --sage-deep background. Swap for real icon art later — this exists so the
// PWA is installable today rather than blocked on brand design work.
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'node:fs';

const SAGE_DEEP = '#363F39';
const OAT = '#F9F1EA';

/**
 * `safe` confines the motif to Android's maskable safe-zone (~40% radius from
 * center) so nothing gets cropped when the OS applies its own mask shape.
 * `opaque` drops the rounded corners (plain full-bleed square) for maskable
 * and apple-touch-icon variants, which must not have transparent pixels.
 */
function leafSvg({ size = 512, safe = false, opaque = false } = {}) {
  const c = size / 2;
  const r = safe ? size * 0.34 : size * 0.4;
  const leaf = (angleDeg) => {
    const a = (angleDeg * Math.PI) / 180;
    const tipX = c + r * Math.cos(a);
    const tipY = c + r * Math.sin(a);
    const w = r * 0.42;
    const perp = a + Math.PI / 2;
    const midX = c + r * 0.55 * Math.cos(a);
    const midY = c + r * 0.55 * Math.sin(a);
    const x1 = midX + w * Math.cos(perp), y1 = midY + w * Math.sin(perp);
    const x2 = midX - w * Math.cos(perp), y2 = midY - w * Math.sin(perp);
    return `M ${c} ${c} Q ${x1} ${y1} ${tipX} ${tipY} Q ${x2} ${y2} ${c} ${c} Z`;
  };
  const bg = opaque
    ? `<rect width="${size}" height="${size}" fill="${SAGE_DEEP}"/>`
    : `<rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${SAGE_DEEP}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    ${bg}
    <g fill="${OAT}">
      <path d="${leaf(-90)}"/>
      <path d="${leaf(30)}"/>
      <path d="${leaf(150)}"/>
      <circle cx="${c}" cy="${c}" r="${size * 0.045}"/>
    </g>
  </svg>`;
}

function toPng(svg, width) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

mkdirSync('public/icons', { recursive: true });

writeFileSync('public/icons/icon-192.png', toPng(leafSvg({ size: 512, safe: false }), 192));
writeFileSync('public/icons/icon-512.png', toPng(leafSvg({ size: 512, safe: false }), 512));
writeFileSync(
  'public/icons/icon-512-maskable.png',
  toPng(leafSvg({ size: 512, safe: true, opaque: true }), 512),
);
writeFileSync(
  'public/icons/apple-touch-icon.png',
  toPng(leafSvg({ size: 512, safe: false, opaque: true }), 180),
);

console.log('Wrote public/icons/{icon-192,icon-512,icon-512-maskable,apple-touch-icon}.png');
