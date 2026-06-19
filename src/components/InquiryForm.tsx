'use client'

import { useState } from 'react'

export default function InquiryForm({ vesselName }: { vesselName: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: `I'm interested in the ${vesselName}.` })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, vesselName }),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text" placeholder="Your Name" required value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400 w-full"
      />
      <input
        type="email" placeholder="Email Address" required value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400 w-full"
      />
      <input
        type="tel" placeholder="Phone Number" value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400 w-full"
      />
      <textarea
        placeholder="Message" rows={3} value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none w-full"
      />
      <button
        type="submit" disabled={status === 'sending'}
        className="py-4 text-sm tracking-widest uppercase font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 w-full"
        style={{ backgroundColor: '#c9a84c' }}
      >
        {status === 'sending' ? 'Sending...' : 'Send Inquiry'}
      </button>
      {status === 'success' && <p className="text-green-600 text-sm text-center">Inquiry sent! We&apos;ll be in touch shortly.</p>}
      {status === 'error' && <p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>}
    </form>
  )
}
