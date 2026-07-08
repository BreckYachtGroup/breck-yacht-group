/**
 * POST /api/auctions/intake
 * Accepts a seller intake form submission. Requires auth.
 * 1. Saves to auction_intake_submissions
 * 2. Auto-creates a draft auction_listings row
 * 3. Sends alert email to Austin + confirmation to seller
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendIntakeAlertEmail, sendIntakeConfirmationEmail } from '@/lib/auction-emails'
import { auctionSchedule } from '@/lib/auction-time'

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  const body = await req.json()
  const {
    year, make, model, length_ft, hull_type,
    hin,
    engine_count, engine_make, engine_model, engine_year, engine_hours,
    drive_type, fuel_type,
    condition, known_issues, recent_maintenance,
    reserve_price, current_location, storage_type, title_status,
    has_existing_survey, desired_start_window,
    seller_notes,
    ack_listing_fee, ack_survey_policy, ack_auction_terms, ack_listing_agreement,
  } = body

  // Basic validation
  if (!make || !model || !year) {
    return NextResponse.json({ error: 'Make, model, and year are required.' }, { status: 400 })
  }
  // ack_listing_agreement is OPTIONAL — waives 1% seller commission
  if (!ack_listing_fee || !ack_survey_policy || !ack_auction_terms) {
    return NextResponse.json({ error: 'All required agreement checkboxes must be accepted.' }, { status: 400 })
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
      condition:    condition || null,
      hours:        engine_hours || null,      // map intake engine_hours → listing hours
      vin:          hin || null,               // map intake HIN → listing vin field
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
      // Draft dates: schedule ~30 days out at 8 PM ET so the admin edit form
      // is pre-populated correctly. Admin adjusts the exact date before going live.
      ...(() => {
        const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        return auctionSchedule(thirtyDaysOut)
      })(),
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
      hin: hin || null,
      engine_count, engine_make, engine_model, engine_year, engine_hours,
      drive_type, fuel_type,
      condition, known_issues, recent_maintenance,
      reserve_price, current_location, storage_type, title_status,
      has_existing_survey: has_existing_survey || false,
      desired_start_window,
      seller_notes,
      ack_listing_fee:       ack_listing_fee       || false,
      ack_survey_policy:     ack_survey_policy      || false,
      ack_auction_terms:     ack_auction_terms      || false,  // requires supabase-intake-auction-terms.sql
      ack_listing_agreement: ack_listing_agreement  || false,  // optional — waives 1% seller commission
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
