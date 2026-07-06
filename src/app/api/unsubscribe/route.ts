/**
 * /api/unsubscribe
 *
 * GET — Verifies the signed token and deletes all saved searches for the user.
 *       No login required — link comes from the match alert email.
 *       Redirects to /unsubscribe?success=true on completion.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://breckyachtgroup.com'

export async function GET(req: NextRequest) {
  const uid   = req.nextUrl.searchParams.get('uid')
  const token = req.nextUrl.searchParams.get('token')

  if (!uid || !token || !verifyUnsubscribeToken(uid, token)) {
    return NextResponse.redirect(`${BASE_URL}/unsubscribe?error=invalid`)
  }

  // Delete all saved searches for this user — stops all future alerts
  const { error } = await supabaseAdmin
    .from('saved_searches')
    .delete()
    .eq('user_id', uid)

  if (error) {
    return NextResponse.redirect(`${BASE_URL}/unsubscribe?error=server`)
  }

  return NextResponse.redirect(`${BASE_URL}/unsubscribe?success=true`)
}
