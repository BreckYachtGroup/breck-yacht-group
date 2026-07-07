/**
 * POST /api/newsletter/subscribe
 * Adds an email to newsletter_subscribers and sends a welcome email.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendNewsletterWelcome } from '@/lib/auction-emails'

export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => ({}))
  const email = (body.email ?? '').trim().toLowerCase()
  const name  = (body.name  ?? '').trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .upsert({ email, name: name || null, active: true }, { onConflict: 'email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget welcome email
  sendNewsletterWelcome({ to: email }).catch(err => console.error('[newsletter welcome]', err))

  return NextResponse.json({ ok: true })
}
