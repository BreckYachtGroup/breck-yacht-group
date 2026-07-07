'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuctionForm, { AuctionFormValues } from '../_components/AuctionForm'

export default function CreateAuctionPage() {
  const router  = useRouter()
  const [token,  setToken]  = useState<string | null>(null)
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.email !== 'austin@breckyachtgroup.com') {
        router.replace('/'); return
      }
      setToken(session.access_token)
    })
  }, [router])

  async function handleSubmit(values: AuctionFormValues) {
    if (!token) return
    setSaving(true); setError('')

    const res = await fetch('/api/auctions/admin/listings', {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(values),
    })

    const d = await res.json()
    setSaving(false)
    if (!res.ok) { setError(d.error ?? 'Failed to create auction'); return }
    router.push('/auctions/admin')
  }

  if (!token) return null

  return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen text-white">
      <div style={{ backgroundColor: '#0c1f3f' }} className="px-8 py-6 flex items-center gap-6">
        <button onClick={() => router.push('/auctions/admin')} className="text-white/40 hover:text-white text-sm">← Back</button>
        <div>
          <p className="text-xs tracking-widest uppercase" style={{ color: '#c9a84c' }}>Auction Admin</p>
          <h1 className="text-2xl font-bold">New Auction Listing</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-8 py-10">
        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}
        <AuctionForm token={token} saving={saving} onSubmit={handleSubmit} onError={setError} />
      </div>
    </div>
  )
}
