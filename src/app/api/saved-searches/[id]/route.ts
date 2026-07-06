/**
 * /api/saved-searches/[id]
 *
 * DELETE — Removes a saved search. Verifies the search belongs to the
 *          requesting user before deleting (prevents cross-user deletion).
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabaseAdmin
    .from('saved_searches')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id) // ensures users can only delete their own searches

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
