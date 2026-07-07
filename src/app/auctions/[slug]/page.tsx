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
type Comment = { id: string; user_id: string; display_name: string; body: string; image_url: string | null; like_count: number; flag_count: number; created_at: string }
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
    urgent:  diff < 3 * 60 * 1000,
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuctionDetailPage() {
  const { slug }   = useParams<{ slug: string }>()
  const { user }   = useAuth()
  const router     = useRouter()

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
  const [commentImage,    setCommentImage]    = useState<File | null>(null)
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null)
  const [commentImageUploading, setCommentImageUploading] = useState(false)
  const commentFileRef = useRef<HTMLInputElement>(null)
  const [termsAgreed,  setTermsAgreed]  = useState(false)
  const [watching,       setWatching]       = useState(false)
  const [watchLoading,   setWatchLoading]   = useState(false)
  const [likedComments,  setLikedComments]  = useState<Set<string>>(new Set())
  const [flaggedComments,setFlaggedComments]= useState<Set<string>>(new Set())
  const endProcessedRef = useRef(false)

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

  // ── Fetch watchlist status ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch(`/api/auctions/${slug}/watch`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then(r => r.json()).then(d => setWatching(d.watching ?? false)).catch(() => {})
    })
  }, [slug, user])

  // ── Fetch user's liked/flagged comments ───────────────────────────────────
  useEffect(() => {
    if (!user || comments.length === 0) return
    const ids = comments.map(c => c.id)
    Promise.all([
      supabase.from('auction_comment_likes').select('comment_id').in('comment_id', ids),
      supabase.from('auction_comment_flags').select('comment_id').in('comment_id', ids),
    ]).then(([likes, flags]) => {
      setLikedComments(new Set((likes.data ?? []).map(l => l.comment_id)))
      setFlaggedComments(new Set((flags.data ?? []).map(f => f.comment_id)))
    }).catch(() => {})
  }, [user, comments.length])

  // ── Reset scroll to top on load (prevent browser scroll restoration) ──────
  useEffect(() => { window.scrollTo(0, 0) }, [])

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

  // ── Post comment (with optional image) ────────────────────────────────────
  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    setCommentError('')
    if (!user) { router.push('/account/login'); return }
    if (!commentText.trim() && !commentImage) return
    setCommentSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setCommentError('Please sign in again.'); setCommentSubmitting(false); return }

    // Upload image first if attached
    let uploadedUrl: string | null = null
    if (commentImage) {
      setCommentImageUploading(true)
      const form = new FormData()
      form.append('file', commentImage)
      const upRes = await fetch('/api/auctions/comment-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      })
      setCommentImageUploading(false)
      if (!upRes.ok) {
        const upData = await upRes.json()
        setCommentError(upData.error ?? 'Image upload failed.')
        setCommentSubmitting(false)
        return
      }
      const upData = await upRes.json()
      uploadedUrl = upData.url
    }

    const res = await fetch(`/api/auctions/${slug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ body: commentText.trim(), image_url: uploadedUrl }),
    })
    const d = await res.json()
    setCommentSubmitting(false)
    if (!res.ok) { setCommentError(d.error ?? 'Failed to post.'); return }
    // Reset form
    setCommentText('')
    setCommentImage(null)
    setCommentImagePreview(null)
    if (commentFileRef.current) commentFileRef.current.value = ''
  }

  // ── Toggle watchlist ───────────────────────────────────────────────────────
  async function handleWatch() {
    if (!user) { router.push('/account/login'); return }
    setWatchLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setWatchLoading(false); return }
    const method = watching ? 'DELETE' : 'POST'
    const res = await fetch(`/api/auctions/${slug}/watch`, {
      method,
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const d = await res.json()
    setWatching(d.watching ?? !watching)
    setWatchLoading(false)
  }

  // ── Process auction end (called once when countdown hits zero) ─────────────
  function triggerProcessEnd() {
    if (endProcessedRef.current) return
    endProcessedRef.current = true
    fetch(`/api/auctions/${slug}/process-end`, { method: 'POST' }).catch(() => {})
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

  // ── Like / unlike a comment ────────────────────────────────────────────────
  async function handleLikeComment(commentId: string) {
    if (!user) { router.push('/account/login'); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const isLiked = likedComments.has(commentId)
    // Optimistic update
    setLikedComments(prev => { const n = new Set(prev); isLiked ? n.delete(commentId) : n.add(commentId); return n })
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, like_count: c.like_count + (isLiked ? -1 : 1) } : c))
    await fetch(`/api/auctions/${slug}/comments/${commentId}/like`, {
      method: isLiked ? 'DELETE' : 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {
      // Revert on error
      setLikedComments(prev => { const n = new Set(prev); isLiked ? n.add(commentId) : n.delete(commentId); return n })
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, like_count: c.like_count + (isLiked ? 1 : -1) } : c))
    })
  }

  // ── Flag a comment as not constructive ─────────────────────────────────────
  async function handleFlagComment(commentId: string) {
    if (!user) { router.push('/account/login'); return }
    if (flaggedComments.has(commentId)) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setFlaggedComments(prev => new Set([...prev, commentId]))
    await fetch(`/api/auctions/${slug}/comments/${commentId}/flag`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {
      setFlaggedComments(prev => { const n = new Set(prev); n.delete(commentId); return n })
    })
  }

  // ── Build merged feed ──────────────────────────────────────────────────────
  const feed: FeedItem[] = [
    ...bids.map(b => ({ kind: 'bid' as const, data: b })),
    ...comments.map(c => ({ kind: 'comment' as const, data: c })),
  ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime())

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

      {/* Back bar */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="px-6 py-4">
        <a href="/auctions" className="text-sm text-white/40 hover:text-white transition-colors">← All Auctions</a>
      </div>

      {/* Two-column flex layout — left scrolls, right column stretches so sticky works */}
      <div className="xl:flex xl:flex-row">
        <div className="xl:flex-1 xl:min-w-0">
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

                    {/* Image attachment */}
                    <div className="flex items-center gap-3">
                      <button type="button"
                        onClick={() => commentFileRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
                        style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M3.75 3.75h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6a2.25 2.25 0 012.25-2.25z" />
                        </svg>
                        Attach Photo
                      </button>
                      {commentImage && (
                        <div className="flex items-center gap-2">
                          {commentImagePreview && (
                            <img src={commentImagePreview} alt="preview"
                              className="w-12 h-10 object-cover" style={{ border: '1px solid #333' }} />
                          )}
                          <span className="text-xs text-white/40 truncate max-w-[140px]">{commentImage.name}</span>
                          <button type="button" onClick={() => {
                            setCommentImage(null); setCommentImagePreview(null)
                            if (commentFileRef.current) commentFileRef.current.value = ''
                          }} className="text-white/30 hover:text-red-400 text-xs">✕</button>
                        </div>
                      )}
                      <input ref={commentFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0] ?? null
                          setCommentImage(f)
                          if (f) {
                            const reader = new FileReader()
                            reader.onload = ev => setCommentImagePreview(ev.target?.result as string)
                            reader.readAsDataURL(f)
                          } else {
                            setCommentImagePreview(null)
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/20">{commentText.length}/1000</span>
                      {commentError && <p className="text-red-400 text-xs">{commentError}</p>}
                    </div>
                    <button type="submit"
                      disabled={commentSubmitting || commentImageUploading || (!commentText.trim() && !commentImage)}
                      className="w-full py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-40"
                      style={{ backgroundColor: '#0c1f3f', border: '1px solid #c9a84c', color: '#c9a84c' }}>
                      {commentImageUploading ? 'Uploading image…' : commentSubmitting ? 'Posting…' : 'Post Comment'}
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
                        isOwn={user?.id === item.data.user_id}
                        onDelete={handleDeleteComment}
                        liked={likedComments.has(item.data.id)}
                        onLike={() => handleLikeComment(item.data.id)}
                        flagged={flaggedComments.has(item.data.id)}
                        onFlag={() => handleFlagComment(item.data.id)} />
                    )
                  ))}
                </div>
              )}
            </div>

        </div>
      </div>{/* end left wrapper */}

      {/* Right: sticky panel — outer div stretches to left-column height; inner sticks at top */}
      <div className="hidden xl:block xl:w-[400px] flex-shrink-0"
        style={{ backgroundColor: '#0c0c0c', borderLeft: '1px solid #1a1a1a', position: 'relative' }}>
        <div style={{ position: 'sticky', top: '124px' }}>
        <div className="p-4 space-y-3">

              {isActive && <CountdownBlock endsAt={auction.ends_at} onEnded={triggerProcessEnd} />}
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

              {/* Watch button */}
              <button onClick={handleWatch} disabled={watchLoading}
                className="w-full py-2 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: watching ? 'rgba(201,168,76,0.15)' : 'transparent',
                  border: `1px solid ${watching ? '#c9a84c' : '#333'}`,
                  color: watching ? '#c9a84c' : 'rgba(255,255,255,0.3)',
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={watching ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {watching ? 'Watching' : 'Watch This Auction'}
              </button>

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
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)}
                          className="mt-0.5 flex-shrink-0" required />
                        <span className="text-xs text-white/30 leading-snug">
                          I agree to the{' '}
                          <a href="/auctions/terms" target="_blank" className="underline hover:text-white/60" style={{ color: '#c9a84c' }}>
                            auction terms &amp; conditions
                          </a>
                          . All bids are binding.
                        </span>
                      </label>
                      <button type="submit" disabled={submitting || !termsAgreed}
                        className="w-full py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                        style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
                        {submitting ? 'Placing Bid…' : 'Place Bid'}
                      </button>
                      <p className="text-xs text-white/25 text-center leading-snug">
                        Bids in the final 3 minutes reset the timer to 3 minutes.
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

          </div>{/* end panel content */}
        </div>{/* end sticky */}
      </div>{/* end right panel */}
    </div>{/* end flex wrapper */}
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
function CommentFeedItem({ comment, isOwn, onDelete, liked, onLike, flagged, onFlag }: {
  comment: Comment
  isOwn: boolean
  onDelete: (id: string) => void
  liked: boolean
  onLike: () => void
  flagged: boolean
  onFlag: () => void
}) {
  const [imgOpen, setImgOpen] = useState(false)

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
          {comment.body && (
            <p className="text-white/70 text-sm leading-relaxed break-words">{comment.body}</p>
          )}
          {comment.image_url && (
            <div className="mt-3">
              <img
                src={comment.image_url}
                alt="comment attachment"
                loading="lazy"
                onClick={() => setImgOpen(true)}
                className="max-h-64 object-cover cursor-zoom-in"
                style={{ border: '1px solid #2a2a2a', maxWidth: '100%' }}
              />
            </div>
          )}

          {/* Like + Flag row */}
          <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: '1px solid #1a1a1a' }}>

            {/* Thumbs up */}
            <button onClick={onLike}
              className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
              style={{ color: liked ? '#c9a84c' : 'rgba(255,255,255,0.25)' }}
              aria-label="Like comment">
              {/* Thumbs up icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={liked ? 'currentColor' : 'none'}
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
              </svg>
              {comment.like_count > 0 && <span className="tabular-nums">{comment.like_count}</span>}
            </button>

            {/* Flag — only shown on others' comments */}
            {!isOwn && (
              <button onClick={onFlag} disabled={flagged}
                className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80 disabled:cursor-default"
                style={{ color: flagged ? '#ef4444' : 'rgba(255,255,255,0.18)' }}
                aria-label="Flag as not constructive">
                {/* Flag icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill={flagged ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
                {flagged ? 'Flagged' : 'Flag as not constructive'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {imgOpen && comment.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setImgOpen(false)}>
          <img src={comment.image_url} alt="full size" className="max-w-full max-h-full object-contain" />
          <button className="absolute top-4 right-6 text-white/50 hover:text-white text-3xl leading-none">✕</button>
        </div>
      )}
    </div>
  )
}

// ── Countdown block ───────────────────────────────────────────────────────────
function CountdownBlock({ endsAt, onEnded }: { endsAt: string; onEnded?: () => void }) {
  const { days, hours, minutes, seconds, ended, urgent } = useCountdown(endsAt)
  const color = urgent ? '#ef4444' : '#c9a84c'

  useEffect(() => {
    if (ended && onEnded) onEnded()
  }, [ended, onEnded])

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
