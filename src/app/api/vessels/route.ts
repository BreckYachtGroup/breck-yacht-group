/**
 * /api/vessels — Paginated vessel search endpoint.
 *
 * Accepts filter params and passes them to the Vultr proxy,
 * which forwards them to YachtBroker.org for server-side filtering.
 * This means searches work across ALL 8,000+ listings, not just loaded ones.
 *
 * Rate limiting: middleware.ts handles the primary per-IP limit.
 * This route adds a secondary hard cap as a belt-and-suspenders measure.
 */

import { NextRequest } from 'next/server'
import { normalizeYachtBrokerListing, type Listing } from '@/lib/listings'

const PROXY_URL = process.env.PROXY_URL ?? 'http://207.246.72.35:3001'

// Secondary rate limit — stricter than the global middleware limit.
// Inventory pagination is expensive; cap at 30 requests/min per IP.
const RL_WINDOW_MS  = 60_000
const RL_MAX        = 30
const rlStore       = new Map<string, { count: number; windowStart: number }>()

function checkRL(ip: string): boolean {
  const now   = Date.now()
  const entry = rlStore.get(ip)
  if (!entry || now - entry.windowStart > RL_WINDOW_MS) {
    rlStore.set(ip, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= RL_MAX) return false
  entry.count++
  return true
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRL(ip)) {
    return Response.json({ error: 'Too many requests', listings: [], total: 0, lastPage: 1, currentPage: 1 }, { status: 429 })
  }
  const { searchParams } = new URL(request.url)

  // Build proxy query string with all supported filter params
  const params = new URLSearchParams()
  params.set('page', searchParams.get('page') || '1')
  if (searchParams.get('make'))      params.set('make',      searchParams.get('make')!)
  if (searchParams.get('model'))     params.set('model',     searchParams.get('model')!)
  if (searchParams.get('state'))     params.set('state',     searchParams.get('state')!)
  if (searchParams.get('fuelType'))  params.set('fuelType',  searchParams.get('fuelType')!)
  if (searchParams.get('boatType'))  params.set('boatType',  searchParams.get('boatType')!)
  if (searchParams.get('minPrice'))  params.set('minPrice',  searchParams.get('minPrice')!)
  if (searchParams.get('maxPrice'))  params.set('maxPrice',  searchParams.get('maxPrice')!)
  if (searchParams.get('minYear'))   params.set('minYear',   searchParams.get('minYear')!)
  if (searchParams.get('maxYear'))   params.set('maxYear',   searchParams.get('maxYear')!)
  if (searchParams.get('minLength')) params.set('minLength', searchParams.get('minLength')!)
  if (searchParams.get('maxLength')) params.set('maxLength', searchParams.get('maxLength')!)
  if (searchParams.get('bygOnly') === 'true') params.set('bygOnly', 'true')
  if (searchParams.get('keyword')) params.set('keyword', searchParams.get('keyword')!)

  try {
    const res = await fetch(`${PROXY_URL}/listings?${params.toString()}`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Proxy returned ${res.status}`)

    const data = await res.json()
    const listings: Listing[] = (data['V-Data'] ?? []).map(normalizeYachtBrokerListing)

    return Response.json({
      listings,
      total: data.total ?? 0,
      lastPage: data.last_page ?? 1,
      currentPage: Number(searchParams.get('page') || '1'),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: message, listings: [], total: 0, lastPage: 1, currentPage: 1 },
      { status: 500 }
    )
  }
}
