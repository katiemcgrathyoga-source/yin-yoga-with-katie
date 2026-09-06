#!/usr/bin/env node
/**
 * MailerLite signup report — where and how the list is growing.
 *
 *   node scripts/mailerlite-report.mjs            # print the report
 *   node scripts/mailerlite-report.mjs --days 14  # widen the recent window
 *   node scripts/mailerlite-report.mjs --out data/audits/mailerlite-2026-09.md
 *   node scripts/mailerlite-report.mjs --dump     # also write the raw subscriber JSON
 *
 * Reads MAILERLITE_API_KEY from .env (or the environment). Read-only: it only
 * GETs /subscribers and /groups. Emails are never printed in full — the report
 * shows the domain and a masked local part, which is enough to spot junk.
 *
 * Two attribution layers, both set by the site's forms:
 *   - group          → which FORM they used (Free class = retreat, Runners)
 *   - signup_source  → which PAGE the form was on (home-hero, pose, journal…)
 *     The custom field must exist in the account, or MailerLite drops it silently.
 *   - MailerLite's own `source` (form / api / import / manual) separates site
 *     signups from anything imported or added by hand.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const API = 'https://connect.mailerlite.com/api';

// ---- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  return i === -1 ? dflt : args[i + 1];
};
const DAYS = Number(flag('--days', 14));
const OUT = flag('--out', null);
const DUMP = args.includes('--dump');

// ---- key --------------------------------------------------------------------
function loadEnvKey() {
  if (process.env.MAILERLITE_API_KEY) return process.env.MAILERLITE_API_KEY;
  try {
    const env = readFileSync('.env', 'utf8');
    const m = env.match(/^\s*MAILERLITE_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);
    if (m) return m[1].trim();
  } catch {}
  return null;
}
const KEY = loadEnvKey();
if (!KEY) {
  console.error(
    'No MAILERLITE_API_KEY found.\n' +
      'MailerLite → Integrations → API → Generate new token, then add to .env:\n' +
      '  MAILERLITE_API_KEY=...'
  );
  process.exit(1);
}

// ---- api --------------------------------------------------------------------
async function get(path, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} for ${url.pathname}\n${body.slice(0, 300)}`);
  }
  return res.json();
}

/** Cursor-paginate a list endpoint to completion. */
async function all(path, params = {}) {
  const out = [];
  let cursor = null;
  for (;;) {
    const page = await get(path, { limit: 1000, cursor, ...params });
    out.push(...(page.data ?? []));
    cursor = page.meta?.next_cursor ?? null;
    if (!cursor) break;
  }
  return out;
}

