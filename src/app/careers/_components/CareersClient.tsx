'use client'

import { useState } from 'react'

const inputCls = "w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white rounded"
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"

const TIERS = [
  {
    split:     '60 / 40',
    you:       '60%',
    milestone: 'Starting split',
    detail:    'You keep 60% of every deal from your very first sale. No ramp period, no holdbacks.',
    color:     '#c9a84c',
  },
  {
    split:     '70 / 30',
    you:       '70%',
    milestone: 'After $150K in commissions',
    detail:    'Once your cumulative commission income crosses $150,000, your split automatically upgrades.',
    color:     '#e0bc6a',
  },
  {
    split:     '80 / 20',
    you:       '80%',
    milestone: 'After $300K in commissions',
    detail:    'The highest tier in the industry. Cross $300K and keep 80 cents of every dollar you bring in.',
    color:     '#f0d080',
  },
]

export default function CareersClient() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    licensed: '', experience: '', territory: '', pitch: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.licensed) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/careers', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })

    setSubmitting(false)
    if (res.ok) {
      setSubmitted(true)
    } else {
      setError('Something went wrong. Please email us directly at austin@breckyachtgroup.com.')
    }
  }

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-24 text-center text-white px-6">
        <p className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#c9a84c' }}>
          Now Hiring · Marine Sales Professionals
        </p>
        <h1 className="text-5xl font-bold mb-5">Sell more. Keep more.</h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
          Breck Yacht Group is building a sales team around the highest commission
          structure in the Florida marine market — and an auction platform no other
          brokerage can offer.
        </p>
      </div>

      {/* ── Commission Tiers ─────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs tracking-[0.3em] uppercase mb-8" style={{ color: '#c9a84c' }}>
            Commission Structure
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TIERS.map((t) => (
              <div key={t.split} className="p-6"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${t.color}` }}>
                <p className="text-4xl font-bold text-white mb-1">{t.you}</p>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: t.color }}>
                  {t.split} split
                </p>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">
                  {t.milestone}
                </p>
                <p className="text-white/50 text-sm leading-relaxed">{t.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-white/30 text-sm mt-6">
            No desk fees. No earnings cap. Milestones reset annually.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        {/* ── Why BYG ───────────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#c9a84c' }}>
            Why Breck Yacht Group
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: 'The auction platform',
                body: 'We\'re launching one of the first live online auction platforms in the Florida marine market. You\'ll have incentivized access as it goes live — a tool no competing salesperson will have.',
              },
              {
                title: 'Co-brokerage inventory',
                body: 'Tap into over 8,200 co-brokerage listings alongside our in-house inventory. You\'re never starting from zero.',
              },
              {
                title: 'Clean, modern tools',
                body: 'Custom CRM, real-time bidding technology, automated buyer matching, and a premium brand that positions you to sell at the high end of the market.',
              },
              {
                title: 'Licensing support',
                body: 'Don\'t have your Florida yacht salesperson\'s license yet? We\'ll get you the packet and walk you through the process. The license is required to sell — but we\'ll help you get there.',
              },
            ].map(item => (
              <div key={item.title} className="bg-white p-6 shadow-sm">
                <p className="font-semibold text-gray-900 mb-2">{item.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Requirements ──────────────────────────────────────────────────── */}
        <div className="bg-white p-8 shadow-sm">
          <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#c9a84c' }}>
            What we're looking for
          </p>
          <ul className="space-y-3 text-sm text-gray-600">
            {[
              'Florida yacht salesperson\'s license (or willingness to obtain one — we\'ll help)',
              'Proven track record in marine, automotive, or high-ticket sales',
              'Self-motivated, client-first mindset with a team-oriented approach',
              'Comfortable representing a premium brand to high-net-worth buyers',
              'Based in or able to work the Florida market',
            ].map(req => (
              <li key={req} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: '#c9a84c' }}>✓</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Application Form ──────────────────────────────────────────────── */}
        <div>
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: '#c9a84c' }}>
            Apply now
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Tell us about yourself</h2>

          {submitted ? (
            <div className="bg-white p-10 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#f0f9f0' }}>
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Application received</h3>
              <p className="text-gray-500 text-sm">
                Thanks, {form.name.split(' ')[0]}. Austin will be in touch within 1–2 business days.
                In the meantime, feel free to reach out directly at{' '}
                <a href="mailto:austin@breckyachtgroup.com" className="underline" style={{ color: '#0c1f3f' }}>
                  austin@breckyachtgroup.com
                </a>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white p-8 shadow-sm space-y-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input type="text" required value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="John Smith"
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input type="email" required value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="john@example.com"
                    className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input type="tel" required value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="(561) 000-0000"
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Florida Yacht Salesperson License *</label>
                  <select required value={form.licensed}
                    onChange={e => set('licensed', e.target.value)}
                    className={`${inputCls} appearance-none`}>
                    <option value="">Select…</option>
                    <option value="yes">Yes — I'm currently licensed</option>
                    <option value="no">Not yet — I'd like to get licensed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Sales Experience</label>
                <input type="text" value={form.experience}
                  onChange={e => set('experience', e.target.value)}
                  placeholder="e.g. 8 years marine sales, previously at MarineMax Fort Lauderdale"
                  className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Territory / Area You Work</label>
                <input type="text" value={form.territory}
                  onChange={e => set('territory', e.target.value)}
                  placeholder="e.g. Palm Beach, Broward, Monroe counties"
                  className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Why do you want to join BYG?</label>
                <textarea value={form.pitch}
                  onChange={e => set('pitch', e.target.value)}
                  placeholder="Tell us what you're looking for and what you'd bring to the team…"
                  rows={4}
                  className={`${inputCls} resize-none`} />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: '#0c1f3f' }}
              >
                {submitting ? 'Sending…' : 'Submit Application'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Prefer to reach out directly?{' '}
                <a href="mailto:austin@breckyachtgroup.com" className="underline">
                  austin@breckyachtgroup.com
                </a>{' '}
                · (561) 723-5636
              </p>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
