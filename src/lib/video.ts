import type { CollectionEntry } from 'astro:content';
import { splitTitle } from './title';

export type VideoData = CollectionEntry<'videos'>['data'];

/** Short display headline — the curated `display_title`, else derived from the full title. */
export const videoHeadline = (d: VideoData) =>
  d.display_title?.trim() ? d.display_title : splitTitle(d.title).headline;

/** Supporting subtitle — the curated `subtitle`, else the tail of the full title. */
export const videoSubtitle = (d: VideoData) =>
  d.subtitle?.trim() ? d.subtitle : splitTitle(d.title).subtitle;

/** Derived YouTube thumbnail — honours a custom `thumbnail`, else builds one from the id. */
export const derivedThumb = (
  d: VideoData,
  quality: 'hqdefault' | 'mqdefault' | 'maxresdefault' = 'hqdefault',
) => (d.thumbnail?.trim() ? d.thumbnail : `https://img.youtube.com/vi/${d.youtube_id}/${quality}.jpg`);

/** Round a raw duration to a clean marketed number (nearest 5, min 5): 61 → 60, 94 → 95. */
export const roundedMinutes = (m: number) => Math.max(5, Math.round(m / 5) * 5);

/** Length label — prefers the marketed `display_length`, else the rounded minutes. */
export const lenLabel = (d: VideoData) =>
  d.display_length?.trim() ? d.display_length : `${roundedMinutes(d.length_minutes)} min`;

/**
 * Recency window: classes published in the last 2 years carry Katie's current
 * thumbnails/branding, so they're preferred when choosing what to surface.
 * Computed at build time — a rebuild rolls the window forward.
 */
const RECENCY_CUTOFF = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return d;
})();
export const isRecent = (d: { published?: Date }) => (d.published ? d.published >= RECENCY_CUTOFF : false);

/** Sort by most-practised, newest as tiebreak. Undated classes sort oldest. */
export const byWatchHours = (a: { watch_hours?: number; published?: Date }, b: typeof a) =>
  (b.watch_hours ?? -1) - (a.watch_hours ?? -1) ||
  (b.published?.getTime() ?? 0) - (a.published?.getTime() ?? 0);

/**
 * Preferred ranking for surfacing classes: recent classes first (for a
 * consistent, current look), then older ones — each tier by watch-hours.
 */
export const byRecencyThenWatch = (
  a: { watch_hours?: number; published?: Date },
  b: typeof a,
) => Number(isRecent(b)) - Number(isRecent(a)) || byWatchHours(a, b);

/**
 * A useful FAQ for a class page. Prefers the authored `faq`; otherwise derives
 * 3–4 real questions from the record (length, props, level, silent). Purely
 * factual — no invented claims — so it's safe to show on every enriched class.
 */
export const videoFaq = (d: VideoData): { q: string; a: string }[] => {
  if (d.faq?.length) return d.faq;

  const len = lenLabel(d);
  const isSilent = /silent|minimal cue|no cue/i.test(`${d.title} ${d.subtitle ?? ''}`);
  const realProps = d.props.filter((p) => !/no props|none/i.test(p));
  const faq: { q: string; a: string }[] = [];

  faq.push({
    q: `How long is this Yin Yoga class?`,
    a: `It runs about ${len}. Yin is slow and floor-based, so you can settle in — and pause any time you need to.`,
  });

  faq.push({
    q: `Do I need any props for this class?`,
    a: realProps.length
      ? `It helps to have ${realProps.join(', ')} nearby, but you can always improvise with cushions, blankets or books, or simply take the option that needs no props.`
      : `No props needed — just a mat and a warm, quiet space. A cushion or blanket nearby is always welcome for extra comfort.`,
  });

  faq.push({
    q: `Is this class suitable for beginners?`,
    a:
      d.level === 'beginner'
        ? `Yes — it's designed with beginners in mind. Work at about 80% of your edge, breathe, and never force a shape.`
        : d.level === 'all-levels'
          ? `Yes. It's an all-levels class — every pose has a gentler option, so work at about 80% of your edge and ease off whenever you need to.`
          : `This one is best once you have a little Yin experience, but you're welcome to follow along gently, take the softer option in each pose, and rest whenever you need to.`,
  });

  if (isSilent) {
    faq.push({
      q: `Is this a silent Yin class?`,
      a: `Yes — I keep the cues to a minimum so you can drop out of your head and fully into the practice. Have a read of the poses below first if you're new, then follow along at your own pace.`,
    });
  }

  return faq;
};
