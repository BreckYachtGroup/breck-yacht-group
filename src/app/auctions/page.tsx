'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NewsletterSignup from '@/components/NewsletterSignup'

type Auction = {
  id: string; slug: string; title: string; make: string; model: string
  year: number; length_ft: number; location: string; images: string[]
  status: string; starts_at: string; ends_at: string
  starting_bid: number; current_bid: number; bid_count: number
}

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(endsAt: string) {
  const [diff, setDiff] = useState(new Date(endsAt).getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => setDiff(new Date(endsAt).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true }
  const s = Math.floor(diff / 1000)
  return {
    days:    Math.floor(s / 86400),
    hours:   Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    ended:   false,
  }
}

// ── Countdown display ─────────────────────────────────────────────────────────
function Countdown({ endsAt }: { endsAt: string }) {
  const { days, hours, minutes, seconds, ended } = useCountdown(endsAt)

  if (ended) return (
    <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">Auction Ended</span>
  )

  return (
    <div className="flex gap-3 text-center">
      {[['d', days], ['h', hours], ['m', minutes], ['s', seconds]].map(([label, val]) => (
        <div key={label as string}>
          <div className="text-lg font-bold tabular-nums" style={{ color: '#c9a84c' }}>
            {String(val).padStart(2, '0')}
          </div>
          <div className="text-xs text-white/40 uppercase tracking-wider">{label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/auctions')
      .then(r => r.json())
      .then(d => { setAuctions(d.auctions ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const active = auctions.filter(a => a.status === 'active')
  const ended  = auctions.filter(a => a.status !== 'active')

  return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen text-white">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-24 text-center">
        <p className="text-xs tracking-[0.5em] uppercase mb-3" style={{ color: '#c9a84c' }}>
          Breck Yacht Group
        </p>
        <h1 className="text-5xl font-bold tracking-tight mb-4">Auction House</h1>
        <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
          Transparent, timed auctions on verified luxury performance vessels.
          No reserve. No games. Just the market.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="h-64 bg-gray-800" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                  <div className="h-5 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : active.length === 0 && ended.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-white/30 text-xl mb-2">No auctions listed yet.</p>
            <p className="text-white/20 text-sm">Check back soon.</p>
          </div>
        ) : (
          <>
            {/* Active auctions */}
            {active.length > 0 && (
              <section className="mb-16">
                <h2 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-8">
                  Live Auctions — {active.length} listing{active.length !== 1 ? 's' : ''}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {active.map(a => (
                    <AuctionCard key={a.id} auction={a} />
                  ))}
                </div>
              </section>
            )}

            {/* Ended auctions */}
            {ended.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-[0.3em] text-white/30 mb-8">
                  Ended
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 opacity-60">
                  {ended.map(a => (
                    <AuctionCard key={a.id} auction={a} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Newsletter signup */}
      <div style={{ backgroundColor: '#0c1f3f', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-xl mx-auto px-8 py-16">
          <NewsletterSignup />
        </div>
      </div>

    </div>
  )
}

// ── Auction card ──────────────────────────────────────────────────────────────
function AuctionCard({ auction }: { auction: Auction }) {
  return (
    <Link
      href={`/auctions/${auction.slug}`}
      className="group block hover:opacity-90 transition-opacity"
      style={{ backgroundColor: '#111' }}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        {auction.images?.[0] ? (
          <img
            src={auction.images[0]}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#0c1f3f' }}>
            <span className="text-white/20 text-sm tracking-widest uppercase">No Photo</span>
          </div>
        )}

        {/* Status badge */}
        {auction.status === 'active' && (
          <span className="absolute top-3 left-3 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
            Live
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#c9a84c' }}>
          {auction.year} {auction.make} {auction.model}
          {auction.length_ft ? ` · ${auction.length_ft}ft` : ''}
        </p>
        <h3 className="text-lg font-bold text-white mb-1">{auction.title}</h3>
        <p className="text-white/40 text-sm mb-5">{auction.location}</p>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-1">
              {auction.bid_count > 0 ? 'Current Bid' : 'Starting Bid'}
            </p>
            <p className="text-2xl font-bold" style={{ color: '#c9a84c' }}>
              ${(auction.current_bid || auction.starting_bid).toLocaleString()}
            </p>
            {auction.bid_count > 0 && (
              <p className="text-xs text-white/30 mt-0.5">{auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}</p>
            )}
          </div>

          {auction.status === 'active' && (
            <div className="text-right">
              <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Ends in</p>
              <Countdown endsAt={auction.ends_at} />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
