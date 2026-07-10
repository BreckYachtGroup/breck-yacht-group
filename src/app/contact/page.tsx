import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us | Breck Yacht Group',
  description: 'Get in touch with Breck Yacht Group. Reach our Palm Beach yacht brokerage team for buying, selling, or general inquiries.',
  openGraph: {
    title: 'Contact Us | Breck Yacht Group',
    description: 'Reach our Palm Beach yacht brokerage team for buying, selling, or general inquiries.',
    url: 'https://www.breckyachtgroup.com/contact',
  },
}

export default function ContactPage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white px-6">
        <p className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#c9a84c' }}>
          Get In Touch
        </p>
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
          Whether you&apos;re buying, selling, or just have questions — we&apos;re here to help.
        </p>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-16">

        {/* Left — contact info */}
        <div className="flex flex-col justify-start gap-10">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#c9a84c' }}>
              Direct Contact
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Phone</p>
                <a href="tel:5617235636" className="text-lg font-semibold text-gray-900 hover:opacity-70 transition-opacity">
                  (561) 723-5636
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Email</p>
                <a href="mailto:austin@breckyachtgroup.com" className="text-lg font-semibold text-gray-900 hover:opacity-70 transition-opacity">
                  austin@breckyachtgroup.com
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Location</p>
                <p className="text-lg font-semibold text-gray-900">Palm Beach County, Florida</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#c9a84c' }}>
              Follow Us
            </p>
            <div className="flex gap-5">
              <a href="https://www.facebook.com/BreckYachtGroup/" target="_blank" rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity" aria-label="Facebook" style={{ color: '#0c1f3f' }}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/breckyachtgroup" target="_blank" rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity" aria-label="Instagram" style={{ color: '#0c1f3f' }}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="bg-white p-6 shadow-sm">
            <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#c9a84c' }}>
              Response Time
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              We typically respond within a few hours during business hours.
              For urgent inquiries, call us directly at (561) 723-5636.
            </p>
          </div>
        </div>

        {/* Right — form */}
        <div>
          <p className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: '#c9a84c' }}>
            Send a Message
          </p>
          <ContactForm />
        </div>

      </div>
    </div>
  )
}
