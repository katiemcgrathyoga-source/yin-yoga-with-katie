import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Lemon Squeezy webhook: on a paid order, grant the buyer their entitlement.
 *   POST /api/ls-webhook
 *
 * Verifies the X-Signature HMAC, then on `order_created` (status paid):
 *   email -> get-or-create the Supabase user -> upsert entitlement (service role)
 *   -> add the buyer to the MailerLite buyers group.
 * Idempotent (upsert), so redelivered events are safe.
 *
 * The MailerLite step is what stops a buyer from being sold to for another week by
 * the runner nurture automation — that group is its exit condition. It is
 * best-effort on purpose: a MailerLite outage must never cost someone the access
 * they paid for, so a failure there is logged and swallowed.
 */
export default async (req) => {
  const SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const SUPA_URL = process.env.PUBLIC_SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const PRODUCT_DEFAULT = process.env.RUNNER_PRODUCT || 'runner-reset';

  if (!SECRET) return new Response('Webhook secret not configured', { status: 500 });
  if (!SUPA_URL || !SERVICE) return new Response('Supabase admin not configured', { status: 500 });

  const raw = await req.text();
  const sig = req.headers.get('x-signature') || '';

  // Verify: HMAC-SHA256(raw body, secret) === X-Signature (hex).
  const expected = createHmac('sha256', SECRET).update(raw).digest('hex');
  if (!safeEqualHex(expected, sig)) {
    return new Response('Invalid signature', { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const name = event?.meta?.event_name;
  if (name === 'order_created') {
    const attrs = event?.data?.attributes || {};
    // Grant on a paid order OR a fully-discounted comp (total 0) — the running-group
    // 100%-off codes create $0 orders, which may not carry status 'paid'. Still
    // exclude refunded/fraudulent. TODO: verify a real $0 order's status against a
    // live test code before launch.
    const isComp = Number(attrs.total) === 0;
    const granted = attrs.status === 'paid' || (isComp && attrs.status !== 'refunded' && attrs.status !== 'fraudulent');
    if (!granted) return new Response(`ok (status ${attrs.status})`, { status: 200 });

    const email = attrs.user_email;
    const product = event?.meta?.custom_data?.product || PRODUCT_DEFAULT;
    if (!email) return new Response('ok (no email)', { status: 200 });

    const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
    const userId = await getOrCreateUser(admin, email);
    if (!userId) return new Response('Could not resolve user', { status: 500 });

    const { error } = await admin
      .from('entitlements')
      .upsert({ user_id: userId, product, source: 'lemonsqueezy' }, { onConflict: 'user_id,product' });
    if (error) return new Response(`Grant failed: ${error.message}`, { status: 500 });

    await tagBuyerInMailerLite(email);
  }

  return new Response('ok', { status: 200 });
};

/**
 * Add the buyer to the MailerLite buyers group so the runner nurture automation
 * stops selling to them. Best-effort: never throws, never blocks the grant.
 * No-ops (with a warning) if the env vars aren't set, so the webhook keeps
 * working in environments where MailerLite isn't configured.
 */
async function tagBuyerInMailerLite(email) {
  const KEY = process.env.MAILERLITE_API_KEY;
  const GROUP = process.env.MAILERLITE_BUYER_GROUP_ID;
  if (!KEY || !GROUP) {
    console.warn('MailerLite buyer tagging skipped: MAILERLITE_API_KEY / MAILERLITE_BUYER_GROUP_ID not set');
    return;
  }

  try {
    // Upserts the subscriber and adds the group — safe to replay for the same order.
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, groups: [GROUP] }),
    });
    if (!res.ok) {
      console.error(`MailerLite buyer tagging failed (${res.status}): ${await res.text()}`);
    }
  } catch (err) {
    console.error(`MailerLite buyer tagging errored: ${err?.message || err}`);
  }
}

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

// Create an email-confirmed user (so they can sign in via magic link), or find
// the existing one. listUsers paging is fine at launch scale; TODO: swap for an
// email->id lookup (profiles table / RPC) once the user base is large.
async function getOrCreateUser(admin, email) {
  const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (!error && created?.user) return created.user.id;

  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const found = data?.users?.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (!data?.users?.length || data.users.length < 200) break;
  }
  return null;
}

export const config = { path: '/api/ls-webhook' };
