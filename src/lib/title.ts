/**
 * Split a video title into a headline and a subtitle at the first `:` or `|`.
 *
 * Class titles come from YouTube-style strings that use either separator, e.g.
 *   "Bend Like Bamboo: The Ultimate Yin Yoga Flexibility Class"
 *   "30-Min Yin Yoga for Sleep | Full-Body Stretch | Challenge Day 1"
 * The headline drives the big display; the remainder becomes the italic
 * subtitle, with any further `|` separators shown as middots.
 */
export function splitTitle(title: string): { headline: string; subtitle: string } {
  const m = title.match(/^(.*?)\s*[:|]\s*(.*)$/);
  if (!m) return { headline: title.trim(), subtitle: '' };
  return {
    headline: m[1].trim(),
    subtitle: m[2].replace(/\s*\|\s*/g, ' · ').trim(),
  };
}
