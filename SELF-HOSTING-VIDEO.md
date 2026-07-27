# Self-hosting paid video

The plan and the working spike for hosting Katie's **paid** video off YouTube
(The Runner's Reset now, the $10/mo membership later), gated so only buyers can
watch.

> **Free classes stay on YouTube.** The ~313 free classes drive discovery and the
> channel is growing — re-hosting them just adds a bandwidth bill. Only paid
> content is self-hosted.

## The four pieces

| Piece | Job | Choice |
|---|---|---|
| **Video host** | store masters, transcode to adaptive HLS, issue **signed** playback URLs | **Bunny Stream** |
| **Auth + entitlements** | who's a member, what they own | **Supabase** (Postgres + Auth) |
| **Payments** | take $49 / $67, later $10/mo | **Stripe** Checkout + webhook |
| **Access gate** | hand a signed URL only to a paid, logged-in user | a **Netlify Function** |

**Flow:** buy via Stripe → webhook writes an entitlement to Supabase → user logs
in (magic link) → the course page asks a Netlify function for playback → the
function verifies entitlement → returns a short-lived signed URL → the player
streams it. Short-TTL signed URLs stop casual link-sharing (full Widevine/
FairPlay DRM is available on Bunny but is overkill for launch).

## Phases

- **Phase 0 — spike. ✅ DONE.** Signed Bunny delivery through a Netlify function,
  enforced (tampered/token-less URLs are refused by Bunny).
- **Phase 1 — accounts + entitlements. ✅ DONE.**
  Supabase magic-link login + a per-user entitlement check in the function.
- **Phase 2 — Lemon Squeezy payments. (code built; needs an LS store)**
  Merchant-of-Record checkout + a webhook that grants the entitlement on payment.
  (Stripe isn't available to Taiwan-based accounts; LS is an MoR so it also
  handles worldwide sales tax.)
- **Phase 3** — gated player wired into the Runner's Reset session pages
  (upgrade from the Bunny embed to an `hls.js` player on the direct HLS URL with
  CDN token-auth, if we want a fully branded player).
- **Phase 4** — Stripe subscription for the membership; fold the course in.

---

## Phase 0 — run the spike

What's already built:

- `netlify/functions/bunny-playback.mjs` — mints a signed embed URL at
  `GET /api/playback?v=<videoGuid>`.
- `src/pages/dev/stream-test.astro` — hidden harness at `/dev/stream-test`
  (noindex, out of the sitemap) that calls the function and plays the result.
- `.env.example` — the env vars to fill in.

### Steps (Kevin — needs a Bunny account + a test upload)

1. **Create a Bunny.net account** and add a **Stream** library.
2. Upload any short **placeholder video** to that library. Copy its **video GUID**.
3. In the library settings, note the **Library ID** (number) and the **Token
   Authentication Key**, and turn **Embed Token Authentication ON** (so only
   signed URLs play).
4. `cp .env.example .env` and fill in:
   - `BUNNY_STREAM_LIBRARY_ID` = the library ID
   - `BUNNY_STREAM_TOKEN_KEY` = the Token Authentication Key
   - `BUNNY_STREAM_ALLOW` = the placeholder video's GUID
5. Run the functions locally:
   ```
   npx netlify dev
   ```
   (Astro's own `npm run dev` does **not** run Netlify functions — you must use
   `netlify dev`, which serves the site + functions together.)
6. Open `http://localhost:8888/dev/stream-test`, paste the GUID, press **Load**.
   The placeholder should play, and the status line shows when the token expires.
   Swap in a wrong/expired GUID to confirm it's actually being blocked.

Once that works, the delivery + signing half is proven, and Phase 1 (Supabase
login + real entitlement check) can start — at which point the
`BUNNY_STREAM_ALLOW` allowlist is removed in favour of a per-user check.

---

## Phase 1 — accounts + entitlements

What's already built:

- `supabase/schema.sql` — the `entitlements` table + row-level security.
- `src/lib/supabaseBrowser.ts` — browser Supabase client (null-safe if unset).
- `src/pages/account.astro` — magic-link sign-in + "what you own" (noindex).
- `netlify/functions/bunny-playback.mjs` — now requires a valid session **and**
  the `runner-reset` entitlement (falls back to allowlist-only until Supabase
  env is set, so nothing breaks in the meantime).
- `.env.example` — the Supabase vars.

The gate order in the function: known course video → signed-in user → owns the
product → sign the URL.

### Steps (Kevin — needs a Supabase project)

1. Create a **Supabase** project (free tier).
2. **SQL editor →** paste and run `supabase/schema.sql`.
3. **Project Settings → API:** copy the **Project URL** and the **anon public**
   key into `.env`:
   - `PUBLIC_SUPABASE_URL=` the Project URL
   - `PUBLIC_SUPABASE_ANON_KEY=` the anon public key
   (Both are safe to expose — RLS is what protects the data.)
4. **Authentication → URL Configuration:** add `http://localhost:8888` and the
   production domain to **Redirect URLs** (so magic links can return).
5. Restart `netlify dev` (it reads `.env` at startup).
6. Go to `http://localhost:8888/account`, enter your email, click the emailed
   link. You should land back signed in.
7. **Grant yourself access to test:** in Supabase, **Authentication → Users**,
   copy your user id, then in the SQL editor:
   ```sql
   insert into public.entitlements (user_id, product, source)
   values ('<your-user-uuid>', 'runner-reset', 'manual')
   on conflict do nothing;
   ```
8. Open `/dev/stream-test` (now signed in) → the video plays. Sign out → it
   returns "please sign in". Remove your entitlement row → it returns "no access".

That proves the real gate: only a **signed-in buyer** gets a playable URL.
Phase 2 then automates step 7 with Stripe (a webhook writes the entitlement on
payment, using the service-role key).

---

## Phase 2 — Lemon Squeezy payments (Merchant of Record)

What's already built:

- `netlify/functions/create-checkout.mjs` — `POST /api/checkout` creates a Lemon
  Squeezy checkout and 303-redirects to it. Picks the **founding** variant for the
  first `FOUNDING_LIMIT` buyers, then the **standard** variant (counts entitlements).
  Passes `custom_data.product` through so the webhook knows what was bought.
- `netlify/functions/lemonsqueezy-webhook.mjs` — `POST /api/ls-webhook` verifies the
  `X-Signature` HMAC, then on a paid `order_created` gets-or-creates the buyer's
  Supabase user by email and upserts their entitlement (idempotent).
- The Runner's Reset buy buttons submit a `<form>` to `/api/checkout` (works
  without JS). `/account?purchased=1` shows a "sign in to unlock" note.

