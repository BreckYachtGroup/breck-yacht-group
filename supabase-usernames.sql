-- ============================================================
-- BYG Usernames
-- Run in Supabase → SQL Editor (safe to re-run)
-- ============================================================

-- Add username to buyer_profiles
alter table buyer_profiles add column if not exists username text unique;
create unique index if not exists idx_buyer_profiles_username on buyer_profiles(username);

-- Add bidder_username to auction_bids (stored at bid time for historical accuracy)
alter table auction_bids add column if not exists bidder_username text;

-- ============================================================
-- After running, deploy the updated profile + auction pages.
-- ============================================================
