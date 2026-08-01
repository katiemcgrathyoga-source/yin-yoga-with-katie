/**
 * Calendar plans — the "Never-Skip Scheduler" the sales page promises.
 *
 * A plan is a schedule of things already in the library, exported as an .ics the
 * reader imports into whatever calendar they use. Deliberately a downloaded file
 * rather than a subscription feed: a feed needs a per-user endpoint and a server
 * hit every refresh, and it buys nothing here because a plan doesn't change once
 * you've started it.
 *
 * Items reference the library by `kind:slug` rather than repeating titles and
 * durations, so a practice renamed or re-timed can't drift out of step with the
 * plan that schedules it. The page resolves them at build time and fails loudly
 * if a reference is dead.
 *
 * Two anchors, because the plans answer different questions:
 *   'start' — counts forward from the day you begin.
 *   'race'  — counts BACKWARDS from race day, which is the only way a taper can
 *             work. Day offsets are negative; day 0 is the race.
 */

export type PlanRef = `practice:${string}` | `routine:${string}`;

export type DatedItem = {
  /** Days from the anchor. Negative for race-anchored plans. */
  day: number;
  ref: PlanRef;
  /** Why this one, here. Shown on the page and in the calendar entry. */
  note: string;
};

export type WeeklySlot = {
  /** 0 = Sunday … 6 = Saturday, matching Date.getDay(). */
  weekday: number;
  /** Slots are open by design — see the note on The Weekly Rhythm below. */
  label: string;
  note: string;
};

export type Plan = {
  slug: string;
  title: string;
  tagline: string;
  blurb: string;
  /** What the reader supplies: the day they start, or the day they race. */
  anchor: 'start' | 'race';
  anchorLabel: string;
  schedule:
    | { type: 'dated'; weeks: number; items: DatedItem[] }
    | { type: 'weekly'; slots: WeeklySlot[] };
};

