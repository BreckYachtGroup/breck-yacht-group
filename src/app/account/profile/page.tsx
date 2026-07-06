'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

type Profile = { name: string; phone: string; looking_for: string; timeline: string }

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
  const { user, signOut } = useAuth()
  const router = useRouter()

  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [form,     setForm]     = useState<Profile>({ name: '', phone: '', looking_for: '', timeline: '' })
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [saveMsg,  setSaveMsg]  = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  const set = (k: keyof Profile, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!user) { router.push('/account/login'); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/account/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then(r => r.json())
        .then(d => {
          const p = d.profile ?? { name: '', phone: '', looking_for: '', timeline: '' }
          setProfile(p)
          setForm(p)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

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
                <label className={labelCls}>Email</label>
                <input type="email" value={user?.email ?? ''} disabled
                  className={`${inputCls} opacity-50 cursor-not-allowed`} />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
              </div>
              <div>
                <label className={labelCls}>Phone Number</label>
                <input type="tel" value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="(561) 000-0000"
                  className={inputCls} />
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
                <p className={labelCls}>Phone</p>
                <p className="font-medium">{profile?.phone || <span className="text-gray-400 italic">Not set</span>}</p>
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
