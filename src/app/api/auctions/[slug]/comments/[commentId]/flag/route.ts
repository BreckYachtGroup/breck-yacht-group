/**
 * POST /api/auctions/[slug]/comments/[commentId]/flag
 * Flags a comment as not constructive. One flag per user per comment.
 * Syncs flag_count on auction_comments and emails admin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendFlagAlertEmail } from '@/lib/auction-emails'

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

  const { slug, commentId } = await params

  // Upsert — one flag per user per comment; ignore if already flagged
  const { error: upsertErr } = await supabaseAdmin
    .from('auction_comment_flags')
    .upsert({ comment_id: commentId, user_id: user.id }, { onConflict: 'comment_id,user_id', ignoreDuplicates: true })

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  // Recount and sync to comment row
  const { count } = await supabaseAdmin
    .from('auction_comment_flags')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId)

  const flagCount = count ?? 1
  await supabaseAdmin
    .from('auction_comments')
    .update({ flag_count: flagCount })
    .eq('id', commentId)

  // Fetch comment + auction details for the alert email
  const [{ data: comment }, { data: auction }, { data: flagger }] = await Promise.all([
    supabaseAdmin
      .from('auction_comments')
      .select('display_name, body')
      .eq('id', commentId)
      .single(),
    supabaseAdmin
      .from('auction_listings')
      .select('title, slug')
      .eq('slug', slug)
      .single(),
    supabaseAdmin
      .from('buyer_profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  // Fire-and-forget admin alert
  if (comment && auction) {
    sendFlagAlertEmail({
      auctionTitle:  auction.title,
      auctionSlug:   auction.slug,
      commentAuthor: comment.display_name,
      commentBody:   comment.body ?? '(image only)',
      flaggedBy:     flagger?.name ?? user.email ?? user.id,
      flagCount,
    }).catch(() => {})
  }

  return NextResponse.json({ flagged: true, flag_count: flagCount })
}