export const PLANS: Plan[] = [
  {
    slug: 'six-week-foundation',
    title: 'The 6-Week Foundation',
    tagline: 'The gentle on-ramp — twice a week, building to three',
    blurb:
      "If you're new to Yin, or you've never managed to make stretching stick, start here. It opens at two short practices a week and only adds a third once the habit has taken. By week six you're working the whole chain and finishing with a long rest-day reset — but you get there slowly, because that's the part most plans skip.",
    anchor: 'start',
    anchorLabel: 'The Monday you want to begin',
    schedule: {
      type: 'dated',
      weeks: 6,
      items: [
        // Week 1 — two short ones. Nothing deep, nothing long.
        { day: 1, ref: 'practice:express-reset', note: 'Your first one. A little of everything so you know what the practice feels like.' },
        { day: 4, ref: 'routine:up-the-wall', note: 'Legs up the wall. Almost nothing is asked of you — that is the point this week.' },
        // Week 2 — add a third, introduce the hips.
        { day: 8, ref: 'practice:hips-hip-flexors', note: 'The runner\'s tightest link, and the one you will feel the difference in first.' },
        { day: 11, ref: 'routine:seven-honest-minutes', note: 'Seven minutes. On a busy week this is the one that keeps the habit alive.' },
        { day: 14, ref: 'routine:up-the-wall', note: 'Sunday reset. Let the week settle.' },
        // Week 3 — the back line joins in.
        { day: 15, ref: 'practice:hamstrings-glutes', note: 'The hamstrings do the hardest braking in every stride. Their turn.' },
        { day: 18, ref: 'routine:twists-for-a-tight-back', note: 'Running is relentlessly forward. This is the rotation you never get.' },
        { day: 21, ref: 'practice:express-reset', note: 'Back to the all-rounder. Notice how different week three feels from week one.' },
        // Week 4 — the base and the deeper hamstring work.
        { day: 22, ref: 'practice:calves-ankles-feet', note: 'Stiff ankles change everything above them, and almost nobody works here.' },
        { day: 25, ref: 'practice:hips-hip-flexors', note: 'Second time round. Go a little further in, if it offers.' },
        { day: 28, ref: 'routine:the-deep-hamstring', note: 'Twenty minutes on the back line and nothing else.' },
        // Week 5 — the outer hip, the low back, then real rest.
        { day: 29, ref: 'practice:quads-outer-hip', note: 'The tissue behind most IT band complaints.' },
        { day: 32, ref: 'practice:lower-back-spine', note: 'Undoing the compression every run puts through the spine.' },
        { day: 35, ref: 'practice:restorative-reset', note: 'Fully supported and nearly an hour. Give it a proper rest day.' },
        // Week 6 — the whole chain.
        { day: 36, ref: 'practice:hamstrings-glutes', note: 'You know this one now.' },
        { day: 39, ref: 'routine:outer-hip-and-it-band', note: 'The muscles that pull on the IT band, released rather than stretched.' },
        { day: 42, ref: 'practice:full-reset', note: 'The whole chain, unhurried. Six weeks ago this would have felt like a lot.' },
      ],
    },
  },

  {
    slug: 'weekly-rhythm',
    title: 'The Weekly Rhythm',
    tagline: 'Three slots a week, repeating forever',
    blurb:
      "Once you know the library, you don't need to be told which class to do — you need the time held. So this plan books three recurring slots and leaves the choice to you and your legs on the day. It repeats indefinitely, so you import it once and it's simply part of your week.",
    anchor: 'start',
    anchorLabel: 'The week you want it to start',
    schedule: {
      type: 'weekly',
      // Open slots rather than named classes, on purpose. A recurring calendar
      // event repeats the SAME entry forever, so naming a class here would have
      // someone doing Hips every Tuesday until they quit. It also matches how the
      // library is meant to be used: press play on whatever is grumbling.
      slots: [
        {
          weekday: 2,
          label: 'Post-run reset',
          note: 'After your run, while you are still warm. Pick the short practice for whatever is grumbling — hips, hamstrings, calves, quads or low back.',
        },
        {
          weekday: 4,
          label: 'Short practice',
          note: 'Fifteen minutes on a different area from Tuesday. Rotating through them over a month covers the whole chain.',
        },
        {
          weekday: 0,
          label: 'Long reset',
          note: 'A rest-day practice: The Full Reset, The Restorative Reset, or The Long Reset if you want the timer instead of a video.',
        },
      ],
    },
  },

  {
    slug: 'race-prep',
    title: 'Race Prep',
    tagline: 'Four weeks out, easing off into race week',
    blurb:
      "This one counts backwards from your race. The first fortnight works normally, then it deliberately backs off: race week is supported and gentle only, with no deep hip or hamstring work at all. Long, passive holds are wonderful for recovery and a poor idea in the days before you need power — so the taper is built in rather than left to you to remember.",
    anchor: 'race',
    anchorLabel: 'Your race day',
    schedule: {
      type: 'dated',
      weeks: 4,
      items: [
        // 4 weeks out — normal load.
        { day: -27, ref: 'practice:hips-hip-flexors', note: 'Four weeks out. Train as usual; this is ordinary maintenance.' },
        { day: -24, ref: 'practice:hamstrings-glutes', note: 'The back of the legs, while there is still time for them to change.' },
        { day: -21, ref: 'practice:full-reset', note: 'A long rest-day reset. The last really deep session of the block.' },
        // 3 weeks out — still working, slightly shorter.
        { day: -20, ref: 'practice:quads-outer-hip', note: 'Outer hip and quads — the ones that complain late in a long race.' },
        { day: -17, ref: 'practice:calves-ankles-feet', note: 'Feet and ankles. Everything above them stands on this.' },
        { day: -14, ref: 'practice:restorative-reset', note: 'Supported and gentle. The taper starts here in spirit.' },
        // 2 weeks out — easing.
        { day: -13, ref: 'practice:lower-back-spine', note: 'Low back, kept light.' },
        { day: -10, ref: 'practice:express-reset', note: 'A little of everything, nothing deep.' },
        { day: -7, ref: 'routine:up-the-wall', note: 'Legs up the wall. From here on it is recovery, not range.' },
        // Race week — supported only. Nothing that could leave the legs loose.
        { day: -5, ref: 'routine:up-the-wall', note: 'Race week. Twelve easy minutes, nothing asked of the legs.' },
        { day: -3, ref: 'routine:pre-race-calm', note: 'Fully supported. This is for your head as much as your hips.' },
        { day: -1, ref: 'routine:pre-race-calm', note: 'The night before. Nothing deep — just props, stillness, and sleep.' },
        // After.
        { day: 1, ref: 'routine:up-the-wall', note: 'The day after. Legs up the wall and nothing else. Well run.' },
        { day: 3, ref: 'practice:restorative-reset', note: 'Still gentle. Let the race come out of your legs before you ask anything of them.' },
      ],
    },
  },
];
