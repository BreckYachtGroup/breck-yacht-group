export const dynamic = 'force-dynamic'

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

          {vessel.description && (
            <p className="text-gray-600 leading-relaxed mb-10">{vessel.description}</p>
          )}

          {/* Specs Grid */}
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0c1f3f' }}>Vessel Specifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 border border-gray-100 mb-10">
            {[
              // ── Identification ─────────────────────────────────────────────
              { label: 'Year',        value: vessel.year },
              { label: 'Make',        value: vessel.make },
              { label: 'Model',       value: vessel.model },
              { label: 'Condition',   value: vessel.condition || null },
              { label: 'Category',    value: vessel.category || null },
              { label: 'Refit Year',  value: vessel.refit_year || null },
              // ── Dimensions ────────────────────────────────────────────────
              { label: 'Length',      value: vessel.length_ft ? `${vessel.length_ft} ft` : null },
              { label: 'Beam',        value: vessel.beam_ft ? `${vessel.beam_ft} ft` : null },
              { label: 'Draft',       value: vessel.draft_ft ? `${vessel.draft_ft} ft` : null },
              { label: 'Dry Weight',  value: vessel.dry_weight ? `${Number(vessel.dry_weight).toLocaleString()} lbs` : null },
              // ── Hull ──────────────────────────────────────────────────────
              { label: 'Hull Material', value: vessel.hull_material || null },
              { label: 'Hull Color',    value: vessel.hull_finish || null },
              // ── Performance ───────────────────────────────────────────────
              { label: 'Fuel Type',     value: vessel.fuel_type || null },
              { label: 'Cruise Speed',  value: vessel.cruise_speed ? `${vessel.cruise_speed} ${vessel.speed_unit ?? 'Knots'}` : null },
              { label: 'Max Speed',     value: vessel.max_speed ? `${vessel.max_speed} ${vessel.speed_unit ?? 'Knots'}` : null },
              { label: 'Fuel Capacity', value: vessel.fuel_tank_gallons ? `${vessel.fuel_tank_gallons.toLocaleString()} gal` : null },
              { label: 'Fresh Water',   value: vessel.fresh_water_gallons ? `${vessel.fresh_water_gallons} gal` : null },
              { label: 'Holding Tank',  value: vessel.holding_tank_gallons ? `${vessel.holding_tank_gallons} gal` : null },
              // ── Engines ───────────────────────────────────────────────────
              (() => {
                const engList = vessel.engines ?? []
                // Build a readable engine description from structured fields
                const engDesc = (eng: typeof engList[0]) => {
                  const parts = [eng.Make, eng.Model, eng.HP && eng.HP > 0 ? `${eng.HP}HP` : null].filter(Boolean)
                  return parts.length > 0 ? parts.join(' ') : (vessel.engine_details || null)
                }
                if (engList.length > 1) {
                  const sampleDesc = engDesc(engList[0])
                  return [
                    { label: 'Engines', value: `${engList.length}× ${sampleDesc ?? ''}`.trim() || null },
                    ...engList.map((eng, i) => ({
                      label: `Engine ${i + 1} Hours`,
                      value: eng.Hours && Number(eng.Hours) > 0 ? Number(eng.Hours).toLocaleString() : null,
                    })),
                  ]
                }
                const single = engList[0]
                return [
                  { label: 'Engine', value: single ? engDesc(single) : (vessel.engine_details || null) },
                  { label: 'Engine Hours', value: vessel.hours && Number(vessel.hours) > 0 ? Number(vessel.hours).toLocaleString() : null },
                ]
              })().flat(),
              // ── Accommodations ────────────────────────────────────────────
              { label: 'Cabins',      value: vessel.cabin_count ?? null },
              { label: 'Sleeps',      value: vessel.sleep_count ?? null },
              { label: 'Heads',       value: vessel.head_count ?? null },
              // ── Features ──────────────────────────────────────────────────
              { label: 'SeaKeeper',      value: vessel.sea_keeper === 'Yes' ? 'Yes' : vessel.sea_keeper === 'No' ? null : null },
              { label: 'Bow Thruster',   value: vessel.bow_thrusters === 'Yes' ? 'Yes' : null },
              { label: 'Stern Thruster', value: vessel.stern_thrusters === 'Yes' ? 'Yes' : null },
              { label: 'Air Conditioning', value: vessel.ac === 'Yes' ? 'Yes' : null },
              { label: 'Trailer',        value: vessel.trailer || null },
              // ── Status ────────────────────────────────────────────────────
              { label: 'Status', value: vessel.status === 'under_contract' ? 'Under Contract' : 'Available' },
            ].filter(spec => spec.value !== null && spec.value !== undefined && spec.value !== '').map((spec) => (
              <div key={spec.label} className="border border-gray-100 px-5 py-4">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">{spec.label}</p>
                <p className="font-semibold text-sm" style={{ color: '#0c1f3f' }}>{String(spec.value)}</p>
              </div>
            ))}
          </div>

          {/* Notable Upgrades */}
          {vessel.notable_upgrades && (
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#0c1f3f' }}>Notable Upgrades</h2>
              <p className="text-gray-600 leading-relaxed">{vessel.notable_upgrades}</p>
            </div>
          )}

          {/* Videos */}
          {vessel.videos && vessel.videos.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-6" style={{ color: '#0c1f3f' }}>Video</h2>
              <div className="space-y-6">
                {vessel.videos.map((vid, i) => {
                  // Handle plain 11-char YouTube ID (e.g. "dQw4w9WgXcQ") OR full URL
                  const ytId = /^[a-zA-Z0-9_-]{11}$/.test(vid.URL)
                    ? vid.URL
                    : vid.URL.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]
                  if (!ytId) return null
                  return (
                    <div key={i}>
                      {vid.Title && (
                        <p className="text-sm font-semibold mb-2 text-gray-500 uppercase tracking-widest">{vid.Title}</p>
                      )}
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute inset-0 w-full h-full rounded"
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={vid.Title || 'Vessel Video'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Textblocks — detailed equipment/spec sections from the listing broker */}
          {vessel.textblocks && vessel.textblocks.length > 0 && (
            <div className="space-y-8">
              {vessel.textblocks
                .filter(block =>
                  block.Description &&
                  // Strip Yachtr.com and similar MLS attribution blocks
                  !block.Description.toLowerCase().includes('yachtr.com') &&
                  !block.Description.toLowerCase().includes('listing mls')
                )
                .map((block, i) => (
                  <div key={i}>
                    {block.Title && (
                      <h2 className="text-xl font-bold mb-4" style={{ color: '#0c1f3f' }}>{block.Title}</h2>
                    )}
                    <div
                      className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: block.Description }}
                    />
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Right: Price + Contact */}
        <div>
          <div className="sticky top-24 border border-gray-100 p-8 shadow-sm">
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Asking Price</p>
            <p className="text-4xl font-bold mb-6" style={{ color: '#0c1f3f' }}>
              {vessel.price ? `$${vessel.price.toLocaleString()}` : 'Call for Price'}
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
