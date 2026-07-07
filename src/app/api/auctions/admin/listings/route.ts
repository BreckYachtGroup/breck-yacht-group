/**
 * GET  /api/auctions/admin/listings — list all auctions (admin only)
 * POST /api/auctions/admin/listings — create new auction (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const user = await getAdminUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('auction_listings')
    .select('id, slug, title, make, model, year, status, starts_at, ends_at, starting_bid, current_bid, bid_count, reserve_price, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ auctions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.slug || !body?.title || !body?.starts_at || !body?.ends_at) {
    return NextResponse.json(
      { error: 'Required: slug, title, starts_at, ends_at' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('auction_listings')
    .insert({
      slug:          body.slug,
      title:         body.title,
      description:   body.description   ?? null,
      make:          body.make          ?? null,
      model:         body.model         ?? null,
      year:          body.year          ?? null,
      length_ft:     body.length_ft     ?? null,
      location:      body.location      ?? null,
      images:        body.images        ?? [],
      condition:     body.condition     ?? 'Used',
      hours:         body.hours         ?? null,
      vin:           body.vin           ?? null,
      status:        body.status        ?? 'draft',
      starts_at:     body.starts_at,
      ends_at:       body.ends_at,
      starting_bid:  body.starting_bid  ?? 0,
      reserve_price: body.reserve_price ?? null,
      current_bid:   body.starting_bid  ?? 0,
    })
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, auction: data }, { status: 201 })
}
