/**
 * Turning a routine's steps into the flat list of holds the player runs.
 *
 * Two things get unfolded here, and both used to be copy-pasted into every page
 * that rendered a player:
 *
 *   sides — a two-sided pose becomes Side 1 then Side 2, with a pause between.
 *   parts — a pose held in parts (see `parts` on the poses collection) becomes
 *           one hold per part, run back to back with NO pause. Reclined Hamstring
 *           is leg up, then out to the side, then across the body; stopping to
 *           rebound between them would break the one thing that makes it work.
 *
 * They nest: every part of side one, then the side switch, then every part of
 * side two. A multi-part pose therefore costs a sequence exactly what a single
 * hold of the same length costs, which is why lib/duration.ts needs no special
 * case for it and the minutes on the page do not move.
 */
import { MIN_PART_SECONDS, splitParts, type PosePart } from './duration';

export interface Hold {
  name: string;
  slug: string;
  img: string;
  seconds: number;
  note?: string;
  sideLabel?: string;
  /** Which part of a multi-part pose this is, e.g. "A · Leg up". */
  partLabel?: string;
  rebound?: number;
  /** Run straight into the next hold with no rebound — parts within one side. */
  joinNext?: boolean;
}

export interface HoldStep {
  pose: string;
  seconds: number;
  sides?: 1 | 2;
  rebound?: number;
  note?: string;
}

export interface HoldPose {
  name_en: string;
  slug: string;
  images: string[];
  cues?: string[];
  parts?: PosePart[];
}

/**
 * @param steps      the routine's or practice's steps, in order
 * @param bySlug     pose slug -> pose data, for the name, photo and parts
 * @param keepRebound course sequences honour a step's `rebound:` override; the
 *                    public site runs a flat gap and drops it (PUBLIC_GAP_SECONDS)
 */
export function expandHolds(
  steps: readonly HoldStep[],
  bySlug: ReadonlyMap<string, HoldPose>,
  { keepRebound = false, humanise }: { keepRebound?: boolean; humanise?: (slug: string) => string } = {},
): Hold[] {
  const out: Hold[] = [];
  for (const step of steps) {
    const pose = bySlug.get(step.pose);
    const name = pose?.name_en ?? (humanise ? humanise(step.pose) : step.pose);
    const img = pose?.images?.[0] ?? `/poses/${step.pose}.jpg`;
    // Same fallback the pages used before: the step's own cue, else the pose's first.
    const stepNote = step.note ?? pose?.cues?.[0] ?? '';
    const sides = step.sides ?? 1;
    const parts = pose?.parts ?? [];

    if (parts.length) {
      const split = splitParts(step.seconds, parts);
      const shortest = Math.min(...split);
      if (shortest < MIN_PART_SECONDS) {
        throw new Error(
          `${step.pose} is held in ${parts.length} parts, so a step of ${step.seconds}s per side ` +
            `leaves only ${shortest}s for the shortest of them. Give it at least ` +
            `${Math.ceil((step.seconds * MIN_PART_SECONDS) / shortest)}s per side, or use a pose that is not held in parts.`,
        );
      }
      for (let s = 1; s <= sides; s++) {
        parts.forEach((part, k) => {
          out.push({
            name,
            slug: step.pose,
            img: part.image ?? img,
            seconds: split[k],
            note: part.cue,
            sideLabel: sides === 2 ? `Side ${s}` : undefined,
            partLabel: part.label,
            joinNext: k < parts.length - 1,
            ...(keepRebound ? { rebound: step.rebound } : {}),
          });
        });
      }
      continue;
    }

    for (let s = 1; s <= sides; s++) {
      out.push({
        name,
        slug: step.pose,
        img,
        seconds: step.seconds,
        note: stepNote,
        sideLabel: sides === 2 ? `Side ${s}` : undefined,
        ...(keepRebound ? { rebound: step.rebound } : {}),
      });
    }
  }
  return out;
}
