'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/context/AuthContext'

// ── Types ─────────────────────────────────────────────────────────────────────
type Auction = {
  id: string; slug: string; title: string; make: string; model: string
  year: number; length_ft: number; location: string; images: string[]
  description: string; condition: string; hours: number; vin: string
  status: string; starts_at: string; ends_at: string
  starting_bid: number; reserve_price: number | null
  current_bid: number; current_bidder_id: string | null; bid_count: number
  extended_count: number
}
type Bid = { id: string; amount: number; created_at: string; bidder_id: string }

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(endsAt: string) {
  const [diff, setDiff] = useState(new Date(endsAt).getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => setDiff(new Date(endsAt).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true, urgent: false }
  const s = Math.floor(diff / 1000)
  return {
    days:    Math.floor(s / 86400),
    hours:   Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    ended:   false,
    urgent:  diff < 5 * 60 * 1000, // last 5 min = anti-snipe zone
  }
}

// ── Format helpers ────────────────────────────────────────────────────────────
function fmt(n: number) { return '$' + n.toLocaleString() }
function maskBidder(id: string) { return id.slice(0, 4) + '…' + id.slice(-4) }
function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60)  return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuctionDetailPage() {
  const { slug }   = useParams<{ slug: string }>()
  const { user }   = useAuth()
  const router     = useRouter()
  const supabase   = createClientComponentClient()

  const [auction,    setAuction]    = useState<Auction | null>(null)
  const [bids,       setBids]       = useState<Bid[]>([])
  const [loading,    setLoading]    = useState(true)
  const [imgIdx,     setImgIdx]     = useState(0)
  const [bidAmount,  setBidAmount]  = useState('')
  const [bidError,   setBidError]   = useState('')
  const [bidSuccess, setBidSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // ── Fetch auction + bids ───────────────────────────────────────────────────
  const fetchAuction = useCallback(async () => {
    const res = await fetch(`/api/auctions/${slug}`)
    if (!res.ok) { setLoading(false); return }
    const d = await res.json()
    setAuction(d.auction)
    setBids(d.bids ?? [])
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchAuction() }, [fetchAuction])

  // ── Supabase Realtime: live bid updates ────────────────────────────────────
  useEffect(() => {
    if (!auction) return

    const channel = supabase
      .channel(`auction-${auction.id}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'auction_listings',
          filter: `id=eq.${auction.id}`,
        },
        (payload) => {
          // Update auction state with new bid/timer values
          setAuction(prev => prev ? { ...prev, ...payload.new as Partial<Auction> } : prev)
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'auction_bids',
          filter: `auction_id=eq.${auction.id}`,
        },
        (payload) => {
          setBids(prev => [payload.new as Bid, ...prev].slice(0, 50))
        }
      )
      .subscribe()

    realtimeRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [auction?.id, supabase])

  // ── Place bid ──────────────────────────────────────────────────────────────
  async function handleBid(e: React.FormEvent) {
    e.preventDefault()
    setBidError(''); setBidSuccess('')

    if (!user) { router.push('/account/login'); return }

    const amount = Number(bidAmount.replace(/[^0-9.]/g, ''))
    if (!amount || isNaN(amount)) { setBidError('Enter a valid bid amount.'); return }

    setSubmitting(true)

    // Get fresh session token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setBidError('Please sign in again.'); setSubmitting(false); return }

    const res = await fetch(`/api/auctions/${slug}/bid`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ amount }),
    })

    const d = await res.json()
    setSubmitting(false)

    if (!res.ok) { setBidError(d.error ?? 'Bid failed. Please try again.'); return }

    setBidSuccess(`Bid of ${fmt(amount)} placed!`)
    setBidAmount('')
    // Realtime will update the UI, but also re-fetch to be safe
    fetchAuction()
  }

  // ── Loading / 404 ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen flex items-center justify-center">
      <div className="text-white/30 text-sm tracking-widest uppercase animate-pulse">Loading…</div>
    </div>
  )

  if (!auction) return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/40 text-xl mb-3">Auction not found.</p>
        <a href="/auctions" className="text-sm underline" style={{ color: '#c9a84c' }}>← All Auctions</a>
      </div>
    </div>
  )

  const images   = auction.images ?? []
  const minBid   = Math.max(auction.starting_bid, auction.current_bid + 100)
  const isActive = auction.status === 'active'
  const isWinner = user?.id === auction.current_bidder_id

  return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen text-white">

      {/* ── Back link ─────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="px-6 py-4">
        <a href="/auctions" className="text-sm text-white/40 hover:text-white transition-colors">
          ← All Auctions
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">

          {/* ── Left: image gallery + details ──────────────────────────────── */}
          <div className="xl:col-span-3 space-y-8">

            {/* Gallery */}
            <div>
              <div className="relative" style={{ backgroundColor: '#0c1f3f' }}>
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[imgIdx]}
                      alt={`${auction.title} photo ${imgIdx + 1}`}
                      className="w-full object-cover"
                      style={{ maxHeight: '480px', objectFit: 'cover' }}
                    />
                    {/* Nav arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/80 transition-colors"
                          aria-label="Previous photo"
                        >‹</button>
                        <button
                          onClick={() => setImgIdx(i => (i + 1) % images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/80 transition-colors"
                          aria-label="Next photo"
                        >›</button>
                        <div className="absolute bottom-3 right-3 bg-black/60 text-white/70 text-xs px-2 py-1">
                          {imgIdx + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <span className="text-white/20 tracking-widest uppercase text-sm">No Photos</span>
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className="flex-shrink-0 w-20 h-14 overflow-hidden transition-opacity"
                      style={{ opacity: i === imgIdx ? 1 : 0.4 }}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title + headline specs */}
            <div>
              <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>
                {auction.year} {auction.make} {auction.model}
                {auction.length_ft ? ` · ${auction.length_ft}ft` : ''}
              </p>
              <h1 className="text-3xl font-bold mb-2">{auction.title}</h1>
              <p className="text-white/40 text-sm">{auction.location}</p>
            </div>

            {/* Vessel specs table */}
            <div>
              <h2 className="text-xs tracking-widest uppercase text-white/30 mb-4">Vessel Details</h2>
              <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: '#222' }}>
                {[
                  ['Make',       auction.make],
                  ['Model',      auction.model],
                  ['Year',       auction.year],
                  ['Length',     auction.length_ft ? `${auction.length_ft} ft` : '—'],
                  ['Condition',  auction.condition],
                  ['Engine Hours', auction.hours != null ? auction.hours.toLocaleString() : '—'],
                  ['HIN / VIN',  auction.vin || '—'],
                  ['Location',   auction.location],
                ].map(([label, val]) => (
                  <div key={label} className="p-4" style={{ backgroundColor: '#111' }}>
                    <p className="text-xs text-white/30 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-white font-medium">{val || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {auction.description && (
              <div>
                <h2 className="text-xs tracking-widest uppercase text-white/30 mb-4">About This Vessel</h2>
                <p className="text-white/70 leading-relaxed text-sm whitespace-pre-line">{auction.description}</p>
              </div>
            )}
          </div>

          {/* ── Right: bid panel ───────────────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Sticky bid box */}
            <div className="sticky top-6 space-y-5">

              {/* Timer */}
              {isActive && <CountdownBlock endsAt={auction.ends_at} />}
              {!isActive && (
                <div className="py-4 text-center" style={{ backgroundColor: '#1a1a1a' }}>
                  <span className="text-white/40 text-sm uppercase tracking-widest">
                    {auction.status === 'sold' ? 'Sold' : 'Auction Ended'}
                  </span>
                </div>
              )}

              {/* Current bid */}
              <div className="p-6" style={{ backgroundColor: '#111' }}>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">
                  {auction.bid_count > 0 ? 'Current Bid' : 'Starting Bid'}
                </p>
                <p className="text-4xl font-bold mb-1" style={{ color: '#c9a84c' }}>
                  {fmt(auction.current_bid || auction.starting_bid)}
                </p>
                {auction.bid_count > 0 && (
                  <p className="text-white/30 text-sm">{auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}</p>
                )}
                {isWinner && isActive && (
                  <p className="text-green-400 text-xs mt-2 font-semibold uppercase tracking-wider">
                    ✓ You are the highest bidder
                  </p>
                )}
              </div>

              {/* Bid form */}
              {isActive && (
                <div className="p-6" style={{ backgroundColor: '#111' }}>
                  {user ? (
                    <form onSubmit={handleBid} className="space-y-4">
                      <div>
                        <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                          Your Bid (min {fmt(minBid)})
                        </label>
                        <div className="flex">
                          <span className="flex items-center px-3 text-white/40 text-sm" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRight: 0 }}>
                            $
                          </span>
                          <input
                            type="number"
                            min={minBid}
                            step={100}
                            value={bidAmount}
                            onChange={e => { setBidAmount(e.target.value); setBidError(''); setBidSuccess('') }}
                            placeholder={minBid.toString()}
                            className="flex-1 px-4 py-3 text-white text-lg bg-transparent focus:outline-none"
                            style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                            required
                          />
                        </div>
                      </div>

                      {bidError   && <p className="text-red-400 text-sm">{bidError}</p>}
                      {bidSuccess && <p className="text-green-400 text-sm">{bidSuccess}</p>}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 text-sm font-bold uppercase tracking-wider transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}
                      >
                        {submitting ? 'Placing Bid…' : 'Place Bid'}
                      </button>

                      <p className="text-xs text-white/25 text-center leading-relaxed">
                        All bids are binding. By bidding you agree to complete the purchase if you win.
                        Bids within the last 5 minutes extend the auction by 5 minutes.
                      </p>
                    </form>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-white/50 text-sm">Sign in to place a bid</p>
                      <a
                        href="/account/login"
                        className="block py-3 text-sm font-bold uppercase tracking-wider text-center"
                        style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}
                      >
                        Sign In to Bid
                      </a>
                      <p className="text-white/30 text-xs">
                        No account?{' '}
                        <a href="/account/signup" className="underline" style={{ color: '#c9a84c' }}>
                          Register free
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bid history */}
              <div>
                <h3 className="text-xs tracking-widest uppercase text-white/30 mb-3">Bid History</h3>
                {bids.length === 0 ? (
                  <p className="text-white/20 text-sm text-center py-6">No bids yet — be the first!</p>
                ) : (
                  <div className="space-y-px">
                    {bids.map((b, i) => (
                      <div key={b.id} className="flex items-center justify-between px-4 py-3"
                        style={{ backgroundColor: i === 0 ? '#0f1d35' : '#111' }}>
                        <div>
                          <p className="text-white font-semibold">{fmt(b.amount)}</p>
                          <p className="text-white/30 text-xs">{maskBidder(b.bidder_id)}</p>
                        </div>
                        <p className="text-white/30 text-xs">{timeAgo(b.created_at)}</p>
                        {i === 0 && (
                          <span className="ml-3 text-xs px-2 py-0.5 font-bold uppercase"
                            style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
                            High
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Countdown block (larger display for detail page) ─────────────────────────
function CountdownBlock({ endsAt }: { endsAt: string }) {
  const { days, hours, minutes, seconds, ended, urgent } = useCountdown(endsAt)

  const goldColor = '#c9a84c'
  const urgentColor = '#ef4444'
  const timerColor = urgent ? urgentColor : goldColor

  if (ended) return (
    <div className="py-5 text-center" style={{ backgroundColor: '#1a1a1a' }}>
      <span className="text-red-400 font-semibold uppercase tracking-wider text-sm">Auction Ended</span>
    </div>
  )

  return (
    <div className="py-5 px-6" style={{ backgroundColor: urgent ? '#1a0a0a' : '#111' }}>
      <p className="text-xs text-white/30 uppercase tracking-widest mb-4 text-center">
        {urgent ? '⚡ Anti-snipe active — bids extend the timer' : 'Time Remaining'}
      </p>
      <div className="flex justify-center gap-6">
        {[['Days', days], ['Hrs', hours], ['Min', minutes], ['Sec', seconds]].map(([label, val]) => (
          <div key={label as string} className="text-center">
            <div className="text-4xl font-bold tabular-nums" style={{ color: timerColor }}>
              {String(val).padStart(2, '0')}
            </div>
            <div className="text-xs text-white/30 uppercase tracking-wider mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
