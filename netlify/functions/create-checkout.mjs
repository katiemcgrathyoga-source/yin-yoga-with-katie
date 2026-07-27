import { createClient } from '@supabase/supabase-js';

/**
 * Starts a Lemon Squeezy checkout for The Runner's Reset and redirects to it.
 *   POST /api/checkout   (a plain <form> submit — works without JS)
 *
 * Lemon Squeezy is the Merchant of Record (it handles global sales tax). We pick
 * the founding variant for the first N buyers, then the standard variant, by
 * counting entitlements. No login required to buy: LS collects the email, and the
 * webhook links/creates the account and grants access.
 */
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
  }

  const API_KEY = process.env.LEMONSQUEEZY_API_KEY;
  const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
  const VAR_FOUNDING = process.env.LEMONSQUEEZY_VARIANT_FOUNDING;
  const VAR_STANDARD = process.env.LEMONSQUEEZY_VARIANT_STANDARD;
  const LIMIT = Number(process.env.FOUNDING_LIMIT || 100);
  const PRODUCT = process.env.RUNNER_PRODUCT || 'runner-reset';
  const origin = req.headers.get('origin') || process.env.URL || new URL(req.url).origin;

  // Not wired up yet → send them back to the page gracefully, no ugly error.
  if (!API_KEY || !STORE_ID || !(VAR_FOUNDING || VAR_STANDARD)) {
    return Response.redirect(`${origin}/runner-reset?checkout=unavailable`, 303);
  }

  // Founding variant for the first LIMIT buyers, then standard.
  let variantId = VAR_FOUNDING || VAR_STANDARD;
  const SUPA_URL = process.env.PUBLIC_SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (VAR_FOUNDING && VAR_STANDARD && SUPA_URL && SERVICE) {
    try {
      const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
      const { count } = await admin
        .from('entitlements')
        .select('*', { count: 'exact', head: true })
        .eq('product', PRODUCT);
      variantId = (count ?? 0) >= LIMIT ? VAR_STANDARD : VAR_FOUNDING;
    } catch {
      /* fall back to founding variant */
    }
  }

  try {
    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            // Echoed back on the webhook as meta.custom_data.
            checkout_data: { custom: { product: PRODUCT } },
            product_options: { redirect_url: `${origin}/account?purchased=1` },
          },
          relationships: {
            store: { data: { type: 'stores', id: String(STORE_ID) } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return new Response(`Checkout error (${res.status}): ${detail}`, { status: 502 });
    }
    const json = await res.json();
    const url = json?.data?.attributes?.url;
    if (!url) return new Response('Checkout error: no URL returned', { status: 502 });
    return Response.redirect(url, 303);
  } catch (err) {
    return new Response(`Checkout error: ${err?.message || err}`, { status: 500 });
  }
};

export const config = { path: '/api/checkout' };
