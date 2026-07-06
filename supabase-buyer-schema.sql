-- ============================================================
-- BYG Buyer Account Schema
-- Run this in your Supabase dashboard → SQL Editor
-- ============================================================

-- 1. Buyer profiles (one per auth user)
create table if not exists buyer_profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  phone       text,
  looking_for text,   -- free text: budget, type, size preferences
  timeline    text,   -- e.g. "3-6 months", "Ready to buy now"
  created_at  timestamptz default now()
);

alter table buyer_profiles enable row level security;

create policy "buyer: read own profile"
  on buyer_profiles for select
  using (auth.uid() = id);

create policy "buyer: insert own profile"
  on buyer_profiles for insert
  with check (auth.uid() = id);

create policy "buyer: update own profile"
  on buyer_profiles for update
  using (auth.uid() = id);


-- 2. Saved searches
create table if not exists saved_searches (
  id                uuid        default gen_random_uuid() primary key,
  user_id           uuid        references auth.users(id) on delete cascade not null,
  name              text        not null,
  filters           jsonb       not null default '{}',
  -- Tracks which listing IDs were seen on the last notification run.
  -- The cron job compares current results to this list to find genuinely new vessels.
  seen_listing_ids  text[]      default '{}',
  last_notified_at  timestamptz,
  created_at        timestamptz default now()
);

alter table saved_searches enable row level security;

create policy "buyer: read own searches"
  on saved_searches for select
  using (auth.uid() = user_id);

create policy "buyer: insert own searches"
  on saved_searches for insert
  with check (auth.uid() = user_id);

create policy "buyer: delete own searches"
  on saved_searches for delete
  using (auth.uid() = user_id);

-- ============================================================
-- After running this SQL:
-- 1. Go to Supabase → Authentication → Providers → Email
--    and turn OFF "Confirm email" for now (simpler onboarding).
--    You can re-enable it later with a custom email template.
-- 2. Add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment
--    variables (Project Settings → Environment Variables).
--    Find the key in Supabase → Project Settings → API.
-- 3. Add CRON_SECRET to Vercel env vars (any random string,
--    e.g. openssl rand -hex 32). Used to authenticate the
--    daily cron job.
-- ============================================================
