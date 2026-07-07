'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
type Comment = { id: string; user_id: string; display_name: string; body: string; created_at: string }
type FeedItem =
  | { kind: 'bid';     data: Bid }
  | { kind: 'comment'; data: Comment }

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number)  { return '$' + n.toLocaleString() }
function maskBidder(id: string) { return 'Bidder ' + id.slice(0, 4).toUpperCase() }
function fmtTime(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

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
    urgent:  diff < 5 * 60 * 1000,
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuctionDetailPage() {
  const { slug }   = useParams<{ slug: string }>()
  const { user }   = useAuth()
  const router     = useRouter()

  const [panelBottom, setPanelBottom] = useState(0)
  const [auction,    setAuction]    = useState<Auction | null>(null)
  const [bids,       setBids]       = useState<Bid[]>([])
  const [comments,   setComments]   = useState<Comment[]>([])
  const [loading,    setLoading]    = useState(true)
  const [imgIdx,     setImgIdx]     = useState(0)
  const [bidAmount,  setBidAmount]  = useState('')
  const [bidError,   setBidError]   = useState('')
  const [bidSuccess, setBidSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const feedEndRef = useRef<HTMLDivElement>(null)

  // ── Fetch auction + bids + comments ───────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const [auctionRes, commentsRes] = await Promise.all([
      fetch(`/api/auctions/${slug}`),
      fetch(`/api/auctions/${slug}/comments`),
    ])
    if (!auctionRes.ok) { setLoading(false); return }
    const auctionData   = await auctionRes.json()
    const commentsData  = await commentsRes.json()
    setAuction(auctionData.auction)
    setBids(auctionData.bids ?? [])
    setComments(commentsData.comments ?? [])
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Track footer position so fixed panel stops at footer edge ─────────────
  useEffect(() => {
    function onScroll() {
      const footer = document.querySelector('footer')
      if (!footer) return
      // How many px of footer are visible from viewport bottom
      const gap = window.innerHeight - footer.getBoundingClientRect().top
      setPanelBottom(Math.max(0, gap))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Supabase Realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!auction) return
    const channel = supabase
      .channel(`auction-activity-${auction.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auction_listings', filter: `id=eq.${auction.id}` },
        (p) => setAuction(prev => prev ? { ...prev, ...p.new as Partial<Auction> } : prev))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auction_bids', filter: `auction_id=eq.${auction.id}` },
        (p) => setBids(prev => [...prev, p.new as Bid]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auction_comments', filter: `auction_id=eq.${auction.id}` },
        (p) => setComments(prev => [...prev, p.new as Comment]))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [auction?.id])

  // Scroll feed to bottom when new items arrive
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [bids.length, comments.length])

  // ── Place bid ──────────────────────────────────────────────────────────────
  async function handleBid(e: React.FormEvent) {
    e.preventDefault()
    setBidError(''); setBidSuccess('')
    if (!user) { router.push('/account/login'); return }
    const amount = Number(bidAmount.replace(/[^0-9.]/g, ''))
    if (!amount || isNaN(amount)) { setBidError('Enter a valid bid amount.'); return }
    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setBidError('Please sign in again.'); setSubmitting(false); return }
    const res = await fetch(`/api/auctions/${slug}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ amount }),
    })
    const d = await res.json()
    setSubmitting(false)
    if (!res.ok) { setBidError(d.error ?? 'Bid failed.'); return }
    setBidSuccess(`Bid of ${fmt(amount)} placed!`)
    setBidAmount('')
    fetchAll()
  }

  // ── Post comment ───────────────────────────────────────────────────────────
  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    setCommentError('')
    if (!user) { router.push('/account/login'); return }
    if (!commentText.trim()) return
    setCommentSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setCommentError('Please sign in again.'); setCommentSubmitting(false); return }
    const res = await fetch(`/api/auctions/${slug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ body: commentText.trim() }),
    })
    const d = await res.json()
    setCommentSubmitting(false)
    if (!res.ok) { setCommentError(d.error ?? 'Failed to post.'); return }
    setCommentText('')
  }

  // ── Delete comment ─────────────────────────────────────────────────────────
  async function handleDeleteComment(commentId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch(`/api/auctions/${slug}/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id: commentId }),
    })
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  // ── Build merged feed ──────────────────────────────────────────────────────
  const feed: FeedItem[] = [
    ...bids.map(b => ({ kind: 'bid' as const, data: b })),
    ...comments.map(c => ({ kind: 'comment' as const, data: c })),
  ].sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime())

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

      {/* Back */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="px-6 py-4">
        <a href="/auctions" className="text-sm text-white/40 hover:text-white transition-colors">← All Auctions</a>
      </div>

      {/* Left: scrolls freely; right padding reserves space for the fixed panel on xl */}
      <div className="xl:pr-[400px]">
        <div className="px-8 py-12 space-y-8">

            {/* Gallery */}
            <div>
              <div className="relative" style={{ backgroundColor: '#0c1f3f' }}>
                {images.length > 0 ? (
                  <>
                    <img src={images[imgIdx]} alt={auction.title}
                      className="w-full object-cover" style={{ maxHeight: '480px', objectFit: 'cover' }} />
                    {images.length > 1 && (
                      <>
                        <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/80">‹</button>
                        <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/80">›</button>
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
              {images.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                  {images.map((src, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className="flex-shrink-0 w-20 h-14 overflow-hidden transition-opacity"
                      style={{ opacity: i === imgIdx ? 1 : 0.4 }}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>
                {auction.year} {auction.make} {auction.model}{auction.length_ft ? ` · ${auction.length_ft}ft` : ''}
              </p>
              <h1 className="text-3xl font-bold mb-2">{auction.title}</h1>
              <p className="text-white/40 text-sm">{auction.location}</p>
            </div>

            {/* Specs */}
            <div>
              <h2 className="text-xs tracking-widest uppercase text-white/30 mb-4">Vessel Details</h2>
              <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: '#222' }}>
                {[
                  ['Make', auction.make], ['Model', auction.model],
                  ['Year', auction.year], ['Length', auction.length_ft ? `${auction.length_ft} ft` : '—'],
                  ['Condition', auction.condition], ['Engine Hours', auction.hours != null ? auction.hours.toLocaleString() : '—'],
                  ['HIN / VIN', auction.vin || '—'], ['Location', auction.location],
                ].map(([label, val]) => (
                  <div key={label} className="p-4" style={{ backgroundColor: '#111' }}>
                    <p className="text-xs text-white/30 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-white font-medium">{val || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {auction.description && (
              <div>
                <h2 className="text-xs tracking-widest uppercase text-white/30 mb-4">About This Vessel</h2>
                <p className="text-white/70 leading-relaxed text-sm whitespace-pre-line">{auction.description}</p>
              </div>
            )}

            {/* ── Activity & Discussion (inside left column) ──────────── */}
            <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '48px' }}>
              <div className="flex items-baseline gap-4 mb-8">
                <h2 className="text-lg font-bold">Activity & Discussion</h2>
                <span className="text-xs text-white/30 uppercase tracking-wider">
                  {feed.length} item{feed.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Comment form */}
              <div className="mb-8 p-6" style={{ backgroundColor: '#111' }}>
                <h3 className="text-xs uppercase tracking-widest text-white/30 mb-4">Leave a Comment</h3>
                {user ? (
                  <form onSubmit={handleComment} className="space-y-3">
                    <textarea
                      value={commentText}
                      onChange={e => { setCommentText(e.target.value); setCommentError('') }}
                      rows={4} maxLength={1000}
                      placeholder="Ask a question, share your experience with this vessel, or contribute to the discussion…"
                      className="w-full px-4 py-3 text-white text-sm bg-transparent border focus:outline-none focus:border-yellow-500/50 resize-none leading-relaxed"
                      style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/20">{commentText.length}/1000</span>
                      {commentError && <p className="text-red-400 text-xs">{commentError}</p>}
                    </div>
                    <button type="submit" disabled={commentSubmitting || !commentText.trim()}
                      className="w-full py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-40"
                      style={{ backgroundColor: '#0c1f3f', border: '1px solid #c9a84c', color: '#c9a84c' }}>
                      {commentSubmitting ? 'Posting…' : 'Post Comment'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-white/40 text-sm leading-relaxed">Sign in to join the discussion.</p>
                    <a href="/account/login"
                      className="block py-3 text-sm font-bold uppercase tracking-wider text-center"
                      style={{ border: '1px solid #c9a84c', color: '#c9a84c' }}>
                      Sign In to Comment
                    </a>
                  </div>
                )}
              </div>

              {/* Feed */}
              {feed.length === 0 ? (
                <p className="text-white/20 text-sm py-8">No activity yet. Place a bid or leave a comment to get the conversation started.</p>
              ) : (
                <div className="space-y-px">
                  {feed.map((item) => (
                    item.kind === 'bid' ? (
                      <BidFeedItem key={`bid-${item.data.id}`} bid={item.data}
                        isLatest={item.data.amount === Math.max(...bids.map(b => b.amount))} />
                    ) : (
                      <CommentFeedItem key={`comment-${item.data.id}`} comment={item.data}
                        isOwn={user?.id === item.data.user_id} onDelete={handleDeleteComment} />
                    )
                  ))}
                  <div ref={feedEndRef} />
                </div>
              )}
            </div>

        </div>
      </div>{/* end left wrapper */}

      {/* Right: fixed panel — scroll listener shrinks it up as footer enters viewport */}
      <div className="hidden xl:block"
        style={{
          position: 'fixed',
          top: '72px',
          right: '0',
          width: '400px',
          bottom: `${panelBottom}px`,
          backgroundColor: '#0c0c0c',
          borderLeft: '1px solid #1a1a1a',
          overflow: 'hidden',
          transition: 'bottom 0.15s ease-out',
          zIndex: 10,
        }}><div className="p-4 space-y-3">

              {isActive && <CountdownBlock endsAt={auction.ends_at} />}
              {!isActive && (
                <div className="py-4 text-center" style={{ backgroundColor: '#1a1a1a' }}>
                  <span className="text-white/40 text-sm uppercase tracking-widest">
                    {auction.status === 'sold' ? 'Sold' : 'Auction Ended'}
                  </span>
                </div>
              )}

              <div className="p-4" style={{ backgroundColor: '#111' }}>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">
                  {auction.bid_count > 0 ? 'Current Bid' : 'Starting Bid'}
                </p>
                <p className="text-3xl font-bold mb-1" style={{ color: '#c9a84c' }}>
                  {fmt(auction.current_bid || auction.starting_bid)}
                </p>
                {auction.bid_count > 0 && (
                  <p className="text-white/30 text-xs">{auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}</p>
                )}
                {isWinner && isActive && (
                  <p className="text-green-400 text-xs mt-1 font-semibold uppercase tracking-wider">✓ You are the highest bidder</p>
                )}
              </div>

              {isActive && (
                <div className="p-4" style={{ backgroundColor: '#111' }}>
                  {user ? (
                    <form onSubmit={handleBid} className="space-y-3">
                      <div>
                        <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">
                          Your Bid (min {fmt(minBid)})
                        </label>
                        <div className="flex">
                          <span className="flex items-center px-3 text-white/40 text-sm"
                            style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRight: 0 }}>$</span>
                          <input type="number" min={minBid} step={100} value={bidAmount}
                            onChange={e => { setBidAmount(e.target.value); setBidError(''); setBidSuccess('') }}
                            placeholder={minBid.toString()}
                            className="flex-1 px-3 py-2 text-white text-base bg-transparent focus:outline-none"
                            style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} required />
                        </div>
                      </div>
                      {bidError   && <p className="text-red-400 text-xs">{bidError}</p>}
                      {bidSuccess && <p className="text-green-400 text-xs">{bidSuccess}</p>}
                      <button type="submit" disabled={submitting}
                        className="w-full py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                        style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
                        {submitting ? 'Placing Bid…' : 'Place Bid'}
                      </button>
                      <p className="text-xs text-white/25 text-center leading-snug">
                        All bids are binding. Bids within the last 5 minutes extend the auction by 5 minutes.
                      </p>
                    </form>
                  ) : (
                    <div className="text-center space-y-3">
                      <p className="text-white/50 text-sm">Sign in to place a bid</p>
                      <a href="/account/login"
                        className="block py-2 text-sm font-bold uppercase tracking-wider text-center"
                        style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
                        Sign In to Bid
                      </a>
                      <p className="text-white/30 text-xs">
                        No account?{' '}
                        <a href="/account/signup" className="underline" style={{ color: '#c9a84c' }}>Register free</a>
                      </p>
                    </div>
                  )}
                </div>
              )}

          </div>{/* end p-6 */}
      </div>{/* end fixed panel */}
    </div>
  )
}

// ── Feed item: bid ────────────────────────────────────────────────────────────
function BidFeedItem({ bid, isLatest }: { bid: Bid; isLatest: boolean }) {
  return (
    <div className="px-5 py-4"
      style={{ backgroundColor: isLatest ? '#0f1d35' : '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}>
      <div className="flex items-center gap-3 mb-1">
        <span className="text-xs font-bold px-2 py-0.5 uppercase tracking-wider flex-shrink-0"
          style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>Bid</span>
        <span className="font-bold text-white">{fmt(bid.amount)}</span>
        <span className="text-white/30 text-sm">by {maskBidder(bid.bidder_id)}</span>
        {isLatest && (
          <span className="text-xs text-green-400 font-semibold">High Bid</span>
        )}
      </div>
      <p className="text-white/25 text-xs">{fmtTime(bid.created_at)}</p>
    </div>
  )
}

// ── Feed item: comment ────────────────────────────────────────────────────────
function CommentFeedItem({ comment, isOwn, onDelete }: {
  comment: Comment; isOwn: boolean; onDelete: (id: string) => void
}) {
  return (
    <div className="px-5 py-4 group" style={{ backgroundColor: '#111', borderBottom: '1px solid #1a1a1a' }}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: '#0c1f3f', color: '#c9a84c' }}>
          {comment.display_name[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm text-white">{comment.display_name}</span>
            <span className="text-white/25 text-xs">{fmtTime(comment.created_at)}</span>
            {isOwn && (
              <button onClick={() => onDelete(comment.id)}
                className="text-white/20 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                delete
              </button>
            )}
          </div>
          <p className="text-white/70 text-sm leading-relaxed break-words">{comment.body}</p>
        </div>
      </div>
    </div>
  )
}

// ── Countdown block ───────────────────────────────────────────────────────────
function CountdownBlock({ endsAt }: { endsAt: string }) {
  const { days, hours, minutes, seconds, ended, urgent } = useCountdown(endsAt)
  const color = urgent ? '#ef4444' : '#c9a84c'

  if (ended) return (
    <div className="py-5 text-center" style={{ backgroundColor: '#1a1a1a' }}>
      <span className="text-red-400 font-semibold uppercase tracking-wider text-sm">Auction Ended</span>
    </div>
  )
  return (
    <div className="py-3 px-4" style={{ backgroundColor: urgent ? '#1a0a0a' : '#111' }}>
      <p className="text-xs text-white/30 uppercase tracking-widest mb-3 text-center">
        {urgent ? '⚡ Anti-snipe active — bids extend the timer' : 'Time Remaining'}
      </p>
      <div className="flex justify-center gap-4">
        {[['Days', days], ['Hrs', hours], ['Min', minutes], ['Sec', seconds]].map(([label, val]) => (
          <div key={label as string} className="text-center">
            <div className="text-3xl font-bold tabular-nums" style={{ color }}>{String(val).padStart(2, '0')}</div>
            <div className="text-xs text-white/30 uppercase tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
