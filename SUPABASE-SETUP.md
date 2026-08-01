# Turning accounts on

`/account` says *"Accounts aren't switched on yet"* and every member page gates —
including for you. That's correct behaviour, not a bug: `checkAccess()` **fails
closed** when Supabase isn't configured, so a deploy missing its env vars can
never hand the paid library to the public.

## Read this first — where you actually are

Your local `.env` already has `PUBLIC_SUPABASE_URL` and
`PUBLIC_SUPABASE_ANON_KEY` filled in, so **the Supabase project already exists**.
Steps 1 and 2 are probably done. The live site gates because those same values
are **not set in Netlify**, and you personally gate because you have no
entitlement row yet.

So the likely path is: **step 3** (copy the values into Netlify) → **step 4**
(sign in) → **step 5** (grant yourself). Skim 1 and 2 to confirm the table
exists; don't redo them.

## Previewing locally

`DEV_OPEN_ACCESS=1` is **not** a general bypass — `checkAccess()` only honours it
when Supabase is *unconfigured*, and yours is configured, so adding it to `.env`
does nothing. To use it you'd have to blank both `PUBLIC_SUPABASE_*` values as
well, and it must be a real environment variable rather than a `.env` line:

```bash
PUBLIC_SUPABASE_URL= PUBLIC_SUPABASE_ANON_KEY= DEV_OPEN_ACCESS=1 npm run dev
```

Once you've done step 5, you won't need any of that — just sign in.

> **Never set `DEV_OPEN_ACCESS=1` on Netlify.** It is the single switch that
> opens every paid session to every visitor.

---

## 1 · Create the project

*(Almost certainly already done — your `.env` has the credentials.)*

[supabase.com](https://supabase.com) → New project. Any region near your readers.
Free tier is ample: this stores one row per buyer, nothing else.

## 2 · Create the entitlements table

*(Check whether it exists first: Table Editor → look for `entitlements`.)*

SQL Editor → New query → run this:

```sql
-- One row per person per product they own. `product` matches RUNNER_PRODUCT
-- in the environment ('runner-reset'), which is what the gates query for.
create table public.entitlements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product     text not null,
  granted_at  timestamptz not null default now(),
  source      text,                       -- 'lemonsqueezy', 'comp', 'manual'
  order_id    text,                       -- Lemon Squeezy order, for reconciliation
  unique (user_id, product)               -- makes webhook replays harmless
);

alter table public.entitlements enable row level security;

-- The gates run as the signed-in user with the anon key, so this policy is what
-- makes the read work at all — and what stops anyone reading anyone else's row.
create policy "read own entitlements"
  on public.entitlements for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete policy on purpose: only the service-role key (the
-- Lemon Squeezy webhook) may grant access. A user cannot grant themselves.
create index entitlements_user_product_idx on public.entitlements (user_id, product);
```

## 3 · Set the environment variables

Supabase → Project Settings → API. You need three values.

| Variable | Value | Where |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Project URL | Netlify **and** `.env` |
| `PUBLIC_SUPABASE_ANON_KEY` | `anon` / publishable key | Netlify **and** `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key | **Netlify only** |

In Netlify: Site configuration → Environment variables.

> The `service_role` key bypasses row-level security entirely. It belongs only in
> the Netlify function environment — never in `.env` committed anywhere, never in
> anything prefixed `PUBLIC_`, which Astro inlines into the browser bundle.

**Then trigger a deploy** — Deploys → Trigger deploy → Deploy site. Adding a
variable does not cause a build, and the two groups behave differently:

| Prefix | Read | Live when |
|---|---|---|
| `PUBLIC_*` | **build time** — Vite inlines them into the browser bundle | only in a build that ran *after* you added them |
| everything else | **runtime** — `process.env` inside the function | the next deploy, whenever that happens |

So `BUNNY_STREAM_*` can start working on a deploy triggered by an unrelated
push, while `PUBLIC_SUPABASE_*` sit there doing nothing until a genuine rebuild.
The failure looks identical to a missing variable — `/account` still says
"Accounts aren't switched on yet" — which sends you hunting for a config bug
that is really a stale build.

Two commands to tell them apart, neither needing a login:

```bash
# runtime vars — expect: {"error":"Missing video id..."}
curl -s https://yinyogawithkatie.com/api/playback

# build-time vars — expect a hit; nothing means the bundle predates them
curl -s https://yinyogawithkatie.com/account \
  | grep -oE '/_astro/[A-Za-z0-9._-]+\.js' | sort -u \
  | while read -r f; do curl -s "https://yinyogawithkatie.com$f"; done \
  | grep -c "supabase\.co"
```

## 4 · Sign in once

Go to `/account` and enter your email. Sign-in is a magic link — no password.
That creates your row in `auth.users`, which you need before the next step.

## 5 · Grant yourself the product

SQL Editor:

```sql
insert into public.entitlements (user_id, product, source)
select id, 'runner-reset', 'manual'
from auth.users
where email = 'you@example.com'
on conflict (user_id, product) do nothing;
```

Reload `/practices`. The whole course opens.

---

## How buyers get in

`netlify/functions/lemonsqueezy-webhook.mjs` handles it: on a paid order — or a
fully-discounted comp, for the running-group codes — it upserts the buyer and
inserts their entitlement, then adds them to the MailerLite buyers group so the
nurture sequence stops selling to someone who has already bought.

The MailerLite step is deliberately best-effort. If MailerLite is down the
purchase still grants access, because failing to tag someone is an annoyance and
failing to give a buyer what they paid for is not.

## If a page still gates after all this

Work down in order:

1. **Env vars set but not redeployed.** The most common cause by far.
2. **Signed in as a different email** than the one you granted. `/account` shows
   which.
3. **`product` mismatch.** The row must say `runner-reset` exactly, matching
   `RUNNER_PRODUCT` and the sessions' `product` field.
4. **The RLS policy didn't apply.** Without it the read returns empty and the
   user is treated as un-entitled — indistinguishable from not owning it.
5. **Cookie lapsed.** `sb-token` is shorter-lived than the browser session; the
   session page detects this and reloads once to resync. If you're in a loop,
   clear site data.
