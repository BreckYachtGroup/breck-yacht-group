'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ firstName: '', lastName: '', email: '', phone: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text" placeholder="First Name" required value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
        />
        <input
          type="text" placeholder="Last Name" required value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
        />
      </div>
      <input
        type="email" placeholder="Email Address" required value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
      />
      <input
        type="tel" placeholder="Phone Number" value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
      />
      <textarea
        placeholder="What are you looking for?" rows={4} value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
      />
      <button
        type="submit" disabled={status === 'sending'}
        className="py-4 text-sm tracking-widest uppercase font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#c9a84c' }}
      >
        {status === 'sending' ? 'Sending...' : 'Send Message'}
      </button>
      {status === 'success' && <p className="text-green-600 text-sm text-center">Message sent! We&apos;ll be in touch shortly.</p>}
      {status === 'error' && <p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>}
    </form>
  )
}
