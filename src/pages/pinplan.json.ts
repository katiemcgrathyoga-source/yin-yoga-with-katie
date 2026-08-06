import type { APIRoute } from 'astro';
import { buildPinInventory } from '../lib/pinInventory';
import { planDays } from '../lib/pinSchedule';
import { PIN_HISTORY } from '../data/pinHistory';

/**
 * The plan as data, for auditing it outside a browser.
 *
 * /pincalendar is the page Katie uses; this is the same plan in a form a script
 * can check — board spacing, template mix, how long before a destination comes
 * round again. scripts/artifact-pinplan.mjs reads it to build the review sheet,
 * and scripts/check-pin-plan.mjs reads it to fail a build that schedules two
 * pins to one board in a week.
 *
 * Prerendered and unlisted. It carries no more than /pins already does.
 */
export const prerender = true;

const DAYS = 60;

export const GET: APIRoute = async () => {
  const inventory = await buildPinInventory();
  const from = new Date('2026-08-06T00:00:00');
  const days = planDays(inventory, from, DAYS).map((day) => ({
    date: day.date.toISOString().slice(0, 10),
    dayIndex: day.dayIndex,
    pins: day.pins.map((p) => ({
      id: p.id, kind: p.kind, label: p.label, template: p.template,
      tone: p.tone, board: p.board, url: p.url, image: p.image,
      description: p.description,
    })),
  }));

  return new Response(
    JSON.stringify({ total: inventory.length, history: PIN_HISTORY, days }, null, 2),
    {
      headers: {
        'content-type': 'application/json',
        // /pins and /pincalendar get their noindex from a meta tag, which a
        // JSON body has nowhere to put. The header is the equivalent.
        'x-robots-tag': 'noindex, nofollow',
      },
    },
  );
};
