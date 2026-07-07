'use client'

import { useState, useRef } from 'react'

export type AuctionFormValues = {
  slug: string; title: string; description: string
  make: string; model: string; year: string; length_ft: string
  location: string; condition: string; hours: string; vin: string
  status: string; starts_at: string; ends_at: string
  starting_bid: string; reserve_price: string
  images: string[]
}

type Props = {
  token: string
  saving: boolean
  initialValues?: Partial<AuctionFormValues>
  onSubmit: (values: AuctionFormValues) => void
  onError: (msg: string) => void
}

// Returns a datetime-local string (YYYY-MM-DDTHH:mm) set to 5:00 PM Eastern
// on a given date offset from today, accounting for ET offset (UTC-5 or UTC-4 DST).
function defaultAt5pmET(daysFromNow: number): string {
  const now = new Date()
  // Determine ET offset: EDT = UTC-4 (Mar–Nov), EST = UTC-5 (Nov–Mar)
  // Simple check: if the local Date shows DST is active for NY, use -4
  const jan = new Date(now.getFullYear(), 0, 1).getTimezoneOffset()
  const jul = new Date(now.getFullYear(), 6, 1).getTimezoneOffset()
  const etOffset = Math.min(jan, jul) === 240 ? -4 : -5 // 240 = UTC-4

  const target = new Date(now)
  target.setDate(target.getDate() + daysFromNow)
  // Build a date string at 17:00 ET expressed in UTC
  const utcHour = 17 - etOffset // e.g. 17 - (-4) = 21 UTC during EDT
  target.setUTCHours(utcHour, 0, 0, 0)

  // Format as datetime-local value (YYYY-MM-DDTHH:mm) in local time
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:00`
}

const DEFAULT: AuctionFormValues = {
  slug: '', title: '', description: '',
  make: '', model: '', year: '', length_ft: '',
  location: '', condition: 'Used', hours: '', vin: '',
  status: 'draft',
  starts_at: defaultAt5pmET(0),   // today at 5 PM ET
  ends_at:   defaultAt5pmET(7),   // 7 days from now at 5 PM ET
  starting_bid: '', reserve_price: '',
  images: [],
}

const inputClass = `
  w-full px-4 py-2.5 text-white text-sm bg-transparent border focus:outline-none focus:border-yellow-500/60
`.trim()
const inputStyle = { backgroundColor: '#1a1a1a', borderColor: '#333' }

const labelClass = "block text-xs text-white/40 uppercase tracking-wider mb-1.5"

export default function AuctionForm({ token, saving, initialValues, onSubmit, onError }: Props) {
  const [form,        setForm]        = useState<AuctionFormValues>({ ...DEFAULT, ...initialValues })
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function set(field: keyof AuctionFormValues, value: string | string[]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // ── Auto-generate slug from title ──────────────────────────────────────────
  function handleTitleChange(val: string) {
    set('title', val)
    if (!initialValues?.slug) {
      set('slug', val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  // ── Image upload ───────────────────────────────────────────────────────────
  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true); setUploadError('')

    const urls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/auctions/admin/upload', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      })
      const d = await res.json()
      if (!res.ok) { setUploadError(d.error ?? 'Upload failed'); setUploading(false); return }
      urls.push(d.url)
    }

    set('images', [...form.images, ...urls])
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(idx: number) {
    set('images', form.images.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.slug || !form.title || !form.starts_at || !form.ends_at) {
      onError('Slug, title, start date, and end date are required.'); return
    }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Basic info ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-white/30 mb-5">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="md:col-span-2">
            <label className={labelClass}>Listing Title *</label>
            <input type="text" value={form.title} onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g. 2022 Contender 39 ST"
              className={inputClass} style={inputStyle} required />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Slug (URL) *</label>
            <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)}
              placeholder="e.g. 2022-contender-39-st"
              className={inputClass} style={inputStyle} required />
            <p className="text-white/25 text-xs mt-1">/auctions/{form.slug || '…'}</p>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className={inputClass} style={inputStyle}>
              {['draft', 'active', 'ended', 'sold', 'cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
              placeholder="e.g. Palm Beach, FL"
              className={inputClass} style={inputStyle} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={4} placeholder="Seller notes, condition details, equipment list…"
              className={inputClass} style={inputStyle} />
          </div>
        </div>
      </section>

      {/* ── Vessel specs ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-white/30 mb-5">Vessel Specs</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Make</label>
            <input type="text" value={form.make} onChange={e => set('make', e.target.value)}
              placeholder="Contender" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass}>Model</label>
            <input type="text" value={form.model} onChange={e => set('model', e.target.value)}
              placeholder="39 ST" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass}>Year</label>
            <input type="number" value={form.year} onChange={e => set('year', e.target.value)}
              placeholder="2022" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass}>Length (ft)</label>
            <input type="number" value={form.length_ft} onChange={e => set('length_ft', e.target.value)}
              placeholder="39" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass}>Engine Hours</label>
            <input type="number" value={form.hours} onChange={e => set('hours', e.target.value)}
              placeholder="87" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass}>Condition</label>
            <select value={form.condition} onChange={e => set('condition', e.target.value)}
              className={inputClass} style={inputStyle}>
              <option>Used</option>
              <option>New</option>
            </select>
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className={labelClass}>HIN / VIN</label>
            <input type="text" value={form.vin} onChange={e => set('vin', e.target.value)}
              placeholder="Hull identification number" className={inputClass} style={inputStyle} />
          </div>
        </div>
      </section>

      {/* ── Auction mechanics ──────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-white/30 mb-5">Auction Mechanics</h2>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Starts At *</label>
            <input type="datetime-local" value={form.starts_at} onChange={e => set('starts_at', e.target.value)}
              className={inputClass} style={inputStyle} required />
          </div>
          <div>
            <label className={labelClass}>Ends At * <span style={{ color: '#c9a84c', fontWeight: 400 }}>(defaults to 5 PM ET)</span></label>
            <input type="datetime-local" value={form.ends_at} onChange={e => set('ends_at', e.target.value)}
              className={inputClass} style={inputStyle} required />
          </div>
          <div>
            <label className={labelClass}>Starting Bid ($)</label>
            <input type="number" value={form.starting_bid} onChange={e => set('starting_bid', e.target.value)}
              placeholder="275000" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass}>Reserve Price ($) <span className="normal-case text-white/20">optional</span></label>
            <input type="number" value={form.reserve_price} onChange={e => set('reserve_price', e.target.value)}
              placeholder="Leave blank for no reserve" className={inputClass} style={inputStyle} />
          </div>
        </div>
      </section>

      {/* ── Photos ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-white/30 mb-5">Photos</h2>

        {/* Upload area */}
        <div
          className="border-2 border-dashed border-white/20 p-8 text-center cursor-pointer hover:border-white/40 transition-colors mb-4"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleImageUpload(e.target.files)}
          />
          {uploading ? (
            <p className="text-white/40 text-sm animate-pulse">Uploading…</p>
          ) : (
            <>
              <p className="text-white/40 text-sm">Click to upload photos</p>
              <p className="text-white/20 text-xs mt-1">JPG, PNG, WebP — max 10MB each</p>
            </>
          )}
        </div>

        {uploadError && <p className="text-red-400 text-xs mb-3">{uploadError}</p>}

        {/* Preview grid */}
        {form.images.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {form.images.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-28 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >×</button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 font-bold"
                    style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>Cover</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={saving || uploading}
          className="px-8 py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}
        >
          {saving ? 'Saving…' : 'Save Auction'}
        </button>
      </div>

    </form>
  )
}
