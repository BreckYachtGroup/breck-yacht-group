/**
 * GET    /api/auctions/[slug]/watch — check if current user is watching
 * POST   /api/auctions/[slug]/watch — add to watchlist
 * DELETE /api/auctions/[slug]/watch — remove from watchlist
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user ?? null
}

async function getAuctionId(slug: string) {
  const { data } = await supabaseAdmin
    .from('auction_listings')
    .select('id')
    .eq('slug', slug)
    .single()
  return data?.id ?? null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ watching: false })

  const { slug } = await params
  const auctionId = await getAuctionId(slug)
  if (!auctionId) return NextResponse.json({ watching: false })

  const { data } = await supabaseAdmin
    .from('auction_watchlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('auction_id', auctionId)
    .maybeSingle()

  return NextResponse.json({ watching: !!data })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const auctionId = await getAuctionId(slug)
  if (!auctionId) return NextResponse.json({ error: 'Auction not found' }, { status: 404 })

  await supabaseAdmin
    .from('auction_watchlist')
    .upsert({ user_id: user.id, auction_id: auctionId }, { onConflict: 'user_id,auction_id' })

  return NextResponse.json({ watching: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const auctionId = await getAuctionId(slug)
  if (!auctionId) return NextResponse.json({ error: 'Auction not found' }, { status: 404 })

  await supabaseAdmin
    .from('auction_watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('auction_id', auctionId)

  return NextResponse.json({ watching: false })
}
