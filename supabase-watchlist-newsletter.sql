-- ============================================================
-- BYG Watchlist + Newsletter + Auction end-email flags
-- Run in Supabase → SQL Editor (safe to re-run)
-- ============================================================

-- ── Auction watchlist ─────────────────────────────────────────────────────────
create table if not exists auction_watchlist (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  auction_id  uuid        not null references auction_listings(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, auction_id)
);

create index if not exists idx_watchlist_auction on auction_watchlist(auction_id);
create index if not exists idx_watchlist_user    on auction_watchlist(user_id);

alter table auction_watchlist enable row level security;
drop policy if exists "users manage own watchlist" on auction_watchlist;
create policy "users manage own watchlist"
  on auction_watchlist for all
  using (auth.uid() = user_id);

-- ── Newsletter subscribers ────────────────────────────────────────────────────
create table if not exists newsletter_subscribers (
  id          uuid        default gen_random_uuid() primary key,
  email       text        unique not null,
  name        text,
  created_at  timestamptz default now(),
  active      boolean     default true
);

create index if not exists idx_newsletter_email on newsletter_subscribers(email);

alter table newsletter_subscribers enable row level security;
drop policy if exists "no public access newsletter" on newsletter_subscribers;
create policy "no public access newsletter"
  on newsletter_subscribers for all
  using (false);

-- ── Email-sent flags on auction_listings ─────────────────────────────────────
alter table auction_listings add column if not exists end_email_sent  boolean default false;
alter table auction_listings add column if not exists alert_24h_sent  boolean default false;
alter table auction_listings add column if not exists alert_1h_sent   boolean default false;

-- ============================================================
-- After running:
-- Add CRON_SECRET to Vercel env vars (any random string).
-- ============================================================
