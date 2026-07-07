/**
 * POST /api/auctions/admin/create
 *
 * Creates a new auction listing. Protected by CRON_SECRET so only
 * Austin can seed listings from Postman / curl until a full admin
 * UI is built.
 *
 * Example body:
 * {
 *   "slug": "2022-42-contender",
 *   "title": "2022 Contender 42 ST",
 *   "make": "Contender", "model": "42 ST", "year": 2022,
 *   "length_ft": 42, "location": "Palm Beach, FL",
 *   "description": "One owner, low hours...",
 *   "images": ["https://..."],
 *   "hours": 120,
 *   "starting_bid": 250000,
 *   "reserve_price": 300000,
 *   "starts_at": "2026-07-10T14:00:00Z",
 *   "ends_at":   "2026-07-17T14:00:00Z"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.slug || !body?.title || !body?.starts_at || !body?.ends_at) {
    return NextResponse.json(
      { error: 'Required fields: slug, title, starts_at, ends_at' },
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
      status:        body.status        ?? 'active',
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
