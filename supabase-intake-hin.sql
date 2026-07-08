-- Migration: Add HIN (Hull Identification Number) to auction_intake_submissions
-- Run this in the Supabase SQL Editor before the next intake submission.

ALTER TABLE auction_intake_submissions
  ADD COLUMN IF NOT EXISTS hin text;
