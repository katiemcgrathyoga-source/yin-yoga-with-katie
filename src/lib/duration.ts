/**
 * The single source of truth for how long a practice actually takes.
 *
 * A Yin practice is never just the sum of its holds. Between shapes you rebound —
 * a still pause to let the tissue respond before the next pose — and swapping to
 * the second side takes a moment too. Leave those out and a class runs a third
 * longer than the number on the page, which is exactly what used to happen here.
 *
 * Katie's timings: 30–60s rebound between poses (45 is the working default),
 * 15s to switch sides, 15s to settle in before the first hold.
 *
 * Keep this in step with the constants in RoutinePlayer.astro — the player runs
 * the practice, this predicts it, and the two disagreeing is the original bug.
 */

export const PREP_SECONDS = 15;
export const REBOUND_SECONDS = 45;
export const SIDE_SWITCH_SECONDS = 15;

/**
 * The public site runs a flat 15 seconds between everything — pose to pose and
 * side to side — and ignores per-step `rebound:` overrides (Kevin, 2026-09-07).
 * The 45-second rebound is a course thing: the paid sessions keep it. Anything
 * that shows or runs a public routine must use the PUBLIC functions below.
 */
export const PUBLIC_GAP_SECONDS = 15;

export interface DurationStep {
  seconds: number;
  sides?: 1 | 2;
  /** Override the rebound that FOLLOWS this step (Katie's 30–60s range). */
  rebound?: number;
}

/**
 * A pose held in parts (see `parts` on the poses collection). The parts run back
 * to back with NO gap between them, so a multi-part pose costs a sequence exactly
 * what a single hold of the same length would — the functions above need no
 * special case for it, and the number on the page does not move.
 */
export interface PosePart {
  label: string;
  image?: string;
  seconds: number;
  cue: string;
}

/**
 * Below this, a part is too short to be worth changing shape for — you spend it
 * getting there. `expandHolds` refuses to build a sequence that asks for less.
 */
export const MIN_PART_SECONDS = 30;

/**
 * Divide a step's per-side time across a pose's parts, keeping the pose's own
 * ratio between them. A routine says how long the shape gets; the pose says how
 * that time is shared out. Largest-remainder rounding, so the parts add back up
 * to the step exactly and no second goes missing.
 */
export function splitParts(totalSeconds: number, parts: readonly PosePart[]): number[] {
  const weight = parts.reduce((n, p) => n + p.seconds, 0);
  if (weight <= 0) return parts.map(() => Math.floor(totalSeconds / parts.length));
  const exact = parts.map((p) => (totalSeconds * p.seconds) / weight);
  const out = exact.map(Math.floor);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  let left = totalSeconds - out.reduce((a, b) => a + b, 0);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length].i]++;
  return out;
}

/** True runtime of a sequence, in seconds — holds, rebounds, side switches and lead-in. */
export function practiceSeconds(steps: readonly DurationStep[]): number {
  if (steps.length === 0) return 0;
  return steps.reduce((total, step, i) => {
    const sides = step.sides ?? 1;
    const holds = step.seconds * sides;
    const sideSwitch = (sides - 1) * SIDE_SWITCH_SECONDS;
    // No rebound after the final pose — the practice ends there.
    const rebound = i < steps.length - 1 ? (step.rebound ?? REBOUND_SECONDS) : 0;
    return total + holds + sideSwitch + rebound;
  }, PREP_SECONDS);
}

/** The number we put on the page: true runtime, rounded to the nearest minute. */
export function practiceMinutes(steps: readonly DurationStep[]): number {
  return Math.round(practiceSeconds(steps) / 60);
}

/** Public-site runtime: lead-in, holds, and a flat gap after every hold but the last. */
export function publicPracticeSeconds(steps: readonly DurationStep[]): number {
  if (steps.length === 0) return 0;
  return steps.reduce((total, step, i) => {
    const sides = step.sides ?? 1;
    const gaps = (sides - 1) + (i < steps.length - 1 ? 1 : 0);
    return total + step.seconds * sides + gaps * PUBLIC_GAP_SECONDS;
  }, PREP_SECONDS);
}

export function publicPracticeMinutes(steps: readonly DurationStep[]): number {
  return Math.round(publicPracticeSeconds(steps) / 60);
}
