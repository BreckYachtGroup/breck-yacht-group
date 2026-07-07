'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

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
  const { user }   = useAuth()
  const router     = useRouter()
  const [auctions,  setAuctions]  = useState<Auction[]>([])
  const [loading,   setLoading]   = useState(true)
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/auctions')
      .then(r => r.json())
      .then(d => { setAuctions(d.auctions ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Fetch user's watchlist once auctions are loaded
  useEffect(() => {
    if (!user || auctions.length === 0) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      Promise.all(
        auctions.map(a =>
          fetch(`/api/auctions/${a.slug}/watch`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).then(r => r.json()).then(d => d.watching ? a.id : null)
        )
      ).then(results => {
        setWatchlist(new Set(results.filter(Boolean) as string[]))
      }).catch(() => {})
    })
  }, [user, auctions])

  const toggleWatch = useCallback(async (auction: Auction, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { router.push('/account/login'); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const isWatching = watchlist.has(auction.id)
    // Optimistic update
    setWatchlist(prev => {
      const next = new Set(prev)
      isWatching ? next.delete(auction.id) : next.add(auction.id)
      return next
    })
    await fetch(`/api/auctions/${auction.slug}/watch`, {
      method: isWatching ? 'DELETE' : 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {
      // Revert on error
      setWatchlist(prev => {
        const next = new Set(prev)
        isWatching ? next.add(auction.id) : next.delete(auction.id)
        return next
      })
    })
  }, [user, watchlist, router])

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
            {active.length > 0 && (
              <section className="mb-16">
                <h2 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-8">
                  Live Auctions — {active.length} listing{active.length !== 1 ? 's' : ''}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {active.map(a => (
                    <AuctionCard key={a.id} auction={a}
                      watching={watchlist.has(a.id)}
                      onWatch={e => toggleWatch(a, e)} />
                  ))}
                </div>
              </section>
            )}

            {ended.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-[0.3em] text-white/30 mb-8">Ended</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 opacity-60">
                  {ended.map(a => (
                    <AuctionCard key={a.id} auction={a}
                      watching={watchlist.has(a.id)}
                      onWatch={e => toggleWatch(a, e)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

    </div>
  )
}

// ── Auction card ──────────────────────────────────────────────────────────────
function AuctionCard({ auction, watching, onWatch }: {
  auction: Auction
  watching: boolean
  onWatch: (e: React.MouseEvent) => void
}) {
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
          <span className="absolute top-3 left-3 px-2 py-1 text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
            Live
          </span>
        )}

        {/* Watch button */}
        <button
          onClick={onWatch}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full transition-all"
          style={{
            backgroundColor: watching ? 'rgba(201,168,76,0.9)' : 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
          }}
          aria-label={watching ? 'Remove from watchlist' : 'Add to watchlist'}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={watching ? '#0c1f3f' : 'none'} viewBox="0 0 24 24" stroke={watching ? '#0c1f3f' : 'white'} strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
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
