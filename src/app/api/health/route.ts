/**
 * GET /api/health
 *
 * Health check endpoint for uptime monitoring (UptimeRobot, Better Uptime, etc.)
 *
 * Returns:
 *   200 { status: 'ok', db: 'ok', ts: <iso> }          — everything healthy
 *   503 { status: 'degraded', db: 'error', error: ... } — DB unreachable
 *
 * Point your uptime monitor at:
 *   https://breckyachtgroup.com/api/health
 * Alert trigger: any non-200 response or response time > 5s.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'       // ensure full Node runtime (not Edge)
export const dynamic = 'force-dynamic' // never cache — always run live

export async function GET() {
  const ts = new Date().toISOString()

  try {
    // Lightweight DB ping — count() on a small system table
    const { error } = await supabaseAdmin
      .from('auction_listings')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    if (error) throw error

    return NextResponse.json(
      { status: 'ok', db: 'ok', ts },
      { status: 200 }
    )
  } catch (err) {
    console.error('[health] DB check failed:', err)
    return NextResponse.json(
      { status: 'degraded', db: 'error', ts, error: String(err) },
      { status: 503 }
    )
  }
}
