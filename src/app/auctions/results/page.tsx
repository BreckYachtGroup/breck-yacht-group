/**
 * /auctions/results — Public archive of ended and sold auctions with final prices.
 * Builds trust and market transparency.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import Link from 'next/link'

export const revalidate = 300 // refresh every 5 minutes

async function getResults() {
  const { data } = await supabaseAdmin
    .from('auction_listings')
    .select('id, slug, title, make, model, year, length_ft, location, images, status, ends_at, starting_bid, current_bid, bid_count')
    .in('status', ['sold', 'ended'])
    .order('ends_at', { ascending: false })
    .limit(100)
  return data ?? []
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AuctionResultsPage() {
  const results = await getResults()
  const sold  = results.filter(r => r.status === 'sold')
  const ended = results.filter(r => r.status === 'ended')

  return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen text-white">

      {/* Hero */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-24 text-center">
        <p className="text-xs tracking-[0.5em] uppercase mb-3" style={{ color: '#c9a84c' }}>
          Breck Yacht Group
        </p>
        <h1 className="text-5xl font-bold tracking-tight mb-4">Auction Results</h1>
        <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
          Transparent market data on every vessel that has crossed our block.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">

        <div className="flex items-center gap-6 mb-10 text-sm">
          <Link href="/auctions" className="text-white/40 hover:text-white transition-colors">
            ← Live Auctions
          </Link>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-white/30 text-xl">No completed auctions yet.</p>
          </div>
        ) : (
          <>
            {sold.length > 0 && (
              <section className="mb-16">
                <h2 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-8">
                  Sold — {sold.length} vessel{sold.length !== 1 ? 's' : ''}
                </h2>
                <div className="space-y-px">
                  {sold.map(r => <ResultRow key={r.id} r={r} />)}
                </div>
              </section>
            )}

            {ended.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-[0.3em] text-white/30 mb-8">
                  No Sale — {ended.length} listing{ended.length !== 1 ? 's' : ''}
                </h2>
                <div className="space-y-px opacity-50">
                  {ended.map(r => <ResultRow key={r.id} r={r} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ResultRow({ r }: { r: any }) {
  const isSold = r.status === 'sold'
  return (
    <Link href={`/auctions/${r.slug}`}
      className="flex items-center gap-5 px-5 py-4 hover:bg-white/5 transition-colors"
      style={{ borderBottom: '1px solid #1a1a1a' }}>

      {/* Thumbnail */}
      <div className="flex-shrink-0 w-20 h-14 overflow-hidden" style={{ backgroundColor: '#0c1f3f' }}>
        {r.images?.[0]
          ? <img src={r.images[0]} alt={r.title} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">No Photo</div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: '#c9a84c' }}>
          {r.year} {r.make} {r.model}{r.length_ft ? ` · ${r.length_ft}ft` : ''}
        </p>
        <p className="font-semibold text-white truncate">{r.title}</p>
        <p className="text-white/30 text-xs">{r.location}</p>
      </div>

      {/* Bids */}
      <div className="flex-shrink-0 text-center hidden sm:block">
        <p className="text-white/30 text-xs uppercase tracking-wider">Bids</p>
        <p className="font-semibold text-white">{r.bid_count}</p>
      </div>

      {/* Ended date */}
      <div className="flex-shrink-0 text-center hidden md:block">
        <p className="text-white/30 text-xs uppercase tracking-wider">Closed</p>
        <p className="text-white/60 text-sm">{fmtDate(r.ends_at)}</p>
      </div>

      {/* Final price */}
      <div className="flex-shrink-0 text-right min-w-[120px]">
        <p className="text-xs uppercase tracking-wider mb-0.5"
          style={{ color: isSold ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
          {isSold ? 'Sold' : 'No Sale'}
        </p>
        {isSold
          ? <p className="text-xl font-bold" style={{ color: '#c9a84c' }}>
              ${r.current_bid.toLocaleString()}
            </p>
          : <p className="text-white/30 text-sm">Reserve not met</p>
        }
      </div>
    </Link>
  )
}
