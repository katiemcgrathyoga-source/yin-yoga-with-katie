/**
 * Which routines belong on the free site, and which belong to a paid course.
 *
 * A routine with a `course` set is a bonus inside that course. It must not
 * appear anywhere public — not in the index, not as a page of its own, not as a
 * "featured routine" on a pose page (which would link a stranger to a gate), and
 * emphatically not in the pin/board consoles, where the whole point is to
 * publish things to Pinterest.
 *
 * Filtering lives here rather than inline so a NEW public surface has one
 * obvious thing to call, instead of quietly leaking by omission.
 */

type WithCourse = { data: { course?: string } };

/** Free-site routines only. Use on every public surface. */
export const publicRoutines = <T extends WithCourse>(all: T[]): T[] => all.filter((r) => !r.data.course);

/** Routines belonging to one course. Use behind the gate. */
export const courseRoutines = <T extends WithCourse>(all: T[], course: string): T[] =>
  all.filter((r) => r.data.course === course);
