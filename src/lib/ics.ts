/**
 * A small, correct iCalendar (RFC 5545) writer.
 *
 * Runs in the browser so a plan download costs no server hit — the plan is built
 * from data already on the page.
 *
 * The fiddly parts of the spec are the ones that fail SILENTLY: a calendar app
 * given a malformed file will usually import nothing, or import it stripped,
 * rather than say why. So:
 *
 *   - TEXT values escape backslash, semicolon, comma and newline. An unescaped
 *     comma in a description truncates the field at that comma.
 *   - Lines fold at 75 octets with a leading space on continuations. Long
 *     descriptions are the usual offender.
 *   - Line endings are CRLF, which the spec requires and some parsers enforce.
 *   - Times are FLOATING (no Z, no TZID): "18:00 wherever you are" is what a
 *     practice reminder means, and it dodges shipping a timezone database.
 */

export type IcsEvent = {
  /** Stable per event within a download, so re-importing updates rather than duplicates. */
  uid: string;
  start: Date;
  durationMinutes: number;
  summary: string;
  description?: string;
  url?: string;
  /** e.g. 'FREQ=WEEKLY' — omit for a one-off. */
  rrule?: string;
  /** Minutes before the start to nudge. Omit for no alarm. */
  reminderMinutes?: number;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Floating local date-time: YYYYMMDDTHHMMSS. */
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

/** UTC stamp, for DTSTAMP which must be UTC. */
const stampUtc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

/** RFC 5545 TEXT escaping. Order matters — backslash first. */
const esc = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/** Fold at 75 octets, continuations prefixed with a space. Counts BYTES, not
 *  characters — the copy is full of en dashes and curly quotes, which are 3 and
 *  2 bytes in UTF-8, so folding on string length would overrun the limit. */
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let curBytes = 0;
  for (const ch of line) {
    const chBytes = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuations lose one to the space
    if (curBytes + chBytes > limit) {
      out.push(cur);
      cur = '';
      curBytes = 0;
    }
    cur += ch;
    curBytes += chBytes;
  }
  if (cur) out.push(cur);
  return out[0] + out.slice(1).map((l) => `\r\n ${l}`).join('');
}

export function buildIcs(calendarName: string, events: IcsEvent[]): string {
  const now = new Date();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Yin Yoga with Katie//The Runner\'s Reset//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calendarName)}`,
  ];

  for (const e of events) {
    const end = new Date(e.start.getTime() + e.durationMinutes * 60_000);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTAMP:${stampUtc(now)}`);
    lines.push(`DTSTART:${stamp(e.start)}`);
    lines.push(`DTEND:${stamp(end)}`);
    lines.push(`SUMMARY:${esc(e.summary)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    if (e.reminderMinutes != null) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`TRIGGER:-PT${e.reminderMinutes}M`);
      lines.push(`DESCRIPTION:${esc(e.summary)}`);
      lines.push('END:VALARM');
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Triggers a download of the given calendar. */
export function downloadIcs(filename: string, ics: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
