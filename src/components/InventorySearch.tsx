'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { type Listing } from '@/lib/listings'

export default function InventorySearch() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // ── Server-fetched vessels ──────────────────────────────────────────────────
  const [vessels, setVessels] = useState<Listing[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // ── Dropdown options from /meta ─────────────────────────────────────────────
  const [metaStates, setMetaStates] = useState<string[]>([])
  const [metaFuelTypes, setMetaFuelTypes] = useState<string[]>([])
  const [metaBoatTypes, setMetaBoatTypes] = useState<string[]>([])

  // ── Filter state — initialized from URL params ──────────────────────────────
  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') || '')
  const [make, setMake] = useState(() => searchParams.get('make') || '')
  const [model, setModel] = useState(() => searchParams.get('model') || '')
  const [state, setState] = useState(() => searchParams.get('state') || '')
  const [fuelType, setFuelType] = useState(() => searchParams.get('fuelType') || '')
  const [boatType, setBoatType] = useState(() => searchParams.get('boatType') || '')
  const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') || '')
  const [minYear, setMinYear] = useState(() => searchParams.get('minYear') || '')
  const [maxYear, setMaxYear] = useState(() => searchParams.get('maxYear') || '')
  const [minLength, setMinLength] = useState(() => searchParams.get('minLength') || '')
  const [maxLength, setMaxLength] = useState(() => searchParams.get('maxLength') || '')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showOwn, setShowOwn] = useState(() => searchParams.get('tab') !== 'all')

  // ── Sync filter state to URL so back button restores search ─────────────────
  useEffect(() => {
    const p = new URLSearchParams()
    if (!showOwn) p.set('tab', 'all')
    if (keyword)   p.set('keyword',   keyword)
    if (make)      p.set('make',      make)
    if (model)     p.set('model',     model)
    if (state)     p.set('state',     state)
    if (fuelType)  p.set('fuelType',  fuelType)
    if (boatType)  p.set('boatType',  boatType)
    if (minPrice)  p.set('minPrice',  minPrice)
    if (maxPrice)  p.set('maxPrice',  maxPrice)
    if (minYear)   p.set('minYear',   minYear)
    if (maxYear)   p.set('maxYear',   maxYear)
    if (minLength) p.set('minLength', minLength)
    if (maxLength) p.set('maxLength', maxLength)
    const qs = p.toString()
    router.replace(qs ? `/inventory?${qs}` : '/inventory', { scroll: false })
  }, [showOwn, keyword, make, model, state, fuelType, boatType, minPrice, maxPrice, minYear, maxYear, minLength, maxLength]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounce timer ref ──────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch dropdown options on mount ────────────────────────────────────────
  useEffect(() => {
    fetch('/api/vessels/meta')
      .then(r => r.json())
      .then(d => {
        setMetaStates(d.states ?? [])
        setMetaFuelTypes(d.fuelTypes ?? [])
        setMetaBoatTypes(d.boatTypes ?? [])
      })
      .catch(() => {/* non-critical — dropdowns stay empty */})
  }, [])

  // ── Build query string from current filters ─────────────────────────────────
  const buildParams = useCallback((page: number) => {
    const p = new URLSearchParams()
    p.set('page', String(page))
    if (showOwn)   p.set('bygOnly',   'true')
    if (keyword)   p.set('keyword',   keyword)
    if (make)      p.set('make',      make)
    if (model)     p.set('model',     model)
    if (state)     p.set('state',     state)
    if (fuelType)  p.set('fuelType',  fuelType)
    if (boatType)  p.set('boatType',  boatType)
    if (minPrice)  p.set('minPrice',  minPrice)
    if (maxPrice)  p.set('maxPrice',  maxPrice)
    if (minYear)   p.set('minYear',   minYear)
    if (maxYear)   p.set('maxYear',   maxYear)
    if (minLength) p.set('minLength', minLength)
    if (maxLength) p.set('maxLength', maxLength)
    return p.toString()
  }, [showOwn, keyword, make, model, state, fuelType, boatType, minPrice, maxPrice, minYear, maxYear, minLength, maxLength])

  // ── Fetch page 1 (reset) or next page (append) ─────────────────────────────
  const fetchListings = useCallback(async (page: number, reset = false) => {
    if (reset) { setLoading(true); setVessels([]) }
    else setLoadingMore(true)

    try {
      const res = await fetch(`/api/vessels?${buildParams(page)}`)
      const data = await res.json()
      setVessels(prev => reset ? data.listings : [...prev, ...data.listings])
      setCurrentPage(data.currentPage)
      setLastPage(data.lastPage)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load vessels:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildParams])

  // Initial load
  useEffect(() => { fetchListings(1, true) }, [fetchListings])

  // ── Debounced re-search when server-side filters change ─────────────────────
  const filtersKey = `${showOwn}|${keyword}|${make}|${model}|${state}|${fuelType}|${boatType}|${minPrice}|${maxPrice}|${minYear}|${maxYear}|${minLength}|${maxLength}`
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchListings(1, true)
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filtersKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = () => {
    setKeyword(''); setMake(''); setModel(''); setState(''); setFuelType(''); setBoatType('')
    setMinPrice(''); setMaxPrice(''); setMinYear(''); setMaxYear(''); setMinLength(''); setMaxLength('')
  }

  const hasFilters = keyword || make || model || state || fuelType || boatType ||
    minPrice || maxPrice || minYear || maxYear || minLength || maxLength

  // ── Client-side filters applied on top of server results ───────────────────
  const filtered = useMemo(() => vessels, [vessels])

  // ── Shared input/label styles ───────────────────────────────────────────────
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1"
  const inputClass = "w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded"
  const selectClass = "w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded appearance-none"

  // ── Filter panel ────────────────────────────────────────────────────────────
  const FilterPanel = () => (
    <div className="space-y-5">

      <div>
        <label className={labelClass}>Keyword Search</label>
        <input
          type="text"
          placeholder="Search name, model, location..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Make / Manufacturer</label>
        <input
          type="text"
          placeholder="e.g. Contender, Regulator..."
          value={make}
          onChange={e => setMake(e.target.value)}
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1">Searches all {total.toLocaleString()} listings</p>
      </div>

      <div>
        <label className={labelClass}>Model</label>
        <input
          type="text"
          placeholder="e.g. 39 ST, 41 Express..."
          value={model}
          onChange={e => setModel(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Location / State</label>
        <select value={state} onChange={e => setState(e.target.value)} className={selectClass}>
          <option value="">All States</option>
          {metaStates.map(s => (
            <option key={s} value={s.toLowerCase()}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Boat Type</label>
        <select value={boatType} onChange={e => setBoatType(e.target.value)} className={selectClass}>
          <option value="">All Types</option>
          {metaBoatTypes.map(t => (
            <option key={t} value={t.toLowerCase()}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Fuel Type</label>
        <select value={fuelType} onChange={e => setFuelType(e.target.value)} className={selectClass}>
          <option value="">All Fuel Types</option>
          {metaFuelTypes.map(f => (
            <option key={f} value={f.toLowerCase()}>{f}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Year</label>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Min" value={minYear}
            onChange={e => setMinYear(e.target.value)} className={inputClass} />
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Max" value={maxYear}
            onChange={e => setMaxYear(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Length (ft)</label>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Min" value={minLength}
            onChange={e => setMinLength(e.target.value)} className={inputClass} />
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Max" value={maxLength}
            onChange={e => setMaxLength(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Price (USD)</label>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Min" value={minPrice}
            onChange={e => setMinPrice(e.target.value)} className={inputClass} />
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Max" value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)} className={inputClass} />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2 text-xs tracking-widest uppercase border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors rounded"
        >
          Clear All Filters ×
        </button>
      )}
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-10">

      {/* Sidebar — desktop */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="bg-white border border-gray-100 p-6 rounded sticky top-24">
          <h2 className="text-sm font-bold tracking-widest uppercase mb-6" style={{ color: '#0c1f3f' }}>
            Search Filters
          </h2>
          {FilterPanel()}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">

        {/* Mobile filter toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="lg:hidden w-full flex items-center justify-between px-4 py-3 border border-gray-200 bg-white text-sm mb-4 rounded"
        >
          <span className="tracking-widest uppercase text-xs font-semibold" style={{ color: '#0c1f3f' }}>
            Search Filters {hasFilters ? '(active)' : ''}
          </span>
          <span className="text-gray-400">{filtersOpen ? '▲' : '▼'}</span>
        </button>

        {filtersOpen && (
          <div className="lg:hidden bg-white border border-gray-100 p-6 rounded mb-6">
            {FilterPanel()}
          </div>
        )}

        {/* Results count + BYG toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400">
            {loading ? 'Searching...' : `${total.toLocaleString()} vessels found`}
          </p>
          <div className="flex rounded overflow-hidden border border-gray-200 text-xs">
            <button
              onClick={() => setShowOwn(true)}
              className="px-4 py-2 font-semibold uppercase tracking-wider transition-colors"
              style={{ backgroundColor: showOwn ? '#0c1f3f' : 'white', color: showOwn ? 'white' : '#6b7280' }}
            >
              BYG Listings
            </button>
            <button
              onClick={() => setShowOwn(false)}
              className="px-4 py-2 font-semibold uppercase tracking-wider transition-colors"
              style={{ backgroundColor: !showOwn ? '#0c1f3f' : 'white', color: !showOwn ? 'white' : '#6b7280' }}
            >
              All Inventory
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white shadow-md animate-pulse">
                <div className="h-60 bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-1/2 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20 text-lg">No vessels match your search.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filtered.map((vessel) => (
                <Link
                  key={vessel.id}
                  href={`/inventory/${vessel.slug}`}
                  className="group block bg-white shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative overflow-hidden h-60">
                    {vessel.images?.[0] ? (
                      <img
                        src={vessel.images[0]}
                        alt={vessel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#0c1f3f' }}>
                        <span className="text-white/30 text-sm tracking-widest uppercase">No Photo</span>
                      </div>
                    )}
                    {vessel.status !== 'available' && (
                      <span
                        className="absolute top-3 right-3 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
                        style={{ backgroundColor: vessel.status === 'sold' ? '#991b1b' : '#92400e' }}
                      >
                        {vessel.status === 'under_contract' ? 'Under Contract' : 'Sold'}
                      </span>
                    )}
                    {vessel.is_cobrokerage && (
                      <span
                        className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold uppercase tracking-widest text-white"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                      >
                        Co-Brokerage
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#c9a84c' }}>
                      {vessel.year} {vessel.make} · {vessel.length_ft}ft
                    </p>
                    <h2 className="text-xl font-bold mb-1" style={{ color: '#0c1f3f' }}>{vessel.name}</h2>
                    <p className="text-gray-400 text-sm mb-4">{vessel.location}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold" style={{ color: '#0c1f3f' }}>
                        {vessel.price ? `$${vessel.price.toLocaleString()}` : 'Call for Price'}
                      </p>
                      {vessel.hours ? (
                        <span className="text-xs tracking-widest uppercase text-gray-400">
                          {vessel.hours.toLocaleString()} hrs
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More */}
            {currentPage < lastPage && (
              <div className="mt-12 text-center">
                <p className="text-xs text-gray-400 mb-4">
                  Showing {vessels.length.toLocaleString()} of {total.toLocaleString()} listings
                </p>
                <button
                  onClick={() => fetchListings(currentPage + 1)}
                  disabled={loadingMore}
                  className="px-10 py-3 text-sm font-semibold tracking-widest uppercase text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#0c1f3f' }}
                >
                  {loadingMore ? 'Loading...' : 'Load More Vessels'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
