/**
 * Audience tag → Pinterest board.
 *
 * The audience tag on a pin angle *is* the board it gets pinned to. There is no
 * separate board field to keep in sync: /pincalendar reads this map to decide
 * where each of the day's pins goes, and the pose schema validates every
 * `pin_angles[].audience` against these keys — so an angle can never name a
 * board that doesn't exist.
 *
 * These are the boards that actually exist — the canonical list on /boards, plus
 * Desk Workers. They are not aspirational: a pin whose board is missing has
 * nowhere to go, and /pincalendar sending Katie to a board that was never
 * created is the exact friction this page exists to remove.
 *
 * Adding an audience: create the board on Pinterest first, then add it here.
 *
 * Two of the ten are deliberately not reachable from an audience tag. **Yin
 * Yoga Poses** is the evergreen catch-all — every pose already has a more
 * specific home, so routing to it would only dilute the targeted boards.
 * **Yin Yoga Routines** takes only `to start the day` for the same reason.
 * Both are still fed by hand from /boards.
 */
export const PIN_BOARDS = {
  'for runners': 'Yin Yoga for Runners',
  // Every real use of this tag (the /runners offer, the-day-after routine, the
  // legs-up-the-wall pose, the sore-legs-after-running post) is post-run/
  // exercise-recovery copy — "legs like concrete", "sore legs after running" —
  // not sleep or savasana. It was pointed at Yoga Nidra & Deep Rest, which the
  // board's own blurb ("savasana, legs up the wall, the most calming
  // practices") made a plausible-looking pairing, but the actual pin copy
  // never mentions rest or sleep, so it read as off-topic to anyone browsing
  // that board — found 2026-08-25 when a runner-recovery offer landed there.
  'for tired legs': 'Yin Yoga for Runners',
  'if you sit all day': 'Yoga for Desk Workers | Neck, Shoulders & Posture',
  'for stiff shoulders': 'Yoga for Desk Workers | Neck, Shoulders & Posture',
  'for restless nights': 'Bedtime Yoga & Yin for Sleep',
  "when you're wound up": 'Yoga Nidra & Deep Rest',
  'for beginners': 'Yin Yoga for Beginners',
  'for tight hips': 'Yoga for Hips',
  'for a stiff back': 'Yoga for Back & Spine',
  'for a full-body reset': 'Yin Yoga for Flexibility',
  'to start the day': 'Yin Yoga Routines',
} as const;

export type PinAudience = keyof typeof PIN_BOARDS;

/** Non-empty tuple form, for `z.enum()` in the pose schema. */
export const PIN_AUDIENCES = Object.keys(PIN_BOARDS) as [PinAudience, ...PinAudience[]];

/** The board a pin with this audience tag belongs on. */
export const boardFor = (audience: PinAudience): string => PIN_BOARDS[audience];

/**
 * Hard limits on pin copy, shared by the schema and the draft checker.
 *
 * These are the tightest slot for each layer across all eight templates, not the
 * loosest — so a single angle can be dropped into any template without checking
 * first. Satori cannot shrink type to fit: one character over and the headline
 * runs off the canvas instead of wrapping.
 *
 *   audience  22 — also the board key
 *   headline  40 — List and Split are the tightest; Hook would allow 46
 *   proof     54 — the Split card is the tightest proof slot
 *   state     19 — one line at 108px on Before → after. Both state lines must
 *                  break the same way, so this one is measured, not chosen.
 */
export const PIN_LIMITS = { audience: 22, headline: 40, proof: 54, state: 19 } as const;
