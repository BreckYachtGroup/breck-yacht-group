'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

type Auction = {
  id: string; slug: string; title: string; make: string; model: string
  year: number; length_ft: number; location: string; images: string[]
  status: string; ends_at: string; starting_bid: number
  current_bid: number; bid_count: number
}

function useCountdown(endsAt: string) {
  const [diff, setDiff] = useState(new Date(endsAt).getTime() - Date.now())
  useEffect(() => {
    const id = setInterval(() => setDiff(new Date(endsAt).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [endsAt])
  if (diff <= 0) return { label: 'Ended', urgent: false }
  const s = Math.floor(diff / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sc = s % 60
  if (h > 48) {
    const d = Math.floor(s / 86400)
    return { label: `${d}d ${Math.floor((s % 86400) / 3600)}h`, urgent: false }
  }
  return {
    label: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`,
    urgent: diff < 3 * 60 * 1000,
  }
}

function CountdownPill({ endsAt, status }: { endsAt: string; status: string }) {
  const { label, urgent } = useCountdown(endsAt)
  if (status !== 'active') return (
    <span className="text-xs text-white/30 uppercase tracking-wider">
      {status === 'sold' ? 'Sold' : 'Ended'}
    </span>
  )
  return (
    <span className="text-xs font-mono font-semibold tabular-nums"
      style={{ color: urgent ? '#ef4444' : '#c9a84c' }}>
      {label}
    </span>
  )
}

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth()
  const router   = useRouter()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/account/login'); return }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/account/watchlist', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then(r => r.json())
        .then(d => { setAuctions(d.auctions ?? []); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [user, authLoading]) // eslint-disable-line

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>My Account</p>
        <h1 className="text-4xl font-bold">Watchlist</h1>
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
            <p className="text-gray-400 text-lg">No auctions on your watchlist yet.</p>
            <Link href="/auctions"
              className="inline-block px-6 py-3 text-sm font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: '#0c1f3f' }}>
              Browse Auctions
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {auctions.map(a => (
              <Link key={a.id} href={`/auctions/${a.slug}`}
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
                  <p className="text-gray-400 text-xs">{a.location}</p>
                </div>

                {/* Bid + timer */}
                <div className="flex-shrink-0 text-right space-y-1">
                  <p className="font-bold text-lg" style={{ color: '#0c1f3f' }}>
                    ${(a.current_bid || a.starting_bid).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">{a.bid_count} bid{a.bid_count !== 1 ? 's' : ''}</p>
                  <CountdownPill endsAt={a.ends_at} status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
