-- ============================================================
-- BYG Auction House Schema  (safe to re-run)
-- Run this in your Supabase dashboard → SQL Editor
-- ============================================================

-- 1. Auction listings
create table if not exists auction_listings (
  id              uuid        default gen_random_uuid() primary key,
  slug            text        not null unique,

  -- Vessel info
  title           text        not null,
  description     text,
  make            text,
  model           text,
  year            int,
  length_ft       numeric,
  location        text,
  images          text[]      default '{}',
  condition       text        default 'Used',
  hours           int,
  vin             text,

  -- Auction mechanics
  status          text        not null default 'draft',
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  starting_bid    numeric     not null default 0,
  reserve_price   numeric,
  current_bid     numeric     not null default 0,
  current_bidder_id uuid      references auth.users(id) on delete set null,
  bid_count       int         not null default 0,
  extended_count  int         not null default 0,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 2. Auction bids
create table if not exists auction_bids (
  id          uuid        default gen_random_uuid() primary key,
  auction_id  uuid        references auction_listings(id) on delete cascade not null,
  bidder_id   uuid        references auth.users(id) on delete cascade not null,
  amount      numeric     not null,
  created_at  timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_auction_listings_status  on auction_listings(status);
create index if not exists idx_auction_listings_ends_at on auction_listings(ends_at);
create index if not exists idx_auction_bids_auction_id  on auction_bids(auction_id);
create index if not exists idx_auction_bids_bidder_id   on auction_bids(bidder_id);

-- ── Updated-at trigger ────────────────────────────────────────────────────────
-- Use a unique function name to avoid conflicts with buyer schema
create or replace function update_auction_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists auction_listings_updated_at on auction_listings;
create trigger auction_listings_updated_at
  before update on auction_listings
  for each row execute function update_auction_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────────────────
alter table auction_listings enable row level security;
alter table auction_bids     enable row level security;

-- Drop policies first so re-runs don't error
drop policy if exists "public: read active auctions" on auction_listings;
drop policy if exists "public: read bids"            on auction_bids;
drop policy if exists "auth: insert own bid"         on auction_bids;

-- Anyone can read active/ended auction listings
create policy "public: read active auctions"
  on auction_listings for select
  using (status in ('active', 'ended', 'sold'));

-- Anyone can read bids (for bid history display)
create policy "public: read bids"
  on auction_bids for select
  using (true);

-- Only authenticated users can insert bids
create policy "auth: insert own bid"
  on auction_bids for insert
  with check (auth.uid() = bidder_id);

-- ============================================================
-- After running:
-- 1. Database → Replication → enable Realtime on
--    auction_listings AND auction_bids
-- 2. Seed a test listing via POST /api/auctions/admin/create
-- ============================================================
