/**
 * Validates the iCalendar writer against the parts of RFC 5545 that fail
 * SILENTLY — a calendar app given a malformed file usually imports nothing, or
 * imports it truncated, without saying why.
 *
 *   node scripts/check-ics.mjs
 */
import { buildIcs } from '../src/lib/ics.ts';

const ics = buildIcs('Race Prep — Yin Yoga with Katie', [
  {
    uid: 'a@x',
    start: new Date(2026, 7, 20, 18, 0),
    durationMinutes: 21,
    summary: 'Yin: Pre-Race Calm',
    // Deliberately nasty: a comma, a semicolon, an em dash (3 bytes), and a
    // newline — each of which breaks a naive writer in a different way.
    description:
      'Fully supported; for your head as much as your hips, with props, stillness — and sleep.\n\nhttps://yinyogawithkatie.com/practices/routines/pre-race-calm',
    url: 'https://yinyogawithkatie.com/practices/routines/pre-race-calm',
    reminderMinutes: 30,
  },
  {
    uid: 'b@x',
    start: new Date(2026, 7, 25, 18, 0),
    durationMinutes: 30,
    summary: 'Yin: Long reset',
    description: 'A rest-day practice.',
    rrule: 'FREQ=WEEKLY',
    reminderMinutes: 30,
  },
]);

const enc = new TextEncoder();
const lines = ics.split('\r\n');
// Content assertions must run on the UNFOLDED text. Folding breaks lines every
// 75 octets regardless of word boundaries, so a correctly escaped "props\," can
// arrive as "pro" + CRLF + " ps\," — which reads as a bug and isn't one.
const unfolded = ics.replace(/\r\n /g, '');
const fails = [];
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
};

const over = lines.filter((l) => enc.encode(l).length > 75);
check('CRLF line endings', ics.includes('\r\n') && !/[^\r]\n/.test(ics));
check('no line over 75 octets', over.length === 0, over.length ? `${over.length} too long` : '');
check('VEVENT balanced', (ics.match(/BEGIN:VEVENT/g) || []).length === (ics.match(/END:VEVENT/g) || []).length);
check('VALARM balanced', (ics.match(/BEGIN:VALARM/g) || []).length === (ics.match(/END:VALARM/g) || []).length);
check('two alarms present', (ics.match(/BEGIN:VALARM/g) || []).length === 2);
check('RRULE written', ics.includes('RRULE:FREQ=WEEKLY'));
check('comma escaped', unfolded.includes('props\\, stillness'));
check('semicolon escaped', unfolded.includes('supported\\;'));
check('newline escaped', unfolded.includes('sleep.\\n\\nhttps'));
check('DTSTART is floating local', /^DTSTART:20260820T180000$/m.test(ics));
check('DTSTAMP is UTC', /^DTSTAMP:\d{8}T\d{6}Z$/m.test(ics));
check('DTEND respects duration', /^DTEND:20260820T182100$/m.test(ics));
check('folded lines continue with a space', !over.length && lines.every((l, i) => i === 0 || !l.startsWith('  ')));

console.log(fails.length ? `\n${fails.length} check(s) failed` : '\nall checks passed');
process.exit(fails.length ? 1 : 0);
