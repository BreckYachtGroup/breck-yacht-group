/**
 * listings.ts — Central data source for vessel listings.
 *
 * Architecture: Vultr proxy (static IP) → YachtBroker.org MLS API
 * - getAllListings: fetches first 3 pages for homepage featured section
 * - getListingBySlug: fetches a single listing by its MLS ID
 * - getFeaturedListings: BYG own listings first, up to 6
 *
 * Inventory browsing uses client-side pagination via /api/vessels route.
 */

import { supabase } from './supabase'

const PROXY_URL = process.env.PROXY_URL ?? 'http://207.246.72.35:3001'
const BYG_BROKERAGE_ID = 40000937

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
  broker_name?: string
  broker_company?: string
  broker_email?: string
  broker_phone?: string
  is_cobrokerage?: boolean
  // All engines from the API
  engines?: Array<{ Make: string; Model: string; HP: number; Hours: number | string }>
  // Extended specs
  condition?: string
  category?: string
  refit_year?: number | null
  hull_material?: string
  hull_finish?: string
  draft_ft?: number | null
  dry_weight?: string | null
  cruise_speed?: number | null
  max_speed?: number | null
  speed_unit?: string
  fuel_tank_gallons?: number | null
  fresh_water_gallons?: number | null
  holding_tank_gallons?: number | null
  engine_qty?: number | null
  sea_keeper?: string
  bow_thrusters?: string
  stern_thrusters?: string
  trailer?: string
  ac?: string
  cabin_count?: number | null
  sleep_count?: number | null
  head_count?: number | null
  notable_upgrades?: string
  price_headline?: string
  last_price_change?: { OldPrice: number; NewPrice: number; DateTime: string } | null
  textblocks?: Array<{ Title: string; Description: string }>
}

// ── Public API ────────────────────────────────────────────────────────────────

// Used by homepage featured section — fetches 3 pages (45 listings)
export async function getAllListings(): Promise<Listing[]> {
  try {
    const pages = await Promise.all(
      [1, 2, 3].map((page) =>
        fetch(`${PROXY_URL}/listings?page=${page}`, { next: { revalidate: 300 } })
          .then((r) => (r.ok ? r.json() : { 'V-Data': [] }))
          .catch(() => ({ 'V-Data': [] }))
      )
    )
    const raw = pages.flatMap((p) => p['V-Data'] ?? [])
    return raw
      .map(normalizeYachtBrokerListing)
      .sort((a, b) => (a.is_cobrokerage ? 1 : -1) - (b.is_cobrokerage ? 1 : -1))
  } catch {
    return fetchFromSupabase()
  }
}

// Used by listing detail page — checks Supabase first, then MLS proxy
export async function getListingBySlug(slug: string): Promise<Listing | null> {
  // 1. Check Supabase first (BYG own manually-entered listings)
  try {
    const { data } = await supabase
      .from('vessels')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    if (data) return data as unknown as Listing
  } catch {
    // not in Supabase, fall through to MLS
  }

  // 2. Fall back to MLS proxy (co-brokerage + MLS listings)
  try {
    const res = await fetch(`${PROXY_URL}/listing/${slug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const raw = await res.json()
    if (raw.error) return null
    return normalizeYachtBrokerListing(raw)
  } catch {
    return null
  }
}

// Used by homepage — shows only BYG's own Supabase listings, max 6
// Falls back to BYG MLS listings if Supabase is empty
export async function getFeaturedListings(): Promise<Listing[]> {
  try {
    const { data } = await supabase
      .from('vessels')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(6)
    if (data && data.length > 0) return data as unknown as Listing[]
  } catch {
    // fall through
  }

  // Fallback: BYG own MLS listings only (no co-brokerage)
  const all = await getAllListings()
  return all
    .filter((l) => l.status === 'available' && !l.is_cobrokerage)
    .slice(0, 6)
}

// ── Field normalization ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeYachtBrokerListing(raw: any): Listing {
  // Use gallery if available (detail page), fall back to single image (list card)
  let images: string[] = (raw.gallery ?? [])
    .map((g: any) => g.Large ?? g.HD ?? g.Medium)
    .filter(Boolean)
  if (images.length === 0 && raw.DisplayPicture?.Large) images.push(raw.DisplayPicture.Large)
  if (images.length === 0 && raw.image) images.push(raw.image)

  // Handle both slim list format (raw.hours) and full detail format (raw.Engines[])
  // YachtBroker API returns capital-E "Engines"; our cache normalizes to lowercase
  const engineList = raw.Engines ?? raw.engines ?? []
  const engine = Array.isArray(engineList) ? engineList[0] : null
  const hours = raw.hours ?? engine?.Hours ?? 0
  const engineDetails = [engine?.Make, engine?.Model, engine?.HP ? `${engine.HP}HP` : null]
    .filter(Boolean)
    .join(' ')

  const stateAbbr = STATE_ABBR[raw.State] ?? raw.State ?? ''
  const location = [raw.City, stateAbbr].filter(Boolean).join(', ')

  const isCobrokerage = raw.ListingOwnerBrokerageID !== BYG_BROKERAGE_ID

  const status: Listing['status'] =
    raw.Status === 'Under Contract' ? 'under_contract' : 'available'

  const description = (raw.Summary ?? raw.Description ?? '')
    .replace(/<[^>]*>/g, '')
    .trim()

  return {
    id:             String(raw.ID),
    slug:           String(raw.ID),
    name:           raw.VesselName || [raw.Year, raw.Manufacturer, raw.Model].filter(Boolean).join(' '),
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
    engines:        Array.isArray(engineList) ? engineList : [],
    // Extended specs
    condition:            raw.Condition ?? '',
    category:             raw.Category ?? '',
    refit_year:           raw.RefitYear ?? null,
    hull_material:        raw.HullMaterial ?? '',
    hull_finish:          raw.HullFinish ?? '',
    draft_ft:             raw.MaximumDraftFeet ?? null,
    dry_weight:           raw.DryWeight ?? null,
    cruise_speed:         raw.CruiseSpeed ?? null,
    max_speed:            raw.MaximumSpeed ?? null,
    speed_unit:           raw.SpeedUnit ?? 'Knots',
    fuel_tank_gallons:    raw.FuelTankCapacityGallons ?? null,
    fresh_water_gallons:  raw.FreshWaterCapacityGallons ?? null,
    holding_tank_gallons: raw.HoldingTankCapacityGallons ?? null,
    engine_qty:           raw.EngineQty ?? null,
    sea_keeper:           raw.SeaKeeper ?? '',
    bow_thrusters:        raw.BowThrusters ?? '',
    stern_thrusters:      raw.SternThrusters ?? '',
    trailer:              raw.Trailer ?? '',
    ac:                   raw.AC ?? '',
    cabin_count:          raw.CabinCount ?? null,
    sleep_count:          raw.SleepCount ?? null,
    head_count:           raw.HeadCount ?? null,
    notable_upgrades:     raw.NotableUpgrades ?? '',
    price_headline:       raw.PriceHeadline ?? '',
    last_price_change:    raw.LastPriceChange ?? null,
    textblocks:           raw.Textblocks ?? [],
  }
}

// ── Supabase fallback ─────────────────────────────────────────────────────────

async function fetchFromSupabase(): Promise<Listing[]> {
  const { data } = await supabase
    .from('vessels')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as Listing[]
}
