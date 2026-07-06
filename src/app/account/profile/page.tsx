'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function AccountProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const [profile, setProfile]   = useState<{ name: string; phone: string; looking_for: string; timeline: string } | null>(null)
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm]   = useState(false)

  useEffect(() => {
    if (!user) { router.push('/account/login'); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/account/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then(r => r.json())
        .then(d => { setProfile(d.profile); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Buyer Portal</p>
        <h1 className="text-4xl font-bold">My Account</h1>
      </div>

      <div className="max-w-lg mx-auto px-6 py-16 space-y-6">

        {/* Profile summary */}
        <div className="bg-white shadow-md p-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: '#0c1f3f' }}>
            Your Profile
          </h2>

          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            {profile?.name && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Name</p>
                <p className="font-medium">{profile.name}</p>
              </div>
            )}
            {profile?.phone && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Phone</p>
                <p className="font-medium">{profile.phone}</p>
              </div>
            )}
            {profile?.looking_for && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Looking For</p>
                <p className="font-medium">{profile.looking_for}</p>
              </div>
            )}
            {profile?.timeline && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Timeline</p>
                <p className="font-medium">{profile.timeline}</p>
              </div>
            )}
          </div>
        </div>

        {/* Danger zone */}
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
