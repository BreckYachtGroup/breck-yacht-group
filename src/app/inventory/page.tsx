import { Suspense } from 'react'
import InventorySearch from '@/components/InventorySearch'

export default function InventoryPage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Browse</p>
        <h1 className="text-4xl font-bold">Current Inventory</h1>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
          <InventorySearch />
        </Suspense>
      </div>
    </div>
  )
}
