/**
 * POST /api/auctions/[slug]/bid
 *
 * Places a bid on an active auction.
 *
 * Rules:
 *  - User must be authenticated
 *  - Auction must be in 'active' status
 *  - Auction must not have ended (ends_at > now)
 *  - Bid must exceed current_bid by at least $100 (minimum increment)
 *  - Anti-snipe: if bid lands within 3 minutes of ends_at,
 *    reset ends_at to 3 minutes from now (max 10 extensions per auction)
 *
 * Auth: Authorization: Bearer <supabase_access_token>
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MIN_INCREMENT  = 100             // minimum bid increment in dollars
const SNIPE_WINDOW   = 3 * 60 * 1000  // trigger if < 3 minutes remain
const SNIPE_EXTEND   = 3 * 60 * 1000  // reset timer to 3 minutes from now
const MAX_EXTENSIONS = 10

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Sign in to place a bid.' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Sign in to place a bid.' }, { status: 401 })

  // ── Parse input ────────────────────────────────────────────────────────────
  const { slug } = await params
  const body = await req.json().catch(() => ({}))
  const amount = Number(body.amount)

  if (!amount || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid bid amount.' }, { status: 400 })
  }

  // ── Load auction ───────────────────────────────────────────────────────────
  const { data: auction, error: fetchError } = await supabaseAdmin
    .from('auction_listings')
    .select('*')
    .eq('slug', slug)
    .single()

  if (fetchError || !auction) {
    return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })
  }

  const now    = Date.now()
  const endsAt = new Date(auction.ends_at).getTime()

  if (auction.status !== 'active') {
    return NextResponse.json({ error: 'This auction is not active.' }, { status: 400 })
  }

  if (now >= endsAt) {
    return NextResponse.json({ error: 'This auction has ended.' }, { status: 400 })
  }

  // ── Validate bid amount ────────────────────────────────────────────────────
  const minBid = Math.max(auction.starting_bid, auction.current_bid + MIN_INCREMENT)
  if (amount < minBid) {
    return NextResponse.json({
      error: `Minimum bid is $${minBid.toLocaleString()}.`,
      minBid,
    }, { status: 400 })
  }

  // Can't outbid yourself
  if (auction.current_bidder_id === user.id) {
    return NextResponse.json({ error: 'You are already the highest bidder.' }, { status: 400 })
  }

  // ── Anti-snipe: extend if bid lands within 5 minutes of end ───────────────
  let newEndsAt = auction.ends_at
  if (endsAt - now < SNIPE_WINDOW && auction.extended_count < MAX_EXTENSIONS) {
    newEndsAt = new Date(endsAt + SNIPE_EXTEND).toISOString()
  }

  // ── Record the bid ─────────────────────────────────────────────────────────
  const { error: bidError } = await supabaseAdmin
    .from('auction_bids')
    .insert({ auction_id: auction.id, bidder_id: user.id, amount })

  if (bidError) return NextResponse.json({ error: bidError.message }, { status: 500 })

  // ── Update auction ─────────────────────────────────────────────────────────
  const { error: updateError } = await supabaseAdmin
    .from('auction_listings')
    .update({
      current_bid:        amount,
      current_bidder_id:  user.id,
      bid_count:          auction.bid_count + 1,
      ends_at:            newEndsAt,
      extended_count:     newEndsAt !== auction.ends_at
                            ? auction.extended_count + 1
                            : auction.extended_count,
    })
    .eq('id', auction.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    success:    true,
    currentBid: amount,
    endsAt:     newEndsAt,
    extended:   newEndsAt !== auction.ends_at,
  })
}
