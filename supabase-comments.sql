-- ============================================================
-- BYG Auction Comments Schema  (safe to re-run)
-- Run this in Supabase → SQL Editor
-- ============================================================

create table if not exists auction_comments (
  id          uuid        default gen_random_uuid() primary key,
  auction_id  uuid        references auction_listings(id) on delete cascade not null,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  display_name text       not null,           -- stored at insert time
  body        text        not null check (char_length(body) > 0 and char_length(body) <= 1000),
  created_at  timestamptz default now()
);

create index if not exists idx_auction_comments_auction_id on auction_comments(auction_id);

-- RLS
alter table auction_comments enable row level security;

drop policy if exists "public: read comments" on auction_comments;
drop policy if exists "auth: insert own comment" on auction_comments;
drop policy if exists "auth: delete own comment" on auction_comments;

-- Anyone can read comments
create policy "public: read comments"
  on auction_comments for select
  using (true);

-- Auth users can insert their own comments
create policy "auth: insert own comment"
  on auction_comments for insert
  with check (auth.uid() = user_id);

-- Users can delete their own comments
create policy "auth: delete own comment"
  on auction_comments for delete
  using (auth.uid() = user_id);

-- ============================================================
-- After running:
-- 1. Database → Publications → supabase_realtime → 0 tables
--    → add auction_comments to the publication
-- ============================================================
