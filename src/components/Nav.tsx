'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Nav() {
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <nav style={{ backgroundColor: '#0c1f3f' }} className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-white text-lg font-bold tracking-widest uppercase">
          Breck Yacht Group
        </Link>

        <div className="flex items-center gap-8">
          <Link href="/inventory" className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors">
            Inventory
          </Link>

          {/* About Us Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
          >
            <button className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors flex items-center gap-1">
              About Us
              <span className="text-xs">▾</span>
            </button>

            {aboutOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-44 shadow-lg"
                style={{ backgroundColor: '#0c1f3f', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Link
                  href="/about/crew"
                  className="block px-5 py-3 text-sm tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setAboutOpen(false)}
                >
                  Our Crew
                </Link>
                <Link
                  href="/about/testimonials"
                  className="block px-5 py-3 text-sm tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setAboutOpen(false)}
                >
                  Testimonials
                </Link>
              </div>
            )}
          </div>

          <Link href="/#contact" className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </nav>
  )
}
