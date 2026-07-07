/**
 * GET /api/auctions/[slug]
 * Returns a single auction listing with full bid history.
 * Public — no auth required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: auction, error } = await supabaseAdmin
    .from('auction_listings')
    .select('*')
    .eq('slug', slug)
    .in('status', ['active', 'ended', 'sold'])
    .single()

  if (error || !auction) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
  }

  // Fetch bid history (most recent first, show bidder email partially masked)
  const { data: bids } = await supabaseAdmin
    .from('auction_bids')
    .select('id, amount, created_at, bidder_id, bidder_username')
    .eq('auction_id', auction.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ auction, bids: bids ?? [] })
}
