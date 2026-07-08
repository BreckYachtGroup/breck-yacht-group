'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
type Form = {
  // Vessel basics
  year: string; make: string; model: string; length_ft: string; hull_type: string
  // Engines
  engine_count: string; engine_make: string; engine_model: string
  engine_year: string; engine_hours: string; drive_type: string; fuel_type: string
  // Condition
  condition: string; known_issues: string; recent_maintenance: string
  // Listing preferences
  reserve_price: string; current_location: string; storage_type: string
  title_status: string; has_existing_survey: boolean; desired_start_window: string
  // Notes
  seller_notes: string
  // Agreements
  ack_listing_fee: boolean; ack_survey_policy: boolean; ack_listing_agreement: boolean
}

const INIT: Form = {
  year: '', make: '', model: '', length_ft: '', hull_type: '',
  engine_count: '1', engine_make: '', engine_model: '',
  engine_year: '', engine_hours: '', drive_type: '', fuel_type: '',
  condition: '', known_issues: '', recent_maintenance: '',
  reserve_price: '', current_location: '', storage_type: '',
  title_status: '', has_existing_survey: false, desired_start_window: '',
  seller_notes: '',
  ack_listing_fee: false, ack_survey_policy: false, ack_listing_agreement: false,
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-3 bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#c9a84c] transition-colors placeholder:text-white/30 rounded"
const labelCls = "block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2"
const sectionHdr = "text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c] mb-6 pb-3 border-b border-white/10"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, children, placeholder }: {
  value: string; onChange: (v: string) => void
  children: React.ReactNode; placeholder?: string
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`${inputCls} appearance-none`}>
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SellPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const [form,    setForm]    = useState<Form>(INIT)
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [done,    setDone]    = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) router.push('/account/login?redirect=/auctions/sell')
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/account/login'); return }

      const res = await fetch('/api/auctions/intake', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...form,
          year:         parseInt(form.year) || null,
          length_ft:    parseFloat(form.length_ft) || null,
          engine_count: parseInt(form.engine_count) || 1,
          engine_year:  parseInt(form.engine_year) || null,
          engine_hours: parseInt(form.engine_hours) || null,
          reserve_price: form.reserve_price ? parseFloat(form.reserve_price.replace(/,/g, '')) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed.')
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  if (done) return <SuccessScreen />

  return (
    <div style={{ backgroundColor: '#0a0a0a' }} className="min-h-screen text-white">

      {/* Hero */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center">
        <p className="text-xs tracking-[0.5em] uppercase mb-3" style={{ color: '#c9a84c' }}>
          Auction House
        </p>
        <h1 className="text-4xl font-bold mb-3">List Your Vessel</h1>
        <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
          7-day auction · $0 seller commission if sold · independent pre-auction survey included
        </p>
      </div>

      {/* Step indicator */}
      <div className="max-w-2xl mx-auto px-6 pt-10">
        <div className="flex items-center gap-2 mb-10">
          {[
            { n: 1, label: 'Vessel' },
            { n: 2, label: 'Engines & Condition' },
            { n: 3, label: 'Listing Details' },
            { n: 4, label: 'Agreements' },
          ].map(({ n, label }, i, arr) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === n
                    ? 'text-[#0c1f3f]'
                    : step > n
                    ? 'bg-[#c9a84c]/20 text-[#c9a84c]'
                    : 'bg-white/10 text-white/30'
                }`} style={step === n ? { backgroundColor: '#c9a84c' } : {}}>
                  {step > n ? '✓' : n}
                </div>
                <span className={`text-xs uppercase tracking-wider hidden sm:block ${
                  step === n ? 'text-white' : step > n ? 'text-[#c9a84c]' : 'text-white/30'
                }`}>{label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="flex-1 h-px mx-2" style={{ backgroundColor: step > n ? '#c9a84c40' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Vessel Basics ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-8 pb-16">
            <p className={sectionHdr}>Vessel Information</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Field label="Year *">
                <input type="number" placeholder="2021" min="1950" max={new Date().getFullYear() + 1}
                  value={form.year} onChange={e => set('year', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Make *">
                <input type="text" placeholder="Contender" value={form.make}
                  onChange={e => set('make', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Model *">
                <input type="text" placeholder="39 ST" value={form.model}
                  onChange={e => set('model', e.target.value)} className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Field label="Length (ft)">
                <input type="number" placeholder="39" min="15" max="200"
                  value={form.length_ft} onChange={e => set('length_ft', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Hull Type">
                <Select value={form.hull_type} onChange={v => set('hull_type', v)} placeholder="Select…">
                  <option value="fiberglass">Fiberglass</option>
                  <option value="aluminum">Aluminum</option>
                  <option value="composite">Composite</option>
                  <option value="wood">Wood</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
            </div>

            <StepNav
              onNext={() => {
                if (!form.year || !form.make || !form.model) {
                  setError('Year, make, and model are required.')
                  return
                }
                setError(null); setStep(2)
              }}
            />
          </div>
        )}

        {/* ── Step 2: Engines & Condition ──────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-8 pb-16">
            <p className={sectionHdr}>Engines</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Field label="# of Engines">
                <Select value={form.engine_count} onChange={v => set('engine_count', v)}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </Select>
              </Field>
              <Field label="Engine Make">
                <input type="text" placeholder="Yamaha" value={form.engine_make}
                  onChange={e => set('engine_make', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Engine Model">
                <input type="text" placeholder="F425 XTO" value={form.engine_model}
                  onChange={e => set('engine_model', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Engine Year">
                <input type="number" placeholder="2021" value={form.engine_year}
                  onChange={e => set('engine_year', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Total Hours">
                <input type="number" placeholder="350" value={form.engine_hours}
                  onChange={e => set('engine_hours', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Drive Type">
                <Select value={form.drive_type} onChange={v => set('drive_type', v)} placeholder="Select…">
                  <option value="outboard">Outboard</option>
                  <option value="inboard">Inboard</option>
                  <option value="sterndrive">Sterndrive</option>
                  <option value="jet">Jet</option>
                </Select>
              </Field>
            </div>

            <Field label="Fuel Type">
              <div className="flex gap-4">
                {['Gas', 'Diesel'].map(f => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="fuel" value={f.toLowerCase()}
                      checked={form.fuel_type === f.toLowerCase()}
                      onChange={() => set('fuel_type', f.toLowerCase())}
                      className="accent-[#c9a84c]" />
                    <span className="text-sm text-white/70">{f}</span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="h-px bg-white/10" />
            <p className={sectionHdr}>Condition</p>

            <Field label="Overall Condition">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: 'excellent', label: 'Excellent', sub: 'Like new' },
                  { val: 'good',      label: 'Good',      sub: 'Well maintained' },
                  { val: 'fair',      label: 'Fair',      sub: 'Some wear' },
                  { val: 'project',   label: 'Project',   sub: 'Needs work' },
                ].map(({ val, label, sub }) => (
                  <button key={val} type="button" onClick={() => set('condition', val)}
                    className={`p-3 border text-left transition-colors rounded ${
                      form.condition === val
                        ? 'border-[#c9a84c] bg-[#c9a84c]/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Known Issues / Seller Disclosure *">
              <textarea value={form.known_issues}
                onChange={e => set('known_issues', e.target.value)}
                placeholder="List any known defects, deferred maintenance, or issues the buyer should be aware of. Enter 'None known' if applicable."
                rows={4} className={`${inputCls} resize-none`} />
              <p className="text-xs text-white/30 mt-1.5">Required. This becomes part of your seller disclosure.</p>
            </Field>

            <Field label="Recent Maintenance & Upgrades">
              <textarea value={form.recent_maintenance}
                onChange={e => set('recent_maintenance', e.target.value)}
                placeholder="e.g. New impellers 2024, bottom paint Oct 2024, full engine service 2023…"
                rows={3} className={`${inputCls} resize-none`} />
            </Field>

            <StepNav
              onBack={() => { setError(null); setStep(1) }}
              onNext={() => {
                if (!form.known_issues.trim()) {
                  setError('Seller disclosure is required. Enter known issues or "None known."')
                  return
                }
                setError(null); setStep(3)
              }}
            />
          </div>
        )}

        {/* ── Step 3: Listing Details ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-8 pb-16">
            <p className={sectionHdr}>Listing Preferences</p>

            <Field label="Reserve Price (minimum you'll accept)">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <input type="text" placeholder="350,000" value={form.reserve_price}
                  onChange={e => set('reserve_price', e.target.value)}
                  className={`${inputCls} pl-8`} />
              </div>
              <p className="text-xs text-white/30 mt-1.5">The auction will not close below this price. Keep it confidential from bidders.</p>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Boat's Current Location">
                <input type="text" placeholder="West Palm Beach, FL"
                  value={form.current_location}
                  onChange={e => set('current_location', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Storage Type">
                <Select value={form.storage_type} onChange={v => set('storage_type', v)} placeholder="Select…">
                  <option value="wet_slip">Wet Slip / Marina</option>
                  <option value="dry_storage">Dry Storage</option>
                  <option value="on_trailer">On Trailer</option>
                  <option value="mooring">Mooring</option>
                  <option value="private">Private Dock</option>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Title Status">
                <Select value={form.title_status} onChange={v => set('title_status', v)} placeholder="Select…">
                  <option value="clear">Clear Title</option>
                  <option value="lien">Lien — will be paid off at closing</option>
                  <option value="documentation">USCG Documented</option>
                  <option value="other">Other (explain in notes)</option>
                </Select>
              </Field>
              <Field label="Desired Auction Start">
                <Select value={form.desired_start_window} onChange={v => set('desired_start_window', v)} placeholder="Select…">
                  <option value="asap">ASAP — as soon as survey is done</option>
                  <option value="2_weeks">Within 2 weeks</option>
                  <option value="30_days">Within 30 days</option>
                  <option value="60_days">Within 60 days</option>
                  <option value="flexible">Flexible</option>
                </Select>
              </Field>
            </div>

            <Field label="Existing Survey?">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.has_existing_survey}
                  onChange={e => set('has_existing_survey', e.target.checked)}
                  className="w-4 h-4 accent-[#c9a84c]" />
                <span className="text-sm text-white/70">
                  I have an existing survey (BYG will still conduct an independent survey on your behalf)
                </span>
              </label>
            </Field>

            <Field label="Additional Notes">
              <textarea value={form.seller_notes}
                onChange={e => set('seller_notes', e.target.value)}
                placeholder="Anything else we should know — electronics package, custom equipment, reason for selling, availability for survey, etc."
                rows={4} className={`${inputCls} resize-none`} />
            </Field>

            <StepNav
              onBack={() => { setError(null); setStep(2) }}
              onNext={() => { setError(null); setStep(4) }}
            />
          </div>
        )}

        {/* ── Step 4: Agreements ────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-8 pb-16">
            <p className={sectionHdr}>Agreements & Submission</p>

            {/* Summary card */}
            <div className="border border-white/10 p-6 rounded space-y-3 bg-white/3">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-4">Your Submission Summary</p>
              {[
                ['Vessel', `${form.year} ${form.make} ${form.model}${form.length_ft ? ` · ${form.length_ft}ft` : ''}`],
                ['Engines', `${form.engine_count}x ${form.engine_make} ${form.engine_model}${form.engine_hours ? ` · ${form.engine_hours}hrs` : ''}`],
                ['Condition', form.condition || '—'],
                ['Location', form.current_location || '—'],
                ['Reserve', form.reserve_price ? `$${parseFloat(form.reserve_price.replace(/,/g,'')).toLocaleString()}` : 'Not specified'],
                ['Desired Start', form.desired_start_window?.replace(/_/g, ' ') || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-white/40">{k}</span>
                  <span className="text-white font-medium capitalize">{v}</span>
                </div>
              ))}
            </div>

            {/* Agreement checkboxes */}
            <div className="space-y-5">
              {[
                {
                  key: 'ack_listing_fee' as const,
                  title: '$500 Listing Fee',
                  body: 'I understand a $500 non-refundable listing fee is due upon approval. This covers platform setup and is credited toward any auction-related costs.',
                },
                {
                  key: 'ack_survey_policy' as const,
                  title: 'Independent Pre-Auction Survey',
                  body: 'I agree that Breck Yacht Group will select and coordinate an independent marine surveyor on behalf of buyers. The surveyor\'s findings will be published with my listing. I understand BYG absorbs the survey cost.',
                },
                {
                  key: 'ack_listing_agreement' as const,
                  title: '1-Year Listing Agreement',
                  body: 'I understand that by submitting this form I am entering a 1-year exclusive listing agreement with Breck Yacht Group. If the 7-day auction does not result in a sale, BYG will list the vessel on the traditional market at 8–9% commission. Early termination requires reimbursement of out-of-pocket costs and is subject to a 90–180 day protection period.',
                },
              ].map(({ key, title, body }) => (
                <label key={key}
                  className={`flex gap-4 p-5 border rounded cursor-pointer transition-colors ${
                    form[key] ? 'border-[#c9a84c]/50 bg-[#c9a84c]/5' : 'border-white/10 hover:border-white/20'
                  }`}>
                  <input type="checkbox" checked={form[key]}
                    onChange={e => set(key, e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-[#c9a84c] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{title}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{body}</p>
                  </div>
                </label>
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded px-4 py-3">
                {error}
              </p>
            )}

            <div className="flex gap-4 pt-2">
              <button onClick={() => { setError(null); setStep(3) }}
                className="px-6 py-3 text-sm text-white/50 border border-white/10 hover:border-white/30 transition-colors rounded">
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!form.ack_listing_fee || !form.ack_survey_policy || !form.ack_listing_agreement) {
                    setError('Please accept all three agreements before submitting.')
                    return
                  }
                  handleSubmit()
                }}
                disabled={loading}
                className="flex-1 py-3 text-sm font-bold tracking-widest uppercase text-[#0c1f3f] transition-opacity hover:opacity-80 disabled:opacity-50 rounded"
                style={{ backgroundColor: '#c9a84c' }}
              >
                {loading ? 'Submitting…' : 'Submit Listing Request'}
              </button>
            </div>
          </div>
        )}

        {error && step < 4 && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded px-4 py-3 -mt-4 mb-6">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Nav buttons ───────────────────────────────────────────────────────────────
function StepNav({ onNext, onBack }: { onNext: () => void; onBack?: () => void }) {
  return (
    <div className="flex gap-4 pt-4">
      {onBack && (
        <button onClick={onBack}
          className="px-6 py-3 text-sm text-white/50 border border-white/10 hover:border-white/30 transition-colors rounded">
          ← Back
        </button>
      )}
      <button onClick={onNext}
        className="flex-1 py-3 text-sm font-bold tracking-widest uppercase text-[#0c1f3f] hover:opacity-80 transition-opacity rounded"
        style={{ backgroundColor: '#c9a84c' }}>
        Continue →
      </button>
    </div>
  )
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen() {
  return (
    <div style={{ backgroundColor: '#0a0a0a' }} className="min-h-screen text-white flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{ backgroundColor: '#c9a84c20', border: '1px solid #c9a84c40' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24"
            stroke="#c9a84c" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#c9a84c' }}>Submission Received</p>
        <h1 className="text-3xl font-bold mb-4">We've got your listing request.</h1>
        <p className="text-white/50 leading-relaxed mb-8">
          Our team will review your submission and reach out within 1–2 business days to confirm eligibility and schedule your pre-auction survey.
        </p>
        <div className="text-left space-y-3 mb-10 p-6 border border-white/10 rounded">
          <p className="text-xs uppercase tracking-widest text-white/30 mb-4">What happens next</p>
          {[
            'We review your submission and confirm listing eligibility',
            'We schedule an independent pre-auction survey at your location',
            'Your 7-day auction goes live once the survey is complete',
            'You owe $0 in seller commission if your boat sells',
          ].map((step, i) => (
            <div key={i} className="flex gap-3 text-sm text-white/60">
              <span className="text-[#c9a84c] font-bold flex-shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/auctions"
            className="px-6 py-3 text-sm font-semibold tracking-wider uppercase text-white/60 border border-white/10 hover:border-white/30 transition-colors rounded">
            Browse Auctions
          </Link>
          <Link href="/account/profile"
            className="px-6 py-3 text-sm font-semibold tracking-wider uppercase text-[#0c1f3f] rounded hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#c9a84c' }}>
            My Account
          </Link>
        </div>
      </div>
    </div>
  )
}
