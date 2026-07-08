'use client'

/**
 * /auctions/admin/[slug]/preview
 * Admin-only preview of a draft listing — shows exactly what the public page
 * will look like with a "DRAFT PREVIEW" banner across the top.
 */

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Listing = {
  id: string; slug: string; title: string; description: string
  make: string; model: string; year: number; length_ft: number | null
  location: string; status: string; condition: string; hours: number | null
  images: string[]; starting_bid: number; reserve_price: number | null
  starts_at: string; ends_at: string
}

export default function PreviewPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const [listing, setListing] = useState<Listing | null>(null)
  const [error,   setError]   = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user.email !== 'austin@breckyachtgroup.com') {
        router.replace('/'); return
      }
      const res = await fetch(`/api/auctions/admin/listings/${slug}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { setError('Listing not found'); return }
      const d = await res.json()
      setListing(d.auction)
    })
  }, [router, slug])

  if (error) return (
    <div style={{ backgroundColor: '#0a0a0a' }} className="min-h-screen flex items-center justify-center">
      <p className="text-red-400">{error}</p>
    </div>
  )

  if (!listing) return (
    <div style={{ backgroundColor: '#0a0a0a' }} className="min-h-screen flex items-center justify-center">
      <p className="text-white/30 text-sm tracking-widest uppercase animate-pulse">Loading preview…</p>
    </div>
  )

  function fmt(n: number) { return '$' + n.toLocaleString() }

  return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen text-white">

      {/* Draft preview banner */}
      <div className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: '#7a4a00', borderBottom: '1px solid #c9a84c40' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#c9a84c' }}>
            ⚠ Draft Preview
          </span>
          <span className="text-xs text-white/50">This listing is not yet visible to the public.</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/auctions/admin/${slug}/edit`}
            className="text-xs px-3 py-1 rounded font-bold uppercase tracking-wider"
            style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
            Edit Draft
          </Link>
          <Link href="/auctions/admin"
            className="text-xs text-white/40 hover:text-white/70 transition-colors">
            ← Admin
          </Link>
        </div>
      </div>

      {/* Hero image */}
      <div className="relative h-[55vh] min-h-[400px] overflow-hidden">
        {listing.images?.[0] ? (
          <img src={listing.images[0]} alt={listing.title}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: '#0c1f3f' }}>
            <span className="text-white/20 text-sm tracking-widest uppercase">No Photos Yet</span>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,12,12,0.85) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>
            {listing.year} {listing.make} {listing.model}
            {listing.length_ft ? ` · ${listing.length_ft}ft` : ''}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">{listing.title}</h1>
          <p className="text-white/50 text-sm">{listing.location}</p>
        </div>
      </div>

      {/* Image strip */}
      {listing.images?.length > 1 && (
        <div className="flex gap-2 px-8 py-4 overflow-x-auto">
          {listing.images.slice(1).map((img, i) => (
            <img key={i} src={img} alt={`Photo ${i + 2}`}
              className="h-20 w-32 object-cover flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
          ))}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">About This Vessel</h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-line">
              {listing.description || 'No description yet.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ['Year', listing.year],
              ['Make', listing.make],
              ['Model', listing.model],
              ['Length', listing.length_ft ? `${listing.length_ft}ft` : '—'],
              ['Condition', listing.condition || '—'],
              ['Hours', listing.hours ? listing.hours.toLocaleString() : '—'],
            ].map(([k, v]) => (
              <div key={String(k)} className="p-4 border border-white/10">
                <p className="text-xs uppercase tracking-wider text-white/30 mb-1">{k}</p>
                <p className="text-sm font-semibold text-white capitalize">{String(v)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bid panel */}
        <div className="space-y-4">
          <div className="p-6 border border-white/10" style={{ backgroundColor: '#111' }}>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Starting Bid</p>
            <p className="text-3xl font-bold mb-4" style={{ color: '#c9a84c' }}>
              {fmt(listing.starting_bid)}
            </p>
            {listing.reserve_price && (
              <p className="text-xs text-white/30 mb-4">Reserve: {fmt(listing.reserve_price)} (hidden from bidders)</p>
            )}
            <div className="border border-white/10 rounded p-3 text-center text-xs text-white/30">
              Bidding opens when auction goes live
            </div>
          </div>

          <div className="p-4 border border-white/10 text-xs text-white/40 space-y-2">
            <div className="flex justify-between">
              <span>Auction Status</span>
              <span className="capitalize font-semibold" style={{ color: '#c9a84c' }}>{listing.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Starts</span>
              <span>{new Date(listing.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span>Ends</span>
              <span>{new Date(listing.ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
