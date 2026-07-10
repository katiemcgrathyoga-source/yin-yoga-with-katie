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
