'use client'

import { useState, useEffect } from 'react'

interface Testimonial {
  id: string
  name: string
  title: string | null
  content: string
  approved_at: string
}

const inputCls = "w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white rounded"
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(data => { setTestimonials(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.content.trim()) {
      setError('Please fill in your name and testimonial.')
      return
    }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white px-6">
        <p className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#c9a84c' }}>Client Stories</p>
        <h1 className="text-4xl font-bold mb-4">Testimonials</h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Real experiences from buyers and sellers who&apos;ve worked with Breck Yacht Group.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">

        {/* Approved testimonials */}
        {loading ? (
          <div className="text-center text-gray-400 py-12 text-sm tracking-widest uppercase">Loading...</div>
        ) : testimonials.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            Be the first to share your experience.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map(t => (
              <div key={t.id} className="bg-white p-8 shadow-sm relative">
                <span className="absolute top-6 left-8 text-4xl leading-none" style={{ color: '#c9a84c', opacity: 0.3 }}>&ldquo;</span>
                <p className="text-gray-700 text-sm leading-relaxed mt-4 mb-6 relative z-10">{t.content}</p>
                <div className="border-t pt-4" style={{ borderColor: '#eee' }}>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  {t.title && (
                    <p className="text-xs uppercase tracking-wider mt-0.5" style={{ color: '#c9a84c' }}>{t.title}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submission form */}
        <div>
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: '#c9a84c' }}>Share Your Experience</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Leave a Testimonial</h2>

          {submitted ? (
            <div className="bg-white p-10 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f0f9f0' }}>
                <span className="text-2xl">âœ“</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Thank you, {form.name.split(' ')[0]}!</h3>
              <p className="text-gray-500 text-sm">Your testimonial has been submitted and will appear here after review.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white p-8 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email (not displayed publicly)</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Your Title / Context (optional)</label>
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Boat Buyer Â· Palm Beach, FL" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Your Testimonial *</label>
                <textarea required value={form.content} onChange={e => set('content', e.target.value)} placeholder="Tell us about your experience working with Breck Yacht Group…" rows={5} className={`${inputCls} resize-none`} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full py-4 text-sm tracking-widest uppercase font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#0c1f3f' }}>
                {submitting ? 'Submitting...' : 'Submit Testimonial'}
              </button>
              <p className="text-center text-xs text-gray-400">Testimonials are reviewed before being published.</p>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}

