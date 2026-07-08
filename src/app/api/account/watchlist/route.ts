/**
 * GET /api/account/watchlist
 * Returns all auctions the authenticated user is watching, with full listing data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('auction_watchlist')
    .select(`
      created_at,
      auction_listings!inner(
        id, slug, title, make, model, year, length_ft, location,
        images, status, ends_at, starting_bid, current_bid, bid_count
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const auctions = (data ?? []).map((row: any) => row.auction_listings)
  return NextResponse.json({ auctions })
}
