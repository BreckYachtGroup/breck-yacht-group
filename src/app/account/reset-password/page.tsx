'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [ready,     setReady]     = useState(false)  // true once Supabase confirms the reset token

  // Supabase sends the user back with a hash fragment containing the tokens.
  // Listening for PASSWORD_RECOVERY confirms the session is valid.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) { setError(updateError.message); return }

    // Sign out so user logs in fresh with new password
    await supabase.auth.signOut()
    router.push('/account/login?reset=success')
  }

  const inputCls = "w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded bg-white"
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Client Portal</p>
        <h1 className="text-4xl font-bold">Set New Password</h1>
      </div>

      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white shadow-md p-10">

          {!ready ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500 animate-pulse">Verifying reset link…</p>
              <p className="text-xs text-gray-400">
                If nothing happens, your link may have expired.{' '}
                <a href="/account/forgot-password" className="underline">Request a new one</a>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelCls}>New Password</label>
                <input type="password" required minLength={8} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Confirm Password</label>
                <input type="password" required value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
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
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
