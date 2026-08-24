/**
 * Audits the plan the scheduler produces.
 *
 *   npx astro build && node scripts/check-pin-plan.mjs
 *
 * The rules in src/lib/pinSchedule.ts give way in tiers when the library cannot
 * satisfy them all, which is correct — a plan with a gap in it is worse than a
 * plan that bends. But bending silently is how the previous version ended up
 * putting two pose lists on one day without anyone noticing, so every relaxed
 * rule is reported here rather than absorbed.
 */
import { readFileSync } from 'node:fs';

const { total, history, days } = JSON.parse(readFileSync('dist/pinplan.json', 'utf8'));

const BOARD_REST = 2; // keep in step with BOARD_COOLDOWN_DAYS in src/lib/pinSchedule.ts
const URL_REST = 7;
const PAIR_REST = 21;

// Seed from the handover so the seam is audited too, not just the new plan.
const lastBoard = new Map();
const lastUrl = new Map();
const lastPair = new Map();
const pairKey = (url, board) => `${board} ${url}`;
const dayNum = (iso) => Math.round(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
for (const h of history) {
  lastBoard.set(h.board, dayNum(h.date));
  lastUrl.set(h.url, dayNum(h.date));
  lastPair.set(pairKey(h.url, h.board), dayNum(h.date));
}

const problems = [];
const boardCount = new Map();
const templateCount = new Map();
const kindCount = new Map();

// Read the day's own pin count off the data rather than hardcoding it —
// PINS_PER_DAY in src/lib/pinSchedule.ts is the source of truth, and a
// literal here would silently go stale the next time it changes. The mode
// across all days (not just day 0) is what "expected" means, in case a
// short-supply day ever legitimately falls short.
const countFreq = new Map();
for (const day of days) countFreq.set(day.pins.length, (countFreq.get(day.pins.length) ?? 0) + 1);
const expectedPerDay = [...countFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

for (const day of days) {
  const n = dayNum(day.date);
  const seenBoards = new Set();
  const seenTemplates = new Set();

  if (day.pins.length !== expectedPerDay) {
    problems.push(`${day.date}: ${day.pins.length} pins, expected ${expectedPerDay}`);
  }

  for (const pin of day.pins) {
    boardCount.set(pin.board, (boardCount.get(pin.board) ?? 0) + 1);
    templateCount.set(pin.template, (templateCount.get(pin.template) ?? 0) + 1);
    kindCount.set(pin.kind, (kindCount.get(pin.kind) ?? 0) + 1);

    if (seenBoards.has(pin.board)) problems.push(`${day.date}: two pins to ${pin.board}`);
    if (seenTemplates.has(pin.template)) problems.push(`${day.date}: two ${pin.template} pins`);
    seenBoards.add(pin.board);
    seenTemplates.add(pin.template);

    const lb = lastBoard.get(pin.board);
    if (lb !== undefined && n - lb < BOARD_REST) {
      problems.push(`${day.date}: ${pin.board} again after ${n - lb} day(s) — wanted ${BOARD_REST}`);
    }
    const short = pin.url.replace('https://yinyogawithkatie.com', '');
    const lu = lastUrl.get(pin.url);
    if (lu !== undefined && n - lu < URL_REST) {
      problems.push(`${day.date}: ${short} again after ${n - lu} day(s) — wanted ${URL_REST}`);
    }
    const lp = lastPair.get(pairKey(pin.url, pin.board));
    if (lp !== undefined && n - lp < PAIR_REST) {
      problems.push(`${day.date}: ${short} back on ${pin.board} after ${n - lp} day(s) — wanted ${PAIR_REST}`);
    }
    lastBoard.set(pin.board, n);
    lastUrl.set(pin.url, n);
    lastPair.set(pairKey(pin.url, pin.board), n);
  }
}

const rank = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);
const pct = (n) => `${Math.round((n / (days.length * expectedPerDay)) * 100)}%`;

console.log(`${total} pins in the library · planning ${days.length} days from ${days[0].date}\n`);

console.log('BOARDS');
for (const [board, n] of rank(boardCount)) {
  console.log(`  ${String(n).padStart(3)}  ${pct(n).padStart(4)}  ${board}`);
}

console.log('\nTEMPLATES');
for (const [t, n] of rank(templateCount)) console.log(`  ${String(n).padStart(3)}  ${pct(n).padStart(4)}  ${t}`);

console.log('\nKINDS');
for (const [k, n] of rank(kindCount)) console.log(`  ${String(n).padStart(3)}  ${pct(n).padStart(4)}  ${k}`);

console.log(`\n${problems.length ? 'RULES BENT' : 'No rule was bent.'}`);
for (const p of problems.slice(0, 40)) console.log(`  ${p}`);
if (problems.length > 40) console.log(`  …and ${problems.length - 40} more`);

console.log('\nFIRST TEN DAYS');
for (const day of days.slice(0, 10)) {
  console.log(`  ${day.date}`);
  for (const p of day.pins) console.log(`     ${p.template.padEnd(10)} ${p.tone.padEnd(5)} ${p.board.slice(0, 44).padEnd(46)} ${p.label.slice(0, 40)}`);
}
