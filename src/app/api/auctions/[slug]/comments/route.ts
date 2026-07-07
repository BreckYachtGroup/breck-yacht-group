/**
 * GET  /api/auctions/[slug]/comments — public, returns all comments
 * POST /api/auctions/[slug]/comments — auth required, insert comment
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: auction } = await supabaseAdmin
    .from('auction_listings')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!auction) return NextResponse.json({ comments: [] })

  const { data, error } = await supabaseAdmin
    .from('auction_comments')
    .select('id, user_id, display_name, body, image_url, like_count, flag_count, created_at')
    .eq('auction_id', auction.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Sign in to comment.' }, { status: 401 })

  const { slug } = await params
  const body = await req.json().catch(() => ({}))
  const text     = (body.body ?? '').trim()
  // Optional image URL — must be from our own Supabase storage bucket
  const imageUrl = typeof body.image_url === 'string' && body.image_url.includes('/auction-images/') ? body.image_url : null

  if (!text && !imageUrl) return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 })
  if (text.length > 1000) return NextResponse.json({ error: 'Comment too long (max 1000 characters).' }, { status: 400 })

  // Look up auction
  const { data: auction } = await supabaseAdmin
    .from('auction_listings')
    .select('id, status')
    .eq('slug', slug)
    .single()

  if (!auction) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })

  // Use username if set, fall back to name, then email prefix
  const { data: profile } = await supabaseAdmin
    .from('buyer_profiles')
    .select('username, name')
    .eq('id', user.id)
    .maybeSingle()

  const displayName = profile?.username || profile?.name || (user.email?.split('@')[0] ?? 'User')

  const { data, error } = await supabaseAdmin
    .from('auction_comments')
    .insert({
      auction_id:   auction.id,
      user_id:      user.id,
      display_name: displayName,
      body:         text,
      image_url:    imageUrl,
    })
    .select('id, user_id, display_name, body, image_url, like_count, flag_count, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const body = await req.json().catch(() => ({}))
  const commentId = body.id

  if (!commentId) return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('auction_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id) // only own comments

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
