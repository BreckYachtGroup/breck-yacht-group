/**
 * /api/vessels — Server-side API route for paginated inventory.
 *
 * Called by the InventorySearch client component.
 * Fetches one page of listings from the Vultr proxy and normalizes them.
 * Next.js caches each page response for 60 seconds.
 */

import { normalizeYachtBrokerListing, type Listing } from '@/lib/listings'

const PROXY_URL = process.env.PROXY_URL ?? 'http://207.246.72.35:3001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') || '1'

  try {
    const res = await fetch(`${PROXY_URL}/listings?page=${page}`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) throw new Error(`Proxy returned ${res.status}`)

    const data = await res.json()
    const listings: Listing[] = (data['V-Data'] ?? []).map(normalizeYachtBrokerListing)

    return Response.json({
      listings,
      total: data.total ?? 0,
      lastPage: data.last_page ?? 1,
      currentPage: Number(page),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: message, listings: [], total: 0, lastPage: 1, currentPage: 1 },
      { status: 500 }
    )
  }
}
