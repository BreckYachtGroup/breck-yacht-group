'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Testimonial {
  id: string
  name: string
  email: string | null
  title: string | null
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [acting, setActing] = useState<string | null>(null)

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? ''
  }

  async function load() {
    setLoading(true)
    const token = await getToken()
    const res = await fetch('/api/admin/testimonials', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function act(id: string, status: 'approved' | 'rejected') {
    setActing(id)
    const token = await getToken()
    await fetch('/api/admin/testimonials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    })
    setActing(null)
    load()
  }

  async function del(id: string) {
    if (!confirm('Permanently delete this testimonial?')) return
    setActing(id)
    const token = await getToken()
    await fetch('/api/admin/testimonials', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    })
    setActing(null)
    load()
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)
  const pendingCount = items.filter(i => i.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Testimonials
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full text-white font-semibold" style={{ backgroundColor: '#c9a84c' }}>
              {pendingCount} pending
            </span>
          )}
        </h2>
        <div className="flex gap-2 text-xs">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded uppercase tracking-wider font-semibold transition-colors ${filter === f ? 'text-white' : 'text-gray-400 hover:text-gray-600 bg-gray-100'}`}
              style={filter === f ? { backgroundColor: '#0c1f3f' } : {}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loadingâ€¦</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No {filter === 'all' ? '' : filter} testimonials.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white border border-gray-100 p-6 rounded shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    {t.title && <span className="text-xs text-gray-400">{t.title}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.status === 'approved' ? 'bg-green-100 text-green-700' : t.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {t.status}
                    </span>
                  </div>
                  {t.email && <p className="text-xs text-gray-400 mb-3">{t.email}</p>}
                  <p className="text-sm text-gray-700 leading-relaxed">{t.content}</p>
                  <p className="text-xs text-gray-300 mt-3">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div className="flex gap-2 flex-shrink-0 items-start">
                  {t.status === 'pending' && (
                    <>
                      <button onClick={() => act(t.id, 'approved')} disabled={acting === t.id} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white rounded transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#0c1f3f' }}>Approve</button>
                      <button onClick={() => act(t.id, 'rejected')} disabled={acting === t.id} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">Reject</button>
                    </>
                  )}
                  {t.status === 'approved' && (
                    <button onClick={() => act(t.id, 'rejected')} disabled={acting === t.id} className="px-3 py-2 text-xs text-gray-400 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">Unpublish</button>
                  )}
                  {t.status === 'rejected' && (
                    <button onClick={() => act(t.id, 'approved')} disabled={acting === t.id} className="px-3 py-2 text-xs text-white rounded disabled:opacity-50" style={{ backgroundColor: '#c9a84c' }}>Approve</button>
                  )}
                  {/* Delete button â€” always visible */}
                  <button onClick={() => del(t.id)} disabled={acting === t.id}
                    className="px-3 py-2 text-xs text-red-400 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                    title="Delete permanently">
                    X
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

