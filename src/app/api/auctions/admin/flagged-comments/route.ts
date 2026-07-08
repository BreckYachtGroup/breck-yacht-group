/**
 * GET    /api/auctions/admin/flagged-comments — all comments with flag_count > 0
 * DELETE /api/auctions/admin/flagged-comments — delete a comment by id (body: { id })
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const ADMIN_EMAIL = 'austin@breckyachtgroup.com'

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('auction_comments')
    .select(`
      id, display_name, body, image_url, flag_count, like_count, created_at,
      auction_listings!inner(title, slug)
    `)
    .gt('flag_count', 0)
    .order('flag_count', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('auction_comments')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
