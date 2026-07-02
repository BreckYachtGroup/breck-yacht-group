'use client'
/**
 * /valuation-lab — Internal test page for the BYG Valuation Engine.
 * Not linked from nav. noindex enforced via meta tag below.
 * For Austin's eyes only during development.
 */

import { useState } from 'react'
import Head from 'next/head'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1979 }, (_, i) => CURRENT_YEAR - i)

interface CompRow {
  name:      string
  year:      number
  make:      string
  model:     string
  length_ft: number
  hours:     number
  price:     number
  location:  string
}

interface EngineBreakdown {
  label:         string
  msrpEach:      number
  residualEach:  number
  totalResidual: number
  baselineDesc:  string
  baselineValue: number
  delta:         number
  found:         boolean
}

interface ValuationResult {
  low:              number
  mid:              number
  high:             number
  confidence:       'high' | 'medium' | 'low'
  comp_count:       number
  comps:            CompRow[]
  methodology:      string
  engine_breakdown: EngineBreakdown | null
  error?:           string
}

const CONFIDENCE_COLOR = {
  high:   'text-green-600',
  medium: 'text-yellow-600',
  low:    'text-red-500',
}

export default function ValuationLab() {
  const [form, setForm] = useState({
    year:         String(CURRENT_YEAR - 2),
    make:         '',
    model:        '',
    length_ft:    '',
    hours:        '',
    condition:    'good',
    state:        '',
    engine_count: '',
    engine_make:  '',
    engine_model: '',
  })
  const [result, setResult]   = useState<ValuationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/valuation/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year:         Number(form.year),
          make:         form.make,
          model:        form.model || undefined,
          length_ft:    Number(form.length_ft),
          hours:        form.hours ? Number(form.hours) : undefined,
          condition:    form.condition,
          state:        form.state || undefined,
          engine_count: form.engine_count ? Number(form.engine_count) : undefined,
          engine_make:  form.engine_make || undefined,
          engine_model: form.engine_model || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Valuation failed')
      } else {
        setResult(data)
      }
    } catch {
      setError('Network error — is the proxy running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <title>Valuation Lab — Internal BYG</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-8 border-l-4 pl-4" style={{ borderColor: '#c9a84c' }}>
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Internal Tool — Not Public</p>
            <h1 className="text-3xl font-bold" style={{ color: '#0c1f3f' }}>BYG Valuation Engine</h1>
            <p className="text-sm text-gray-400 mt-1">Comp-based market valuation using live MLS data</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-8 shadow-sm space-y-5 mb-8">
            <div className="grid grid-cols-2 gap-5">

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Year *</label>
                <select
                  value={form.year}
                  onChange={e => set('year', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Make *</label>
                <input
                  type="text"
                  value={form.make}
                  onChange={e => set('make', e.target.value)}
                  placeholder="e.g. Sportsman, Contender, Viking"
                  required
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Model</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={e => set('model', e.target.value)}
                  placeholder="e.g. 352 Open, 39 ST"
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Length (ft) *</label>
                <input
                  type="number"
                  value={form.length_ft}
                  onChange={e => set('length_ft', e.target.value)}
                  placeholder="e.g. 35"
                  required
                  min="10" max="200"
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engine Hours</label>
                <input
                  type="number"
                  value={form.hours}
                  onChange={e => set('hours', e.target.value)}
                  placeholder="e.g. 450"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Condition *</label>
                <select
                  value={form.condition}
                  onChange={e => set('condition', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Number of Engines</label>
                <select
                  value={form.engine_count}
                  onChange={e => set('engine_count', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded"
                >
                  <option value="">Unknown</option>
                  <option value="1">1 — Single</option>
                  <option value="2">2 — Twin</option>
                  <option value="3">3 — Triple</option>
                  <option value="4">4 — Quad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engine Make</label>
                <input
                  type="text"
                  value={form.engine_make}
                  onChange={e => set('engine_make', e.target.value)}
                  placeholder="e.g. Mercury, Yamaha, Volvo"
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engine Model / Series</label>
                <input
                  type="text"
                  value={form.engine_model}
                  onChange={e => set('engine_model', e.target.value)}
                  placeholder="e.g. Verado 400, F350, V8"
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">State (optional)</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={e => set('state', e.target.value)}
                  placeholder="e.g. Florida"
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold tracking-widest uppercase text-white transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#0c1f3f' }}
            >
              {loading ? 'Analyzing market...' : 'Run Valuation'}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded text-sm mb-6">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-white border border-gray-100 p-8 shadow-sm space-y-8">

              {/* Value range */}
              <div>
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Estimated Market Value</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border border-gray-100 py-6 px-4">
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Conservative</p>
                    <p className="text-2xl font-bold" style={{ color: '#0c1f3f' }}>${result.low.toLocaleString()}</p>
                  </div>
                  <div className="border-2 py-6 px-4" style={{ borderColor: '#c9a84c' }}>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#c9a84c' }}>Most Likely</p>
                    <p className="text-3xl font-bold" style={{ color: '#0c1f3f' }}>${result.mid.toLocaleString()}</p>
                  </div>
                  <div className="border border-gray-100 py-6 px-4">
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Optimistic</p>
                    <p className="text-2xl font-bold" style={{ color: '#0c1f3f' }}>${result.high.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Confidence + comp count */}
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-400 uppercase tracking-widest text-xs">Confidence: </span>
                  <span className={`font-semibold capitalize ${CONFIDENCE_COLOR[result.confidence]}`}>
                    {result.confidence}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase tracking-widest text-xs">Comps used: </span>
                  <span className="font-semibold" style={{ color: '#0c1f3f' }}>{result.comp_count}</span>
                </div>
              </div>

              {/* Engine breakdown */}
              {result.engine_breakdown && result.engine_breakdown.found && (
                <div className="bg-gray-50 border border-gray-100 rounded p-5 space-y-2 text-sm">
                  <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">Engine Package Analysis</p>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-500">Your engines</span>
                    <span className="font-medium" style={{ color: '#0c1f3f' }}>{result.engine_breakdown.label}</span>
                    <span className="text-gray-500">Retail per engine</span>
                    <span className="font-medium" style={{ color: '#0c1f3f' }}>${result.engine_breakdown.msrpEach.toLocaleString()}</span>
                    <span className="text-gray-500">Current residual (each)</span>
                    <span className="font-medium" style={{ color: '#0c1f3f' }}>${result.engine_breakdown.residualEach.toLocaleString()}</span>
                    <span className="text-gray-500">Total engine package value</span>
                    <span className="font-semibold" style={{ color: '#0c1f3f' }}>${result.engine_breakdown.totalResidual.toLocaleString()}</span>
                    <span className="text-gray-500">Comp baseline ({result.engine_breakdown.baselineDesc})</span>
                    <span className="font-medium" style={{ color: '#0c1f3f' }}>${result.engine_breakdown.baselineValue.toLocaleString()}</span>
                    <span className="text-gray-500">Engine adjustment to valuation</span>
                    <span className={`font-semibold ${result.engine_breakdown.delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {result.engine_breakdown.delta >= 0 ? '+' : ''}${result.engine_breakdown.delta.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Methodology */}
              <p className="text-xs text-gray-400 italic">{result.methodology}</p>

              {/* Comp table */}
              {result.comps.length > 0 && (
                <div>
                  <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">Top Comparable Listings</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Vessel', 'Year', 'Length', 'Hours', 'Price', 'Location'].map(h => (
                            <th key={h} className="text-left text-xs uppercase tracking-widest text-gray-400 pb-2 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.comps.map((c, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-2 pr-4 font-medium" style={{ color: '#0c1f3f' }}>{c.name}</td>
                            <td className="py-2 pr-4 text-gray-500">{c.year}</td>
                            <td className="py-2 pr-4 text-gray-500">{c.length_ft}ft</td>
                            <td className="py-2 pr-4 text-gray-500">{c.hours > 0 ? c.hours.toLocaleString() : '—'}</td>
                            <td className="py-2 pr-4 font-semibold" style={{ color: '#0c1f3f' }}>${c.price.toLocaleString()}</td>
                            <td className="py-2 text-gray-500">{c.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
