/**
 * /api/cron/match-searches
 *
 * Vercel Cron Job — runs daily at 9am UTC (configured in vercel.json).
 *
 * Algorithm:
 *  1. Load all saved searches from Supabase (with buyer profile joined)
 *  2. For each search, fetch current matching listings from /api/vessels
 *  3. Diff current listing IDs against previously seen IDs
 *  4. If new listings found → email austin@breckyachtgroup.com with buyer
 *     details and the new vessel(s)
 *  5. Update seen_listing_ids and last_notified_at in Supabase
 *
 * Security: requests must include Authorization: Bearer <CRON_SECRET>.
 * Vercel automatically adds this header when invoking scheduled crons.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'

const resend  = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://breckyachtgroup.com'

// ── Auth guard ────────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // misconfigured — block all requests
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

// ── Fetch listings matching a filter set ──────────────────────────────────────
async function fetchMatchingListings(filters: Record<string, string>): Promise<{ id: string; name: string; url: string; make: string; model: string; year: number; price: number; location: string }[]> {
  try {
    const params = new URLSearchParams({ page: '1', ...filters })
    const res    = await fetch(`${BASE_URL}/api/vessels?${params.toString()}`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.listings ?? []).map((l: Record<string, unknown>) => ({
      id:       String(l.id ?? ''),
      name:     String(l.name ?? ''),
      url:      `${BASE_URL}/inventory/${l.slug ?? l.id}`,
      make:     String(l.make ?? ''),
      model:    String(l.model ?? ''),
      year:     Number(l.year ?? 0),
      price:    Number(l.price ?? 0),
      location: String(l.location ?? ''),
    }))
  } catch {
    return []
  }
}

// ── Build email HTML for Austin ───────────────────────────────────────────────
function buildEmailHtml(params: {
  buyerName:  string
  buyerEmail: string
  buyerPhone: string
  lookingFor: string
  timeline:   string
  searchName: string
  filters:    Record<string, string>
  newVessels: { name: string; url: string; make: string; model: string; year: number; price: number; location: string }[]
}): string {
  const { buyerName, buyerEmail, buyerPhone, lookingFor, timeline, searchName, newVessels } = params

  const vesselRows = newVessels.map(v => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">
        <a href="${v.url}" style="color:#0c1f3f;font-weight:bold;text-decoration:none;">
          ${v.year} ${v.make} ${v.model}
        </a><br/>
        <span style="color:#888;font-size:12px;">${v.location}</span>
      </td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">
        <strong>${v.price ? `$${v.price.toLocaleString()}` : 'Call for Price'}</strong>
      </td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">
        <a href="${v.url}" style="color:#c9a84c;font-size:12px;">View →</a>
      </td>
    </tr>
  `).join('')

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#0c1f3f;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;letter-spacing:2px;">BRECK YACHT GROUP</h1>
        <p style="color:#c9a84c;margin:4px 0 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Buyer Match Alert</p>
      </div>

      <div style="padding:32px;background:#fff;">
        <h2 style="color:#0c1f3f;margin-top:0;">New vessels matching a saved buyer search</h2>

        <div style="background:#f8f6f1;border-left:4px solid #c9a84c;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;">Buyer</p>
          <p style="margin:0;font-weight:bold;font-size:16px;">${buyerName}</p>
          <p style="margin:4px 0 0;">
            <a href="mailto:${buyerEmail}" style="color:#0c1f3f;">${buyerEmail}</a>
            ${buyerPhone ? ` · <a href="tel:${buyerPhone}" style="color:#0c1f3f;">${buyerPhone}</a>` : ''}
          </p>
          ${lookingFor ? `<p style="margin:8px 0 0;font-size:14px;color:#555;"><strong>Looking for:</strong> ${lookingFor}</p>` : ''}
          ${timeline   ? `<p style="margin:4px 0 0;font-size:14px;color:#555;"><strong>Timeline:</strong> ${timeline}</p>` : ''}
        </div>

        <p style="color:#555;margin-bottom:8px;">
          Their saved search <strong>"${searchName}"</strong> now has ${newVessels.length} new match${newVessels.length !== 1 ? 'es' : ''}:
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#f8f6f1;">
              <th style="padding:10px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;">Vessel</th>
              <th style="padding:10px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;">Price</th>
              <th style="padding:10px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;"></th>
            </tr>
          </thead>
          <tbody>${vesselRows}</tbody>
        </table>

        <p style="font-size:13px;color:#888;">
          This is an automated alert from the BYG buyer matching system.
          Reach out to ${buyerName} directly — they haven't been notified by the system.
        </p>
      </div>
    </div>
  `
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Load all saved searches with joined buyer profile
  const { data: searches, error: fetchError } = await supabaseAdmin
    .from('saved_searches')
    .select(`
      id, name, filters, seen_listing_ids,
      buyer_profiles (
        id, name, phone, looking_for, timeline
      )
    `)

  if (fetchError) {
    console.error('Cron: failed to fetch saved searches', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!searches || searches.length === 0) {
    return NextResponse.json({ message: 'No saved searches to process.' })
  }

  let totalNotifications = 0

  for (const search of searches) {
    try {
      const profile   = Array.isArray(search.buyer_profiles) ? search.buyer_profiles[0] : search.buyer_profiles
      const seenIds   = new Set<string>(search.seen_listing_ids ?? [])
      const filters   = (search.filters ?? {}) as Record<string, string>

      // 2. Fetch current matching listings
      const listings = await fetchMatchingListings(filters)
      const currentIds = listings.map(l => l.id)

      // 3. Find listings that weren't in the last seen set
      const newListings = listings.filter(l => !seenIds.has(l.id))

      // 4. Email Austin if there are new matches and we have a buyer profile
      if (newListings.length > 0 && profile) {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.id)

        if (user?.email) {
          await resend.emails.send({
            from:    'BYG Buyer Alerts <leads@breckyachtgroup.com>',
            to:      'austin@breckyachtgroup.com',
            subject: `🎯 New match for ${profile.name} — "${search.name}" (${newListings.length} vessel${newListings.length !== 1 ? 's' : ''})`,
            html:    buildEmailHtml({
              buyerName:  profile.name,
              buyerEmail: user.email,
              buyerPhone: profile.phone ?? '',
              lookingFor: profile.looking_for ?? '',
              timeline:   profile.timeline ?? '',
              searchName: search.name,
              filters,
              newVessels: newListings,
            }),
          })
          totalNotifications++
        }
      }

      // 5. Update seen_listing_ids and last_notified_at
      await supabaseAdmin
        .from('saved_searches')
        .update({
          seen_listing_ids: currentIds,
          last_notified_at: newListings.length > 0 ? new Date().toISOString() : undefined,
        })
        .eq('id', search.id)

    } catch (err) {
      console.error(`Cron: error processing search ${search.id}`, err)
      // Continue processing other searches even if one fails
    }
  }

  return NextResponse.json({
    message:       `Processed ${searches.length} saved searches.`,
    notifications: totalNotifications,
  })
}
