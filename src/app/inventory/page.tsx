export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import type { Metadata } from 'next'
import InventorySearch from '@/components/InventorySearch'
import { getPaginatedListings } from '@/lib/listings'

export const metadata: Metadata = {
  title: 'Inventory | Breck Yacht Group',
  description: 'Browse luxury center consoles and sportfish yachts for sale, including exclusive Breck Yacht Group listings and co-brokerage inventory.',
  alternates: {
    canonical: '/inventory',
  },
}

// Filter query params InventorySearch reads from the URL — kept in one place
// so the server-rendered first fetch and the client component stay in sync.
const FILTER_KEYS = [
  'keyword', 'make', 'model', 'condition', 'boatType', 'fuelType',
  'minYear', 'maxYear', 'minLength', 'maxLength', 'minPrice', 'maxPrice',
  'region', 'country', 'state', 'city',
] as const

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const showOwn = sp.tab !== 'all'

  // Render the same default (or deep-linked) result set server-side that the
  // client component would otherwise fetch after mount. This gives Googlebot
  // real <a href> links to individual listings in the raw page HTML instead
  // of an empty shell — the client component takes over from here for any
  // further filtering/pagination.
  const params = new URLSearchParams()
  params.set('page', '1')
  if (showOwn) params.set('bygOnly', 'true')
  for (const key of FILTER_KEYS) {
    const value = sp[key]
    if (typeof value === 'string' && value) params.set(key, value)
  }
  const initialData = await getPaginatedListings(params)

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Browse</p>
        <h1 className="text-4xl font-bold">Current Inventory</h1>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
          <InventorySearch initialData={initialData} />
        </Suspense>
      </div>
    </div>
  )
}
