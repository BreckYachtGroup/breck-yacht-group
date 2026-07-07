'use client'

/**
 * /valuation-data  — Private admin view of valuation submissions
 * Protected: only huebya@gmail.com can access
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Submission = {
  id: string
  created_at: string
  year: number
  make: string
  model: string | null
  length_ft: number
  condition: string
  hours: number | null
  state: string | null
  engine_count: number | null
  engine_make: string | null
  engine_model: string | null
  val_low: number | null
  val_mid: number | null
  val_high: number | null
  confidence: string | null
  comp_count: number | null
}

function fmt(n: number | null) {
  if (n == null) return '—'
  return '$' + n.toLocaleString()
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   '#4ade80',
  medium: '#c9a84c',
  low:    '#f87171',
}

export default function ValuationDataPage() {
  const router = useRouter()
  const [rows,    setRows]    = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sortKey, setSortKey] = useState<keyof Submission>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user.email !== 'austin@breckyachtgroup.com') {
        router.replace('/'); return
      }

      const { data, error } = await supabaseAdmin
        .from('valuation_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) console.error(error)
      setRows(data ?? [])
      setLoading(false)
    })
  }, [router])

  function toggleSort(key: keyof Submission) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = rows.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.make.toLowerCase().includes(q) ||
      (r.model ?? '').toLowerCase().includes(q) ||
      String(r.year).includes(q) ||
      (r.state ?? '').toLowerCase().includes(q)
    )
  }).sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  // Summary stats
  const total    = rows.length
  const makes    = [...new Set(rows.map(r => r.make))].length
  const avgMid   = rows.filter(r => r.val_mid).reduce((s, r) => s + (r.val_mid ?? 0), 0) / (rows.filter(r => r.val_mid).length || 1)
  const highConf = rows.filter(r => r.confidence === 'high').length

  const SortIcon = ({ col }: { col: keyof Submission }) => (
    <span style={{ opacity: sortKey === col ? 1 : 0.3, fontSize: '10px', marginLeft: '4px' }}>
      {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '▼'}
    </span>
  )

  if (loading) return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen flex items-center justify-center">
      <p className="text-white/30 text-sm animate-pulse tracking-widest uppercase">Loading…</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen text-white">

      {/* Header */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="px-8 py-6 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#c9a84c' }}>Admin · Analytics</p>
          <h1 className="text-2xl font-bold">Valuation Submissions</h1>
        </div>
        <button onClick={() => router.push('/')}
          className="text-white/40 hover:text-white text-sm">← Home</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-px px-8 pt-8 pb-2" style={{ backgroundColor: 'transparent' }}>
        {[
          { label: 'Total Submissions', value: total.toLocaleString() },
          { label: 'Unique Makes',      value: makes.toLocaleString() },
          { label: 'Avg Estimated Value', value: fmt(Math.round(avgMid / 1000) * 1000) },
          { label: 'High Confidence',   value: `${highConf} (${total ? Math.round(highConf / total * 100) : 0}%)` },
        ].map(({ label, value }) => (
          <div key={label} className="p-5" style={{ backgroundColor: '#111', border: '1px solid #1a1a1a' }}>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-2xl font-bold" style={{ color: '#c9a84c' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-8 py-4">
        <input
          type="text"
          placeholder="Search by make, model, year, or state…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 text-sm text-white bg-transparent border focus:outline-none focus:border-yellow-500/50"
          style={{ backgroundColor: '#111', borderColor: '#333' }}
        />
        <span className="text-white/30 text-xs ml-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="px-8 pb-16 overflow-x-auto">
        <table className="w-full text-sm border-collapse" style={{ minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #222' }}>
              {([
                ['created_at', 'Date'],
                ['year',       'Year'],
                ['make',       'Make'],
                ['model',      'Model'],
                ['length_ft',  'Ft'],
                ['condition',  'Cond'],
                ['hours',      'Hrs'],
                ['val_low',    'Low'],
                ['val_mid',    'Mid'],
                ['val_high',   'High'],
                ['confidence', 'Conf'],
                ['comp_count', 'Comps'],
              ] as [keyof Submission, string][]).map(([key, label]) => (
                <th key={key}
                  onClick={() => toggleSort(key)}
                  className="text-left py-3 pr-4 text-xs uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: '#666' }}>
                  {label}<SortIcon col={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={12} className="py-12 text-center text-white/20 text-sm">No submissions yet.</td></tr>
            )}
            {filtered.map((r, i) => (
              <tr key={r.id}
                style={{ borderBottom: '1px solid #1a1a1a', backgroundColor: i % 2 === 0 ? '#0d0d0d' : '#0a0a0a' }}>
                <td className="py-3 pr-4 text-white/40 text-xs whitespace-nowrap">{fmtDate(r.created_at)}</td>
                <td className="py-3 pr-4 text-white/70">{r.year}</td>
                <td className="py-3 pr-4 text-white font-medium">{r.make}</td>
                <td className="py-3 pr-4 text-white/60">{r.model ?? '—'}</td>
                <td className="py-3 pr-4 text-white/60">{r.length_ft}</td>
                <td className="py-3 pr-4 text-white/60 capitalize">{r.condition}</td>
                <td className="py-3 pr-4 text-white/60">{r.hours?.toLocaleString() ?? '—'}</td>
                <td className="py-3 pr-4 text-white/50">{fmt(r.val_low)}</td>
                <td className="py-3 pr-4 font-semibold" style={{ color: '#c9a84c' }}>{fmt(r.val_mid)}</td>
                <td className="py-3 pr-4 text-white/50">{fmt(r.val_high)}</td>
                <td className="py-3 pr-4">
                  <span className="text-xs font-semibold uppercase"
                    style={{ color: CONFIDENCE_COLOR[r.confidence ?? ''] ?? '#666' }}>
                    {r.confidence ?? '—'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-white/40">{r.comp_count ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
