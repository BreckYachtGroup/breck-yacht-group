'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Nav() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false)

  const closeAll = () => {
    setMobileOpen(false)
    setAboutOpen(false)
    setMobileAboutOpen(false)
  }

  return (
    <nav style={{ backgroundColor: '#0c1f3f' }} className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" onClick={closeAll} className="text-white text-lg font-bold tracking-widest uppercase">
          Breck Yacht Group
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/inventory" className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors">
            Inventory
          </Link>

          <Link href="/blog" className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors">
            The Log
          </Link>

          {/* About Us Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
          >
            <button className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors flex items-center gap-1">
              About Us <span className="text-xs">▾</span>
            </button>
            {aboutOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-44 shadow-lg"
                style={{ backgroundColor: '#0c1f3f', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Link href="/about/crew" onClick={closeAll} className="block px-5 py-3 text-sm tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                  Our Crew
                </Link>
                <Link href="/about/testimonials" onClick={closeAll} className="block px-5 py-3 text-sm tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                  Testimonials
                </Link>
              </div>
            )}
          </div>

          <Link href="/#contact" className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors">
            Contact
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden mt-4 pb-4 flex flex-col" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Link href="/inventory" onClick={closeAll} className="px-2 py-4 text-sm tracking-wider uppercase text-white/80 hover:text-white transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Inventory
          </Link>
          <Link href="/blog" onClick={closeAll} className="px-2 py-4 text-sm tracking-wider uppercase text-white/80 hover:text-white transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            The Log
          </Link>

          {/* Mobile About Us */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              className="w-full text-left px-2 py-4 text-sm tracking-wider uppercase text-white/80 flex justify-between"
              onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
            >
              About Us <span>{mobileAboutOpen ? '▴' : '▾'}</span>
            </button>
            {mobileAboutOpen && (
              <div className="pl-4 pb-2">
                <Link href="/about/crew" onClick={closeAll} className="block py-3 text-sm tracking-wider uppercase text-white/60 hover:text-white transition-colors">
                  Our Crew
                </Link>
                <Link href="/about/testimonials" onClick={closeAll} className="block py-3 text-sm tracking-wider uppercase text-white/60 hover:text-white transition-colors">
                  Testimonials
                </Link>
              </div>
            )}
          </div>

          <Link href="/#contact" onClick={closeAll} className="px-2 py-4 text-sm tracking-wider uppercase text-white/80 hover:text-white transition-colors">
            Contact
          </Link>
        </div>
      )}
    </nav>
  )
}