// ---- helpers ----------------------------------------------------------------
const STATUSES = ['active', 'unconfirmed', 'unsubscribed', 'bounced', 'junk'];
const count = (list, keyFn) => {
  const m = new Map();
  for (const x of list) {
    const k = keyFn(x) ?? '(blank)';
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : '–');
const day = (iso) => (iso ? String(iso).slice(0, 10) : '(none)');
const mask = (email) => {
  const [local = '', domain = ''] = String(email).split('@');
  const shown = local.length <= 2 ? local[0] + '*' : local.slice(0, 2) + '*'.repeat(Math.min(local.length - 2, 6));
  return `${shown}@${domain}`;
};
const table = (rows, headers) => {
  const lines = [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`];
  for (const r of rows) lines.push(`| ${r.join(' | ')} |`);
  return lines.join('\n');
};

/** Heuristics for junk: no vowels / long random local part / digit-heavy. */
function looksJunk(email) {
  const local = String(email).split('@')[0] ?? '';
  const letters = local.replace(/[^a-z]/gi, '');
  const vowels = (letters.match(/[aeiou]/gi) ?? []).length;
  const digits = (local.match(/\d/g) ?? []).length;
  if (letters.length >= 8 && vowels / letters.length < 0.15) return 'no vowels';
  if (local.length >= 14 && /^[a-z0-9]+$/i.test(local) && !/[._-]/.test(local) && vowels / Math.max(letters.length, 1) < 0.3)
    return 'random-looking';
  if (digits >= 6) return 'digit-heavy';
  return null;
}

// ---- main -------------------------------------------------------------------
async function main() {
  const [groups, subscribers] = await Promise.all([
    all('/groups'),
    // Without a status filter the API returns only active subscribers, so fetch
    // each status explicitly and merge — the others are the leak/junk signal.
    Promise.all(STATUSES.map((s) => all('/subscribers', { 'filter[status]': s }))).then((r) => r.flat()),
  ]);

  // Group membership: the list endpoint doesn't reliably include groups, so
  // pull each group's subscribers and index by id.
  const groupsOf = new Map(); // subscriber id → [group names]
  for (const g of groups) {
    const members = await all(`/groups/${g.id}/subscribers`);
    for (const m of members) {
      if (!groupsOf.has(m.id)) groupsOf.set(m.id, []);
      groupsOf.get(m.id).push(g.name);
    }
  }

  const active = subscribers.filter((s) => s.status === 'active');
  const today = new Date();
  const since = new Date(today.getTime() - DAYS * 86400e3);
  const subscribedAt = (s) => s.subscribed_at || s.opted_in_at || s.created_at;
  const recent = active.filter((s) => new Date(subscribedAt(s)) >= since);

  const L = [];
  L.push(`# MailerLite signup report — ${day(today.toISOString())}`, '');

  // 1. Totals
  L.push('## Totals by status', '');
  L.push(table(STATUSES.map((s) => [s, subscribers.filter((x) => x.status === s).length]), ['Status', 'Count']));
  L.push('', `**${active.length} active.** Unconfirmed = double opt-in never completed. Junk = MailerLite's own spam flag.`, '');

  // 2. Groups (overlapping — Newsletter is the master list)
  L.push('## Active by group', '', '_Groups overlap; do not sum them._', '');
  L.push(
    table(
      groups
        .map((g) => [g.name, active.filter((s) => (groupsOf.get(s.id) ?? []).includes(g.name)).length])
        .sort((a, b) => b[1] - a[1]),
      ['Group', 'Active']
    )
  );
  const noGroup = active.filter((s) => !(groupsOf.get(s.id) ?? []).length).length;
  if (noGroup) L.push('', `${noGroup} active subscriber(s) in no group at all.`);
  L.push('');

  // 3. How they arrived (MailerLite's own source)
  L.push('## Active by how they arrived', '', '_`form` = the site or a MailerLite form; `import`/`manual` = added by you; `api` = a webhook or script._', '');
  L.push(table(count(active, (s) => s.source).map(([k, n]) => [k, n, pct(n, active.length)]), ['Source', 'Active', 'Share']));
  L.push('');

  // 4. Which page (signup_source)
  const src = (s) => s.fields?.signup_source || null;
  const bySrc = count(active, src);
  L.push('## Active by page (`signup_source`)', '');
  L.push(table(bySrc.map(([k, n]) => [`\`${k}\``, n, pct(n, active.length)]), ['signup_source', 'Active', 'Share']));
  const blank = active.filter((s) => !src(s)).length;
  L.push('');
  if (blank === active.length)
    L.push('**Every source is blank.** The `signup_source` custom field probably does not exist in the account — create it (Subscribers → Fields → text) and future signups will carry it.');
  else if (blank)
    L.push(`${blank} blank = imported, added by hand, or signed up before the field existed.`);
  L.push('');

  // 5. Recent window
  L.push(`## Last ${DAYS} days — ${recent.length} new active subscribers`, '');
  L.push('### By day', '');
  L.push(table(count(recent, (s) => day(subscribedAt(s))).sort((a, b) => a[0].localeCompare(b[0])), ['Day', 'Signups']));
  L.push('', '### By page', '');
  L.push(table(count(recent, src).map(([k, n]) => [`\`${k}\``, n]), ['signup_source', 'Signups']));
  L.push('', '### By source', '');
  L.push(table(count(recent, (s) => s.source), ['Source', 'Signups']));
  L.push('');

  // 6. Junk scan
  L.push('## Junk scan', '');
  const flagged = active.map((s) => [s, looksJunk(s.email)]).filter(([, why]) => why);
  const domains = count(active, (s) => String(s.email).split('@')[1]?.toLowerCase());
  const bigDomains = domains.filter(([d, n]) => n >= 3 && !/^(gmail|hotmail|outlook|yahoo|icloud|live|me|protonmail|proton|aol|msn|googlemail|ymail|mail)\./i.test(d + '.'));
  const byMinute = count(active, (s) => String(subscribedAt(s)).slice(0, 16));
  const bursts = byMinute.filter(([, n]) => n >= 3);
  if (!flagged.length && !bigDomains.length && !bursts.length) L.push('Nothing suspicious: no random-looking addresses, no domain clusters, no same-minute bursts.');
  if (flagged.length) {
    L.push(`**${flagged.length} random-looking address(es):**`, '');
    for (const [s, why] of flagged) L.push(`- ${mask(s.email)} — ${why}, ${day(subscribedAt(s))}, source \`${src(s) ?? '(blank)'}\``);
    L.push('');
  }
  if (bigDomains.length) {
    L.push('**Domain clusters (3+ on one non-consumer domain):**', '');
    L.push(table(bigDomains, ['Domain', 'Active']), '');
  }
  if (bursts.length) {
    L.push('**Same-minute bursts (3+ signups in one minute):**', '');
    L.push(table(bursts, ['Minute (UTC)', 'Signups']), '');
  }

  // 7. Recent list (masked) — the fastest way to eyeball what's coming in
  L.push(`## The last ${Math.min(recent.length, 60)} signups (masked)`, '');
  const rows = [...recent]
    .sort((a, b) => new Date(subscribedAt(b)) - new Date(subscribedAt(a)))
    .slice(0, 60)
    .map((s) => [
      String(subscribedAt(s)).slice(0, 16).replace('T', ' '),
      mask(s.email),
      s.fields?.name || '',
      src(s) ?? '',
      (groupsOf.get(s.id) ?? []).join(', '),
      s.source ?? '',
    ]);
  L.push(table(rows, ['When (UTC)', 'Email', 'Name', 'signup_source', 'Groups', 'Via']));
  L.push('');

  const report = L.join('\n');
  console.log(report);
  if (OUT) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, report + '\n');
    console.error(`\nWrote ${OUT}`);
  }
  if (DUMP) {
    const p = `data/audits/mailerlite-subscribers-${day(today.toISOString())}.json`;
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify(subscribers.map((s) => ({ ...s, groups: groupsOf.get(s.id) ?? [] })), null, 2));
    console.error(`Wrote ${p} (contains full emails — gitignore it or delete after use)`);
  }
}

main().catch((e) => {
  console.error('MailerLite report failed:', e.message);
  process.exit(1);
});
