/**
 * GET  /api/auctions/admin/intake — list all submissions (admin only)
 * PATCH /api/auctions/admin/intake — update status (approve/reject)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user || user.email !== 'austin@breckyachtgroup.com') return null
  return user
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('auction_intake_submissions')
    .select(`
      id, status, created_at,
      year, make, model, length_ft,
      engine_count, engine_make, engine_hours,
      condition, reserve_price, current_location,
      listing_id,
      buyer_profiles ( name, phone )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submissions: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status } = await req.json()
  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('auction_intake_submissions')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
