-- ============================================================
-- BYG Auction Comment Likes + Flags
-- Run in Supabase → SQL Editor (safe to re-run)
-- ============================================================

-- ── Like counts on comments ───────────────────────────────────────────────────
alter table auction_comments add column if not exists like_count int default 0;
alter table auction_comments add column if not exists flag_count int default 0;

-- ── Comment likes ─────────────────────────────────────────────────────────────
create table if not exists auction_comment_likes (
  comment_id uuid not null references auction_comments(id) on delete cascade,
  user_id    uuid not null references auth.users(id)       on delete cascade,
  created_at timestamptz default now(),
  primary key (comment_id, user_id)
);
create index if not exists idx_comment_likes_comment on auction_comment_likes(comment_id);

alter table auction_comment_likes enable row level security;
drop policy if exists "users manage own comment likes" on auction_comment_likes;
create policy "users manage own comment likes"
  on auction_comment_likes for all
  using (auth.uid() = user_id);

-- ── Comment flags ─────────────────────────────────────────────────────────────
create table if not exists auction_comment_flags (
  comment_id uuid not null references auction_comments(id) on delete cascade,
  user_id    uuid not null references auth.users(id)       on delete cascade,
  reason     text,
  created_at timestamptz default now(),
  primary key (comment_id, user_id)
);
create index if not exists idx_comment_flags_comment on auction_comment_flags(comment_id);

alter table auction_comment_flags enable row level security;
drop policy if exists "users manage own comment flags" on auction_comment_flags;
create policy "users manage own comment flags"
  on auction_comment_flags for all
  using (auth.uid() = user_id);

-- ============================================================
-- After running, deploy the new like/flag API routes and
-- the updated auction detail page.
-- ============================================================
