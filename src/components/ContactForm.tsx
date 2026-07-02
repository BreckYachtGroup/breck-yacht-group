'use client'

import { useState, useEffect, useRef } from 'react'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!

export default function ContactForm() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const turnstileRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    const scriptId = 'cf-turnstile-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true; script.defer = true
      document.head.appendChild(script)
    }
    const render = () => {
      if (turnstileRef.current && (window as any).turnstile && !widgetId.current) {
        widgetId.current = (window as any).turnstile.render(turnstileRef.current, { sitekey: SITE_KEY, theme: 'light' })
      }
    }
    if ((window as any).turnstile) { render() } else {
      const interval = setInterval(() => { if ((window as any).turnstile) { render(); clearInterval(interval) } }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = (window as any).turnstile?.getResponse(widgetId.current)
    if (!token) { setStatus('error'); return }
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken: token }),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ firstName: '', lastName: '', email: '', phone: '', message: '' })
        ;(window as any).turnstile?.reset(widgetId.current)
      } else {
        setStatus('error')
        ;(window as any).turnstile?.reset(widgetId.current)
      }
    } catch {
      setStatus('error')
      ;(window as any).turnstile?.reset(widgetId.current)
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

      <div ref={turnstileRef} />

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
