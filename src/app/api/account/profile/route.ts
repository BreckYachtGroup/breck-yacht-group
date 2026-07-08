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
    .maybeSingle() // returns null (not an error) when no row exists

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // isComplete = all fields required to bid or list a vessel are present
  const p = data
  const isComplete = !!(p?.name && p?.phone && p?.username &&
    p?.address_line1 && p?.address_city && p?.address_state && p?.address_zip)

  return NextResponse.json({ profile: data ?? null, isComplete })
}

// ── POST /api/account/profile ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, phone, looking_for, timeline, username,
          address_line1, address_city, address_state, address_zip } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Validate username: 3–20 chars, alphanumeric + underscores only
  if (username !== undefined) {
    const u = username.trim()
    if (u && !/^[a-zA-Z0-9_]{3,20}$/.test(u)) {
      return NextResponse.json({ error: 'Username must be 3–20 characters: letters, numbers, and underscores only.' }, { status: 400 })
    }
    // Check uniqueness (exclude current user)
    if (u) {
      const { data: existing } = await supabaseAdmin
        .from('buyer_profiles')
        .select('id')
        .eq('username', u)
        .neq('id', user.id)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
      }
    }
  }

  // Compose full address string for clerking records
  const line1 = address_line1?.trim() || null
  const city  = address_city?.trim()  || null
  const state = address_state?.trim() || null
  const zip   = address_zip?.trim()   || null
  const composedAddress = (line1 && city && state && zip)
    ? `${line1}, ${city}, ${state} ${zip}`
    : null

  const { error } = await supabaseAdmin
    .from('buyer_profiles')
    .upsert({
      id:            user.id,
      name:          name.trim(),
      phone:         phone?.trim()       || null,
      looking_for:   looking_for?.trim() || null,
      timeline:      timeline?.trim()    || null,
      address_line1: line1,
      address_city:  city,
      address_state: state,
      address_zip:   zip,
      address:       composedAddress,  // denormalized for clerking records
      ...(username !== undefined ? { username: username.trim() || null } : {}),
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
