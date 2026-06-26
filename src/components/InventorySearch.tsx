'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { type Listing } from '@/lib/listings'

export default function InventorySearch() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [vessels, setVessels] = useState<Listing[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [make, setMake] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minYear, setMinYear] = useState('')
  const [maxYear, setMaxYear] = useState('')
  const [minLength, setMinLength] = useState('')
  const [maxLength, setMaxLength] = useState('')
  const [condition, setCondition] = useState<'all' | 'new' | 'used'>('all')
  const [locationFilter, setLocationFilter] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showOwn, setShowOwn] = useState(false)

  // ── Fetch logic ─────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (page: number) => {
    if (page === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const res = await fetch(`/api/vessels?page=${page}`)
      const data = await res.json()
      setVessels(prev => page === 1 ? data.listings : [...prev, ...data.listings])
      setCurrentPage(data.currentPage)
      setLastPage(data.lastPage)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load vessels:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { fetchPage(1) }, [fetchPage])

  // ── Filter options derived from loaded vessels ───────────────────────────────
  const makes = useMemo(() =>
    [...new Set(vessels.map(v => v.make).filter(Boolean))].sort(),
    [vessels]
  )
  const locations = useMemo(() =>
    [...new Set(vessels.map(v => v.location).filter(Boolean))].sort(),
    [vessels]
  )

  const hasFilters = search || make || minPrice || maxPrice || minYear || maxYear || minLength || maxLength || condition !== 'all' || locationFilter

  const clearFilters = () => {
    setSearch(''); setMake(''); setMinPrice(''); setMaxPrice('')
    setMinYear(''); setMaxYear(''); setMinLength(''); setMaxLength('')
    setCondition('all'); setLocationFilter('')
  }

  // ── Client-side filter on loaded vessels ────────────────────────────────────
  const filtered = useMemo(() => {
    return vessels.filter(v => {
      if (showOwn && v.is_cobrokerage) return false
      if (search && !`${v.name} ${v.make} ${v.model} ${v.location}`.toLowerCase().includes(search.toLowerCase())) return false
      if (make && v.make !== make) return false
      if (minPrice && v.price < Number(minPrice)) return false
      if (maxPrice && v.price > Number(maxPrice)) return false
      if (minYear && v.year < Number(minYear)) return false
      if (maxYear && v.year > Number(maxYear)) return false
      if (minLength && v.length_ft < Number(minLength)) return false
      if (maxLength && v.length_ft > Number(maxLength)) return false
      if (locationFilter && v.location !== locationFilter) return false
      if (condition === 'new' && v.hours && v.hours > 10) return false
      if (condition === 'used' && (!v.hours || v.hours <= 10)) return false
      return true
    })
  }, [vessels, search, make, minPrice, maxPrice, minYear, maxYear, minLength, maxLength, condition, locationFilter, showOwn])

  // ── Shared input styles ─────────────────────────────────────────────────────
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1"
  const inputClass = "w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded"

  // ── Filter panel (rendered as function to avoid remount focus bug) ──────────
  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Keyword Search</label>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Make</label>
        <input
          type="text"
          list="makes-list"
          placeholder="Search makes..."
          value={make}
          onChange={e => setMake(e.target.value)}
          className={inputClass}
        />
        <datalist id="makes-list">
          {makes.map(m => <option key={m} value={m} />)}
        </datalist>
      </div>

      <div>
        <label className={labelClass}>Year</label>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="No Min" value={minYear}
            onChange={e => setMinYear(e.target.value)} className={inputClass} />
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="No Max" value={maxYear}
            onChange={e => setMaxYear(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Length (ft)</label>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="No Min" value={minLength}
            onChange={e => setMinLength(e.target.value)} className={inputClass} />
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="No Max" value={maxLength}
            onChange={e => setMaxLength(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Price (USD)</label>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="No Min" value={minPrice}
            onChange={e => setMinPrice(e.target.value)} className={inputClass} />
          <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="No Max" value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Condition</label>
        <div className="flex rounded overflow-hidden border border-gray-200">
          {(['all', 'new', 'used'] as const).map(c => (
            <button
              key={c}
              onClick={() => setCondition(c)}
              className="flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: condition === c ? '#0c1f3f' : 'white',
                color: condition === c ? 'white' : '#6b7280',
              }}
            >
              {c === 'all' ? 'All' : c === 'new' ? 'New' : 'Used'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Location</label>
        <input
          type="text"
          list="locations-list"
          placeholder="Search locations..."
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
          className={inputClass}
        />
        <datalist id="locations-list">
          {locations.map(s => <option key={s} value={s} />)}
        </datalist>
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
            {loading ? 'Loading...' : `${filtered.length} of ${total.toLocaleString()} vessels`}
          </p>
          <div className="flex rounded overflow-hidden border border-gray-200 text-xs">
            <button
              onClick={() => setShowOwn(false)}
              className="px-4 py-2 font-semibold uppercase tracking-wider transition-colors"
              style={{ backgroundColor: !showOwn ? '#0c1f3f' : 'white', color: !showOwn ? 'white' : '#6b7280' }}
            >
              All Listings
            </button>
            <button
              onClick={() => setShowOwn(true)}
              className="px-4 py-2 font-semibold uppercase tracking-wider transition-colors"
              style={{ backgroundColor: showOwn ? '#0c1f3f' : 'white', color: showOwn ? 'white' : '#6b7280' }}
            >
              BYG Only
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
            {/* Vessel grid */}
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
                        ${vessel.price.toLocaleString()}
                      </p>
                      <span className="text-xs tracking-widest uppercase text-gray-400">
                        {vessel.hours?.toLocaleString()} hrs
                      </span>
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
                  onClick={() => fetchPage(currentPage + 1)}
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
