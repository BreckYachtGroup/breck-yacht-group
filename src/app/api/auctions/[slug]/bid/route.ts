/**
 * POST /api/auctions/[slug]/bid
 *
 * Places a bid on an active auction using an atomic Postgres function
 * (place_bid) that holds a row-level lock for the duration of the transaction.
 * This eliminates the race condition where two concurrent bids could both
 * pass application-level validation before either writes to the DB.
 *
 * Auth: Authorization: Bearer <supabase_access_token>
 *
 * IMPORTANT: Run supabase-place-bid-fn.sql in the Supabase SQL Editor
 * before this route will work correctly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendOutbidEmail } from '@/lib/auction-emails'

const MIN_INCREMENT = 100  // minimum bid increment in dollars

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
  const body   = await req.json().catch(() => ({}))
  const amount = Number(body.amount)

  if (!amount || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid bid amount.' }, { status: 400 })
  }

  // ── Look up bidder's display username ──────────────────────────────────────
  // Done before the RPC so the username is passed into the atomic transaction.
  const { data: bidderProfile } = await supabaseAdmin
    .from('buyer_profiles')
    .select('username, name')
    .eq('id', user.id)
    .maybeSingle()

  const bidderUsername = bidderProfile?.username
    || bidderProfile?.name?.split(' ')[0]
    || user.email?.split('@')[0]
    || 'Bidder'

  // ── Atomic bid via Postgres function ───────────────────────────────────────
  // place_bid() uses SELECT FOR UPDATE to lock the auction row, then validates
  // and writes the bid + updates the listing in a single transaction.
  // No race condition is possible — concurrent bids queue at the DB level.
  const { data: result, error: rpcError } = await supabaseAdmin.rpc('place_bid', {
    p_slug:      slug,
    p_bidder_id: user.id,
    p_amount:    amount,
    p_username:  bidderUsername,
  })

  if (rpcError) {
    console.error('[place_bid rpc]', rpcError)
    return NextResponse.json({ error: 'Bid failed. Please try again.' }, { status: 500 })
  }

  // place_bid returns a jsonb object — Supabase RPC unwraps it as JS object
  const res = result as {
    error?:       string
    minBid?:      number
    success?:     boolean
    currentBid?:  number
    endsAt?:      string
    extended?:    boolean
    auctionId?:   string
    auctionTitle?: string
    prevBidderId?: string | null
  }

  // Validation errors from inside the Postgres function
  if (res.error) {
    return NextResponse.json(
      { error: res.error, ...(res.minBid ? { minBid: res.minBid } : {}) },
      { status: 400 }
    )
  }

  // ── Fire-and-forget outbid email to previous highest bidder ───────────────
  if (res.prevBidderId && res.prevBidderId !== user.id) {
    supabaseAdmin.auth.admin.getUserById(res.prevBidderId).then(({ data: { user: prevUser } }) => {
      if (!prevUser?.email) return
      const prevName = prevUser.user_metadata?.full_name?.split(' ')[0] ?? 'there'
      sendOutbidEmail({
        to:           prevUser.email,
        bidderName:   prevName,
        auctionTitle: res.auctionTitle ?? slug,
        auctionSlug:  slug,
        newBid:       res.currentBid!,
        minNextBid:   res.currentBid! + MIN_INCREMENT,
        endsAt:       res.endsAt!,
      }).catch(err => console.error('[outbid email]', err))
    }).catch(() => {})
  }

  return NextResponse.json({
    success:    true,
    currentBid: res.currentBid,
    endsAt:     res.endsAt,
    extended:   res.extended ?? false,
  })
}
