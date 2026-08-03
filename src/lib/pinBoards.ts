/**
 * Audience tag → Pinterest board.
 *
 * The audience tag on a pin angle *is* the board it gets pinned to. There is no
 * separate board field to keep in sync: /pincalendar reads this map to decide
 * where each of the day's pins goes, and the pose schema validates every
 * `pin_angles[].audience` against these keys — so an angle can never name a
 * board that doesn't exist.
 *
 * Adding an audience: add it here, and create the board on Pinterest. Board
 * names are search terms, so keep them plain and descriptive.
 */
export const PIN_BOARDS = {
  'for runners': 'Yoga for Runners',
  'for tired legs': 'Yoga for Runners',
  'if you sit all day': 'Yoga for Desk Workers',
  'for stiff shoulders': 'Yoga for Desk Workers',
  'for restless nights': 'Yin Yoga for Sleep & Relaxation',
  "when you're wound up": 'Yin Yoga for Stress & Calm',
  'for beginners': 'Yin Yoga for Beginners',
  'for tight hips': 'Yoga for Flexibility & Mobility',
  'for a stiff back': 'Yoga for Flexibility & Mobility',
  // Added for the video library, which has large morning and full-body clusters
  // that none of the tags above describes honestly.
  'for a full-body reset': 'Yin Yoga Routines & Sequences',
  'to start the day': 'Yin Yoga Routines & Sequences',
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
 */
export const PIN_LIMITS = { audience: 22, headline: 40, proof: 54 } as const;
