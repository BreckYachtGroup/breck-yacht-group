/**
 * /api/account/profile
 *
 * POST — Creates a buyer_profiles row for a newly registered user.
 *        Called immediately after supabase.auth.signUp() on the client.
 * GET  — Returns the current user's profile (used by the Nav to display name).
 *
 * Auth: Bearer token from supabase.auth.getSession() in the Authorization header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ── Helper: extract and verify user from Bearer token ─────────────────────────
async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user ?? null
}

// ── GET /api/account/profile ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('buyer_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

// ── POST /api/account/profile ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, phone, looking_for, timeline } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('buyer_profiles')
    .upsert({
      id:          user.id,
      name:        name.trim(),
      phone:       phone?.trim() || null,
      looking_for: looking_for?.trim() || null,
      timeline:    timeline?.trim() || null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
