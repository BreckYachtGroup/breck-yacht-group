export const dynamic = 'force-dynamic'

import { getAllListings, type Listing } from '@/lib/listings'
import InventorySearch from '@/components/InventorySearch'

async function getVessels(): Promise<Listing[]> {
  return getAllListings()
}

export default async function InventoryPage() {
  const vessels = await getVessels()

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      {/* Header */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Browse</p>
        <h1 className="text-4xl font-bold">Current Inventory</h1>
      </div>

      {/* Search + Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <InventorySearch vessels={vessels} />
      </div>
    </div>
  )
}
