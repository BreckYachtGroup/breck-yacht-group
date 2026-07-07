/**
 * Admin auth utility.
 * Only austin@breckyachtgroup.com can access admin routes.
 */

import { supabaseAdmin } from './supabase-admin'
import type { NextRequest } from 'next/server'

export const ADMIN_EMAIL = 'huebya@gmail.com'

export async function getAdminUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  if (user.email !== ADMIN_EMAIL) return null

  return user
}
