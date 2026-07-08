/**
 * /api/auctions/admin/clerking
 *
 * Auction clerking & sales records — required for auctioneer license compliance.
 * All records are maintained server-side only (service_role) and never exposed
 * to the public client. The state board may request these at any time.
 *
 * GET    — list all clerking records (with optional filters)
 * POST   — create a new record from a completed auction
 * PATCH  — mark proceeds as delivered (or update delivery notes)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }            from '@/lib/supabase-admin'
import { requireAdmin }             from '@/lib/admin-auth'

// ── GET /api/auctions/admin/clerking ─────────────────────────────────────────
// Returns all clerking records newest-first.
// Optional query params: ?status=pending|delivered&year=2026
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')   // 'pending' | 'delivered'
  const year   = searchParams.get('year')

  let query = supabaseAdmin
    .from('auction_clerking_records')
    .select('*')
    .order('sale_date', { ascending: false })

  if (status === 'pending') {
    query = query.is('proceeds_delivered_at', null)
  } else if (status === 'delivered') {
    query = query.not('proceeds_delivered_at', 'is', null)
  }

  if (year) {
    // Filter by sale year using ISO date range
    query = query
      .gte('sale_date', `${year}-01-01T00:00:00Z`)
      .lt('sale_date',  `${Number(year) + 1}-01-01T00:00:00Z`)
  }

  const { data, error } = await query

  if (error) {
    console.error('[clerking GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also return a list of sold/ended auctions that don't have a clerking record yet
  const { data: needsRecord } = await supabaseAdmin
    .from('auction_listings')
    .select('id, slug, title, make, model, year, length_ft, vin, condition, description, ends_at, current_bid, current_bidder_id, bid_count')
    .in('status', ['sold', 'ended'])
    .not('id', 'in', `(${(data ?? []).map(r => `'${r.auction_id}'`).join(',') || "'00000000-0000-0000-0000-000000000000'"})`)
    .gt('bid_count', 0)
    .order('ends_at', { ascending: false })

  return NextResponse.json({
    records:     data ?? [],
    needsRecord: needsRecord ?? [],
  })
}

// ── POST /api/auctions/admin/clerking ────────────────────────────────────────
// Creates a new clerking record for a completed auction.
// Body: { auction_slug, winner_address, proceeds_delivered_at? }
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  // Extract the admin email for the audit trail
  const authHeader = req.headers.get('authorization') ?? ''
  const token      = authHeader.replace('Bearer ', '')
  const { data: { user: adminUser } } = await supabaseAdmin.auth.getUser(token)

  const body = await req.json().catch(() => null)
  if (!body?.auction_slug) {
    return NextResponse.json({ error: 'auction_slug is required' }, { status: 400 })
  }

  const {
    auction_slug,
    winner_address,
    proceeds_delivered_at = null,
    proceeds_delivery_notes = null,
  } = body

  // ── Fetch the auction listing ───────────────────────────────────────────────
  const { data: auction, error: auctionErr } = await supabaseAdmin
    .from('auction_listings')
    .select('id, slug, title, make, model, year, length_ft, vin, condition, description, ends_at, current_bid, current_bidder_id, status')
    .eq('slug', auction_slug)
    .single()

  if (auctionErr || !auction) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
  }

  if (!auction.current_bidder_id) {
    return NextResponse.json({ error: 'This auction has no winning bidder' }, { status: 400 })
  }

  // ── Check for duplicate ────────────────────────────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from('auction_clerking_records')
    .select('id')
    .eq('auction_id', auction.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'A clerking record already exists for this auction' }, { status: 409 })
  }

  // ── Fetch winning bidder profile ───────────────────────────────────────────
  const { data: { user: winnerAuth } } = await supabaseAdmin.auth.admin.getUserById(auction.current_bidder_id)

  const { data: winnerProfile } = await supabaseAdmin
    .from('buyer_profiles')
    .select('name, bidder_number, address')
    .eq('id', auction.current_bidder_id)
    .single()

  const winnerName          = winnerProfile?.name   || winnerAuth?.email?.split('@')[0] || 'Unknown'
  const winnerEmail         = winnerAuth?.email     || 'Unknown'
  const winnerBidderNumber  = winnerProfile?.bidder_number ?? 0
  // Address: prefer the one passed in (admin-entered), fallback to profile
  const resolvedAddress     = winner_address || winnerProfile?.address || ''

  if (!resolvedAddress) {
    return NextResponse.json({ error: 'winner_address is required' }, { status: 400 })
  }

  // ── Generate platform event ID ─────────────────────────────────────────────
  const { data: eventIdRow } = await supabaseAdmin
    .rpc('next_platform_event_id', {
      p_year: new Date(auction.ends_at).getFullYear(),
    })

  const platformEventId = eventIdRow as string

  // ── Calculate financials ───────────────────────────────────────────────────
  const hammerPrice          = auction.current_bid
  const buyerPremiumPct      = 5.00
  const buyerPremiumAmount   = Number((hammerPrice * buyerPremiumPct / 100).toFixed(2))
  const totalBuyerPaid       = Number((hammerPrice + buyerPremiumAmount).toFixed(2))

  // ── Insert clerking record ─────────────────────────────────────────────────
  const { data: record, error: insertErr } = await supabaseAdmin
    .from('auction_clerking_records')
    .insert({
      platform_event_id:    platformEventId,
      auction_id:           auction.id,
      auction_slug:         auction.slug,
      sale_date:            auction.ends_at,

      // Vessel snapshot
      vessel_year:          auction.year,
      vessel_make:          auction.make,
      vessel_model:         auction.model,
      vessel_length_ft:     auction.length_ft,
      vessel_hin:           auction.vin,          // stored as 'vin' in listings table
      vessel_condition:     auction.condition,
      vessel_description:   auction.description,

      // Winner
      winner_id:            auction.current_bidder_id,
      winner_name:          winnerName,
      winner_email:         winnerEmail,
      winner_address:       resolvedAddress,
      winner_bidder_number: winnerBidderNumber,

      // Financials
      hammer_price:         hammerPrice,
      buyer_premium_pct:    buyerPremiumPct,
      buyer_premium_amount: buyerPremiumAmount,
      total_buyer_paid:     totalBuyerPaid,

      // Proceeds
      proceeds_delivered_at:    proceeds_delivered_at,
      proceeds_delivery_notes:  proceeds_delivery_notes,

      created_by_email: adminUser?.email ?? 'admin',
    })
    .select()
    .single()

  if (insertErr) {
    console.error('[clerking POST]', insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ record }, { status: 201 })
}

// ── PATCH /api/auctions/admin/clerking ───────────────────────────────────────
// Updates proceeds delivery date/notes on an existing record.
// Body: { id, proceeds_delivered_at, proceeds_delivery_notes? }
export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const body = await req.json().catch(() => null)
  if (!body?.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { id, proceeds_delivered_at, proceeds_delivery_notes } = body

  const { data, error } = await supabaseAdmin
    .from('auction_clerking_records')
    .update({
      proceeds_delivered_at:   proceeds_delivered_at ?? null,
      proceeds_delivery_notes: proceeds_delivery_notes ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ record: data })
}
