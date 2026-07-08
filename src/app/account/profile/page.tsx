'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

type Profile = {
  name: string; phone: string; looking_for: string; timeline: string; username: string
  address_line1: string; address_city: string; address_state: string; address_zip: string
}

const TIMELINES = [
  'Just browsing',
  'Within 3 months',
  '3–6 months',
  '6–12 months',
  'Ready to buy now',
]

const inputCls = "w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded bg-white"
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"

export default function AccountProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const [profileComplete, setProfileComplete] = useState(true)
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [form,     setForm]     = useState<Profile>({
    name: '', phone: '', looking_for: '', timeline: '', username: '',
    address_line1: '', address_city: '', address_state: '', address_zip: '',
  })
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [saveMsg,  setSaveMsg]  = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  const set = (k: keyof Profile, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/account/login'); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/account/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then(r => r.json())
        .then(d => {
          const p = d.profile ?? {
            name: '', phone: '', looking_for: '', timeline: '', username: '',
            address_line1: '', address_city: '', address_state: '', address_zip: '',
          }
          setProfile(p)
          setForm(p)
          setProfileComplete(d.isComplete ?? false)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    })
  }, [user, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setSaveMsg(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/account/profile', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body:    JSON.stringify(form),
    })

    if (res.ok) {
      setProfile({ ...form })
      setEditing(false)
      // Recalculate completeness
      const c = !!(form.name && form.phone && form.username &&
        form.address_line1 && form.address_city && form.address_state && form.address_zip)
      setProfileComplete(c)
      setSaveMsg('Changes saved.')
      setTimeout(() => setSaveMsg(null), 3000)
    } else {
      setSaveMsg('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return }
    setDeleting(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/account/delete', {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (res.ok) {
      await signOut()
      router.push('/')
    } else {
      setDeleting(false)
      setConfirm(false)
      alert('Something went wrong. Please try again or contact us.')
    }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 tracking-widest uppercase text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Client Portal</p>
        <h1 className="text-4xl font-bold">My Account</h1>
      </div>

      <div className="max-w-lg mx-auto px-6 py-16 space-y-6">

        {/* ── Profile completion banner ─────────────────────────────────────── */}
        {!profileComplete && (
          <div className="p-5 border-l-4 bg-amber-50" style={{ borderColor: '#c9a84c' }}>
            <p className="text-sm font-semibold text-amber-800 mb-1">
              ⚠ Complete your profile to bid or list a vessel
            </p>
            <p className="text-xs text-amber-700">
              Name, phone, auction username, and full mailing address are required before
              you can place bids or submit a vessel for auction.
            </p>
          </div>
        )}

        {/* ── Quick links ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <a href="/account/watchlist"
            className="bg-white shadow-sm hover:shadow-md transition-shadow p-5 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#c9a84c' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">Auctions</p>
              <p className="font-semibold text-gray-800 text-sm">My Watchlist</p>
            </div>
          </a>
          <a href="/account/bids"
            className="bg-white shadow-sm hover:shadow-md transition-shadow p-5 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#c9a84c' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">Auctions</p>
              <p className="font-semibold text-gray-800 text-sm">Bid History</p>
            </div>
          </a>
        </div>

        {/* ── Profile card ─────────────────────────────────────────────────── */}
        <div className="bg-white shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#0c1f3f' }}>
              Your Profile
            </h2>
            {!editing && (
              <button
                onClick={() => { setEditing(true); setSaveMsg(null) }}
                className="text-xs uppercase tracking-wider underline underline-offset-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            /* ── Edit form ── */
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input type="text" required value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>
                  Auction Username
                  <span className="ml-1 font-normal normal-case tracking-normal text-gray-400">(shown on bids &amp; comments)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                  <input type="text" value={form.username ?? ''}
                    onChange={e => set('username', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="e.g. MarlinHunter305"
                    maxLength={20}
                    className={`${inputCls} pl-7`} />
                </div>
                <p className="text-xs text-gray-400 mt-1">3–20 characters. Letters, numbers, and underscores only.</p>
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={user?.email ?? ''} disabled
                  className={`${inputCls} opacity-50 cursor-not-allowed`} />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
              </div>
              <div>
                <label className={labelCls}>Phone Number *</label>
                <input type="tel" value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="(561) 000-0000"
                  className={inputCls} />
              </div>

              {/* ── Mailing Address (required for bidding & clerking records) ── */}
              <div>
                <label className={labelCls}>
                  Mailing Address *
                  <span className="ml-1 font-normal normal-case tracking-normal text-gray-400">
                    (required to bid or sell)
                  </span>
                </label>
                <input type="text" value={form.address_line1}
                  onChange={e => set('address_line1', e.target.value)}
                  placeholder="Street address"
                  className={`${inputCls} mb-2`} />
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={form.address_city}
                    onChange={e => set('address_city', e.target.value)}
                    placeholder="City"
                    className={`${inputCls} col-span-1`} />
                  <input type="text" value={form.address_state}
                    onChange={e => set('address_state', e.target.value.toUpperCase())}
                    placeholder="FL"
                    maxLength={2}
                    className={`${inputCls} col-span-1`} />
                  <input type="text" value={form.address_zip}
                    onChange={e => set('address_zip', e.target.value)}
                    placeholder="ZIP"
                    maxLength={10}
                    className={`${inputCls} col-span-1`} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Required by Florida auctioneer licensing regulations. Kept private.
                </p>
              </div>

              <div>
                <label className={labelCls}>What are you looking for?</label>
                <textarea value={form.looking_for}
                  onChange={e => set('looking_for', e.target.value)}
                  placeholder="e.g. Center console 35–45ft, budget $300K–$500K…"
                  rows={3}
                  className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Purchase Timeline</label>
                <select value={form.timeline} onChange={e => set('timeline', e.target.value)}
                  className={`${inputCls} appearance-none`}>
                  <option value="">Select a timeline…</option>
                  {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {saveMsg && (
                <p className="text-sm text-red-500">{saveMsg}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="px-6 py-2.5 text-sm font-semibold tracking-widest uppercase text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#0c1f3f' }}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setEditing(false); setForm(profile ?? form) }}
                  className="px-6 py-2.5 text-sm text-gray-500 border border-gray-200 hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── Read view ── */
            <div className="space-y-4 text-sm text-gray-600">
              {saveMsg && (
                <p className="text-sm text-green-600 font-medium">{saveMsg}</p>
              )}
              <div>
                <p className={labelCls}>Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className={labelCls}>Name</p>
                <p className="font-medium">{profile?.name || <span className="text-gray-400 italic">Not set</span>}</p>
              </div>
              <div>
                <p className={labelCls}>Auction Username</p>
                {profile?.username
                  ? <p className="font-medium text-gray-800">@{profile.username}</p>
                  : <p className="text-sm text-amber-600 font-medium">⚠ No username set — your email prefix will be shown on bids and comments.</p>
                }
              </div>
              <div>
                <p className={labelCls}>Phone</p>
                <p className="font-medium">{profile?.phone || <span className="text-gray-400 italic">Not set</span>}</p>
              </div>
              <div>
                <p className={labelCls}>Mailing Address</p>
                {profile?.address_line1 ? (
                  <p className="font-medium">
                    {profile.address_line1}<br />
                    {profile.address_city}, {profile.address_state} {profile.address_zip}
                  </p>
                ) : (
                  <p className="text-sm text-amber-600 font-medium">⚠ Address required to bid or sell</p>
                )}
              </div>
              <div>
                <p className={labelCls}>Looking For</p>
                <p className="font-medium">{profile?.looking_for || <span className="text-gray-400 italic">Not set</span>}</p>
              </div>
              <div>
                <p className={labelCls}>Timeline</p>
                <p className="font-medium">{profile?.timeline || <span className="text-gray-400 italic">Not set</span>}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Danger zone ──────────────────────────────────────────────────── */}
        <div className="bg-white shadow-md p-8 border border-red-100">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-2 text-red-600">
            Delete Account
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Permanently deletes your account, saved searches, and all personal data.
            This cannot be undone.
          </p>

          {confirm ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-red-600">
                Are you sure? This will permanently delete everything.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  className="px-6 py-2.5 text-sm text-gray-500 border border-gray-200 hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="px-6 py-2.5 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
            >
              Delete My Account
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
