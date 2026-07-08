/**
 * GET /api/account/bids
 * Returns all auctions the authenticated user has bid on, with their highest bid.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all bids by this user, grouped by auction (max amount per auction)
  const { data: bids, error } = await supabaseAdmin
    .from('auction_bids')
    .select(`
      id, amount, created_at,
      auction_listings!inner(
        id, slug, title, make, model, year, length_ft, location,
        images, status, ends_at, starting_bid, current_bid, current_bidder_id, bid_count
      )
    `)
    .eq('bidder_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduplicate: keep only the highest bid per auction
  const seen = new Map<string, any>()
  for (const row of (bids ?? []) as any[]) {
    const auctionId = row.auction_listings.id
    if (!seen.has(auctionId) || row.amount > seen.get(auctionId).myBid) {
      seen.set(auctionId, {
        ...row.auction_listings,
        myBid:    row.amount,
        bidAt:    row.created_at,
        isWinning: row.auction_listings.current_bidder_id === user.id,
      })
    }
  }

  return NextResponse.json({ auctions: Array.from(seen.values()) })
}
