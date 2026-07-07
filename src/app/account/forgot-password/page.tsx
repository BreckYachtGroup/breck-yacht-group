'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account/reset-password`,
    })

    setLoading(false)
    if (resetError) { setError(resetError.message); return }
    setSent(true)
  }

  const inputCls = "w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded bg-white"
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Client Portal</p>
        <h1 className="text-4xl font-bold">Reset Password</h1>
      </div>

      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white shadow-md p-10">

          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">✉️</div>
              <h2 className="text-lg font-semibold text-gray-800">Check your inbox</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
              </p>
              <p className="text-xs text-gray-400">Didn&apos;t get it? Check your spam folder.</p>
              <Link href="/account/login"
                className="block mt-4 text-sm underline text-gray-400 hover:text-gray-600">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Enter the email address on your account and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className={inputCls} />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded px-4 py-3">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-4 text-sm font-semibold tracking-widest uppercase text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#0c1f3f' }}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Remembered it?{' '}
                <Link href="/account/login" className="underline hover:text-gray-600">
                  Sign In
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
