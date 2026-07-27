-- The Runner's Reset — access control schema (Phase 1).
-- Run once in the Supabase SQL editor for your project.
--
-- Model: Supabase Auth owns users (auth.users). We add one table that records
-- what each user has bought. A row = access to that product, for good.

create table if not exists public.entitlements (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  product    text        not null,              -- e.g. 'runner-reset'
  source     text,                              -- 'stripe' | 'manual' | 'comp'
  created_at timestamptz not null default now(),
  primary key (user_id, product)
);

-- Row-level security: a signed-in user may read ONLY their own entitlements.
-- No client-side insert/update/delete — grants are written by the server
-- (the Stripe webhook in Phase 2, using the service-role key) or by hand in the
-- dashboard. So RLS exposes reads only; writes bypass RLS via service role.
alter table public.entitlements enable row level security;

drop policy if exists "read own entitlements" on public.entitlements;
create policy "read own entitlements"
  on public.entitlements
  for select
  using (auth.uid() = user_id);

-- ── Manual test grant (Phase 1) ───────────────────────────────────────────
-- After you've signed in once (which creates your auth user), grant yourself
-- access so you can test the gate. Find your user id in Authentication → Users.
--
--   insert into public.entitlements (user_id, product, source)
--   values ('<your-auth-user-uuid>', 'runner-reset', 'manual')
--   on conflict (user_id, product) do nothing;
