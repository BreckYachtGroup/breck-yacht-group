'use client'

/**
 * /sell/value-my-vessel
 *
 * Two-panel valuation page:
 * Left  — AI Instant Estimate (comp-based, live MLS data)
 * Right — Request a Broker Quote (manual, emails Austin within 24hrs)
 *
 * Lead gate: show price range teaser immediately, lock full breakdown
 * behind name + email capture. Gate submit emails Austin via /api/valuation.
 */

import { useState, useEffect, useRef } from 'react'
import ValuationForm from '@/components/ValuationForm'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!

// ── Types ──────────────────────────────────────────────────────────────────────

interface CompRow {
  name: string; year: number; make: string; model: string
  length_ft: number; hours: number; price: number; location: string
  url: string | null
}

interface ValuationResult {
  low: number; mid: number; high: number
  confidence: 'high' | 'medium' | 'low'
  comp_count: number; comps: CompRow[]
  methodology: string
  engine_breakdown?: unknown // internal only — not displayed on public page
}

type Stage = 'input' | 'teaser' | 'unlocked'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1979 }, (_, i) => CURRENT_YEAR - i)

const BOAT_MAKES = [
  // Center Consoles
  'Sportsman', 'Invincible', 'Yellowfin', 'Freeman', 'Contender', 'Regulator',
  'Grady-White', 'Boston Whaler', 'Pursuit', 'Everglades', 'Hydra-Sports',
  'Scout', 'Cobia', 'Robalo', 'Sea Fox', 'Mako', 'Sailfish', 'Release',
  'World Cat', 'Midnight Express', 'Statement Marine', 'Nor-Tech',
  'Jupiter', 'Intrepid', 'Cape Horn', 'Pro-Line', 'Aquasport',
  // Sportfish / Convertibles
  'Viking', 'Hatteras', 'Bertram', 'Cabo', 'Riviera', 'Ocean', 'Luhrs',
  'Tiara', 'Albemarle', 'Blackfin', 'Jarvis Newman', 'Spencer', 'Paul Mann',
  'Rybovich', 'Merritt', 'Winter Custom Yachts', 'Buddy Davis', 'Post',
  'Striker', 'Topaz', 'Davis',
  // Luxury Motor Yachts
  'Princess', 'Sunseeker', 'Azimut', 'Ferretti', 'Pershing', 'Riva',
  'Benetti', 'Lurssen', 'Sunreef', 'Mangusta', 'Leopard', 'Cranchi',
  'Sanlorenzo', 'Monte Carlo Yachts', 'Absolute', 'Numarine', 'Westport',
  'Feadship', 'Amels', 'Heesen', 'Baglietto', 'Sealine',
  // Catamarans
  'Lagoon', 'Fountaine Pajot', 'Leopard', 'Privilege',
  // Performance
  'Cigarette', 'Fountain', 'Formula', 'Scarab', 'Donzi', 'Baja', 'Glasstream',
  // Recreational / General
  'Sea Ray', 'Chaparral', 'Regal', 'Cobalt', 'Four Winns', 'Wellcraft',
  'Chris-Craft', 'Jeanneau', 'Bavaria', 'Sea Hunt', 'Key West', 'Nautic Star',
  // Walkarounds / Dual Console
  'Edgewater', 'Pathfinder', 'Ranger', 'Skeeter', 'Tidewater',
  // Trawlers / Motor Yachts
  'Grand Banks', 'Nordhavn', 'Kadey-Krogen', 'Ocean Alexander', 'DeFever', 'Selene',
].filter((v, i, a) => a.indexOf(v) === i).sort()

const CONFIDENCE_COLOR = { high: 'text-green-600', medium: 'text-yellow-600', low: 'text-red-500' }

