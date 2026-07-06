/**
 * /api/account/delete
 *
 * DELETE — Permanently deletes the authenticated user's account.
 *          Cascades automatically to buyer_profiles and saved_searches
 *          via the ON DELETE CASCADE foreign keys in Supabase.
 *
 * Auth: Authorization: Bearer <supabase_access_token>
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the token and get the user
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Delete the auth user — cascades to buyer_profiles and saved_searches
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
