-- ─────────────────────────────────────────────────────────────────────────────
-- place_bid() — Atomic bid placement with row-level locking
--
-- WHY: Without a database-level lock, two concurrent bids submitted at the
-- same millisecond can both pass application-level validation and both write,
-- corrupting the auction state. SELECT FOR UPDATE holds an exclusive row lock
-- for the duration of the transaction so only one bid can commit at a time.
--
-- Run this in the Supabase SQL Editor before going live with real auctions.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION place_bid(
  p_slug      text,     -- auction slug
  p_bidder_id uuid,     -- auth user id
  p_amount    numeric,  -- bid amount in dollars
  p_username  text      -- display username for the bid record
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auction        auction_listings%ROWTYPE;
  v_now            timestamptz := now();
  v_new_ends_at    timestamptz;
  v_min_bid        numeric;
  v_snipe_window   constant interval := '3 minutes';
  v_snipe_extend   constant interval := '3 minutes';
  v_max_extensions constant int      := 10;
BEGIN
  -- ── 1. Lock the auction row for this transaction ──────────────────────────
  -- SELECT FOR UPDATE prevents any other transaction from reading or writing
  -- this row until we commit, eliminating the race condition.
  SELECT * INTO v_auction
  FROM auction_listings
  WHERE slug = p_slug
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Auction not found.');
  END IF;

  -- ── 2. Validate auction state ─────────────────────────────────────────────
  IF v_auction.status != 'active' THEN
    RETURN jsonb_build_object('error', 'This auction is not active.');
  END IF;

  IF v_now >= v_auction.ends_at THEN
    RETURN jsonb_build_object('error', 'This auction has ended.');
  END IF;

  -- ── 3. Validate bid amount ────────────────────────────────────────────────
  v_min_bid := GREATEST(v_auction.starting_bid, v_auction.current_bid + 100);

  IF p_amount < v_min_bid THEN
    RETURN jsonb_build_object(
      'error',  'Minimum bid is $' || to_char(v_min_bid, 'FM999,999,999') || '.',
      'minBid', v_min_bid
    );
  END IF;

  -- ── 4. Prevent self-bidding ───────────────────────────────────────────────
  IF v_auction.current_bidder_id = p_bidder_id THEN
    RETURN jsonb_build_object('error', 'You are already the highest bidder.');
  END IF;

  -- ── 5. Anti-snipe: extend end time if bid lands in final 3 minutes ────────
  v_new_ends_at := v_auction.ends_at;
  IF (v_auction.ends_at - v_now < v_snipe_window)
     AND (v_auction.extended_count < v_max_extensions)
  THEN
    v_new_ends_at := v_now + v_snipe_extend;
  END IF;

  -- ── 6. Record the bid ─────────────────────────────────────────────────────
  INSERT INTO auction_bids (auction_id, bidder_id, amount, bidder_username)
  VALUES (v_auction.id, p_bidder_id, p_amount, p_username);

  -- ── 7. Update auction state ───────────────────────────────────────────────
  UPDATE auction_listings SET
    current_bid       = p_amount,
    current_bidder_id = p_bidder_id,
    bid_count         = bid_count + 1,
    ends_at           = v_new_ends_at,
    extended_count    = CASE
                          WHEN v_new_ends_at != v_auction.ends_at
                          THEN extended_count + 1
                          ELSE extended_count
                        END
  WHERE id = v_auction.id;

  -- ── 8. Return result to API route ─────────────────────────────────────────
  -- prev_bidder_id is returned so the API route can send an outbid email
  -- without needing a second DB query.
  RETURN jsonb_build_object(
    'success',       true,
    'currentBid',    p_amount,
    'endsAt',        v_new_ends_at,
    'extended',      v_new_ends_at != v_auction.ends_at,
    'auctionId',     v_auction.id,
    'auctionTitle',  v_auction.title,
    'prevBidderId',  v_auction.current_bidder_id  -- null if no previous bidder
  );
END;
$$;

-- Grant execute to the service role used by supabaseAdmin
GRANT EXECUTE ON FUNCTION place_bid(text, uuid, numeric, text) TO service_role;
