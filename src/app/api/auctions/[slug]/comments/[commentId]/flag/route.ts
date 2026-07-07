/**
 * POST /api/auctions/[slug]/comments/[commentId]/flag
 * Flags a comment as not constructive. One flag per user per comment.
 * Increments flag_count on auction_comments for admin review.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user ?? null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { commentId } = await params

  // Upsert — one flag per user per comment
  await supabaseAdmin
    .from('auction_comment_flags')
    .upsert({ comment_id: commentId, user_id: user.id }, { onConflict: 'comment_id,user_id', ignoreDuplicates: true })

  // Recount and sync
  const { count } = await supabaseAdmin
    .from('auction_comment_flags')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId)

  await supabaseAdmin
    .from('auction_comments')
    .update({ flag_count: count ?? 0 })
    .eq('id', commentId)

  return NextResponse.json({ flagged: true, flag_count: count ?? 0 })
}
