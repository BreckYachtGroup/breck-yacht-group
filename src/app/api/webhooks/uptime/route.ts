/**
 * POST /api/webhooks/uptime
 *
 * Receives recovery (back-online) webhooks from Better Uptime.
 * When triggered:
 *   1. Calculates outage duration from the payload
 *   2. Extends all active auction end times by (outage duration + 10 min buffer)
 *   3. Emails every unique bidder and watcher across affected auctions
 *
 * Setup in Better Uptime:
 *   Integrations → Webhooks → Add webhook
 *   URL: https://breckyachtgroup.com/api/webhooks/uptime?secret=YOUR_SECRET
 *   Trigger on: "Monitor recovered" only
 *
 * Environment variable required:
 *   UPTIME_WEBHOOK_SECRET — any random string, set in Vercel env vars
 *   and copied into the Better Uptime webhook URL above.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendOutageRecoveryEmail } from '@/lib/auction-emails'
import { formatAuctionTime } from '@/lib/auction-time'

const BUFFER_MINUTES = 10  // extra buffer added on top of outage duration

export async function POST(req: NextRequest) {
  // ── Verify secret ───────────────────────────────────────────────────────────
  const secret = req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.UPTIME_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse payload — supports UptimeRobot (form-encoded) and Better Stack (JSON)
  const contentType = req.headers.get('content-type') ?? ''
  let isRecovery = false
  let startedAt: string | null = null
  const resolvedAt = new Date().toISOString()

  if (contentType.includes('application/x-www-form-urlencoded')) {
    // UptimeRobot sends form-encoded data
    // alertType: 1=Down, 2=Up, 3=SSL expiry
    const text   = await req.text()
    const params = new URLSearchParams(text)
    const alertType = params.get('alertType')
    isRecovery = alertType === '2'  // "2" = monitor back up
    // UptimeRobot doesn't send outage start time — we'll default to 5-min (their check interval)
    if (isRecovery) {
      startedAt = new Date(Date.now() - 5 * 60_000).toISOString()
    }
  } else {
    // Better Stack / generic JSON payload
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    const monitorStatus = body?.monitor?.status ?? body?.status
    isRecovery = monitorStatus === 'up' || monitorStatus === 'recovered'
    startedAt  = body?.incident?.started_at ?? body?.started_at ?? null
  }

  if (!isRecovery) {
    return NextResponse.json({ received: true, action: 'none', reason: 'not a recovery event' })
  }

  let outageDurationMs = 0
  if (startedAt) {
    outageDurationMs = new Date(resolvedAt).getTime() - new Date(startedAt).getTime()
  }

  // Minimum 1 minute assumed if we can't calculate (avoids zero-extension edge case)
  const outageDurationMinutes = Math.max(1, Math.round(outageDurationMs / 60_000))
  const extensionMs = (outageDurationMinutes + BUFFER_MINUTES) * 60_000

  console.log(`[uptime webhook] Recovery after ~${outageDurationMinutes}min outage — extending auctions by ${outageDurationMinutes + BUFFER_MINUTES}min`)

  // ── Find all active auctions ─────────────────────────────────────────────────
  const now = new Date().toISOString()
  const { data: activeAuctions, error: auctionsErr } = await supabaseAdmin
    .from('auction_listings')
    .select('id, slug, title, ends_at')
    .eq('status', 'active')
    .gt('ends_at', now)

  if (auctionsErr || !activeAuctions?.length) {
    return NextResponse.json({ received: true, action: 'none', reason: 'no active auctions' })
  }

  // ── Extend each auction's end time ───────────────────────────────────────────
  const extended: { title: string; slug: string; newEndsAt: string }[] = []

  for (const auction of activeAuctions) {
    const newEndsAt = new Date(new Date(auction.ends_at).getTime() + extensionMs).toISOString()

    const { error } = await supabaseAdmin
      .from('auction_listings')
      .update({ ends_at: newEndsAt })
      .eq('id', auction.id)

    if (!error) {
      extended.push({ title: auction.title, slug: auction.slug, newEndsAt })
      console.log(`[uptime webhook] Extended "${auction.title}" → ${newEndsAt}`)
    } else {
      console.error(`[uptime webhook] Failed to extend "${auction.title}":`, error)
    }
  }

  if (!extended.length) {
    return NextResponse.json({ received: true, action: 'none', reason: 'no auctions extended' })
  }

  // ── Collect all unique bidders + watchers across affected auctions ───────────
  const auctionIds = activeAuctions.map(a => a.id)

  const [bidsRes, watchRes] = await Promise.all([
    // All unique bidders on active auctions
    supabaseAdmin
      .from('auction_bids')
      .select('bidder_id')
      .in('auction_id', auctionIds),
    // All watchers on active auctions
    supabaseAdmin
      .from('auction_watchlist')
      .select('user_id')
      .in('auction_id', auctionIds),
  ])

  const userIds = new Set<string>([
    ...(bidsRes.data ?? []).map(b => b.bidder_id),
    ...(watchRes.data ?? []).map(w => w.user_id),
  ])

  if (!userIds.size) {
    return NextResponse.json({ received: true, extended: extended.length, emailed: 0 })
  }

  // ── Fetch emails for all affected users ──────────────────────────────────────
  const emailPromises = Array.from(userIds).map(async (uid) => {
    try {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid)
      if (!user?.email) return

      // Send recovery email — fire and forget per user
      sendOutageRecoveryEmail({
        to:                    user.email,
        outageDurationMinutes,
        affectedAuctions:      extended,
      }).catch(err => console.error(`[uptime webhook] Email failed for ${user.email}:`, err))
    } catch (e) {
      console.error(`[uptime webhook] Could not fetch user ${uid}:`, e)
    }
  })

  // Kick off all emails concurrently (fire-and-forget batch)
  Promise.all(emailPromises).catch(() => {})

  return NextResponse.json({
    received:             true,
    outageDurationMinutes,
    extensionMinutes:     outageDurationMinutes + BUFFER_MINUTES,
    auctionsExtended:     extended.length,
    usersNotified:        userIds.size,
  })
}
