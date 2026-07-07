'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Ensure buyer_profiles row exists (may have been skipped if email confirmation was required at signup)
    const token    = data.session?.access_token
    const meta     = data.user?.user_metadata ?? {}
    const fullName = meta.full_name as string | undefined
    if (token && fullName) {
      // Check if buyer_profiles row exists; create it if not
      fetch('/api/account/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(d => {
          if (!d.profile) {
            fetch('/api/account/profile', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body:    JSON.stringify({
                name:        fullName,
                phone:       meta.phone       ?? '',
                looking_for: meta.looking_for ?? '',
                timeline:    meta.timeline    ?? '',
              }),
            }).catch(() => {})
          }
        })
        .catch(() => {})
    }

    router.push('/inventory')
  }

  const inputCls = "w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded bg-white"
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Client Portal</p>
        <h1 className="text-4xl font-bold">Sign In</h1>
      </div>

      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white shadow-md p-10">

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
                className={inputCls} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls} style={{ marginBottom: 0 }}>Password</label>
                <Link href="/account/forgot-password"
                  className="text-xs text-gray-400 hover:text-gray-600 underline">
                  Forgot password?
                </Link>
              </div>
              <input type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className={inputCls} />
            </div>

            {resetSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded px-4 py-3">
                Password updated successfully. Sign in with your new password.
              </p>
            )}

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
              {loading ? 'Signing In…' : 'Sign In'}
            </button>

          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/account/signup" className="underline hover:text-gray-600 transition-colors">
              Create one free
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
