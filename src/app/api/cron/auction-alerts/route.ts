/**
 * GET /api/cron/auction-alerts
 *
 * Daily cron (9 AM UTC) — sends watchlist alert emails and processes
 * any auctions that ended without being caught by the client-side trigger.
 *
 * Sends:
 *  - 24hr watchlist alerts (auctions ending in ~24 hours)
 *  - Fallback end emails for auctions that ended with no active viewer
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWatchlistAlert, sendWinnerEmail, sendSellerEndEmail } from '@/lib/auction-emails'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now    = new Date()
  const in24h  = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const window = 60 * 60 * 1000 // ±1 hour window around the 24h mark

  let alertsSent = 0
  let endsFallback = 0

  // ── 1. Send 24hr watchlist alerts ─────────────────────────────────────────
  const { data: alertAuctions } = await supabaseAdmin
    .from('auction_listings')
    .select('id, slug, title, current_bid, starting_bid, ends_at')
    .eq('status', 'active')
    .eq('alert_24h_sent', false)
    .gte('ends_at', new Date(in24h.getTime() - window).toISOString())
    .lte('ends_at', new Date(in24h.getTime() + window).toISOString())

  for (const auction of alertAuctions ?? []) {
    // Get all watchers
    const { data: watchers } = await supabaseAdmin
      .from('auction_watchlist')
      .select('user_id')
      .eq('auction_id', auction.id)

    for (const w of watchers ?? []) {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(w.user_id)
      if (user?.email) {
        await sendWatchlistAlert({
          to:           user.email,
          auctionTitle: auction.title,
          auctionSlug:  auction.slug,
          currentBid:   auction.current_bid || auction.starting_bid,
          endsAt:       auction.ends_at,
          alertType:    '24h',
        }).catch(err => console.error('[watchlist 24h]', err))
        alertsSent++
      }
    }

    // Mark sent
    await supabaseAdmin
      .from('auction_listings')
      .update({ alert_24h_sent: true })
      .eq('id', auction.id)
  }

  // ── 2. Fallback: process auctions that ended without client trigger ────────
  const { data: endedAuctions } = await supabaseAdmin
    .from('auction_listings')
    .select('*')
    .eq('status', 'active')
    .eq('end_email_sent', false)
    .lt('ends_at', now.toISOString())

  for (const auction of endedAuctions ?? []) {
    const reserveMet = !auction.reserve_price || auction.current_bid >= auction.reserve_price
    const newStatus  = (auction.current_bidder_id && reserveMet) ? 'sold' : 'ended'

    await supabaseAdmin
      .from('auction_listings')
      .update({ status: newStatus, end_email_sent: true })
      .eq('id', auction.id)
      .eq('end_email_sent', false)

    let winnerName: string | null = null
    let winnerEmail: string | null = null

    if (auction.current_bidder_id && reserveMet) {
      const { data: { user: winner } } = await supabaseAdmin.auth.admin.getUserById(auction.current_bidder_id)
      winnerEmail = winner?.email ?? null
      winnerName  = winner?.user_metadata?.full_name?.split(' ')[0] ?? 'there'
      if (winnerEmail) {
        await sendWinnerEmail({
          to: winnerEmail, winnerName: winnerName ?? 'there',
          auctionTitle: auction.title, auctionSlug: auction.slug,
          winningBid: auction.current_bid,
        }).catch(err => console.error('[winner fallback]', err))
      }
    }

    await sendSellerEndEmail({
      auctionTitle: auction.title, auctionSlug: auction.slug,
      winningBid:   (auction.current_bidder_id && reserveMet) ? auction.current_bid : null,
      winnerName, winnerEmail, reserveMet,
    }).catch(err => console.error('[seller fallback]', err))

    endsFallback++
  }

  return NextResponse.json({ ok: true, alertsSent, endsFallback })
}
