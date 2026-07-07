-- ============================================================
-- BYG Valuation Submissions  (safe to re-run)
-- Run in Supabase → SQL Editor
-- ============================================================

create table if not exists valuation_submissions (
  id              uuid        default gen_random_uuid() primary key,
  created_at      timestamptz default now(),

  -- Vessel inputs
  year            int         not null,
  make            text        not null,
  model           text,
  length_ft       numeric     not null,
  condition       text        not null,
  hours           int,
  state           text,
  engine_count    int,
  engine_make     text,
  engine_model    text,

  -- Results returned
  val_low         int,
  val_mid         int,
  val_high        int,
  confidence      text,       -- 'high' | 'medium' | 'low'
  comp_count      int,

  -- Context
  ip_hash         text,       -- SHA-256 of IP — never store raw IP
  user_id         uuid references auth.users(id) on delete set null
);

-- Index for common queries
create index if not exists idx_val_sub_make_year  on valuation_submissions(make, year);
create index if not exists idx_val_sub_created_at on valuation_submissions(created_at desc);

-- RLS — only service role can read/write (admin queries use supabaseAdmin)
alter table valuation_submissions enable row level security;

drop policy if exists "no public access" on valuation_submissions;
create policy "no public access"
  on valuation_submissions for all
  using (false);

-- ============================================================
-- After running:
-- No Realtime setup needed — this is a private analytics table.
-- ============================================================
