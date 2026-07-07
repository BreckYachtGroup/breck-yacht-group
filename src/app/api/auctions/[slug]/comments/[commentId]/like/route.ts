/**
 * POST   /api/auctions/[slug]/comments/[commentId]/like — toggle like on (auth required)
 * DELETE /api/auctions/[slug]/comments/[commentId]/like — toggle like off (auth required)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user ?? null
}

/** Recount likes and sync to auction_comments.like_count */
async function syncLikeCount(commentId: string) {
  const { count } = await supabaseAdmin
    .from('auction_comment_likes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId)

  await supabaseAdmin
    .from('auction_comments')
    .update({ like_count: count ?? 0 })
    .eq('id', commentId)

  return count ?? 0
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { commentId } = await params

  // Upsert — silently ignore if already liked (unique constraint)
  await supabaseAdmin
    .from('auction_comment_likes')
    .upsert({ comment_id: commentId, user_id: user.id }, { onConflict: 'comment_id,user_id', ignoreDuplicates: true })

  const like_count = await syncLikeCount(commentId)
  return NextResponse.json({ liked: true, like_count })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { commentId } = await params

  await supabaseAdmin
    .from('auction_comment_likes')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', user.id)

  const like_count = await syncLikeCount(commentId)
  return NextResponse.json({ liked: false, like_count })
}
