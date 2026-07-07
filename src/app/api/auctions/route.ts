/**
 * GET /api/auctions
 * Returns all active (and recently ended) auction listings.
 * Public — no auth required.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('auction_listings')
    .select('id, slug, title, make, model, year, length_ft, location, images, status, starts_at, ends_at, starting_bid, current_bid, bid_count, reserve_price')
    .in('status', ['active', 'ended', 'sold'])
    .order('ends_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ auctions: data ?? [] })
}
