'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function UnsubscribeContent() {
  const params  = useSearchParams()
  const success = params.get('success') === 'true'
  const error   = params.get('error')

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>
          Breck Yacht Group
        </p>
        <h1 className="text-4xl font-bold">
          {success ? 'Unsubscribed' : error ? 'Something Went Wrong' : 'Unsubscribe'}
        </h1>
      </div>

      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="bg-white shadow-md p-10">

          {success && (
            <>
              <div className="text-4xl mb-6">✓</div>
              <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>
                You&apos;ve been unsubscribed
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Your saved searches have been removed and you won&apos;t receive any more vessel
                match alerts. Your account remains active — you can still browse inventory and
                save new searches any time.
              </p>
              <Link
                href="/inventory"
                className="inline-block px-8 py-3 text-sm font-semibold tracking-widest uppercase text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#0c1f3f' }}
              >
                Browse Inventory
              </Link>
            </>
          )}

          {error === 'invalid' && (
            <>
              <h2 className="text-xl font-bold mb-3 text-red-600">Invalid Link</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                This unsubscribe link is invalid or has expired. If you&apos;d like to stop
                receiving alerts, you can remove your saved searches from your account settings
                or contact us directly.
              </p>
              <Link
                href="/#contact"
                className="inline-block px-8 py-3 text-sm font-semibold tracking-widest uppercase text-white"
                style={{ backgroundColor: '#0c1f3f' }}
              >
                Contact Us
              </Link>
            </>
          )}

          {error === 'server' && (
            <>
              <h2 className="text-xl font-bold mb-3 text-red-600">Something Went Wrong</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                We couldn&apos;t process your request. Please try again or contact us and we&apos;ll
                remove you manually.
              </p>
              <a
                href="mailto:austin@breckyachtgroup.com"
                className="inline-block px-8 py-3 text-sm font-semibold tracking-widest uppercase text-white"
                style={{ backgroundColor: '#0c1f3f' }}
              >
                Email Us
              </a>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  )
}
