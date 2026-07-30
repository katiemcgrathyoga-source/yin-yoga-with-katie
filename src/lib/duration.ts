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

export interface DurationStep {
  seconds: number;
  sides?: 1 | 2;
  /** Override the rebound that FOLLOWS this step (Katie's 30–60s range). */
  rebound?: number;
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
