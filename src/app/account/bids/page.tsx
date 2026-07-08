'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

type AuctionBid = {
  id: string; slug: string; title: string; make: string; model: string
  year: number; images: string[]; status: string; ends_at: string
  current_bid: number; bid_count: number
  myBid: number; bidAt: string; isWinning: boolean
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BidHistoryPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const [auctions, setAuctions] = useState<AuctionBid[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) { router.push('/account/login'); return }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/account/bids', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then(r => r.json())
        .then(d => { setAuctions(d.auctions ?? []); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [user]) // eslint-disable-line

  const active = auctions.filter(a => a.status === 'active')
  const ended  = auctions.filter(a => a.status !== 'active')

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>My Account</p>
        <h1 className="text-4xl font-bold">Bid History</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/account/profile" className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
            ← Back to Profile
          </Link>
          <Link href="/auctions" className="text-xs uppercase tracking-wider font-semibold"
            style={{ color: '#0c1f3f' }}>
            Browse Auctions →
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm animate-pulse text-center py-16">Loading…</p>
        ) : auctions.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <p className="text-gray-400 text-lg">You haven't placed any bids yet.</p>
            <Link href="/auctions"
              className="inline-block px-6 py-3 text-sm font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: '#0c1f3f' }}>
              Browse Live Auctions
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Live Auctions</h2>
                <div className="space-y-3">
                  {active.map(a => <BidRow key={a.id} a={a} />)}
                </div>
              </section>
            )}
            {ended.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Ended</h2>
                <div className="space-y-3 opacity-70">
                  {ended.map(a => <BidRow key={a.id} a={a} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function BidRow({ a }: { a: AuctionBid }) {
  const isActive = a.status === 'active'
  const won      = a.status === 'sold' && a.isWinning

  return (
    <Link href={`/auctions/${a.slug}`}
      className="flex gap-4 items-center bg-white shadow-sm hover:shadow-md transition-shadow p-4">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-24 h-16 overflow-hidden bg-gray-100">
        {a.images?.[0]
          ? <img src={a.images[0]} alt={a.title} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Photo</div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: '#c9a84c' }}>
          {a.year} {a.make} {a.model}
        </p>
        <p className="font-semibold text-gray-900 truncate">{a.title}</p>
        <p className="text-gray-400 text-xs">Your bid: <span className="font-semibold text-gray-700">${a.myBid.toLocaleString()}</span> · {fmtDate(a.bidAt)}</p>
      </div>

      {/* Status */}
      <div className="flex-shrink-0 text-right space-y-1">
        <p className="font-bold text-lg" style={{ color: '#0c1f3f' }}>
          ${a.current_bid.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400">Current bid · {a.bid_count} total</p>
        {won && (
          <span className="text-xs font-bold px-2 py-0.5 inline-block"
            style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>Won</span>
        )}
        {isActive && a.isWinning && (
          <span className="text-xs font-semibold text-green-600">✓ High bidder</span>
        )}
        {isActive && !a.isWinning && (
          <span className="text-xs font-semibold text-red-500">Outbid</span>
        )}
        {!isActive && !won && (
          <span className="text-xs text-gray-400">{a.status === 'sold' ? 'Lost' : 'Ended'}</span>
        )}
      </div>
    </Link>
  )
}
