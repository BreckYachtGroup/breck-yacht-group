'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Nav() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [profileName, setProfileName] = useState('')

  // Get name from auth metadata (set at signup), fallback to profile API
  useEffect(() => {
    if (!user) { setProfileName(''); return }

    // user_metadata.full_name is stored at signup time — fastest path
    const metaName = user.user_metadata?.full_name as string | undefined
    if (metaName) { setProfileName(metaName); return }

    // Fallback: fetch from buyer_profiles table
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/account/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.profile?.name) setProfileName(d.profile.name) })
        .catch(() => {})
    })
  }, [user])

  const [aboutOpen, setAboutOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [sellOpen, setSellOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const [mobileSellOpen, setMobileSellOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // First + last initials from profile name, fallback to email initial
  const userInitial = profileName
    ? profileName.trim().split(/\s+/).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? '')

  // Timers to delay closing so mouse can travel from button into dropdown
  const aboutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const servicesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sellTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const makeHandlers = (
    setter: (v: boolean) => void,
    timer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) => ({
    onMouseEnter: () => {
      if (timer.current) clearTimeout(timer.current)
      setter(true)
    },
    onMouseLeave: () => {
      timer.current = setTimeout(() => setter(false), 100)
    },
  })

  const closeAll = () => {
    setMobileOpen(false)
    setAboutOpen(false)
    setServicesOpen(false)
    setSellOpen(false)
    setMobileAboutOpen(false)
    setMobileServicesOpen(false)
    setMobileSellOpen(false)
  }

  return (
    <nav style={{ backgroundColor: '#0c1f3f' }} className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" onClick={() => { closeAll(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="text-white text-lg font-bold tracking-widest uppercase">
          Breck Yacht Group
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors">
            Home
          </Link>

          <Link href="/inventory" className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors">
            Inventory
          </Link>

          {/* Services Dropdown */}
          <div className="relative" {...makeHandlers(setServicesOpen, servicesTimer)}>
            <button className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors flex items-center gap-1">
              Services <span className="text-xs">▾</span>
            </button>
            {servicesOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-48 shadow-lg"
                style={{ backgroundColor: '#0c1f3f', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Link href="/services/financing" onClick={closeAll} className="block px-5 py-3 text-sm tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                  Financing
                </Link>
                <Link href="/services/insurance" onClick={closeAll} className="block px-5 py-3 text-sm tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                  Insurance
                </Link>
                <Link href="/services/yacht-management" onClick={closeAll} className="block px-5 py-3 text-sm tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                  Yacht Management
                </Link>
                <Link href="/services/buying-guide" onClick={closeAll} className="block px-5 py-3 text-sm tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                  Buying Guide
                </Link>
              </div>
            )}
          </div>

          {/* Sell Dropdown */}
          <div className="relative" {...makeHandlers(setSellOpen, sellTimer)}>
            <button className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors flex items-center gap-1">
              Sell <span className="text-xs">▾</span>
            </button>
            {sellOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-48 shadow-lg"
                style={{ backgroundColor: '#0c1f3f', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Link href="/sell/value-my-vessel" onClick={closeAll} className="block px-5 py-3 text-sm tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                  Value My Vessel
                </Link>
                <Link href="/sell/sellers-guide" onClick={closeAll} className="block px-5 py-3 text-sm tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                  Seller&apos;s Guide
                </Link>
              </div>
            )}
          </div>

          <Link href="/blog" className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors">
            Captain's Log
          </Link>

          {/* About Us Dropdown */}
          <div className="relative" {...makeHandlers(setAboutOpen, aboutTimer)}>
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

          {/* ── Auth ──────────────────────────────────────────────────────── */}
          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                {/* User avatar — links to account profile */}
                <Link
                  href="/account/profile"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: '#c9a84c', color: '#0c1f3f' }}
                  title="My Account"
                >
                  {userInitial}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-white/60 hover:text-white text-xs tracking-wider uppercase transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/account/login"
                className="text-xs tracking-wider uppercase px-4 py-2 border border-white/30 text-white/80 hover:text-white hover:border-white transition-colors"
              >
                Sign In
              </Link>
            )
          )}
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
          <Link href="/" onClick={() => { closeAll(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="px-2 py-4 text-sm tracking-wider uppercase text-white/80 hover:text-white transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Home
          </Link>
          <Link href="/inventory" onClick={closeAll} className="px-2 py-4 text-sm tracking-wider uppercase text-white/80 hover:text-white transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Inventory
          </Link>

          {/* Mobile Services */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              className="w-full text-left px-2 py-4 text-sm tracking-wider uppercase text-white/80 flex justify-between"
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
            >
              Services <span>{mobileServicesOpen ? '▴' : '▾'}</span>
            </button>
            {mobileServicesOpen && (
              <div className="pl-4 pb-2">
                <Link href="/services/financing" onClick={closeAll} className="block py-3 text-sm tracking-wider uppercase text-white/60 hover:text-white transition-colors">Financing</Link>
                <Link href="/services/insurance" onClick={closeAll} className="block py-3 text-sm tracking-wider uppercase text-white/60 hover:text-white transition-colors">Insurance</Link>
                <Link href="/services/yacht-management" onClick={closeAll} className="block py-3 text-sm tracking-wider uppercase text-white/60 hover:text-white transition-colors">Yacht Management</Link>
                <Link href="/services/buying-guide" onClick={closeAll} className="block py-3 text-sm tracking-wider uppercase text-white/60 hover:text-white transition-colors">Buying Guide</Link>
              </div>
            )}
          </div>

          {/* Mobile Sell */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              className="w-full text-left px-2 py-4 text-sm tracking-wider uppercase text-white/80 flex justify-between"
              onClick={() => setMobileSellOpen(!mobileSellOpen)}
            >
              Sell <span>{mobileSellOpen ? '▴' : '▾'}</span>
            </button>
            {mobileSellOpen && (
              <div className="pl-4 pb-2">
                <Link href="/sell/value-my-vessel" onClick={closeAll} className="block py-3 text-sm tracking-wider uppercase text-white/60 hover:text-white transition-colors">Value My Vessel</Link>
                <Link href="/sell/sellers-guide" onClick={closeAll} className="block py-3 text-sm tracking-wider uppercase text-white/60 hover:text-white transition-colors">Seller&apos;s Guide</Link>
              </div>
            )}
          </div>

          <Link href="/blog" onClick={closeAll} className="px-2 py-4 text-sm tracking-wider uppercase text-white/80 hover:text-white transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Captain's Log
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

          <Link href="/#contact" onClick={closeAll} className="px-2 py-4 text-sm tracking-wider uppercase text-white/80 hover:text-white transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Contact
          </Link>

          {/* Mobile auth */}
          {!loading && (
            user ? (
              <div className="flex items-center justify-between px-2 py-4">
                <span className="text-sm text-white/60 tracking-wider">
                  {user.email}
                </span>
                <button
                  onClick={() => { closeAll(); handleSignOut() }}
                  className="text-xs tracking-wider uppercase text-white/60 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/account/login"
                onClick={closeAll}
                className="px-2 py-4 text-sm tracking-wider uppercase text-white/80 hover:text-white transition-colors"
                style={{ color: '#c9a84c' }}
              >
                Sign In / Create Account
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  )
}

