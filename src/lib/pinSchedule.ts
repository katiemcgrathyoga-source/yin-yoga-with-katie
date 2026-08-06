import type { Pin } from './pinInventory';
import { PIN_HISTORY, type PinnedAlready } from '../data/pinHistory';

/**
 * Turns the inventory into a dated plan.
 *
 * Deterministic on purpose: the same day always produces the same two pins, so
 * reloading /pincalendar never reshuffles the plan out from under Katie, and a
 * day half-done can be finished later. The seed is fixed, not the date, so
 * nothing drifts as the library grows either — new pins join the end of the
 * queue rather than reshuffling what is already scheduled.
 *
 * Three rules shape the plan, in the order they matter:
 *
 *   1. A board rests between pins.       Pinterest's own guidance, and the one
 *                                        thing a naive shuffle gets wrong — it
 *                                        will happily hit Desk Workers three
 *                                        times in five days.
 *   2. A destination rests two weeks.    Repeatedly pinning one URL is the
 *                                        clearest spam signal there is.
 *   3. No two of the same template, or   Two pose lists in a day reads as one
 *      the same board, in one day.       pin posted twice.
 *
 * When they cannot all hold, they give way in that order rather than all at
 * once — see TIERS.
 */

const EPOCH = Date.UTC(2026, 0, 1); // day 0 of the plan
const DAY = 86_400_000;
export const PINS_PER_DAY = 2;

/** No destination pinned twice inside this window. Pinterest reads that as spam. */
const URL_COOLDOWN_DAYS = 14;
/**
 * Clear days a board gets between pins. Nine boards are reachable from an
 * audience tag and two pins go out a day, so 3 leaves roughly three boards
 * free at any moment — enough to choose from without the plan visibly
 * cycling through the same rotation.
 */
const BOARD_COOLDOWN_DAYS = 3;
/** One pin in five asks for the email; one in five sends to YouTube. */
const OFFER_EVERY = 5;
const VIDEO_EVERY = 5;

/**
 * How the rules give way when nothing clears them all.
 *
 * The old scheduler had one fallback that ignored every rule at once, which is
 * how two pose lists ended up on the same day. Board rest is the softest of the
 * three, so it goes first; the destination cooldown holds longest because it is
 * the one Pinterest actually punishes.
 */
const TIERS = [
  { board: BOARD_COOLDOWN_DAYS, url: URL_COOLDOWN_DAYS },
  { board: 2, url: URL_COOLDOWN_DAYS },
  { board: 1, url: URL_COOLDOWN_DAYS },
  { board: 1, url: 7 },
  { board: 1, url: 0 },
];

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

/** Parsed as a plain calendar date — never through the local timezone. */
const dayIndexForISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / DAY);
};

/**
 * Plan `days` days starting from `from`.
 *
 * Builds the whole run from day 0 so the result is stable regardless of which
 * window is asked for — planning a week in August must produce the same pins
 * whether it is generated in August or next year.
 */
export function planDays(
  pins: Pin[],
  from: Date,
  days: number,
  history: PinnedAlready[] = PIN_HISTORY,
): PinDay[] {
  const startIndex = dayIndexFor(from);
  // Three queues, each shuffled with its own seed so adding a video never
  // reorders the pose queue.
  const queues = {
    offer: shuffled(pins.filter((p) => p.kind === 'offer'), 1),
    video: shuffled(pins.filter((p) => p.kind === 'video'), 2),
    rest: shuffled(pins.filter((p) => p.kind !== 'offer' && p.kind !== 'video'), 3),
  };
  const cursor = { offer: 0, video: 0, rest: 0 };

  /** Last day each destination, and each board, was pinned. */
  const lastUrl = new Map<string, number>();
  const lastBoard = new Map<string, number>();

  // Days the previous calendar owned. They are not re-planned — they are read,
  // so their boards and destinations carry their cooldowns across the seam.
  const handedOver = new Map<number, PinnedAlready[]>();
  for (const entry of history) {
    const day = dayIndexForISO(entry.date);
    handedOver.set(day, [...(handedOver.get(day) ?? []), entry]);
  }

  type DaySoFar = { boards: Set<string>; templates: Set<string> };

  const rested = (map: Map<string, number>, key: string, day: number, gap: number) => {
    const last = map.get(key);
    return last === undefined || day - last >= gap;
  };

  function take(kind: keyof typeof queues, day: number, soFar: DaySoFar): Pin | null {
    const queue = queues[kind];
    if (queue.length === 0) return null;
    for (const tier of TIERS) {
      // Walk forward from the cursor for the first pin that clears this tier.
      for (let step = 0; step < queue.length; step++) {
        const at = (cursor[kind] + step) % queue.length;
        const pin = queue[at];
        if (soFar.boards.has(pin.board) || soFar.templates.has(pin.template)) continue;
        if (!rested(lastUrl, pin.url, day, tier.url)) continue;
        if (!rested(lastBoard, pin.board, day, tier.board)) continue;
        queue.splice(at, 1);
        queue.push(pin); // back of the queue — it comes round again eventually
        cursor[kind] = at % Math.max(1, queue.length);
        return pin;
      }
    }
    return null;
  }

  const out: PinDay[] = [];
  for (let day = 0; day < startIndex + days; day++) {
    const already = handedOver.get(day);
    if (already) {
      for (const entry of already) {
        lastUrl.set(entry.url, day);
        lastBoard.set(entry.board, day);
      }
      continue; // the old calendar owned this day
    }

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
      lastUrl.set(pin.url, day);
      lastBoard.set(pin.board, day);
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
