/**
 * A private log of what you've practiced, kept in the browser.
 *
 * localStorage rather than the database, deliberately: it works today with no
 * account, no network and no sign-in, and a practice log is the last thing that
 * should fail because a fetch did. The shape is a flat append-only list so it
 * can be posted to Supabase later and reconciled by (slug, day) without a
 * migration.
 *
 * DESIGN NOTE — no streaks, on purpose. Katie's whole promise is "nothing to
 * keep up with" and "no guilt, ever". A streak counter manufactures exactly the
 * pressure she spends the rest of the copy removing, and a broken one is a
 * well-known reason people abandon a habit tool outright. So this counts what
 * you did and never comments on what you didn't.
 */

export type PracticeEntry = {
  slug: string;
  title: string;
  minutes: number;
  /** ISO date, day precision — the log is a diary, not a stopwatch. */
  day: string;
};

const KEY = 'yywk-practice-log';
const MAX = 500; // a couple of years of daily practice; keeps localStorage small

const today = () => new Date().toISOString().slice(0, 10);

export function readLog(): PracticeEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e) => e && e.slug && e.day) : [];
  } catch {
    return []; // corrupt or unavailable storage must never break the page
  }
}

/** Records a completion. Returns false if this one was already logged today. */
export function logPractice(entry: Omit<PracticeEntry, 'day'>): boolean {
  const log = readLog();
  const day = today();
  // One entry per practice per day: finishing the timer and then also tapping
  // "mark as done" is one practice, not two.
  if (log.some((e) => e.slug === entry.slug && e.day === day)) return false;
  log.push({ ...entry, day });
  try {
    localStorage.setItem(KEY, JSON.stringify(log.slice(-MAX)));
  } catch {
    /* quota or private mode — the practice still happened, which is the point */
  }
  return true;
}

export function didToday(slug: string): boolean {
  return readLog().some((e) => e.slug === slug && e.day === today());
}

/** Days back from today, oldest first — for the rhythm grid. */
export function recentDays(count: number): { day: string; count: number }[] {
  const log = readLog();
  const byDay = new Map<string, number>();
  for (const e of log) byDay.set(e.day, (byDay.get(e.day) ?? 0) + 1);

  const out: { day: string; count: number }[] = [];
  const cursor = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  return out;
}

export function stats() {
  const log = readLog();
  const cut = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };
  const week = cut(7);
  const month = cut(30);
  const inWeek = log.filter((e) => e.day >= week);
  const inMonth = log.filter((e) => e.day >= month);
  return {
    week: inWeek.length,
    month: inMonth.length,
    weekMinutes: inWeek.reduce((n, e) => n + (e.minutes || 0), 0),
    monthMinutes: inMonth.reduce((n, e) => n + (e.minutes || 0), 0),
    total: log.length,
  };
}
