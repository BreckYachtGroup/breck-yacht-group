'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuctionForm, { AuctionFormValues } from '../../_components/AuctionForm'

// Convert DB auction to form values
function toFormValues(a: Record<string, unknown>): Partial<AuctionFormValues> {
  // datetime-local expects "YYYY-MM-DDTHH:mm"
  function toLocal(iso: string) {
    return iso ? new Date(iso).toISOString().slice(0, 16) : ''
  }
  return {
    slug:          String(a.slug ?? ''),
    title:         String(a.title ?? ''),
    description:   String(a.description ?? ''),
    make:          String(a.make ?? ''),
    model:         String(a.model ?? ''),
    year:          String(a.year ?? ''),
    length_ft:     String(a.length_ft ?? ''),
    location:      String(a.location ?? ''),
    condition:     String(a.condition ?? 'Used'),
    hours:         String(a.hours ?? ''),
    vin:           String(a.vin ?? ''),
    status:        String(a.status ?? 'draft'),
    starts_at:     toLocal(String(a.starts_at ?? '')),
    ends_at:       toLocal(String(a.ends_at ?? '')),
    starting_bid:  String(a.starting_bid ?? ''),
    reserve_price: String(a.reserve_price ?? ''),
    images:        Array.isArray(a.images) ? a.images as string[] : [],
  }
}

export default function EditAuctionPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const [token,   setToken]   = useState<string | null>(null)
  const [initial, setInitial] = useState<Partial<AuctionFormValues> | null>(null)
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user.email !== 'huebya@gmail.com') {
        router.replace('/'); return
      }
      const t = session.access_token
      setToken(t)

      // Load existing auction
      const res = await fetch(`/api/auctions/${slug}`)
      if (!res.ok) { setError('Auction not found'); return }
      const d = await res.json()
      setInitial(toFormValues(d.auction))
    })
  }, [router, slug])

  async function handleSubmit(values: AuctionFormValues) {
    if (!token) return
    setSaving(true); setError('')

    // Convert datetime-local back to ISO
    const payload = {
      ...values,
      year:          values.year        ? Number(values.year)        : null,
      length_ft:     values.length_ft   ? Number(values.length_ft)   : null,
      hours:         values.hours       ? Number(values.hours)        : null,
      starting_bid:  values.starting_bid  ? Number(values.starting_bid)  : 0,
      reserve_price: values.reserve_price ? Number(values.reserve_price) : null,
      starts_at:     values.starts_at ? new Date(values.starts_at).toISOString() : undefined,
      ends_at:       values.ends_at   ? new Date(values.ends_at).toISOString()   : undefined,
    }

    const res = await fetch(`/api/auctions/admin/listings/${slug}`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    const d = await res.json()
    setSaving(false)
    if (!res.ok) { setError(d.error ?? 'Failed to save'); return }
    router.push('/auctions/admin')
  }

  if (!token || !initial) return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen flex items-center justify-center">
      <p className="text-white/30 text-sm animate-pulse">{error || 'Loading…'}</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#0c0c0c' }} className="min-h-screen text-white">
      <div style={{ backgroundColor: '#0c1f3f' }} className="px-8 py-6 flex items-center gap-6">
        <button onClick={() => router.push('/auctions/admin')} className="text-white/40 hover:text-white text-sm">← Back</button>
        <div>
          <p className="text-xs tracking-widest uppercase" style={{ color: '#c9a84c' }}>Auction Admin</p>
          <h1 className="text-2xl font-bold">Edit Listing</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-8 py-10">
        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}
        <AuctionForm
          token={token}
          saving={saving}
          initialValues={initial}
          onSubmit={handleSubmit}
          onError={setError}
        />
      </div>
    </div>
  )
}
