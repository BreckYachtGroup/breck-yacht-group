/**
 * /api/vessels/byg — BYG own inventory from Supabase.
 *
 * Rate limiting: middleware.ts handles primary per-IP limit.
 * Secondary cap here protects the Supabase connection pool.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 20 requests/min per IP — BYG inventory is a small static set; no need for bulk polling
const RL_WINDOW_MS  = 60_000
const RL_MAX        = 20
const rlStore       = new Map<string, { count: number; windowStart: number }>()

function checkRL(ip: string): boolean {
  const now   = Date.now()
  const entry = rlStore.get(ip)
  if (!entry || now - entry.windowStart > RL_WINDOW_MS) {
    rlStore.set(ip, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= RL_MAX) return false
  entry.count++
  return true
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRL(ip)) {
    return NextResponse.json({ listings: [] }, { status: 429 })
  }
  try {
    const { data, error } = await supabase
      .from('vessels')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ listings: data ?? [] })
  } catch (err) {
    console.error('BYG vessels error:', err)
    return NextResponse.json({ listings: [] })
  }
}
