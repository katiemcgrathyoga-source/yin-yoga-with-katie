import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Lemon Squeezy webhook: on a paid order, grant the buyer their entitlement.
 *   POST /api/ls-webhook
 *
 * Verifies the X-Signature HMAC, then on `order_created` (status paid):
 *   email -> get-or-create the Supabase user -> upsert entitlement (service role).
 * Idempotent (upsert), so redelivered events are safe.
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
    // Only grant on a genuinely paid order.
    if (attrs.status !== 'paid') return new Response('ok (not paid)', { status: 200 });

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
  }

  return new Response('ok', { status: 200 });
};

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