// Compact price formatter: $455,000 → $455K, $1,200,000 → $1.2M
function fmtK(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(3).replace(/\.?0+$/, '')}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${n.toLocaleString()}`
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ValueMyVesselPage() {
  // AI tool state
  const [form, setForm] = useState({
    year: String(CURRENT_YEAR - 3), make: '', model: '', length_ft: '',
    hours: '', condition: 'good', engine_count: '', engine_make: '', engine_model: '',
  })
  const [result, setResult]   = useState<ValuationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [stage, setStage]     = useState<Stage>('input')

  // Make autocomplete state
  const [showMakes, setShowMakes] = useState(false)
  const filteredMakes = BOAT_MAKES.filter(m =>
    m.toLowerCase().includes(form.make.toLowerCase())
  )

  // Gate state
  const [gate, setGate]           = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [gateLoading, setGateLoading] = useState(false)
  const [gateError, setGateError]   = useState<string | null>(null)
  const gateTurnstileRef = useRef<HTMLDivElement>(null)
  const gateWidgetId     = useRef<string | null>(null)

  // Load Turnstile for the gate form
  useEffect(() => {
    const scriptId = 'cf-turnstile-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true; script.defer = true
      document.head.appendChild(script)
    }
    const render = () => {
      if (gateTurnstileRef.current && (window as any).turnstile && !gateWidgetId.current) {
        gateWidgetId.current = (window as any).turnstile.render(gateTurnstileRef.current, { sitekey: SITE_KEY, theme: 'light' })
      }
    }
    if ((window as any).turnstile) { render() } else {
      const interval = setInterval(() => { if ((window as any).turnstile) { render(); clearInterval(interval) } }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setG = (k: string, v: string) => setGate(g => ({ ...g, [k]: v }))

  // Step 1: run the AI valuation
  async function handleEstimate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null); setStage('input')
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
          engine_count: form.engine_count ? Number(form.engine_count) : undefined,
          engine_make:  form.engine_make || undefined,
          engine_model: form.engine_model || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? 'Valuation failed'); return }
      setResult(data)
      setStage('teaser')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: unlock full results — capture lead and email Austin
  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!result) return
    const token = (window as any).turnstile?.getResponse(gateWidgetId.current)
    if (!token) { setGateError('Please complete the security check.'); return }
    setGateLoading(true); setGateError(null)
    try {
      const emailRes = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: gate.firstName,
          lastName:  gate.lastName,
          email:     gate.email,
          phone:     gate.phone,
          year:      form.year,
          make:      form.make,
          model:     form.model,
          length:    form.length_ft,
          hours:     form.hours,
          engines:   [form.engine_count, form.engine_make, form.engine_model].filter(Boolean).join(' '),
          location:  '',
          notes:     `AI Estimate — Conservative $${result.low.toLocaleString()} / Mid $${result.mid.toLocaleString()} / High $${result.high.toLocaleString()}. Confidence: ${result.confidence}. Comps: ${result.comp_count}.`,
        }),
      })
      if (!emailRes.ok) { setGateError('Failed to send — please check your email and try again.'); ;(window as any).turnstile?.reset(gateWidgetId.current); return }
      setStage('unlocked')
    } catch {
      setGateError('Something went wrong. Please try again.')
    } finally {
      setGateLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      {/* Hero */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Sell Your Vessel</p>
        <h1 className="text-4xl font-bold mb-3">What Is My Boat Worth?</h1>
        <p className="text-gray-300 text-sm max-w-xl mx-auto leading-relaxed">
          Get an instant AI-powered estimate based on live market data, or request a personalised assessment from our team.
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* ── LEFT: AI Instant Estimate ─────────────────────────────────── */}
        <div className="bg-white shadow-sm border border-gray-100 p-8">
          <div className="border-l-4 pl-4 mb-8" style={{ borderColor: '#c9a84c' }}>
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Instant AI Estimate</p>
            <h2 className="text-2xl font-bold" style={{ color: '#0c1f3f' }}>Live Market Valuation</h2>
            <p className="text-sm text-gray-400 mt-1">Based on real comparable listings updated daily</p>
          </div>

          {/* Input form */}
          {stage === 'input' && (
            <form onSubmit={handleEstimate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Year *</label>
                  <select value={form.year} onChange={e => set('year', e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Make *</label>
                  <input
                    type="text" value={form.make} required
                    placeholder="e.g. Sportsman, Viking"
                    onChange={e => { set('make', e.target.value); setShowMakes(true) }}
                    onFocus={() => setShowMakes(true)}
                    onBlur={() => setTimeout(() => setShowMakes(false), 150)}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded"
                  />
                  {showMakes && filteredMakes.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto mt-1">
                      {filteredMakes.map(m => (
                        <li key={m}
                          onMouseDown={() => { set('make', m); setShowMakes(false) }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                          style={{ color: '#0c1f3f' }}>
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Model</label>
                  <input type="text" value={form.model} onChange={e => set('model', e.target.value)}
                    placeholder="e.g. 352 Open, 48 Convertible"
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Length (ft) *</label>
                  <input type="number" value={form.length_ft} onChange={e => set('length_ft', e.target.value)}
                    placeholder="e.g. 35" required min="10" max="200"
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engine Hours</label>
                  <input type="number" value={form.hours} onChange={e => set('hours', e.target.value)}
                    placeholder="e.g. 450" min="0"
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Condition *</label>
                  <select value={form.condition} onChange={e => set('condition', e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded">
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engines</label>
                  <select value={form.engine_count} onChange={e => set('engine_count', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded">
                    <option value="">Quantity</option>
                    <option value="1">Single</option>
                    <option value="2">Twin</option>
                    <option value="3">Triple</option>
                    <option value="4">Quad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engine Make</label>
                  <input type="text" value={form.engine_make} onChange={e => set('engine_make', e.target.value)}
                    placeholder="Mercury, Yamaha…"
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engine Model / Series</label>
                <input type="text" value={form.engine_model} onChange={e => set('engine_model', e.target.value)}
                  placeholder="e.g. Verado 400, F350"
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 text-sm font-semibold tracking-widest uppercase text-white transition-opacity hover:opacity-80 disabled:opacity-50 rounded"
                style={{ backgroundColor: '#0c1f3f' }}>
                {loading ? 'Analyzing market data…' : 'Get My Instant Estimate'}
              </button>
            </form>
          )}

          {/* Teaser — price range visible, full breakdown locked */}
          {(stage === 'teaser' || stage === 'unlocked') && result && (
            <div className="space-y-6">
              {/* Always-visible price range */}
              <div>
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Estimated Market Value</p>
                <div className="grid grid-cols-3 gap-3 text-center mb-2">
                  <div className="border border-gray-100 py-5 px-2 flex flex-col items-center justify-between min-h-[90px]">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Low</p>
                    <p className="text-xl font-bold mt-auto" style={{ color: '#0c1f3f' }}>{fmtK(result.low)}</p>
                  </div>
                  <div className="border-2 py-5 px-2 flex flex-col items-center justify-between min-h-[90px]" style={{ borderColor: '#c9a84c' }}>
                    <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#c9a84c' }}>Mid</p>
                    <p className="text-2xl font-bold mt-auto" style={{ color: '#0c1f3f' }}>{fmtK(result.mid)}</p>
                  </div>
                  <div className="border border-gray-100 py-5 px-2 flex flex-col items-center justify-between min-h-[90px]">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">High</p>
                    <p className="text-xl font-bold mt-auto" style={{ color: '#0c1f3f' }}>{fmtK(result.high)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                  <span>Confidence: <span className={`font-semibold capitalize ${CONFIDENCE_COLOR[result.confidence]}`}>{result.confidence}</span></span>
                  <span>{result.comp_count} comparable listings analyzed</span>
                </div>
              </div>

              {/* Gate — lock full breakdown */}
              {stage === 'teaser' && (
                <div className="border border-gray-100 bg-gray-50 rounded p-6">
                  <p className="text-sm font-semibold mb-1" style={{ color: '#0c1f3f' }}>Unlock the Full Breakdown</p>
                  <p className="text-xs text-gray-400 mb-4">See comparable listings, engine package analysis, and detailed methodology. A Breck Yacht Group broker will also follow up to compare notes.</p>
                  <form onSubmit={handleUnlock} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="First Name" required value={gate.firstName}
                        onChange={e => setG('firstName', e.target.value)}
                        className="px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                      <input type="text" placeholder="Last Name" required value={gate.lastName}
                        onChange={e => setG('lastName', e.target.value)}
                        className="px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                    </div>
                    <input type="email" placeholder="Email Address" required value={gate.email}
                      onChange={e => setG('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                    <input type="tel" placeholder="Phone (optional)" value={gate.phone}
                      onChange={e => setG('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                    <div ref={gateTurnstileRef} />
                    {gateError && <p className="text-red-500 text-xs">{gateError}</p>}
                    <button type="submit" disabled={gateLoading}
                      className="w-full py-3 text-sm font-semibold tracking-widest uppercase text-white transition-opacity hover:opacity-80 disabled:opacity-50 rounded"
                      style={{ backgroundColor: '#c9a84c' }}>
                      {gateLoading ? 'Unlocking…' : 'View Full Report'}
                    </button>
                    <p className="text-xs text-gray-400 text-center">No spam. We&apos;ll only reach out about your vessel.</p>
                  </form>
                </div>
              )}

              {/* Full unlocked results */}
              {stage === 'unlocked' && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-100 rounded px-4 py-3 text-sm text-green-700">
                    ✓ Report unlocked. Austin will be in touch to compare notes.
                  </div>

                  {/* Comp table */}
                  {result.comps.length > 0 && (
                    <div>
                      <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">Top Comparable Listings</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100">
                              {['Vessel', 'Year', 'Len', 'Hrs', 'Price', 'Location'].map(h => (
                                <th key={h} className="text-left uppercase tracking-widest text-gray-400 pb-2 pr-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.comps.map((c, i) => (
                              <tr key={i} className="border-b border-gray-50">
                                <td className="py-2 pr-3 font-medium" style={{ color: '#0c1f3f' }}>
                                  {c.url
                                    ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">{c.name}</a>
                                    : c.name}
                                </td>
                                <td className="py-2 pr-3 text-gray-500">{c.year}</td>
                                <td className="py-2 pr-3 text-gray-500">{c.length_ft}ft</td>
                                <td className="py-2 pr-3 text-gray-500">{c.hours > 0 ? c.hours.toLocaleString() : '—'}</td>
                                <td className="py-2 pr-3 font-semibold" style={{ color: '#0c1f3f' }}>${c.price.toLocaleString()}</td>
                                <td className="py-2 text-gray-500">{c.location}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 italic">{result.methodology}</p>
                  <p className="text-xs text-gray-400 italic">9% list-to-sale discount applied — comps reflect asking prices, not closed transactions.</p>

                  <button onClick={() => { setStage('input'); setResult(null) }}
                    className="text-xs underline text-gray-400 hover:text-gray-600">
                    Run another valuation
                  </button>
                </div>
              )}

              {/* Legal disclaimer — always visible once results show */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-gray-500">Disclaimer:</strong> This estimate is generated algorithmically using publicly available comparable listing data and is provided for informational purposes only. It does not constitute a certified appraisal, broker opinion of value, or guarantee of sale price. Actual market value may vary based on vessel condition, survey findings, location, buyer demand, and negotiation. Breck Yacht Group assumes no liability for decisions made based on this estimate. For a professional assessment, please consult a licensed marine broker or NAMS/SAMS certified surveyor.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Broker Quote ────────────────────────────────────────── */}
        <div className="bg-white shadow-sm border border-gray-100 p-8">
          <div className="border-l-4 pl-4 mb-8" style={{ borderColor: '#0c1f3f' }}>
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Broker Assessment</p>
            <h2 className="text-2xl font-bold" style={{ color: '#0c1f3f' }}>Speak to a Broker</h2>
            <p className="text-sm text-gray-400 mt-1">Personal valuation from Austin within 24 hours</p>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            While our AI tool gives you an instant data-driven range, nothing replaces a broker who knows the market firsthand. Fill out the form below and Austin will review your vessel personally and follow up with a detailed market opinion.
          </p>

          <ValuationForm />
        </div>

      </div>
    </div>
  )
}
