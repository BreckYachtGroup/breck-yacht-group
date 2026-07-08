-- ─────────────────────────────────────────────────────────────────────────────
-- Auction Seller Intake Submissions
-- Stores intake form submissions from prospective auction sellers.
-- Auto-creates a draft auction_listings row on submission.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists auction_intake_submissions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,

  -- Status lifecycle: pending → approved | rejected
  -- 'draft_created' means a draft auction_listings row was auto-generated
  status          text not null default 'pending'
                    check (status in ('pending','approved','rejected','draft_created')),

  -- ── Vessel basics ────────────────────────────────────────────────────────
  year            int,
  make            text,
  model           text,
  length_ft       numeric(5,1),
  hull_type       text,   -- fiberglass, aluminum, composite, other

  -- ── Engines ─────────────────────────────────────────────────────────────
  engine_count    int  default 1,
  engine_make     text,
  engine_model    text,
  engine_year     int,
  engine_hours    int,
  drive_type      text,   -- outboard, inboard, sterndrive, jet
  fuel_type       text,   -- gas, diesel

  -- ── Condition ────────────────────────────────────────────────────────────
  condition       text,   -- excellent, good, fair, project
  known_issues    text,   -- seller disclosure — required field
  recent_maintenance text,

  -- ── Listing preferences ──────────────────────────────────────────────────
  reserve_price   numeric(12,2),   -- seller's minimum acceptable price
  current_location text,           -- city/state where boat is located
  storage_type    text,            -- wet slip, dry storage, on trailer, mooring
  title_status    text,            -- clear, lien, other
  has_existing_survey boolean default false,
  desired_start_window text,       -- e.g. "ASAP", "Within 30 days", etc.

  -- ── Additional notes ─────────────────────────────────────────────────────
  seller_notes    text,

  -- ── Agreement acknowledgments ────────────────────────────────────────────
  -- All three must be true before form submits
  ack_listing_fee      boolean not null default false,
  ack_survey_policy    boolean not null default false,
  ack_listing_agreement boolean not null default false,

  -- ── Link to auto-created draft listing ───────────────────────────────────
  listing_id      uuid references auction_listings(id) on delete set null,

  -- ── Admin notes ──────────────────────────────────────────────────────────
  admin_notes     text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Updated-at trigger
create or replace function update_intake_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists intake_updated_at on auction_intake_submissions;
create trigger intake_updated_at
  before update on auction_intake_submissions
  for each row execute function update_intake_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table auction_intake_submissions enable row level security;

-- Users can insert their own submissions
create policy "Users can submit intake forms"
  on auction_intake_submissions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can read their own submissions
create policy "Users can read own submissions"
  on auction_intake_submissions for select
  to authenticated
  using (auth.uid() = user_id);

-- Service role (admin) has full access — handled via supabaseAdmin client
