/**
 * PATCH /api/auctions/admin/listings/[slug]  — update auction fields
 * DELETE /api/auctions/admin/listings/[slug] — delete auction
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/admin-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getAdminUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const body = await req.json().catch(() => ({}))

  // Whitelist updatable fields
  const allowed = [
    'title', 'description', 'make', 'model', 'year', 'length_ft',
    'location', 'images', 'condition', 'hours', 'vin',
    'status', 'starts_at', 'ends_at', 'starting_bid', 'reserve_price',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('auction_listings')
    .update(updates)
    .eq('slug', slug)
    .select('id, slug, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, auction: data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getAdminUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params

  const { error } = await supabaseAdmin
    .from('auction_listings')
    .delete()
    .eq('slug', slug)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
