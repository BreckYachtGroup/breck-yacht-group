/**
 * GET  /api/auctions/admin/listings/[slug] — fetch any listing by slug (drafts included)
 * PATCH /api/auctions/admin/listings/[slug] — update a listing
 * Both admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/admin-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getAdminUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params

  const { data, error } = await supabaseAdmin
    .from('auction_listings')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  return NextResponse.json({ auction: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getAdminUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('auction_listings')
    .update(body)
    .eq('slug', slug)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
