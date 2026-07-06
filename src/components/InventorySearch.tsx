'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { type Listing } from '@/lib/listings'

// ── Types ─────────────────────────────────────────────────────────────────────

type Filters = {
  keyword:   string; make:      string; model:     string
  condition: string; boatType:  string; fuelType:  string
  minYear:   string; maxYear:   string
  minLength: string; maxLength: string
  minPrice:  string; maxPrice:  string
  region:    string; country:   string; state:     string; city: string
}

type SavedSearch = { name: string; filters: Filters; showOwn: boolean }

const EMPTY_FILTERS: Filters = {
  keyword: '', make: '', model: '', condition: '', boatType: '', fuelType: '',
  minYear: '', maxYear: '', minLength: '', maxLength: '', minPrice: '', maxPrice: '',
  region: '', country: '', state: '', city: '',
}

// ── Search icon SVG ───────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
)

// ── Chevron icon ──────────────────────────────────────────────────────────────
const ChevronIcon = () => (
  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

// ── SearchInput — text field with magnifying glass prefix ─────────────────────
function SearchInput({ placeholder, value, onChange }: {
  placeholder: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded focus-within:border-gray-400 transition-colors">
      <SearchIcon />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 text-sm bg-transparent focus:outline-none placeholder-gray-400"
      />
    </div>
  )
}

// ── SearchSelect — dropdown with magnifying glass prefix ──────────────────────
function SearchSelect({ placeholder, value, onChange, children }: {
  placeholder: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <div className="relative flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded focus-within:border-gray-400 transition-colors">
      <SearchIcon />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 text-sm bg-transparent focus:outline-none appearance-none cursor-pointer text-gray-700"
      >
        {children}
      </select>
      <ChevronIcon />
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InventorySearch() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  // Vessel results
  const [vessels,     setVessels]     = useState<Listing[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [lastPage,    setLastPage]    = useState(1)
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Meta dropdowns
  const [metaStates,    setMetaStates]    = useState<string[]>([])
  const [metaFuelTypes, setMetaFuelTypes] = useState<string[]>([])
  const [metaBoatTypes, setMetaBoatTypes] = useState<string[]>([])

  // Filter state
  const [f, setF] = useState<Filters>({
    keyword:   searchParams.get('keyword')   || '',
    make:      searchParams.get('make')      || '',
    model:     searchParams.get('model')     || '',
    condition: searchParams.get('condition') || '',
    boatType:  searchParams.get('boatType')  || '',
    fuelType:  searchParams.get('fuelType')  || '',
    minYear:   searchParams.get('minYear')   || '',
    maxYear:   searchParams.get('maxYear')   || '',
    minLength: searchParams.get('minLength') || '',
    maxLength: searchParams.get('maxLength') || '',
    minPrice:  searchParams.get('minPrice')  || '',
    maxPrice:  searchParams.get('maxPrice')  || '',
    region:    searchParams.get('region')    || '',
    country:   searchParams.get('country')   || '',
    state:     searchParams.get('state')     || '',
    city:      searchParams.get('city')      || '',
  })

  const set = (key: keyof Filters, val: string) =>
    setF(prev => ({ ...prev, [key]: val }))

  const hasFilters = Object.values(f).some(Boolean)

  // Tab
  const [showOwn, setShowOwn] = useState(() => searchParams.get('tab') !== 'all')

  // Mobile sidebar
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Saved searches
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [saveNameInput, setSaveNameInput] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('byg_saved_searches')
      if (raw) setSavedSearches(JSON.parse(raw))
    } catch {}
  }, [])

  const persistSaved = (list: SavedSearch[]) => {
    setSavedSearches(list)
    try { localStorage.setItem('byg_saved_searches', JSON.stringify(list)) } catch {}
  }

  const handleSaveSearch = () => {
    const name = saveNameInput.trim()
    if (!name) return
    persistSaved([...savedSearches, { name, filters: { ...f }, showOwn }])
    setSaveNameInput('')
    setShowSaveInput(false)
  }

  const handleLoadSearch = (idx: number) => {
    if (idx < 0) return
    const entry = savedSearches[idx]
    setF(entry.filters)
    setShowOwn(entry.showOwn)
  }

  const handleDeleteSearch = (idx: number) =>
    persistSaved(savedSearches.filter((_, i) => i !== idx))

  // Sync to URL
  useEffect(() => {
    const p = new URLSearchParams()
    if (!showOwn) p.set('tab', 'all')
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v) })
    const qs = p.toString()
    router.replace(qs ? `/inventory?${qs}` : '/inventory', { scroll: false })
  }, [f, showOwn]) // eslint-disable-line react-hooks/exhaustive-deps

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/vessels/meta').then(r => r.json()).then(d => {
      setMetaStates(d.states ?? [])
      setMetaFuelTypes(d.fuelTypes ?? [])
      setMetaBoatTypes(d.boatTypes ?? [])
    }).catch(() => {})
  }, [])

  const buildParams = useCallback((page: number) => {
    const p = new URLSearchParams()
    p.set('page', String(page))
    if (showOwn) p.set('bygOnly', 'true')
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v) })
    return p.toString()
  }, [f, showOwn])

  const fetchListings = useCallback(async (page: number, reset = false) => {
    if (reset) { setLoading(true); setVessels([]) } else setLoadingMore(true)
    try {
      const res  = await fetch(`/api/vessels?${buildParams(page)}`)
      const data = await res.json()
      setVessels(prev => reset ? data.listings : [...prev, ...data.listings])
      setCurrentPage(data.currentPage)
      setLastPage(data.lastPage)
      setTotal(data.total)
    } catch (err) { console.error('Failed to load vessels:', err) }
    finally { setLoading(false); setLoadingMore(false) }
  }, [buildParams])

  useEffect(() => { fetchListings(1, true) }, [fetchListings])

  const filtersKey = JSON.stringify({ f, showOwn })
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchListings(1, true), 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filtersKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Shared label style
  const labelCls = "block text-xs font-semibold uppercase tracking-wider mb-1.5"
  const minMaxInput = (placeholder: string, value: string, onChange: (v: string) => void) => (
    <input
      type="text" inputMode="numeric" pattern="[0-9]*"
      placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded placeholder-gray-400"
    />
  )

  // ── Filter panel ──────────────────────────────────────────────────────────
  const FilterPanel = () => (
    <div className="space-y-5">

      {/* ── My Saved Searches ─────────────────────────────────────────────── */}
      <div>
        <p className={labelCls} style={{ color: '#0c1f3f' }}>My Saved Searches</p>

        {/* Dropdown to load a saved search */}
        <div className="relative flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded mb-2 focus-within:border-gray-400 transition-colors">
          <select
            defaultValue=""
            onChange={e => { handleLoadSearch(Number(e.target.value)); e.currentTarget.value = '' }}
            className="flex-1 text-sm bg-transparent focus:outline-none appearance-none cursor-pointer text-gray-500"
          >
            <option value="" disabled>Select a Search</option>
            {savedSearches.map((s, i) => (
              <option key={i} value={i}>{s.name}</option>
            ))}
          </select>
          <ChevronIcon />
        </div>

        {/* Delete buttons for saved searches */}
        {savedSearches.length > 0 && (
          <div className="space-y-1 mb-2">
            {savedSearches.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-1 text-xs text-gray-400">
                <span className="truncate">{s.name}</span>
                <button onClick={() => handleDeleteSearch(i)}
                  className="hover:text-red-400 transition-colors px-1 leading-none">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Save current search */}
        {showSaveInput ? (
          <div className="flex gap-1.5">
            <input
              type="text" autoFocus placeholder="Name this search…"
              value={saveNameInput}
              onChange={e => setSaveNameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  handleSaveSearch()
                if (e.key === 'Escape') { setShowSaveInput(false); setSaveNameInput('') }
              }}
              className="flex-1 px-2 py-1.5 border border-gray-200 text-xs focus:outline-none focus:border-gray-400 rounded"
            />
            <button onClick={handleSaveSearch}
              className="px-2.5 py-1.5 text-xs text-white rounded"
              style={{ backgroundColor: '#0c1f3f' }}>Save</button>
          </div>
        ) : hasFilters ? (
          <button onClick={() => setShowSaveInput(true)}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
            + Save current search
          </button>
        ) : null}
      </div>

      <hr className="border-gray-100" />

      {/* ── Keyword Search ────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>Keyword Search</label>
        <SearchInput placeholder="Search" value={f.keyword} onChange={v => set('keyword', v)} />
      </div>

      {/* ── Make ──────────────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>Make</label>
        <SearchInput placeholder="Search Makes" value={f.make} onChange={v => set('make', v)} />
        <p className="text-xs text-gray-400 mt-1">Across {total.toLocaleString()} listings</p>
      </div>

      {/* ── Year ──────────────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>Year</label>
        <div className="flex gap-2">
          {minMaxInput('No Min', f.minYear, v => set('minYear', v))}
          {minMaxInput('No Max', f.maxYear, v => set('maxYear', v))}
        </div>
      </div>

      {/* ── Length ────────────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>Length</label>
        <div className="flex gap-2 items-center">
          {minMaxInput('No Min', f.minLength, v => set('minLength', v))}
          {minMaxInput('No Max', f.maxLength, v => set('maxLength', v))}
          <div className="shrink-0 flex items-center gap-1 px-2.5 py-2 border border-gray-200 rounded bg-white text-sm text-gray-500">
            ft <ChevronIcon />
          </div>
        </div>
      </div>

      {/* ── Price ─────────────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>Price</label>
        <div className="flex gap-2 items-center">
          {minMaxInput('No Min', f.minPrice, v => set('minPrice', v))}
          {minMaxInput('No Max', f.maxPrice, v => set('maxPrice', v))}
          <div className="shrink-0 flex items-center gap-1 px-2.5 py-2 border border-gray-200 rounded bg-white text-sm text-gray-500">
            USD <ChevronIcon />
          </div>
        </div>
      </div>

      {/* ── Condition ─────────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>Condition</label>
        <div className="flex rounded overflow-hidden border border-gray-200 text-sm">
          {(['', 'New', 'Used'] as const).map(c => (
            <button
              key={c || 'all'}
              onClick={() => set('condition', c)}
              className="flex-1 py-2.5 font-medium transition-colors"
              style={{
                backgroundColor: f.condition === c ? '#0c1f3f' : '#f9fafb',
                color:           f.condition === c ? 'white'   : f.condition === '' && c === ''
                  ? '#374151' : '#6b7280',
                borderRight: c !== 'Used' ? '1px solid #e5e7eb' : 'none',
              }}
            >
              {c || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Class ─────────────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>Class</label>
        <SearchSelect placeholder="Search Classes" value={f.boatType} onChange={v => set('boatType', v)}>
          <option value="">Search Classes</option>
          {metaBoatTypes.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
        </SearchSelect>
      </div>

      {/* ── Region ────────────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>Region</label>
        <SearchInput placeholder="Search Regions" value={f.region} onChange={v => set('region', v)} />
      </div>

      {/* ── Country ───────────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>Country</label>
        <SearchInput placeholder="Search Countries" value={f.country} onChange={v => set('country', v)} />
      </div>

      {/* ── State / Province ──────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>State / Province</label>
        <SearchSelect placeholder="Search States" value={f.state} onChange={v => set('state', v)}>
          <option value="">Search States</option>
          {metaStates.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
        </SearchSelect>
      </div>

      {/* ── City ──────────────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls} style={{ color: '#0c1f3f' }}>City</label>
        <SearchInput placeholder="Search Cities" value={f.city} onChange={v => set('city', v)} />
      </div>

      {/* ── Clear all ─────────────────────────────────────────────────────── */}
      {hasFilters && (
        <button
          onClick={() => setF(EMPTY_FILTERS)}
          className="w-full py-2 text-xs tracking-widest uppercase border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors rounded"
        >
          Clear All Filters ×
        </button>
      )}
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-10">

      {/* Sidebar — desktop */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="bg-white border border-gray-100 p-6 rounded sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
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

        {/* Results count + BYG / All toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400">
            {loading ? 'Searching…' : `${total.toLocaleString()} vessels found`}
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
        ) : vessels.length === 0 ? (
          <p className="text-center text-gray-400 py-20 text-lg">No vessels match your search.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {vessels.map(vessel => (
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
                      {vessel.year} {vessel.make} {vessel.model} · {vessel.length_ft}ft
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
                  {loadingMore ? 'Loading…' : 'Load More Vessels'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
