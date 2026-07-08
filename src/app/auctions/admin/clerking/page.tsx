'use client'

/**
 * /auctions/admin/clerking
 *
 * Auction Clerking & Sales Records — state compliance log.
 *
 * Displays all sales records with the required legal fields:
 *   • Clear vessel identification & description
 *   • Winner name, address, and bidder number
 *   • Final hammer price
 *   • Date of sale and platform event ID
 *   • Date proceeds were delivered to the seller
 *
 * Records must be kept for a minimum of 2 years per FL auctioneer regulations.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

type ClerkingRecord = {
  id:                     string
  platform_event_id:      string
  auction_id:             string
  auction_slug:           string
  sale_date:              string
  vessel_year:            number
  vessel_make:            string
  vessel_model:           string
  vessel_length_ft:       number | null
  vessel_hin:             string | null
  vessel_condition:       string | null
  vessel_description:     string | null
  winner_name:            string
  winner_email:           string
  winner_address:         string
  winner_bidder_number:   number
  hammer_price:           number
  buyer_premium_pct:      number
  buyer_premium_amount:   number
  total_buyer_paid:       number
  proceeds_delivered_at:  string | null
  proceeds_delivery_notes: string | null
  created_at:             string
  created_by_email:       string | null
}

type PendingAuction = {
  id:                 string
  slug:               string
  title:              string
  make:               string
  model:              string
  year:               number
  length_ft:          number | null
  vin:                string | null
  condition:          string | null
  description:        string | null
  ends_at:            string
  current_bid:        number
  current_bidder_id:  string | null
  bid_count:          number
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClerkingPage() {
  const router = useRouter()
  const [token,         setToken]         = useState<string | null>(null)
  const [records,       setRecords]       = useState<ClerkingRecord[]>([])
  const [needsRecord,   setNeedsRecord]   = useState<PendingAuction[]>([])
  const [loading,       setLoading]       = useState(true)
  const [filterStatus,  setFilterStatus]  = useState<'all' | 'pending' | 'delivered'>('all')
  const [filterYear,    setFilterYear]    = useState<string>('')
  const [expandedId,    setExpandedId]    = useState<string | null>(null)

  // Create record modal state
  const [createModal,   setCreateModal]   = useState<PendingAuction | null>(null)
  const [createAddress, setCreateAddress] = useState('')
  const [creating,      setCreating]      = useState(false)
  const [createError,   setCreateError]   = useState('')

  // Proceeds delivery modal state
  const [proceedsModal,     setProceedsModal]     = useState<ClerkingRecord | null>(null)
  const [proceedsDate,      setProceedsDate]       = useState('')
  const [proceedsNotes,     setProceedsNotes]      = useState('')
  const [savingProceeds,    setSavingProceeds]     = useState(false)

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/account/login'); return }
      if (session.user.email !== 'austin@breckyachtgroup.com') {
        router.replace('/'); return
      }
      setToken(session.access_token)
    })
  }, [router])

  // ── Fetch records ─────────────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (filterYear)             params.set('year',   filterYear)

    const res = await fetch(`/api/auctions/admin/clerking?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = await res.json()
    setRecords(d.records     ?? [])
    setNeedsRecord(d.needsRecord ?? [])
    setLoading(false)
  }, [token, filterStatus, filterYear])

  useEffect(() => { if (token) fetchRecords() }, [token, fetchRecords])

  // ── Create record ──────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!token || !createModal) return
    if (!createAddress.trim()) { setCreateError('Winner address is required.'); return }
    setCreating(true)
    setCreateError('')

    const res = await fetch('/api/auctions/admin/clerking', {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        auction_slug:   createModal.slug,
        winner_address: createAddress.trim(),
      }),
    })
    const d = await res.json()
    setCreating(false)

    if (!res.ok) {
      setCreateError(d.error ?? 'Failed to create record.')
      return
    }

    setCreateModal(null)
    setCreateAddress('')
    fetchRecords()
  }

  // ── Mark proceeds delivered ────────────────────────────────────────────────
  async function handleProceeds() {
    if (!token || !proceedsModal || !proceedsDate) return
    setSavingProceeds(true)

    const res = await fetch('/api/auctions/admin/clerking', {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        id:                      proceedsModal.id,
        proceeds_delivered_at:   new Date(proceedsDate).toISOString(),
        proceeds_delivery_notes: proceedsNotes || null,
      }),
    })

    setSavingProceeds(false)
    if (res.ok) {
      setProceedsModal(null)
      setProceedsDate('')
      setProceedsNotes('')
      fetchRecords()
    }
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = [
      'Event ID', 'Sale Date', 'Vessel', 'HIN', 'Condition',
      'Bidder #', 'Winner Name', 'Winner Email', 'Winner Address',
      'Hammer Price', 'Buyer Premium (5%)', 'Total Buyer Paid',
      'Proceeds Delivered', 'Delivery Notes', 'Record Created',
    ]
    const rows = records.map(r => [
      r.platform_event_id,
      fmtDateTime(r.sale_date),
      `${r.vessel_year} ${r.vessel_make} ${r.vessel_model}${r.vessel_length_ft ? ` ${r.vessel_length_ft}ft` : ''}`,
      r.vessel_hin ?? '',
      r.vessel_condition ?? '',
      r.winner_bidder_number,
      r.winner_name,
      r.winner_email,
      r.winner_address,
      r.hammer_price,
      r.buyer_premium_amount,
      r.total_buyer_paid,
      r.proceeds_delivered_at ? fmtDateTime(r.proceeds_delivered_at) : 'PENDING',
      r.proceeds_delivery_notes ?? '',
      fmtDateTime(r.created_at),
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `byg-clerking-records-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!token) return null

  const pendingProceeds = records.filter(r => !r.proceeds_delivered_at).length

  return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen text-white">

      {/* Header */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="px-8 py-6 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#c9a84c' }}>Breck Yacht Group</p>
          <h1 className="text-2xl font-bold">Clerking & Sales Records</h1>
          <p className="text-white/30 text-xs mt-1">
            Required by Florida auctioneer licensing — maintain for 2+ years
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/auctions/admin')}
            className="px-4 py-2 text-sm text-white/50 hover:text-white border border-white/20 hover:border-white/40 transition-colors"
          >
            ← Admin Dashboard
          </button>
          <button
            onClick={exportCSV}
            disabled={records.length === 0}
            className="px-5 py-2 text-sm font-bold uppercase tracking-wider disabled:opacity-40"
            style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="px-8 py-8 space-y-10">

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Records',       value: records.length },
            { label: 'Pending Proceeds',    value: pendingProceeds,
              color: pendingProceeds > 0 ? '#c9a84c' : undefined },
            { label: 'Auctions Needing Record', value: needsRecord.length,
              color: needsRecord.length > 0 ? '#cf6f6f' : undefined },
            { label: 'Total Hammer Value',
              value: records.length
                ? '$' + records.reduce((s, r) => s + r.hammer_price, 0).toLocaleString()
                : '$0' },
          ].map(stat => (
            <div key={stat.label} className="p-4" style={{ backgroundColor: '#111', border: '1px solid #222' }}>
              <p className="text-xs uppercase tracking-wider text-white/30 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color ?? '#fff' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Auctions Needing a Clerking Record ─────────────────────────── */}
        {needsRecord.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-red-400/80 mb-4">
              ⚠ Auctions Without a Clerking Record
            </h2>
            <div className="space-y-3">
              {needsRecord.map(a => (
                <div key={a.id} className="p-5 flex items-center justify-between"
                  style={{ backgroundColor: '#111', border: '1px solid #2a1a1a' }}>
                  <div>
                    <p className="font-semibold text-white">
                      {a.year} {a.make} {a.model}{a.length_ft ? ` · ${a.length_ft}ft` : ''}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      Ended {fmtDate(a.ends_at)} · Hammer: {fmt(a.current_bid)} · {a.bid_count} bid{a.bid_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => { setCreateModal(a); setCreateAddress('') }}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider flex-shrink-0"
                    style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}
                  >
                    Create Record
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1">
            {(['all', 'pending', 'delivered'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 text-xs uppercase tracking-wider font-semibold transition-colors"
                style={{
                  backgroundColor: filterStatus === s ? '#c9a84c' : '#1a1a1a',
                  color:           filterStatus === s ? '#0c1f3f' : 'rgba(255,255,255,0.4)',
                  border:          '1px solid ' + (filterStatus === s ? '#c9a84c' : '#333'),
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="px-3 py-1.5 text-xs"
            style={{ backgroundColor: '#1a1a1a', color: 'rgba(255,255,255,0.6)', border: '1px solid #333' }}
          >
            <option value="">All Years</option>
            {[2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-white/20 text-xs ml-auto">
            {records.length} record{records.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Records Table ─────────────────────────────────────────────────── */}
        {loading ? (
          <p className="text-white/30 text-sm animate-pulse">Loading records…</p>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-white/20 text-sm">No clerking records yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(r => {
              const isExpanded    = expandedId === r.id
              const hasProceeds   = !!r.proceeds_delivered_at

              return (
                <div key={r.id}
                  style={{ backgroundColor: '#111', border: `1px solid ${hasProceeds ? '#1a2a1a' : '#2a2a1a'}` }}>

                  {/* ── Record header row ──────────────────────────────────── */}
                  <div
                    className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    {/* Event ID */}
                    <div className="flex-shrink-0 w-32">
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Event ID</p>
                      <p className="font-mono font-bold text-sm" style={{ color: '#c9a84c' }}>
                        {r.platform_event_id}
                      </p>
                    </div>

                    {/* Vessel */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {r.vessel_year} {r.vessel_make} {r.vessel_model}
                        {r.vessel_length_ft ? ` · ${r.vessel_length_ft}ft` : ''}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">
                        Sold {fmtDate(r.sale_date)}
                        {r.vessel_hin ? ` · HIN: ${r.vessel_hin}` : ''}
                      </p>
                    </div>

                    {/* Winner */}
                    <div className="hidden sm:block flex-shrink-0 w-40">
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Winner</p>
                      <p className="text-white text-sm truncate">{r.winner_name}</p>
                      <p className="text-white/40 text-xs">Bidder #{r.winner_bidder_number}</p>
                    </div>

                    {/* Hammer price */}
                    <div className="flex-shrink-0 w-28 text-right">
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Hammer</p>
                      <p className="font-bold text-white">{fmt(r.hammer_price)}</p>
                    </div>

                    {/* Proceeds status */}
                    <div className="flex-shrink-0">
                      <span
                        className="px-2 py-1 text-xs font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: hasProceeds ? '#1a3a1a' : '#2a2a0a',
                          color:           hasProceeds ? '#6fcf6f'  : '#cfcf4f',
                        }}
                      >
                        {hasProceeds ? '✓ Delivered' : 'Pending'}
                      </span>
                    </div>

                    {/* Expand toggle */}
                    <div className="flex-shrink-0 text-white/20 text-lg">
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* ── Expanded detail view ───────────────────────────────── */}
                  {isExpanded && (
                    <div className="px-5 pb-6 pt-2" style={{ borderTop: '1px solid #1a1a1a' }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">

                        {/* Vessel details */}
                        <div>
                          <p className="text-xs uppercase tracking-widest text-white/30 mb-3 font-semibold">
                            Vessel Identification
                          </p>
                          <div className="space-y-1.5 text-white/70">
                            <p><span className="text-white/30">Year / Make / Model:</span>{' '}
                              {r.vessel_year} {r.vessel_make} {r.vessel_model}</p>
                            {r.vessel_length_ft && <p><span className="text-white/30">Length:</span> {r.vessel_length_ft} ft</p>}
                            {r.vessel_hin       && <p><span className="text-white/30">HIN:</span> <span className="font-mono">{r.vessel_hin}</span></p>}
                            {r.vessel_condition && <p><span className="text-white/30">Condition:</span> {r.vessel_condition}</p>}
                            <p>
                              <span className="text-white/30">Auction:</span>{' '}
                              <a href={`/auctions/${r.auction_slug}`} target="_blank"
                                className="underline" style={{ color: '#c9a84c' }}>
                                /auctions/{r.auction_slug} ↗
                              </a>
                            </p>
                          </div>
                        </div>

                        {/* Winner details */}
                        <div>
                          <p className="text-xs uppercase tracking-widest text-white/30 mb-3 font-semibold">
                            Winning Bidder
                          </p>
                          <div className="space-y-1.5 text-white/70">
                            <p><span className="text-white/30">Name:</span> {r.winner_name}</p>
                            <p><span className="text-white/30">Email:</span> {r.winner_email}</p>
                            <p><span className="text-white/30">Address:</span> {r.winner_address}</p>
                            <p><span className="text-white/30">Bidder #:</span> <span className="font-mono font-bold text-white">{r.winner_bidder_number}</span></p>
                          </div>
                        </div>

                        {/* Financials */}
                        <div>
                          <p className="text-xs uppercase tracking-widest text-white/30 mb-3 font-semibold">
                            Sale Financials
                          </p>
                          <div className="space-y-1.5 text-white/70">
                            <p><span className="text-white/30">Hammer Price:</span>{' '}
                              <span className="font-bold text-white">{fmt(r.hammer_price)}</span></p>
                            <p><span className="text-white/30">Buyer Premium ({r.buyer_premium_pct}%):</span>{' '}
                              {fmt(r.buyer_premium_amount)}</p>
                            <p><span className="text-white/30">Total Buyer Paid:</span>{' '}
                              <span className="font-bold" style={{ color: '#c9a84c' }}>{fmt(r.total_buyer_paid)}</span></p>
                            <p className="pt-2">
                              <span className="text-white/30">Sale Date:</span>{' '}
                              {fmtDateTime(r.sale_date)}
                            </p>
                            <p><span className="text-white/30">Platform Event ID:</span>{' '}
                              <span className="font-mono">{r.platform_event_id}</span></p>
                          </div>
                        </div>

                        {/* Proceeds delivery */}
                        <div className="sm:col-span-2 lg:col-span-3 pt-4" style={{ borderTop: '1px solid #1a1a1a' }}>
                          <p className="text-xs uppercase tracking-widest text-white/30 mb-3 font-semibold">
                            Proceeds Delivery to Seller
                          </p>
                          {r.proceeds_delivered_at ? (
                            <div className="flex items-start gap-6 flex-wrap">
                              <p className="text-white/70">
                                <span className="text-white/30">Delivered:</span>{' '}
                                <span className="text-green-400 font-semibold">
                                  {fmtDateTime(r.proceeds_delivered_at)}
                                </span>
                              </p>
                              {r.proceeds_delivery_notes && (
                                <p className="text-white/70">
                                  <span className="text-white/30">Notes:</span> {r.proceeds_delivery_notes}
                                </p>
                              )}
                              <button
                                onClick={() => {
                                  setProceedsModal(r)
                                  setProceedsDate(r.proceeds_delivered_at!.slice(0, 10))
                                  setProceedsNotes(r.proceeds_delivery_notes ?? '')
                                }}
                                className="text-xs underline text-white/30 hover:text-white"
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <p className="text-yellow-400/70 text-sm">
                                ⚠ Proceeds have not been marked as delivered to the seller.
                              </p>
                              <button
                                onClick={() => {
                                  setProceedsModal(r)
                                  setProceedsDate(new Date().toISOString().slice(0, 10))
                                  setProceedsNotes('')
                                }}
                                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex-shrink-0"
                                style={{ backgroundColor: '#1a3a1a', color: '#6fcf6f', border: '1px solid #2a5a2a' }}
                              >
                                Mark Delivered
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Description snippet */}
                        {r.vessel_description && (
                          <div className="sm:col-span-2 lg:col-span-3 pt-2">
                            <p className="text-xs uppercase tracking-widest text-white/30 mb-2 font-semibold">
                              Vessel Description (Snapshot)
                            </p>
                            <p className="text-white/40 text-xs leading-relaxed line-clamp-4">
                              {r.vessel_description}
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="text-white/20 text-xs mt-6">
                        Record created {fmtDateTime(r.created_at)}
                        {r.created_by_email ? ` by ${r.created_by_email}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Create Record Modal ───────────────────────────────────────────────── */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg p-6" style={{ backgroundColor: '#111', border: '1px solid #333' }}>
            <h2 className="text-lg font-bold text-white mb-1">Create Clerking Record</h2>
            <p className="text-white/40 text-xs mb-5">
              {createModal.year} {createModal.make} {createModal.model}
              {createModal.length_ft ? ` · ${createModal.length_ft}ft` : ''}
              {' '}· Hammer: {fmt(createModal.current_bid)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40 block mb-1.5">
                  Winner&apos;s Full Mailing Address *
                </label>
                <textarea
                  value={createAddress}
                  onChange={e => setCreateAddress(e.target.value)}
                  placeholder={'123 Marina Way\nFort Lauderdale, FL 33316'}
                  rows={3}
                  className="w-full px-3 py-2 text-sm text-white placeholder-white/20 resize-none"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}
                />
                <p className="text-white/20 text-xs mt-1">
                  Required by state auctioneer regulations. Street, city, state, zip.
                </p>
              </div>

              {createError && (
                <p className="text-red-400 text-sm">{createError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 py-2.5 text-sm font-bold uppercase tracking-wider disabled:opacity-40"
                  style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}
                >
                  {creating ? 'Creating…' : 'Create Record'}
                </button>
                <button
                  onClick={() => { setCreateModal(null); setCreateError('') }}
                  className="px-5 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
                  style={{ border: '1px solid #333' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Proceeds Delivery Modal ────────────────────────────────────────────── */}
      {proceedsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md p-6" style={{ backgroundColor: '#111', border: '1px solid #333' }}>
            <h2 className="text-lg font-bold text-white mb-1">Mark Proceeds Delivered</h2>
            <p className="text-white/40 text-xs mb-5">
              {proceedsModal.platform_event_id} — {proceedsModal.vessel_year} {proceedsModal.vessel_make} {proceedsModal.vessel_model}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40 block mb-1.5">
                  Date Proceeds Delivered *
                </label>
                <input
                  type="date"
                  value={proceedsDate}
                  onChange={e => setProceedsDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-white"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-white/40 block mb-1.5">
                  Delivery Notes (optional)
                </label>
                <input
                  type="text"
                  value={proceedsNotes}
                  onChange={e => setProceedsNotes(e.target.value)}
                  placeholder="e.g. Wire transfer ref #12345, or Check #4421 mailed"
                  className="w-full px-3 py-2 text-sm text-white placeholder-white/20"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleProceeds}
                  disabled={savingProceeds || !proceedsDate}
                  className="flex-1 py-2.5 text-sm font-bold uppercase tracking-wider disabled:opacity-40"
                  style={{ backgroundColor: '#1a3a1a', color: '#6fcf6f', border: '1px solid #2a5a2a' }}
                >
                  {savingProceeds ? 'Saving…' : 'Confirm Delivery'}
                </button>
                <button
                  onClick={() => { setProceedsModal(null) }}
                  className="px-5 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
                  style={{ border: '1px solid #333' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
