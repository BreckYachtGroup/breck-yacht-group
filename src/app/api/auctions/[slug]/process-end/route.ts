/**
 * POST /api/auctions/[slug]/process-end
 *
 * Idempotent endpoint called when the client detects an auction has ended.
 * Sends winner + seller emails and updates auction status.
 * Safe to call multiple times — uses end_email_sent flag to prevent duplicates.
 * No auth required (public, but guarded by the end_email_sent flag).
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWinnerEmail, sendSellerEndEmail } from '@/lib/auction-emails'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: auction } = await supabaseAdmin
    .from('auction_listings')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!auction) return NextResponse.json({ ok: false, reason: 'not found' })

  // Only process if actually ended and not already processed
  const ended = new Date(auction.ends_at).getTime() <= Date.now()
  if (!ended)                  return NextResponse.json({ ok: false, reason: 'not ended yet' })
  if (auction.end_email_sent)  return NextResponse.json({ ok: true,  reason: 'already processed' })

  // Determine outcome
  const reserveMet = !auction.reserve_price || auction.current_bid >= auction.reserve_price
  const newStatus  = (auction.current_bidder_id && reserveMet) ? 'sold' : 'ended'

  // Mark processed first (prevents race conditions from concurrent calls)
  await supabaseAdmin
    .from('auction_listings')
    .update({ status: newStatus, end_email_sent: true })
    .eq('id', auction.id)
    .eq('end_email_sent', false) // atomic guard

  // Get winner details if applicable
  let winnerName  : string | null = null
  let winnerEmail : string | null = null
  if (auction.current_bidder_id && reserveMet) {
    const { data: { user: winner } } = await supabaseAdmin.auth.admin.getUserById(auction.current_bidder_id)
    winnerEmail = winner?.email ?? null
    winnerName  = winner?.user_metadata?.full_name?.split(' ')[0] ?? 'there'

    if (winnerEmail) {
      sendWinnerEmail({
        to:           winnerEmail,
        winnerName:   winnerName ?? 'there',
        auctionTitle: auction.title,
        auctionSlug:  slug,
        winningBid:   auction.current_bid,
      }).catch(err => console.error('[winner email]', err))
    }
  }

  // Always notify the admin/seller
  sendSellerEndEmail({
    auctionTitle: auction.title,
    auctionSlug:  slug,
    winningBid:   (auction.current_bidder_id && reserveMet) ? auction.current_bid : null,
    winnerName,
    winnerEmail,
    reserveMet,
  }).catch(err => console.error('[seller end email]', err))

  return NextResponse.json({ ok: true, status: newStatus })
}
