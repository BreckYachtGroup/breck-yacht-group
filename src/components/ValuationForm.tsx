'use client'

import { useState } from 'react'

export default function ValuationForm() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    year: '', make: '', model: '', length: '', hours: '', engines: '', location: '', notes: ''
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ firstName: '', lastName: '', email: '', phone: '', year: '', make: '', model: '', length: '', hours: '', engines: '', location: '', notes: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="text" placeholder="First Name" required value={form.firstName} onChange={set('firstName')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
        <input type="text" placeholder="Last Name" required value={form.lastName} onChange={set('lastName')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
      </div>
      <input type="email" placeholder="Email Address" required value={form.email} onChange={set('email')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
      <input type="tel" placeholder="Phone Number" value={form.phone} onChange={set('phone')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />

      <p className="text-xs tracking-widest uppercase font-semibold mt-2" style={{ color: '#0c1f3f' }}>Vessel Details</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input type="number" placeholder="Year" required value={form.year} onChange={set('year')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
        <input type="text" placeholder="Make" required value={form.make} onChange={set('make')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
        <input type="text" placeholder="Model" required value={form.model} onChange={set('model')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="text" placeholder="Length (ft)" value={form.length} onChange={set('length')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
        <input type="number" placeholder="Engine Hours" value={form.hours} onChange={set('hours')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
      </div>
      <input type="text" placeholder="Engine Configuration (e.g. Triple Yamaha 425)" value={form.engines} onChange={set('engines')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
      <input type="text" placeholder="Current Location" value={form.location} onChange={set('location')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
      <textarea placeholder="Notable features, upgrades, or condition notes..." rows={4} value={form.notes} onChange={set('notes')} className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none" />

      <button
        type="submit" disabled={status === 'sending'}
        className="py-4 text-sm tracking-widest uppercase font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
        style={{ backgroundColor: '#c9a84c' }}
      >
        {status === 'sending' ? 'Sending...' : 'Request My Valuation'}
      </button>
      {status === 'success' && <p className="text-green-600 text-sm text-center">Request sent! We&apos;ll be in touch within 24 hours.</p>}
      {status === 'error' && <p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>}
    </form>
  )
}
