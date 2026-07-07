/**
 * GET /api/auctions/admin/bids/[slug]
 * Returns all bids for a given auction slug. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/admin-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getAdminUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params

  // Get auction id from slug
  const { data: auction, error: auctionError } = await supabaseAdmin
    .from('auction_listings')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (auctionError || !auction) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
  }

  const { data: bids, error } = await supabaseAdmin
    .from('auction_bids')
    .select('id, amount, created_at, bidder_id')
    .eq('auction_id', auction.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch bidder emails from auth.users via admin API
  const bidsWithEmail = await Promise.all(
    (bids ?? []).map(async (bid) => {
      const { data: { user: bidder } } = await supabaseAdmin.auth.admin.getUserById(bid.bidder_id)
      return { ...bid, bidder_email: bidder?.email ?? bid.bidder_id }
    })
  )

  return NextResponse.json({ auction, bids: bidsWithEmail })
}
