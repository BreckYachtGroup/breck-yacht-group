'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getSurveyTier, formatDeposit } from '@/lib/survey-tiers'

type Auction = {
  id: string; slug: string; title: string; make: string; model: string
  year: number; status: string; starts_at: string; ends_at: string
  starting_bid: number; current_bid: number; bid_count: number; created_at: string
}
type Bid = { id: string; amount: number; created_at: string; bidder_email: string }
type IntakeSubmission = {
  id: string; status: string; created_at: string
  year: number; make: string; model: string; length_ft: number | null
  engine_count: number; engine_make: string; engine_hours: number | null
  condition: string; reserve_price: number | null; current_location: string
  listing_id: string | null
  listing_slug: string | null   // derived from auction_listings join
  buyer_profiles: { name: string | null; phone: string | null } | null
  auth_email?: string
}
type FlaggedComment = {
  id: string; display_name: string; body: string | null; image_url: string | null
  flag_count: number; like_count: number; created_at: string
  auction_listings: { title: string; slug: string }
}

const STATUS_COLORS: Record<string, string> = {
  draft:     '#555',
  active:    '#2a7a2a',
  ended:     '#7a4a00',
  sold:      '#1a4a7a',
  cancelled: '#7a1a1a',
}

function fmt(n: number) { return '$' + n.toLocaleString() }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }

