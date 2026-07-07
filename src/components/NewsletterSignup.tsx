'use client'

import { useState } from 'react'

export default function NewsletterSignup() {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res  = await fetch('/api/newsletter/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
    setSuccess(true)
    setEmail('')
  }

  return (
    <div className="border-t py-8 mt-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
      <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: '#c9a84c' }}>
        Stay in the Loop
      </p>
      <p className="text-white/50 text-xs mb-4">
        New auction listings, featured inventory, and market insights — delivered to your inbox.
      </p>
      {success ? (
        <p className="text-xs" style={{ color: '#c9a84c' }}>✓ You&apos;re on the list.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-1 px-3 py-2 text-xs text-white bg-transparent border focus:outline-none"
            style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' }}
          />
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}>
            {loading ? '…' : 'Subscribe'}
          </button>
        </form>
      )}
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}
