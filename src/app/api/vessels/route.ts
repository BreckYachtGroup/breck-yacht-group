/**
 * /api/vessels — Paginated vessel search endpoint.
 *
 * Accepts filter params and passes them to the Vultr proxy,
 * which forwards them to YachtBroker.org for server-side filtering.
 * This means searches work across ALL 8,000+ listings, not just loaded ones.
 */

import { normalizeYachtBrokerListing, type Listing } from '@/lib/listings'

const PROXY_URL = process.env.PROXY_URL ?? 'http://207.246.72.35:3001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // Build proxy query string with all supported filter params
  const params = new URLSearchParams()
  params.set('page', searchParams.get('page') || '1')
  if (searchParams.get('make'))      params.set('make',      searchParams.get('make')!)
  if (searchParams.get('minPrice'))  params.set('minPrice',  searchParams.get('minPrice')!)
  if (searchParams.get('maxPrice'))  params.set('maxPrice',  searchParams.get('maxPrice')!)
  if (searchParams.get('minYear'))   params.set('minYear',   searchParams.get('minYear')!)
  if (searchParams.get('maxYear'))   params.set('maxYear',   searchParams.get('maxYear')!)
  if (searchParams.get('minLength')) params.set('minLength', searchParams.get('minLength')!)
  if (searchParams.get('maxLength')) params.set('maxLength', searchParams.get('maxLength')!)
  if (searchParams.get('keyword'))   params.set('keyword',   searchParams.get('keyword')!)

  try {
    const res = await fetch(`${PROXY_URL}/listings?${params.toString()}`, {
      next: { revalidate: 60 },
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
