/**
 * listings.ts — Central data source for all vessel listings.
 *
 * CURRENT:  Reads from Supabase (manual listings you enter yourself).
 * FUTURE:   Switch to YachtBroker.org live API by setting YACHTBROKER_API_KEY
 *           in your environment variables. No other code changes needed.
 *
 * To activate the live feed:
 *   1. Subscribe at yachtbroker.org
 *   2. Add YACHTBROKER_API_KEY to your Vercel environment variables
 *   3. Redeploy — the site automatically switches to the live feed
 */

import { supabase, type Vessel } from './supabase'

const YACHTBROKER_API_KEY = process.env.YACHTBROKER_API_KEY
const YACHTBROKER_API_URL = 'https://api.yachtbroker.org/v1' // update if they provide a different endpoint

// ─── Shared return type ───────────────────────────────────────────────────────

export type Listing = {
  id: string
  slug: string
  name: string
  make: string
  model: string
  year: number
  length_ft: number
  beam_ft: number
  price: number
  status: 'available' | 'sold' | 'under_contract'
  location: string
  description: string
  engine_details: string
  hours: number
  fuel_type: string
  images: string[]
  featured: boolean
  // Co-brokerage fields (populated from API feed)
  broker_name?: string
  broker_company?: string
  broker_email?: string
  broker_phone?: string
  is_cobrokerage?: boolean  // true if listing belongs to another broker
}

// ─── Fetch all listings ───────────────────────────────────────────────────────

export async function getAllListings(): Promise<Listing[]> {
  if (YACHTBROKER_API_KEY) {
    return fetchFromYachtBrokerAPI()
  }
  return fetchFromSupabase()
}

// ─── Fetch a single listing by slug ──────────────────────────────────────────

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  if (YACHTBROKER_API_KEY) {
    const all = await fetchFromYachtBrokerAPI()
    return all.find((l) => l.slug === slug) ?? null
  }
  const { data } = await supabase.from('vessels').select('*').eq('slug', slug).single()
  return data as Listing | null
}

// ─── Fetch featured listings ──────────────────────────────────────────────────

export async function getFeaturedListings(): Promise<Listing[]> {
  const all = await getAllListings()
  return all.filter((l) => l.featured && l.status === 'available').slice(0, 3)
}

// ─── Supabase source (current) ────────────────────────────────────────────────

async function fetchFromSupabase(): Promise<Listing[]> {
  const { data } = await supabase
    .from('vessels')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as Listing[]
}

// ─── YachtBroker.org API source (activates automatically when key is set) ────
//
// NOTE: Update the fetch calls below once you receive your API documentation
// from YachtBroker.org. The field mapping in normalizeYachtBrokerListing() is
// where you match their field names to our Listing type.

async function fetchFromYachtBrokerAPI(): Promise<Listing[]> {
  try {
    const res = await fetch(`${YACHTBROKER_API_URL}/listings`, {
      headers: {
        Authorization: `Bearer ${YACHTBROKER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      // Revalidate every 5 minutes so listings stay fresh without hammering the API
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      console.error('YachtBroker API error:', res.status, res.statusText)
      // Fall back to Supabase if the API call fails
      return fetchFromSupabase()
    }

    const json = await res.json()

    // json.listings — update this path to match the actual API response shape
    const raw: Record<string, unknown>[] = json.listings ?? json.data ?? json ?? []
    return raw.map(normalizeYachtBrokerListing)
  } catch (err) {
    console.error('YachtBroker API fetch failed, falling back to Supabase:', err)
    return fetchFromSupabase()
  }
}

/**
 * Maps a raw YachtBroker.org API listing to our Listing type.
 * Update field names here once you have the actual API docs.
 */
function normalizeYachtBrokerListing(raw: Record<string, unknown>): Listing {
  return {
    id:             String(raw.id ?? raw.listing_id ?? ''),
    slug:           String(raw.slug ?? raw.id ?? ''),
    name:           String(raw.name ?? raw.title ?? ''),
    make:           String(raw.make ?? raw.builder ?? ''),
    model:          String(raw.model ?? ''),
    year:           Number(raw.year ?? 0),
    length_ft:      Number(raw.length_ft ?? raw.loa_ft ?? raw.length ?? 0),
    beam_ft:        Number(raw.beam_ft ?? raw.beam ?? 0),
    price:          Number(raw.price ?? raw.asking_price ?? 0),
    status:         (raw.status as Listing['status']) ?? 'available',
    location:       String(raw.location ?? raw.vessel_location ?? ''),
    description:    String(raw.description ?? raw.comments ?? ''),
    engine_details: String(raw.engine_details ?? raw.engines ?? ''),
    hours:          Number(raw.hours ?? raw.engine_hours ?? 0),
    fuel_type:      String(raw.fuel_type ?? raw.fuel ?? ''),
    images:         Array.isArray(raw.images) ? raw.images as string[] : [],
    featured:       Boolean(raw.featured ?? false),
    broker_name:    String(raw.broker_name ?? raw.listing_broker ?? ''),
    broker_company: String(raw.broker_company ?? raw.company ?? ''),
    broker_email:   String(raw.broker_email ?? ''),
    broker_phone:   String(raw.broker_phone ?? ''),
    is_cobrokerage: Boolean(raw.is_cobrokerage ?? false),
  }
}
