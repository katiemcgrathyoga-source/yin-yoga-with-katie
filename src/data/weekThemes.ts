import type { VideoData } from '../lib/video';

/**
 * The themed week that powers both calendar views. Days display Mon→Sun, but
 * classes are *allocated* by `priority` (most specific theme claims its best
 * match first) so, e.g., the top sleep class lands on Bedtime rather than being
 * pulled into an earlier, looser day. Themes key off the well-populated
 * `intent_tags` + length (body_areas is sparse on skeleton records).
 */
export interface DayTheme {
  day: string;
  jsDay: number; // 0=Sun … 6=Sat, to match Date.getDay()
  priority: number;
  theme: string;
  note: string;
  match: (d: VideoData) => boolean;
}

// Sleep classes are reserved for Bedtime (Sunday) — otherwise they bleed into
// other days via their secondary tags (many are also "full-body"/"nervous-system").
const notSleep = (d: VideoData) => !d.intent_tags.includes('sleep');

export const WEEK_THEMES: DayTheme[] = [
  { day: 'Monday', jsDay: 1, priority: 7, theme: 'Ease In', note: 'a gentle full-body settle to start the week', match: (d) => notSleep(d) && d.intent_tags.includes('full-body') && d.length_minutes <= 45 },
  { day: 'Tuesday', jsDay: 2, priority: 2, theme: 'Hips & Lower Back', note: 'open where the day collects', match: (d) => notSleep(d) && d.intent_tags.includes('hips-lower-back') },
  { day: 'Wednesday', jsDay: 3, priority: 4, theme: 'Deep Stretch', note: 'long holds for real flexibility', match: (d) => notSleep(d) && d.intent_tags.includes('flexibility') },
  { day: 'Thursday', jsDay: 4, priority: 6, theme: 'Beginner-Friendly', note: 'gentle steps for a newer practice', match: (d) => notSleep(d) && d.intent_tags.includes('beginner') },
  { day: 'Friday', jsDay: 5, priority: 3, theme: 'Unwind', note: 'downshift into the weekend', match: (d) => notSleep(d) && d.intent_tags.includes('nervous-system') },
  { day: 'Saturday', jsDay: 6, priority: 5, theme: 'The Long Hold', note: 'time for a longer practice', match: (d) => notSleep(d) && d.length_minutes >= 75 },
  { day: 'Sunday', jsDay: 0, priority: 1, theme: 'Bedtime', note: 'wind down and rest', match: (d) => d.intent_tags.includes('sleep') },
];

export const themeByJsDay = (jsDay: number) => WEEK_THEMES.find((t) => t.jsDay === jsDay)!;
