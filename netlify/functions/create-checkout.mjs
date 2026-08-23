import { createClient } from '@supabase/supabase-js';

/**
 * Starts a Polar checkout for The Runner's Reset and redirects to it.
 *   POST /api/checkout   (a plain <form> submit — works without JS)
 *
 * Polar is the Merchant of Record (it handles global sales tax). We pick the
 * founding product for the first N buyers, then the standard product, by
 * counting entitlements. No login required to buy: Polar collects the email,
 * and the webhook links/creates the account and grants access.
 */
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
  }

  const ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
  const PROD_FOUNDING = process.env.POLAR_PRODUCT_FOUNDING;
  const PROD_STANDARD = process.env.POLAR_PRODUCT_STANDARD;
  const LIMIT = Number(process.env.FOUNDING_LIMIT || 100);
  const PRODUCT = process.env.RUNNER_PRODUCT || 'runner-reset';
  const origin = req.headers.get('origin') || process.env.URL || new URL(req.url).origin;

  // Not wired up yet → send them back to the page gracefully, no ugly error.
  if (!ACCESS_TOKEN || !(PROD_FOUNDING || PROD_STANDARD)) {
    return Response.redirect(`${origin}/runner-reset?checkout=unavailable`, 303);
  }

  // Founding product for the first LIMIT buyers, then standard.
  let productId = PROD_FOUNDING || PROD_STANDARD;
  const SUPA_URL = process.env.PUBLIC_SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (PROD_FOUNDING && PROD_STANDARD && SUPA_URL && SERVICE) {
    try {
      const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
      const { count } = await admin
        .from('entitlements')
        .select('*', { count: 'exact', head: true })
        .eq('product', PRODUCT);
      productId = (count ?? 0) >= LIMIT ? PROD_STANDARD : PROD_FOUNDING;
    } catch {
      /* fall back to founding product */
    }
  }

  try {
    const res = await fetch('https://api.polar.sh/v1/checkouts/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        products: [productId],
        // Echoed back on the webhook as data.metadata.
        metadata: { product: PRODUCT },
        success_url: `${origin}/account?purchased=1&checkout_id={CHECKOUT_ID}`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return new Response(`Checkout error (${res.status}): ${detail}`, { status: 502 });
    }
    const json = await res.json();
    const url = json?.url;
    if (!url) return new Response('Checkout error: no URL returned', { status: 502 });
    return Response.redirect(url, 303);
  } catch (err) {
    return new Response(`Checkout error: ${err?.message || err}`, { status: 500 });
  }
};

export const config = { path: '/api/checkout' };
