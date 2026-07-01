'use client'

import { useState, useEffect, useRef } from 'react'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!

export default function InquiryForm({ vesselName }: { vesselName: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: `I'm interested in the ${vesselName}.` })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const turnstileRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  // Load Turnstile script and render widget
  useEffect(() => {
    const scriptId = 'cf-turnstile-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    const render = () => {
      if (turnstileRef.current && (window as any).turnstile && !widgetId.current) {
        widgetId.current = (window as any).turnstile.render(turnstileRef.current, {
          sitekey: SITE_KEY,
          theme: 'light',
          size: 'normal',
        })
      }
    }

    // If already loaded, render immediately; otherwise wait for script
    if ((window as any).turnstile) {
      render()
    } else {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          render()
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Get Turnstile token from the rendered widget
    const token = (window as any).turnstile?.getResponse(widgetId.current)
    if (!token) {
      setStatus('error')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, vesselName, turnstileToken: token }),
      })
      if (res.ok) {
        setStatus('success')
        // Reset Turnstile widget after successful submission
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

      {/* Cloudflare Turnstile widget renders here */}
      <div ref={turnstileRef} />

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
