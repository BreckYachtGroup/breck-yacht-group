import Link from 'next/link'
import { getAllListings, type Listing } from '@/lib/listings'

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

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {vessels.length === 0 ? (
          <p className="text-center text-gray-400 py-20 text-lg">No vessels currently listed. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vessels.map((vessel) => (
              <Link
                key={vessel.id}
                href={`/inventory/${vessel.slug}`}
                className="group block bg-white shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Image */}
                <div className="relative overflow-hidden h-60">
                  {vessel.images?.[0] ? (
                    <img
                      src={vessel.images[0]}
                      alt={vessel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#0c1f3f' }}>
                      <span className="text-white/30 text-sm tracking-widest uppercase">No Photo</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  {vessel.status !== 'available' && (
                    <span className="absolute top-3 right-3 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
                      style={{ backgroundColor: vessel.status === 'sold' ? '#991b1b' : '#92400e' }}>
                      {vessel.status === 'under_contract' ? 'Under Contract' : 'Sold'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-6">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#c9a84c' }}>
                    {vessel.year} {vessel.make} · {vessel.length_ft}ft
                  </p>
                  <h2 className="text-xl font-bold mb-1" style={{ color: '#0c1f3f' }}>{vessel.name}</h2>
                  <p className="text-gray-400 text-sm mb-4">{vessel.location}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold" style={{ color: '#0c1f3f' }}>
                      ${vessel.price.toLocaleString()}
                    </p>
                    <span className="text-xs tracking-widest uppercase text-gray-400">
                      {vessel.hours?.toLocaleString()} hrs
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
