import { getListingBySlug, type Listing } from '@/lib/listings'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import InquiryForm from '@/components/InquiryForm'
import VesselGallery from '@/components/VesselGallery'
import type { Metadata } from 'next'

async function getVessel(slug: string): Promise<Listing | null> {
  return getListingBySlug(slug)
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const vessel = await getVessel(id)
  if (!vessel) return {}

  return {
    title: `${vessel.year} ${vessel.name} for Sale | Breck Yacht Group`,
    description: `${vessel.year} ${vessel.make} ${vessel.model}, ${vessel.length_ft}ft${vessel.hours ? `, ${vessel.hours.toLocaleString()} hours` : ''}. Located in ${vessel.location}. Asking $${vessel.price.toLocaleString()}. Contact Breck Yacht Group in Palm Beach, FL.`,
    openGraph: {
      title: `${vessel.year} ${vessel.name} for Sale`,
      description: `${vessel.year} ${vessel.make} ${vessel.model} — $${vessel.price.toLocaleString()} — ${vessel.location}`,
      images: vessel.images?.[0] ? [vessel.images[0]] : [],
    },
  }
}

export default async function VesselDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vessel = await getVessel(id)

  if (!vessel) notFound()

  return (
    <div className="bg-white min-h-screen">
      {/* Image Gallery */}
      <VesselGallery images={vessel.images ?? []} name={vessel.name} />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Details */}
        <div className="lg:col-span-2">
          <Link href="/inventory" className="text-xs tracking-widest uppercase text-gray-400 hover:text-gray-600 mb-6 inline-block">
            ← Back to Inventory
          </Link>
          <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>
            {vessel.year} {vessel.make} {vessel.model}
          </p>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#0c1f3f' }}>{vessel.name}</h1>
          <p className="text-gray-400 mb-8">{vessel.location}</p>

          <p className="text-gray-600 leading-relaxed mb-10">{vessel.description}</p>

          {/* Specs Grid */}
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0c1f3f' }}>Vessel Specifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 border border-gray-100">
            {[
              { label: 'Year', value: vessel.year },
              { label: 'Make', value: vessel.make },
              { label: 'Model', value: vessel.model },
              { label: 'Length', value: `${vessel.length_ft} ft` },
              { label: 'Beam', value: `${vessel.beam_ft} ft` },
              { label: 'Fuel Type', value: vessel.fuel_type },
              { label: 'Engine', value: vessel.engine_details },
              { label: 'Status', value: vessel.status === 'under_contract' ? 'Under Contract' : vessel.status.charAt(0).toUpperCase() + vessel.status.slice(1) },
            ].map((spec) => (
              <div key={spec.label} className="border border-gray-100 px-5 py-4">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">{spec.label}</p>
                <p className="font-semibold text-sm" style={{ color: '#0c1f3f' }}>{spec.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Price + Contact */}
        <div>
          <div className="sticky top-24 border border-gray-100 p-8 shadow-sm">
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Asking Price</p>
            <p className="text-4xl font-bold mb-6" style={{ color: '#0c1f3f' }}>
              ${vessel.price.toLocaleString()}
            </p>

            <p className="text-sm font-semibold tracking-wider uppercase mb-4" style={{ color: '#0c1f3f' }}>
              Inquire About This Vessel
            </p>
            <InquiryForm vesselName={`${vessel.year} ${vessel.name}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
