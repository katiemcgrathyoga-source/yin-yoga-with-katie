import type { Pin } from './pinInventory';

/**
 * Turns the inventory into a dated plan.
 *
 * Deterministic on purpose: the same day always produces the same two pins, so
 * reloading /pincalendar never reshuffles the plan out from under Katie, and a
 * day half-done can be finished later. The seed is fixed, not the date, so
 * nothing drifts as the library grows either — new pins join the end of the
 * queue rather than reshuffling what is already scheduled.
 */

const EPOCH = Date.UTC(2026, 0, 1); // day 0 of the plan
const DAY = 86_400_000;
export const PINS_PER_DAY = 2;

/** No destination pinned twice inside this window. Pinterest reads that as spam. */
const URL_COOLDOWN_DAYS = 14;
/** One pin in five asks for the email; one in five sends to YouTube. */
const OFFER_EVERY = 5;
const VIDEO_EVERY = 5;

export type PlannedPin = Pin & { slot: number };
export type PinDay = { date: Date; dayIndex: number; pins: PlannedPin[] };

/** mulberry32 — small, fast, and identical everywhere. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: number): T[] {
  const out = items.slice();
  const rand = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const dayIndexFor = (date: Date) =>
  Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / DAY);

/**
 * Plan `days` days starting from `from`.
 *
 * Builds the whole run from day 0 so the result is stable regardless of which
 * window is asked for — planning a week in August must produce the same pins
 * whether it is generated in August or next year.
 */
export function planDays(pins: Pin[], from: Date, days: number): PinDay[] {
  const startIndex = dayIndexFor(from);
  // Three queues, each shuffled with its own seed so adding a video never
  // reorders the pose queue.
  const queues = {
    offer: shuffled(pins.filter((p) => p.kind === 'offer'), 1),
    video: shuffled(pins.filter((p) => p.kind === 'video'), 2),
    rest: shuffled(pins.filter((p) => p.kind !== 'offer' && p.kind !== 'video'), 3),
  };
  const cursor = { offer: 0, video: 0, rest: 0 };

  /** Last day each destination was pinned, so the cooldown can be enforced. */
  const lastPinned = new Map<string, number>();

  type DaySoFar = { boards: Set<string>; templates: Set<string> };

  function take(kind: keyof typeof queues, day: number, soFar: DaySoFar): Pin | null {
    const queue = queues[kind];
    if (queue.length === 0) return null;
    // Walk forward from the cursor for the first pin that clears every rule.
    // Template variety is one of them: two pose lists in a day, or two text
    // cards, reads as one pin posted twice — which is exactly what the pins
    // were redesigned to stop being.
    for (let step = 0; step < queue.length; step++) {
      const at = (cursor[kind] + step) % queue.length;
      const pin = queue[at];
      const last = lastPinned.get(pin.url);
      const cool = last === undefined || day - last >= URL_COOLDOWN_DAYS;
      if (cool && !soFar.boards.has(pin.board) && !soFar.templates.has(pin.template)) {
        queue.splice(at, 1);
        queue.push(pin); // back of the queue — it comes round again eventually
        cursor[kind] = at % Math.max(1, queue.length);
        return pin;
      }
    }
    const pin = queue[cursor[kind] % queue.length];
    cursor[kind] = (cursor[kind] + 1) % queue.length;
    return pin;
  }

  const out: PinDay[] = [];
  for (let day = 0; day < startIndex + days; day++) {
    const soFar: DaySoFar = { boards: new Set(), templates: new Set() };
    const dayPins: PlannedPin[] = [];

    for (let slot = 0; slot < PINS_PER_DAY; slot++) {
      const n = day * PINS_PER_DAY + slot;
      const kind: keyof typeof queues =
        n % OFFER_EVERY === 0 ? 'offer' : n % VIDEO_EVERY === 2 ? 'video' : 'rest';
      const pin = take(kind, day, soFar) ?? take('rest', day, soFar);
      if (!pin) continue;
      soFar.boards.add(pin.board);
      soFar.templates.add(pin.template);
      lastPinned.set(pin.url, day);
      dayPins.push({ ...pin, slot });
    }

    if (day >= startIndex) {
      out.push({ date: new Date(EPOCH + day * DAY), dayIndex: day, pins: dayPins });
    }
  }
  return out;
}

/** The Pinterest "save" URL — one click from the calendar to a scheduled pin. */
export const saveUrl = (pin: Pin) =>
  'https://www.pinterest.com/pin/create/button/?' +
  new URLSearchParams({ url: pin.url, media: pin.image, description: pin.description }).toString();

