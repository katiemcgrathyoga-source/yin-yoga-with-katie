import type { CollectionEntry } from 'astro:content';
import { byRecencyThenWatch } from '../lib/video';

type Video = CollectionEntry<'videos'>;
type VideoData = Video['data'];
export type Accent = 'plum' | 'gold';

/**
 * Programs are curated, guided paths through the class library — free and public.
 * Each one resolves its class list *live* from the videos collection (filtered by
 * intent, ranked by watch-hours), so programs stay full and current as the library
 * grows, with zero per-video maintenance. Add a program by adding an entry here.
 */
export interface ProgramDef {
  slug: string;
  title: string;
  tagline: string; // short italic subtitle
  outcome: string; // outcome-led promise
  blurb: string; // 1–2 sentence description
  accent: Accent;
  unit: 'Day' | 'Class'; // how items are numbered
  count: number; // how many classes to include
  match: (d: VideoData) => boolean; // which classes belong
  membersProgram?: boolean; // true = a members-only collection (no sprinkling)
}

export const PROGRAMS: ProgramDef[] = [
  {
    slug: 'bedtime-reset',
    title: 'The Bedtime Reset',
    tagline: 'wind down, night by night',
    outcome: 'Become someone who falls asleep faster and sleeps through the night.',
    blurb:
      'A run of gentle evening practices to close the day and carry you toward sleep. Follow them in order, or drop into whichever night you need.',
    accent: 'plum',
    unit: 'Day',
    count: 5,
    match: (d) => d.intent_tags.includes('sleep'),
  },
  {
    slug: 'full-body-flexibility',
    title: 'Full-Body Flexibility',
    tagline: 'bend like bamboo',
    outcome: 'Become someone who moves through the week looser and lighter.',
    blurb:
      'Five long, slow practices that open the whole body. Do one every few days and feel the difference by the end.',
    accent: 'gold',
    unit: 'Class',
    count: 5,
    match: (d) => d.intent_tags.includes('flexibility'),
  },
  {
    slug: 'free-your-hips',
    title: 'Free Your Hips',
    tagline: 'undo the hours of sitting',
    outcome: 'Become someone whose hips and lower back feel open and easy.',
    blurb:
      'Four targeted hip and lower-back openers to release where the day collects. A little every few days goes a long way.',
    accent: 'plum',
    unit: 'Class',
    count: 4,
    match: (d) => d.intent_tags.includes('hips') || d.intent_tags.includes('hips-lower-back'),
  },
  {
    slug: 'calm-reset',
    title: 'The Calm Reset',
    tagline: 'downshift the day',
    outcome: 'Become someone who ends the day calm, not wired.',
    blurb:
      'Five slow, grounding practices to settle a busy nervous system. Roll one out whenever the day has been a lot.',
    accent: 'gold',
    unit: 'Class',
    count: 5,
    match: (d) => d.intent_tags.includes('nervous-system') || d.intent_tags.includes('stress'),
  },
];

/**
 * Resolve a program's ordered class list. Public programs get a couple of
 * members-only classes *sprinkled in* at spaced positions (a soft funnel to the
 * membership); the Members Collection is left as-is.
 */
export function resolveProgramClasses(def: ProgramDef, videos: Video[]): Video[] {
  const matches = videos
    .filter((v) => v.data.enriched && def.match(v.data))
    .sort((a, b) => byRecencyThenWatch(a.data, b.data));
  if (def.membersProgram) return matches.slice(0, def.count);

  const members = matches.filter((v) => v.data.membership);
  const publicOnes = matches.filter((v) => !v.data.membership);
  const quota = Math.min(2, members.length, Math.max(0, def.count - 1));
  const result = publicOnes.slice(0, def.count - quota);

  // Interleave the members picks at evenly spaced positions.
  const step = Math.max(1, Math.floor(def.count / (quota + 1)));
  let pos = step;
  for (const m of members.slice(0, quota)) {
    result.splice(Math.min(pos, result.length), 0, m);
    pos += step + 1;
  }
  return result.slice(0, def.count);
}

export const unitPlural = (def: Pick<ProgramDef, 'unit'>, n: number) =>
  def.unit === 'Day' ? `${n} ${n === 1 ? 'day' : 'days'}` : `${n} ${n === 1 ? 'class' : 'classes'}`;
