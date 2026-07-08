/**
 * POST /api/auctions/intake
 * Accepts a seller intake form submission. Requires auth.
 * 1. Saves to auction_intake_submissions
 * 2. Auto-creates a draft auction_listings row
 * 3. Sends alert email to Austin + confirmation to seller
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendIntakeAlertEmail, sendIntakeConfirmationEmail } from '@/lib/auction-emails'

function authClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
}

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user }, error: authError } = token
    ? await supabaseAdmin.auth.getUser(token)
    : await authClient().auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  const body = await req.json()
  const {
    year, make, model, length_ft, hull_type,
    engine_count, engine_make, engine_model, engine_year, engine_hours,
    drive_type, fuel_type,
    condition, known_issues, recent_maintenance,
    reserve_price, current_location, storage_type, title_status,
    has_existing_survey, desired_start_window,
    seller_notes,
    ack_listing_fee, ack_survey_policy, ack_listing_agreement,
  } = body

  // Basic validation
  if (!make || !model || !year) {
    return NextResponse.json({ error: 'Make, model, and year are required.' }, { status: 400 })
  }
  if (!ack_listing_fee || !ack_survey_policy || !ack_listing_agreement) {
    return NextResponse.json({ error: 'All agreement checkboxes must be accepted.' }, { status: 400 })
  }

  // ── Fetch seller profile for emails ─────────────────────────────────────────
  const { data: profile } = await supabaseAdmin
    .from('buyer_profiles')
    .select('name, phone')
    .eq('user_id', user.id)
    .single()

  const sellerName  = profile?.name  || user.email?.split('@')[0] || 'Seller'
  const sellerPhone = profile?.phone || ''

  // ── Auto-create draft auction listing ───────────────────────────────────────
  const slug = `${year}-${make}-${model}-draft-${Date.now()}`
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-')

  const { data: listing, error: listingError } = await supabaseAdmin
    .from('auction_listings')
    .insert({
      title:        `${year} ${make} ${model}${length_ft ? ` ${length_ft}ft` : ''}`,
      slug,
      make,
      model,
      year,
      length_ft:    length_ft || null,
      location:     current_location || '',
      status:       'draft',
      starting_bid: reserve_price ? Math.round(reserve_price * 0.7) : 0,
      reserve_price: reserve_price || null,
      description:  [
        condition  ? `Condition: ${condition}` : '',
        known_issues ? `Known issues: ${known_issues}` : '',
        recent_maintenance ? `Recent maintenance: ${recent_maintenance}` : '',
        seller_notes ? `Seller notes: ${seller_notes}` : '',
      ].filter(Boolean).join('\n\n') || 'Draft — details pending intake review.',
      images: [],
      // Auction dates TBD — admin sets these on approval
      starts_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ends_at:   new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (listingError) {
    console.error('Draft listing creation failed:', listingError)
    // Continue even if draft fails — don't block submission
  }

  // ── Save intake submission ───────────────────────────────────────────────────
  const { data: intake, error: intakeError } = await supabaseAdmin
    .from('auction_intake_submissions')
    .insert({
      user_id: user.id,
      status:  listing ? 'draft_created' : 'pending',
      year, make, model, length_ft, hull_type,
      engine_count, engine_make, engine_model, engine_year, engine_hours,
      drive_type, fuel_type,
      condition, known_issues, recent_maintenance,
      reserve_price, current_location, storage_type, title_status,
      has_existing_survey: has_existing_survey || false,
      desired_start_window,
      seller_notes,
      ack_listing_fee:      ack_listing_fee      || false,
      ack_survey_policy:    ack_survey_policy     || false,
      ack_listing_agreement: ack_listing_agreement || false,
      listing_id: listing?.id || null,
    })
    .select('id')
    .single()

  if (intakeError) {
    console.error('Intake submission failed:', intakeError)
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 })
  }

  // ── Emails (fire-and-forget) ─────────────────────────────────────────────────
  sendIntakeAlertEmail({
    sellerName,
    sellerEmail: user.email!,
    sellerPhone,
    year, make, model,
    lengthFt:       length_ft,
    reservePrice:   reserve_price,
    currentLocation: current_location,
    intakeId:       intake.id,
  }).catch(() => {})

  sendIntakeConfirmationEmail({
    to:         user.email!,
    sellerName,
    year, make, model,
  }).catch(() => {})

  return NextResponse.json({ success: true, intakeId: intake.id, listingId: listing?.id || null })
}
