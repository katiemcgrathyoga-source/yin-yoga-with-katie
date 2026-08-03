import { PIN_BOARDS, PIN_LIMITS, type PinAudience } from '../lib/pinBoards';

/**
 * Pin copy for the landing pages.
 *
 * Poses, routines, journal posts and videos carry their pin angles in their own
 * frontmatter, where the schema validates them. The two landing pages aren't
 * collections — they're `.astro` files — so their copy lives here instead, and
 * the assertion at the bottom does the job the schema does everywhere else.
 *
 * These are the only pages that use the Offer template, which is the one pin
 * that asks for something. Roughly one pin in five.
 *
 * Unlike the collections, a landing page may repeat its audience across both
 * angles: it has exactly one audience, and the calendar never schedules two
 * offer pins on the same day, so there is nothing to spread.
 */
export type PinPage = {
  /** Destination path on the site. */
  path: string;
  /** Shown on the calendar row so Katie knows what she's pinning. */
  label: string;
  /** Pose photo slug for the Offer template's band. */
  image: string;
  /** The inset strip inside the card — what you get, and what it costs. */
  offer: string;
  /** The pill. Two or three words; it never wraps. */
  cta: string;
  angles: { audience: PinAudience; headline: string; proof: string }[];
};

export const PIN_PAGES: PinPage[] = [
  {
    path: '/runners',
    label: 'The Post-Run Reset',
    image: 'sleeping-swan',
    offer: 'Free · 15 minutes · straight to your inbox',
    cta: 'Send it to me',
    angles: [
      {
        audience: 'for runners',
        headline: 'The fifteen minutes after your run',
        proof: 'One easy hold for each place a run tightens.',
      },
      {
        audience: 'for runners',
        headline: 'The part of training you skip',
        proof: 'Fifteen minutes. No props, no flexibility needed.',
      },
    ],
  },
  {
    path: '/free-class',
    label: 'The free two-hour retreat',
    image: 'corpse',
    offer: 'Free · 2 hours · normally members-only',
    cta: 'Send me the class',
    angles: [
      {
        audience: 'for restless nights',
        headline: 'A two-hour retreat, at home, free',
        proof: 'Yin, restorative and Yoga Nidra. Yours to keep.',
      },
      {
        audience: "when you're wound up",
        headline: 'Two hours of nothing being asked',
        proof: 'Normally members-only. Free, and yours to keep.',
      },
    ],
  },
];

/**
 * The schema guard, by hand — this file is imported during the build, so a pin
 * over the limit fails `astro build` the same way a bad pose file would.
 */
for (const page of PIN_PAGES) {
  for (const angle of page.angles) {
    if (!(angle.audience in PIN_BOARDS)) {
      throw new Error(`${page.path}: "${angle.audience}" is not a known audience`);
    }
    for (const field of ['audience', 'headline', 'proof'] as const) {
      const value = angle[field];
      if (value.length > PIN_LIMITS[field]) {
        throw new Error(
          `${page.path}: ${field} is ${value.length}/${PIN_LIMITS[field]} — "${value}"`,
        );
      }
    }
  }
  if (page.offer.length > 44) throw new Error(`${page.path}: offer is ${page.offer.length}/44`);
  if (page.cta.length > 20) throw new Error(`${page.path}: cta is ${page.cta.length}/20`);
}
