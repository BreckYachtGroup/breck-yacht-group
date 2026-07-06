'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const TIMELINES = [
  'Just browsing',
  'Within 3 months',
  '3–6 months',
  '6–12 months',
  'Ready to buy now',
]

export default function SignUpPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', looking_for: '', timeline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options:  {
          data: {
            full_name:   form.name,
            phone:       form.phone,
            looking_for: form.looking_for,
            timeline:    form.timeline,
          },
        },
      })

      if (signUpError) throw signUpError
      if (!data.user)  throw new Error('Sign-up failed — please try again.')

      // 2. Create buyer profile
      const token = (await supabase.auth.getSession()).data.session?.access_token
      await fetch('/api/account/profile', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name:        form.name,
          phone:       form.phone,
          looking_for: form.looking_for,
          timeline:    form.timeline,
        }),
      })

      // 3. Send to inventory — they're now logged in
      router.push('/inventory')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded bg-white"
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      {/* Header */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Client Portal</p>
        <h1 className="text-4xl font-bold">Create Your Account</h1>
        <p className="text-white/60 mt-3 text-sm">
          Save searches and get notified personally when matching vessels become available.
        </p>
      </div>

      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="bg-white shadow-md p-10">

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className={labelCls}>Full Name *</label>
              <input type="text" required value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="John Smith"
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Email Address *</label>
              <input type="email" required value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="john@example.com"
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Password *</label>
              <input type="password" required minLength={8} value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Minimum 8 characters"
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Phone Number</label>
              <input type="tel" value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="(561) 000-0000"
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>What are you looking for?</label>
              <textarea value={form.looking_for}
                onChange={e => set('looking_for', e.target.value)}
                placeholder="e.g. Center console 35–45ft, budget $300K–$500K, prefer Contender or Regulator…"
                rows={3}
                className={`${inputCls} resize-none`} />
            </div>

            <div>
              <label className={labelCls}>Purchase Timeline</label>
              <select value={form.timeline} onChange={e => set('timeline', e.target.value)}
                className={`${inputCls} appearance-none`}>
                <option value="">Select a timeline…</option>
                {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-sm font-semibold tracking-widest uppercase text-white transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#0c1f3f' }}
            >
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>

          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link href="/account/login" className="underline hover:text-gray-600 transition-colors">
              Sign in
            </Link>
          </p>

        </div>

        <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
          Your information is only used to match you with vessels and is never sold or shared.
          View our{' '}
          <Link href="/privacy-policy" className="underline hover:text-gray-600">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
