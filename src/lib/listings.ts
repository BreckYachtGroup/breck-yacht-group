/**
 * listings.ts — Central data source for all vessel listings.
 *
 * Now powered by the YachtBroker.org MLS feed via the Vultr proxy server.
 * Own BYG listings are identified by BROKERAGE_ID and shown first.
 * Co-brokerage listings from the MLS are shown below with a badge.
 *
 * Data is cached by Next.js for 5 minutes (revalidate: 300).
 */

import { supabase } from './supabase'

// ─── Config ──────────────────────────────────────────────────────────────────

const PROXY_URL = process.env.PROXY_URL ?? 'http://207.246.72.35:3001'
const BYG_BROKERAGE_ID = 40000937 // Breck Yacht Group's MLS brokerage ID

// State abbreviation map for display
const STATE_ABBR: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY',
}

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
  // Co-brokerage fields
  broker_name?: string
  broker_company?: string
  broker_email?: string
  broker_phone?: string
  is_cobrokerage?: boolean
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAllListings(): Promise<Listing[]> {
  try {
    return await fetchFromProxy()
  } catch (err) {
    console.error('Proxy failed, falling back to Supabase:', err)
    return fetchFromSupabase()
  }
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const all = await getAllListings()
  return all.find((l) => l.slug === slug) ?? null
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const all = await getAllListings()
  // Show BYG own listings first, then co-brokerage, limit to 6 on homepage
  return all
    .filter((l) => l.status === 'available')
    .sort((a, b) => (a.is_cobrokerage ? 1 : -1) - (b.is_cobrokerage ? 1 : -1))
    .slice(0, 6)
}

// ─── Proxy fetch (YachtBroker.org via Vultr static IP) ───────────────────────

async function fetchFromProxy(): Promise<Listing[]> {
  // Proxy serves all listings from its in-memory cache (refreshed hourly).
  // Single request — no pagination needed here.
  const res = await fetch(`${PROXY_URL}/listings`, {
    next: { revalidate: 300 }, // Next.js re-fetches from proxy every 5 minutes
  })

  if (!res.ok) throw new Error(`Proxy returned ${res.status}`)
  const data = await res.json()

  const raw: Record<string, unknown>[] = data['V-Data'] ?? []

  // Sort: BYG own listings first
  return raw
    .map(normalizeYachtBrokerListing)
    .sort((a, b) => (a.is_cobrokerage ? 1 : -1) - (b.is_cobrokerage ? 1 : -1))
}

// ─── Field mapping ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeYachtBrokerListing(raw: any): Listing {
  // Build image array from gallery, fall back to DisplayPicture
  const images: string[] = (raw.gallery ?? [])
    .map((g: any) => g.Large ?? g.HD ?? g.Medium)
    .filter(Boolean)
  if (images.length === 0 && raw.DisplayPicture?.Large) {
    images.push(raw.DisplayPicture.Large)
  }

  // Pull engine info from first engine in array
  const engine = Array.isArray(raw.engines) ? raw.engines[0] : null
  const hours = engine?.Hours ?? 0
  const engineParts = [engine?.Make, engine?.Model, engine?.HP ? `${engine.HP}HP` : null]
  const engineDetails = engineParts.filter(Boolean).join(' ')

  // Location: "City, ST"
  const stateAbbr = STATE_ABBR[raw.State] ?? raw.State ?? ''
  const location = [raw.City, stateAbbr].filter(Boolean).join(', ')

  // Co-brokerage: listing belongs to another brokerage
  const isCobrokerage = raw.ListingOwnerBrokerageID !== BYG_BROKERAGE_ID

  // Status
  const status: Listing['status'] =
    raw.Status === 'Under Contract' ? 'under_contract' : 'available'

  // Use Summary for description (cleaner text), fall back to Description
  const description = (raw.Summary ?? raw.Description ?? '')
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .trim()

  return {
    id:             String(raw.ID),
    slug:           String(raw.ID),
    name:           raw.VesselName || `${raw.Year} ${raw.Manufacturer} ${raw.Model}`,
    make:           raw.Manufacturer ?? '',
    model:          raw.Model ?? '',
    year:           raw.Year ?? 0,
    length_ft:      raw.DisplayLengthFeet ?? 0,
    beam_ft:        raw.BeamFeet ?? 0,
    price:          raw.PriceUSD ?? 0,
    status,
    location,
    description,
    engine_details: engineDetails,
    hours,
    fuel_type:      raw.FuelType ?? '',
    images,
    featured:       !isCobrokerage,
    broker_name:    raw.ListingOwnerName ?? '',
    broker_company: raw.ListingOwnerBrokerageName ?? '',
    broker_email:   raw.ListingOwnerEmail ?? '',
    broker_phone:   raw.ListingOwnerCell ?? raw.ListingOwnerPhone ?? '',
    is_cobrokerage: isCobrokerage,
  }
}

// ─── Supabase fallback ────────────────────────────────────────────────────────

async function fetchFromSupabase(): Promise<Listing[]> {
  const { data } = await supabase
    .from('vessels')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as Listing[]
}
