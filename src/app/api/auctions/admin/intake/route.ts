/**
 * GET  /api/auctions/admin/intake — list all submissions (admin only)
 * PATCH /api/auctions/admin/intake — update status or approve + send deposit email
 *
 * PATCH body options:
 *   { id, status: 'rejected' | 'pending' }  — simple status update
 *   { id, action: 'approve' }               — approve + fire deposit request email to seller
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSurveyTier, formatDeposit } from '@/lib/survey-tiers'
import { sendDepositRequestEmail } from '@/lib/auction-emails'

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user || user.email !== 'austin@breckyachtgroup.com') return null
  return user
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('auction_intake_submissions')
    .select(`
      id, status, created_at,
      year, make, model, length_ft,
      engine_count, engine_make, engine_hours,
      condition, reserve_price, current_location,
      listing_id,
      buyer_profiles ( name, phone )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submissions: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, action, status } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // ── Simple status update (reject, etc.) ──────────────────────────────────────
  if (status && !action) {
    const { error } = await supabaseAdmin
      .from('auction_intake_submissions')
      .update({ status })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // ── Approve + send deposit request email ─────────────────────────────────────
  if (action === 'approve') {
    // 1. Fetch the full submission + seller email
    const { data: intake, error: fetchErr } = await supabaseAdmin
      .from('auction_intake_submissions')
      .select(`
        id, year, make, model, length_ft, user_id,
        buyer_profiles ( name )
      `)
      .eq('id', id)
      .single()

    if (fetchErr || !intake) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // 2. Get seller's email from auth.users
    const { data: { user: sellerAuth } } = await supabaseAdmin.auth.admin.getUserById(intake.user_id)
    if (!sellerAuth?.email) {
      return NextResponse.json({ error: 'Could not resolve seller email' }, { status: 500 })
    }

    // 3. Calculate survey tier from vessel length
    const tier         = getSurveyTier(intake.length_ft)
    const depositAmt   = formatDeposit(tier.depositCents)

    // 4. Build Stripe payment link
    // ── TODO: Replace this placeholder with a real Stripe Payment Link once
    //    Stripe is connected. Create a Payment Link per tier in the Stripe dashboard
    //    and store the URLs in environment variables:
    //      STRIPE_DEPOSIT_LINK_UNDER_30  (< 30ft)
    //      STRIPE_DEPOSIT_LINK_30_TO_39  (30–39ft)
    //      STRIPE_DEPOSIT_LINK_40_PLUS   (40ft+)
    //    Then swap the ternary below to read from process.env.
    const stripeLink =
      intake.length_ft && intake.length_ft >= 40
        ? (process.env.STRIPE_DEPOSIT_LINK_40_PLUS   ?? 'https://buy.stripe.com/placeholder-40plus')
        : intake.length_ft && intake.length_ft >= 30
        ? (process.env.STRIPE_DEPOSIT_LINK_30_TO_39  ?? 'https://buy.stripe.com/placeholder-30to39')
        : (process.env.STRIPE_DEPOSIT_LINK_UNDER_30  ?? 'https://buy.stripe.com/placeholder-under30')

    // 5. Mark as approved
    const { error: updateErr } = await supabaseAdmin
      .from('auction_intake_submissions')
      .update({ status: 'approved' })
      .eq('id', id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    // 6. Fire deposit request email (fire-and-forget)
    const profile = Array.isArray(intake.buyer_profiles)
      ? intake.buyer_profiles[0]
      : intake.buyer_profiles
    const sellerName = (profile as { name?: string } | null)?.name
      || sellerAuth.email.split('@')[0]

    sendDepositRequestEmail({
      to:               sellerAuth.email,
      sellerName,
      year:             intake.year,
      make:             intake.make,
      model:            intake.model,
      lengthFt:         intake.length_ft,
      tierLabel:        tier.label,
      depositAmount:    depositAmt,
      stripePaymentLink: stripeLink,
    }).catch(err => console.error('Deposit email failed:', err))

    return NextResponse.json({
      success:       true,
      tier:          tier.label,
      depositAmount: depositAmt,
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
