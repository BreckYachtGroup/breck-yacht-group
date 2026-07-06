/**
 * /api/saved-searches
 *
 * GET  — Returns all saved searches for the authenticated user.
 * POST — Creates a new saved search for the authenticated user.
 *
 * Auth: Authorization: Bearer <supabase_access_token>
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user ?? null
}

// ── GET /api/saved-searches ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('saved_searches')
    .select('id, name, filters, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ searches: data ?? [] })
}

// ── POST /api/saved-searches ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, filters } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('saved_searches')
    .insert({ user_id: user.id, name: name.trim(), filters: filters ?? {} })
    .select('id, name, filters, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ search: data }, { status: 201 })
}