export default function AuctionAdminPage() {
  const router   = useRouter()
  const [token,    setToken]    = useState<string | null>(null)
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [bidsSlug, setBidsSlug] = useState<string | null>(null)
  const [bids,     setBids]     = useState<Bid[]>([])
  const [bidsTitle, setBidsTitle] = useState('')
  const [bidsLoading, setBidsLoading] = useState(false)
  const [deleting,        setDeleting]        = useState<string | null>(null)
  const [statusUpdating,  setStatusUpdating]  = useState<string | null>(null)
  const [flagged,         setFlagged]         = useState<FlaggedComment[]>([])
  const [flaggedLoading,  setFlaggedLoading]  = useState(false)
  const [deletingComment, setDeletingComment] = useState<string | null>(null)
  const [intakes,          setIntakes]          = useState<IntakeSubmission[]>([])
  const [intakesLoading,   setIntakesLoading]   = useState(false)
  const [rejectingIntake,  setRejectingIntake]  = useState<string | null>(null)
  const [approvingIntake,  setApprovingIntake]  = useState<string | null>(null)

  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/account/login'); return }
      if (session.user.email !== 'austin@breckyachtgroup.com') {
        router.replace('/'); return
      }
      setToken(session.access_token)
    })
  }, [router])

  // ── Fetch all auctions ─────────────────────────────────────────────────────
  const fetchAuctions = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const res = await fetch('/api/auctions/admin/listings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = await res.json()
    if (!res.ok) { setError(d.error); setLoading(false); return }
    setAuctions(d.auctions ?? [])
    setLoading(false)
  }, [token])

  useEffect(() => { if (token) { fetchAuctions(); fetchFlagged(); fetchIntakes() } }, [token, fetchAuctions])

  // ── Fetch intake submissions ───────────────────────────────────────────────
  async function fetchIntakes() {
    if (!token) return
    setIntakesLoading(true)
    const res = await fetch('/api/auctions/admin/intake', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = await res.json()
    // Flatten the auction_listings join into a listing_slug field
    const submissions = (d.submissions ?? []).map((s: IntakeSubmission & { auction_listings?: { slug: string } | null }) => ({
      ...s,
      listing_slug: s.auction_listings?.slug ?? null,
    }))
    setIntakes(submissions)
    setIntakesLoading(false)
  }

  async function approveIntake(id: string) {
    if (!token || !confirm('Approve this intake and send the deposit request email to the seller?')) return
    setApprovingIntake(id)
    const res = await fetch('/api/auctions/admin/intake', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ id, action: 'approve' }),
    })
    const json = await res.json()
    setApprovingIntake(null)
    if (!res.ok) {
      alert('Approval failed: ' + (json.error ?? 'Unknown error'))
    } else {
      alert(`✓ Approved — deposit request sent (${json.depositAmount}, ${json.tier})`)
    }
    fetchIntakes()
  }

  async function rejectIntake(id: string) {
    if (!token || !confirm('Reject this intake submission?')) return
    setRejectingIntake(id)
    await fetch('/api/auctions/admin/intake', {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status: 'rejected' }),
    })
    setRejectingIntake(null)
    fetchIntakes()
  }

  // ── Fetch flagged comments ─────────────────────────────────────────────────
  async function fetchFlagged() {
    if (!token) return
    setFlaggedLoading(true)
    const res = await fetch('/api/auctions/admin/flagged-comments', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = await res.json()
    setFlagged(d.comments ?? [])
    setFlaggedLoading(false)
  }

  // ── Delete flagged comment ─────────────────────────────────────────────────
  async function deleteComment(id: string) {
    if (!token || !confirm('Permanently delete this comment?')) return
    setDeletingComment(id)
    await fetch('/api/auctions/admin/flagged-comments', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeletingComment(null)
    fetchFlagged()
  }

  // ── Update status ──────────────────────────────────────────────────────────
  async function updateStatus(slug: string, status: string) {
    if (!token) return
    setStatusUpdating(slug)
    await fetch(`/api/auctions/admin/listings/${slug}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setStatusUpdating(null)
    fetchAuctions()
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function deleteAuction(slug: string) {
    if (!token || !confirm('Delete this auction and all its bids? This cannot be undone.')) return
    setDeleting(slug)
    await fetch(`/api/auctions/admin/listings/${slug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setDeleting(null)
    fetchAuctions()
  }

  // ── View bids ──────────────────────────────────────────────────────────────
  async function viewBids(slug: string, title: string) {
    if (!token) return
    setBidsSlug(slug)
    setBidsTitle(title)
    setBids([])
    setBidsLoading(true)
    const res = await fetch(`/api/auctions/admin/bids/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = await res.json()
    setBids(d.bids ?? [])
    setBidsLoading(false)
  }

  if (!token) return null

  return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen text-white">

      {/* Header */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="px-8 py-6 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#c9a84c' }}>Breck Yacht Group</p>
          <h1 className="text-2xl font-bold">Auction Admin</h1>
        </div>
        <div className="flex gap-3">
          <a href="/auctions" target="_blank"
            className="px-4 py-2 text-sm text-white/50 hover:text-white border border-white/20 hover:border-white/40 transition-colors">
            View Public Page ↗
          </a>
          <button
            onClick={() => router.push('/auctions/admin/create')}
            className="px-5 py-2 text-sm font-bold uppercase tracking-wider"
            style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}
          >
            + New Auction
          </button>
        </div>
      </div>

      <div className="px-8 py-8">
        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

        {loading ? (
          <p className="text-white/30 text-sm animate-pulse">Loading auctions…</p>
        ) : auctions.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/30 text-lg mb-4">No auctions yet.</p>
            <button
              onClick={() => router.push('/auctions/admin/create')}
              className="px-6 py-3 text-sm font-bold uppercase tracking-wider"
              style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}
            >
              Create Your First Auction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  {['Listing', 'Status', 'Bids', 'Current Bid', 'Ends', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs uppercase tracking-wider text-white/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auctions.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #1a1a1a' }}
                    className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-white">{a.title}</p>
                      <p className="text-white/30 text-xs mt-0.5">/auctions/{a.slug}</p>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={a.status}
                        disabled={statusUpdating === a.slug}
                        onChange={e => updateStatus(a.slug, e.target.value)}
                        className="text-xs px-2 py-1 border-0 cursor-pointer"
                        style={{
                          backgroundColor: STATUS_COLORS[a.status] ?? '#333',
                          color: '#fff',
                          opacity: statusUpdating === a.slug ? 0.5 : 1,
                        }}
                      >
                        {['draft', 'active', 'ended', 'sold', 'cancelled'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => viewBids(a.slug, a.title)}
                        className="text-white/60 hover:text-white underline underline-offset-2"
                      >
                        {a.bid_count} bid{a.bid_count !== 1 ? 's' : ''}
                      </button>
                    </td>
                    <td className="py-4 px-4 font-semibold" style={{ color: '#c9a84c' }}>
                      {fmt(a.current_bid || a.starting_bid)}
                    </td>
                    <td className="py-4 px-4 text-white/50">{fmtDate(a.ends_at)}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => router.push(`/auctions/admin/${a.slug}/edit`)}
                          className="text-xs text-white/50 hover:text-white underline underline-offset-2"
                        >
                          Edit
                        </button>
                        <a href={`/auctions/${a.slug}`} target="_blank"
                          className="text-xs text-white/50 hover:text-white underline underline-offset-2">
                          View ↗
                        </a>
                        <button
                          onClick={() => deleteAuction(a.slug)}
                          disabled={deleting === a.slug}
                          className="text-xs text-red-400/60 hover:text-red-400 underline underline-offset-2 disabled:opacity-40"
                        >
                          {deleting === a.slug ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seller Intake Submissions */}
      <div className="px-8 pb-8">
        <div className="flex items-center gap-4 mb-4" style={{ borderTop: '1px solid #222', paddingTop: '32px' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">Seller Intake Submissions</h2>
          {intakes.filter(i => i.status === 'pending' || i.status === 'draft_created').length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded"
              style={{ backgroundColor: '#1a4a1a', color: '#6fcf6f' }}>
              {intakes.filter(i => i.status === 'pending' || i.status === 'draft_created').length} pending
            </span>
          )}
        </div>

        {intakesLoading ? (
          <p className="text-white/30 text-sm animate-pulse">Loading…</p>
        ) : intakes.length === 0 ? (
          <p className="text-white/20 text-sm">No intake submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {intakes.map(s => {
              const isPending = s.status === 'pending' || s.status === 'draft_created'
              const tier      = getSurveyTier(s.length_ft)
              const deposit   = formatDeposit(tier.depositCents)
              return (
                <div key={s.id} className="p-5 flex gap-5 items-start"
                  style={{ backgroundColor: '#111', border: `1px solid ${isPending ? '#1a3a1a' : '#1a1a1a'}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-bold text-white">
                        {s.year} {s.make} {s.model}{s.length_ft ? ` · ${s.length_ft}ft` : ''}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-semibold capitalize"
                        style={{
                          backgroundColor: isPending ? '#1a3a1a' : s.status === 'rejected' ? '#3a1a1a' : s.status === 'approved' ? '#1a2a3a' : '#1a1a3a',
                          color:           isPending ? '#6fcf6f' : s.status === 'rejected' ? '#cf6f6f' : s.status === 'approved' ? '#c9a84c' : '#6f9fcf',
                        }}>
                        {s.status.replace('_', ' ')}
                      </span>
                      {/* Survey tier + deposit badge */}
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: '#1a1a2a', color: '#8888cc' }}>
                        {tier.label} · {deposit} deposit
                      </span>
                      <span className="text-xs text-white/30">
                        {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs text-white/50 mb-3">
                      <span>Seller: <span className="text-white/80">{s.buyer_profiles?.name || '—'}</span></span>
                      <span>Phone: <span className="text-white/80">{s.buyer_profiles?.phone || '—'}</span></span>
                      <span>Engines: <span className="text-white/80">{s.engine_count}x {s.engine_make}{s.engine_hours ? ` · ${s.engine_hours}hrs` : ''}</span></span>
                      <span>Condition: <span className="text-white/80 capitalize">{s.condition || '—'}</span></span>
                      <span>Location: <span className="text-white/80">{s.current_location || '—'}</span></span>
                      <span>Reserve: <span className="text-white/80" style={{ color: s.reserve_price ? '#c9a84c' : undefined }}>
                        {s.reserve_price ? '$' + s.reserve_price.toLocaleString() : 'Not specified'}
                      </span></span>
                    </div>
                    {s.listing_slug && (
                      <div className="flex items-center gap-3 mt-1">
                        <a href={`/auctions/admin/${s.listing_slug}/edit`}
                          className="text-xs px-3 py-1 rounded font-semibold uppercase tracking-wider transition-opacity hover:opacity-80"
                          style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
                          Edit Draft
                        </a>
                        <a href={`/auctions/admin/${s.listing_slug}/preview`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs px-3 py-1 rounded font-semibold uppercase tracking-wider border transition-colors hover:border-white/40"
                          style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                          Preview ↗
                        </a>
                      </div>
                    )}
                  </div>
                  {isPending && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => approveIntake(s.id)}
                        disabled={approvingIntake === s.id}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider disabled:opacity-40"
                        style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
                        {approvingIntake === s.id ? 'Sending…' : `Approve & Request ${deposit}`}
                      </button>
                      <button
                        onClick={() => rejectIntake(s.id)}
                        disabled={rejectingIntake === s.id}
                        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider disabled:opacity-40"
                        style={{ backgroundColor: '#3a1a1a', color: '#cf6f6f' }}>
                        {rejectingIntake === s.id ? 'Rejecting…' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Flagged Comments */}
      <div className="px-8 pb-12">
        <div className="flex items-center gap-4 mb-4" style={{ borderTop: '1px solid #222', paddingTop: '32px' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">Flagged Comments</h2>
          {flagged.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded"
              style={{ backgroundColor: '#7a1a1a', color: '#fff' }}>{flagged.length}</span>
          )}
        </div>

        {flaggedLoading ? (
          <p className="text-white/30 text-sm animate-pulse">Loading…</p>
        ) : flagged.length === 0 ? (
          <p className="text-white/20 text-sm">No flagged comments.</p>
        ) : (
          <div className="space-y-3">
            {flagged.map(c => (
              <div key={c.id} className="p-4 flex gap-4 items-start"
                style={{ backgroundColor: '#111', border: '1px solid #2a1a1a' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-white text-sm">{c.display_name}</span>
                    <a href={`/auctions/${c.auction_listings.slug}`} target="_blank"
                      className="text-xs underline" style={{ color: '#c9a84c' }}>
                      {c.auction_listings.title} ↗
                    </a>
                    <span className="text-xs text-white/30">
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {c.body && <p className="text-white/60 text-sm leading-relaxed">{c.body}</p>}
                  {c.image_url && (
                    <img src={c.image_url} alt="attachment" className="mt-2 h-20 object-cover"
                      style={{ border: '1px solid #333' }} />
                  )}
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-red-400 font-semibold">⚑ {c.flag_count} flag{c.flag_count !== 1 ? 's' : ''}</span>
                    {c.like_count > 0 && <span className="text-xs text-white/30">👍 {c.like_count}</span>}
                  </div>
                </div>
                <button
                  onClick={() => deleteComment(c.id)}
                  disabled={deletingComment === c.id}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider disabled:opacity-40"
                  style={{ backgroundColor: '#7a1a1a', color: '#fff' }}>
                  {deletingComment === c.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bids slide-over panel */}
      {bidsSlug && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setBidsSlug(null)}>
          <div
            className="w-full max-w-md h-full overflow-y-auto shadow-2xl"
            style={{ backgroundColor: '#111' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #222' }}>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Bid History</p>
                <p className="font-semibold text-white">{bidsTitle}</p>
              </div>
              <button onClick={() => setBidsSlug(null)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="px-6 py-4">
              {bidsLoading ? (
                <p className="text-white/30 text-sm animate-pulse">Loading bids…</p>
              ) : bids.length === 0 ? (
                <p className="text-white/30 text-sm">No bids placed yet.</p>
              ) : (
                <div className="space-y-px">
                  {bids.map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between py-3"
                      style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <div>
                        <p className="font-semibold text-white">{fmt(b.amount)}</p>
                        <p className="text-white/40 text-xs mt-0.5">{b.bidder_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/30 text-xs">
                          {new Date(b.created_at).toLocaleString()}
                        </p>
                        {i === 0 && (
                          <span className="text-xs px-2 py-0.5 mt-1 inline-block font-bold"
                            style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
                            High Bid
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