Buyers don't need to log in to purchase: LS collects the email, the webhook
creates/links the account, and they sign in later with that same email.

### Steps (Kevin — needs a Lemon Squeezy store, test mode)

1. Create a **Lemon Squeezy** store; keep **Test mode** on for now.
2. **Product:** create "The Runner's Reset" as a single-payment product with
   **two variants** — **$49** (founding) and **$67** (standard). Copy each
   **variant id** (Products → the product → each variant). Also note the **Store id**.
3. **API key:** Settings → API → create one. **Webhook:** Settings → Webhooks →
   add one pointing at your tunnel/host `…/api/ls-webhook`, subscribe to
   **`order_created`**, and set a **signing secret** you choose.
4. Fill `.env` (secrets stay local — never commit):
   - `LEMONSQUEEZY_API_KEY=` the API key
   - `LEMONSQUEEZY_WEBHOOK_SECRET=` the signing secret from step 3
   - `LEMONSQUEEZY_STORE_ID=` / `LEMONSQUEEZY_VARIANT_FOUNDING=` / `LEMONSQUEEZY_VARIANT_STANDARD=`
   - `SUPABASE_SERVICE_ROLE_KEY=` from Supabase → Settings → API (**service_role**)
5. **Local webhook delivery:** LS must reach your machine, so expose it with a
   tunnel (e.g. `npx localtunnel --port 8888` or ngrok) and point the LS webhook
   URL at `https://<tunnel>/api/ls-webhook`. Restart `netlify dev`.
6. Go to `http://localhost:8888/runner-reset`, click **Join**, pay with LS's
   **test card** (`4242 4242 4242 4242`, any future expiry/CVC).
7. You're redirected to `/account?purchased=1`; the webhook grants the entitlement.
   Sign in with that email → the course unlocks; `/dev/stream-test` plays.

### Going live (later)
- Turn off LS **test mode**; recreate the webhook against the production domain
  `https://<domain>/api/ls-webhook`.
- Set every env var in **Netlify → Site settings → Environment variables**.
- Add the production domain to Supabase Auth redirect URLs.

> Set the same env vars in **Netlify → Site settings → Environment variables**
> before this is used on a deploy. `.env` is gitignored and never shipped.
