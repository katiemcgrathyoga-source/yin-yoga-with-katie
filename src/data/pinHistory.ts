/**
 * What the previous calendar already sent to Pinterest.
 *
 * Replacing the plan wholesale would otherwise reset every cooldown to zero on
 * changeover day — the new schedule would happily send a third pin to Desk
 * Workers in five days, or re-pin /free-class a week after the last one, which
 * is exactly the pattern Pinterest reads as spam.
 *
 * So the seam is handed over explicitly. `planDays` seeds its URL and board
 * cooldowns from this list before it plans anything, and skips these days
 * rather than planning over them.
 *
 * WHERE THIS CAME FROM
 * The deployed /pincalendar was read directly — it is the page Katie has
 * actually been working from, so this is what she saw, not a reconstruction.
 * That build was frozen to its deploy date (3 August) and listed fourteen days;
 * only the four she has reached are recorded here. The rest of that plan is
 * discarded — the new one replaces it from 7 August.
 *
 * THE ONE UNCERTAINTY
 * That build named boards from the old aspirational list, several of which did
 * not exist. `board` below is the current real board the old name was pointing
 * at, which is a judgement about intent rather than a fact. If Katie put one of
 * these somewhere else, correct the line — nothing else reads it.
 *
 * DO NOT EMPTY THIS. It stops affecting the plan once the last date is more than
 * URL_COOLDOWN_DAYS behind, but it has a second job: it is the durable record of
 * which template went out on which day, which is the only way to answer "which
 * designs actually performed?" against a Pinterest analytics export months later.
 * /pincalendar has a "Copy pinned log" button that produces rows for this file.
 */
export type PinnedAlready = {
  /** ISO date, local. The day it went out. */
  date: string;
  /** Destination URL, exactly as the inventory writes it. */
  url: string;
  /** The board it went to, in current board names. */
  board: string;
  /** What it was, for reading the file. */
  what: string;
};

const SITE = 'https://yinyogawithkatie.com';

export const PIN_HISTORY: PinnedAlready[] = [
  {
    date: '2026-08-03',
    url: `${SITE}/routines/bedtime-wind-down/`,
    board: 'Yoga Nidra & Deep Rest',
    what: 'Bedtime Wind-Down',
  },
  {
    date: '2026-08-03',
    url: `${SITE}/routines/heart-chest-opener/`,
    board: 'Yoga for Desk Workers | Neck, Shoulders & Posture',
    what: 'Heart & Chest Opener',
  },
  {
    date: '2026-08-04',
    url: `${SITE}/free-class`,
    board: 'Bedtime Yoga & Yin for Sleep',
    what: 'The free two-hour retreat',
  },
  {
    date: '2026-08-04',
    url: `${SITE}/routines/shoulders-neck-desk-relief/`,
    board: 'Yoga for Desk Workers | Neck, Shoulders & Posture',
    what: 'Shoulders, Neck & Desk Relief',
  },
  {
    date: '2026-08-05',
    url: `${SITE}/videos/60-minute-yin-yoga-for-deep-relaxation-class-1-of-monthly-peaceful/`,
    board: 'Yin Yoga for Beginners',
    what: 'Deep Relaxation Yin',
  },
  {
    date: '2026-08-05',
    url: `${SITE}/blog/yoga-for-desk-workers/`,
    board: 'Yoga for Desk Workers | Neck, Shoulders & Posture',
    what: 'Yoga for Desk Workers (journal)',
  },
  {
    date: '2026-08-06',
    url: `${SITE}/poses/wind-relieving/`,
    board: 'Bedtime Yoga & Yin for Sleep',
    what: 'Wind-Relieving Pose',
  },
  {
    date: '2026-08-06',
    url: `${SITE}/runners`,
    board: 'Yin Yoga for Runners',
    what: 'The Post-Run Reset',
  },
  // Second handover, 2026-08-25: the gap between here and 08-06 was carried
  // by the deterministic plan alone (no ground truth to check it against),
  // which is fine until the plan itself changes mid-stream — which it did,
  // twice, on 08-24 and 08-25. Re-anchored from Katie's real "Copy pinned
  // log" export so the next few days' cooldowns check against what actually
  // went out, not a retroactive recomputation of it.
  {
    date: '2026-08-24',
    url: `${SITE}/blog/how-long-to-hold-yin-poses/`,
    board: 'Yin Yoga for Beginners',
    what: 'How Long Should You Hold Yin Yoga Poses? (And Why)',
  },
  {
    date: '2026-08-24',
    url: `${SITE}/poses/legs-up-the-wall/`,
    board: 'Bedtime Yoga & Yin for Sleep',
    what: 'Legs Up the Wall',
  },
  {
    date: '2026-08-24',
    url: `${SITE}/videos/55-min-silent-yin-yoga-class-upper-body-minimum-cues-yin-yoga/`,
    board: 'Yoga for Desk Workers | Neck, Shoulders & Posture',
    what: '55-min Silent Upper-Body Yin',
  },
];

/** The day after the last one the old plan owned — where the new plan starts. */
export const HANDOVER = '2026-08-25';
