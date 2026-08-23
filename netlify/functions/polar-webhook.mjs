import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Polar webhook: on a paid order, grant the buyer their entitlement.
 *   POST /api/polar-webhook
 *
 * Verifies the Standard Webhooks signature (webhook-id/-timestamp/-signature
 * headers), then on `order.paid`:
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
  const SECRET = process.env.POLAR_WEBHOOK_SECRET;
  const SUPA_URL = process.env.PUBLIC_SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const PRODUCT_DEFAULT = process.env.RUNNER_PRODUCT || 'runner-reset';

  if (!SECRET) return new Response('Webhook secret not configured', { status: 500 });
  if (!SUPA_URL || !SERVICE) return new Response('Supabase admin not configured', { status: 500 });

  const raw = await req.text();
  const id = req.headers.get('webhook-id') || '';
  const timestamp = req.headers.get('webhook-timestamp') || '';
  const sigHeader = req.headers.get('webhook-signature') || '';

  const reason = verifyStandardWebhook(id, timestamp, raw, sigHeader, SECRET);
  if (reason) {
    // TEMP: diagnosing a signature-verification 400 — tries several plausible
    // signing-algorithm variants against the REAL raw body already in memory
    // (no manual byte-reconstruction, so no truncation risk) and reports which
    // one, if any, matches Polar's actual signature. No secret material exposed.
    return new Response(JSON.stringify({
      reason,
      matches: findMatchingVariant(id, timestamp, raw, sigHeader, SECRET),
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  if (event?.type === 'order.paid') {
    const order = event?.data || {};
    const email = order?.customer?.email;
    const product = order?.metadata?.product || PRODUCT_DEFAULT;
    if (!email) return new Response('ok (no email)', { status: 200 });

    const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
    const userId = await getOrCreateUser(admin, email);
    if (!userId) return new Response('Could not resolve user', { status: 500 });

    const { error } = await admin
      .from('entitlements')
      .upsert({ user_id: userId, product, source: 'polar' }, { onConflict: 'user_id,product' });
    if (error) return new Response(`Grant failed: ${error.message}`, { status: 500 });

    await tagBuyerInMailerLite(email);
  }

  return new Response('ok', { status: 200 });
};

// TEMP: brute-forces plausible (key derivation × signed-content format) pairs
// against a known-real (id, timestamp, body, signature) tuple to find which
// variant Polar actually uses. Remove this once the real bug is identified.
function findMatchingVariant(id, timestamp, body, sigHeader, secret) {
  const stripped = secret.replace(/^whsec_/, '');
  const keys = {
    'base64(stripped)': safeBuf(stripped, 'base64'),
    'base64url(stripped)': safeBuf(stripped, 'base64url'),
    'utf8(stripped)': Buffer.from(stripped, 'utf8'),
    'utf8(full secret incl. prefix)': Buffer.from(secret, 'utf8'),
    'base64(full secret incl. prefix)': safeBuf(secret, 'base64'),
  };
  const contents = {
    'id.timestamp.body': `${id}.${timestamp}.${body}`,
    'timestamp.body': `${timestamp}.${body}`,
    'body only': body,
  };
  const sigs = sigHeader.split(' ').map((e) => e.split(',')[1]).filter(Boolean);

  const hits = [];
  for (const [keyName, keyBuf] of Object.entries(keys)) {
    if (!keyBuf || !keyBuf.length) continue;
    for (const [contentName, content] of Object.entries(contents)) {
      const digestB64 = createHmac('sha256', keyBuf).update(content).digest('base64');
      const digestHex = createHmac('sha256', keyBuf).update(content).digest('hex');
      if (sigs.some((s) => s === digestB64 || s === digestHex)) {
        hits.push(`key=${keyName} content=${contentName}`);
      }
    }
  }
  return hits.length ? hits : ['no variant matched'];
}

function safeBuf(str, encoding) {
  try {
    return Buffer.from(str, encoding);
  } catch {
    return null;
  }
}

/**
 * Verify a Standard Webhooks signature (https://www.standardwebhooks.com/).
 * Signed content is "{id}.{timestamp}.{raw body}", HMAC-SHA256'd with the
 * base64-decoded secret (stripped of its "whsec_" prefix), base64-encoded, and
 * compared against each "v1,<sig>" entry in the space-separated header — Polar
 * may send more than one during secret rotation.
 * Also rejects timestamps more than 5 minutes old/skewed, per spec, to block replay.
 */
// Returns null on success, or a short reason string on failure.
function verifyStandardWebhook(id, timestamp, body, sigHeader, secret) {
  if (!id) return 'missing webhook-id header';
  if (!timestamp) return 'missing webhook-timestamp header';
  if (!sigHeader) return 'missing webhook-signature header';

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return 'webhook-timestamp not a number';
  if (Math.abs(Date.now() / 1000 - ts) > 300) return `timestamp skew too large (ts=${ts}, now=${Math.floor(Date.now() / 1000)})`;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${id}.${timestamp}.${body}`;
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');
  const expectedBuf = Buffer.from(expected, 'base64');

  const matched = sigHeader.split(' ').some((entry) => {
    const [version, sig] = entry.split(',');
    if (version !== 'v1' || !sig) return false;
    try {
      const sigBuf = Buffer.from(sig, 'base64');
      return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });

  return matched ? null : `HMAC mismatch (got "${sigHeader}", expected v1,${expected})`;
}

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

export const config = { path: '/api/polar-webhook' };
