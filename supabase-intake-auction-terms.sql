-- Add ack_auction_terms column to auction_intake_submissions
-- Run this once in the Supabase SQL editor.
-- Records the seller's acceptance of the 7-day auction agreement (required).
-- ack_listing_agreement remains the optional 1-year listing agreement (waives 1% seller commission).

ALTER TABLE auction_intake_submissions
  ADD COLUMN IF NOT EXISTS ack_auction_terms boolean NOT NULL DEFAULT false;
