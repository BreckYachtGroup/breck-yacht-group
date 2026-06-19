'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Add your hero images here — drop files into the /public folder and list them below
const images = [
  '/hero-1.jpg',
  '/hero-2.jpg',
  '/hero-3.jpg',
]

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative overflow-hidden" style={{ minHeight: '92vh' }}>
      {/* Images */}
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={src}
            alt={`Breck Yacht Group hero ${i + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Dark overlay so text is readable over photos */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(12,31,63,0.6) 0%, rgba(12,31,63,0.4) 50%, rgba(12,31,63,0.7) 100%)' }} />
        </div>
      ))}

      {/* Text Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center text-white px-6" style={{ minHeight: '92vh' }}>
        <p className="text-xs tracking-[0.4em] uppercase mb-6" style={{ color: '#c9a84c' }}>
          Premium Yacht Brokerage
        </p>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Find Your Perfect<br />Performance Vessel
        </h1>
        <p className="text-white/80 text-lg mb-10 leading-relaxed max-w-2xl">
          Breck Yacht Group specializes in the finest center consoles and sportfish vessels on the market. Browse our curated inventory or speak with a broker today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/inventory"
            className="px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#c9a84c' }}
          >
            View Inventory
          </Link>
          <a
            href="#contact"
            className="px-8 py-4 text-sm tracking-widest uppercase font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors"
          >
            Contact a Broker
          </a>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{ backgroundColor: i === current ? '#c9a84c' : 'rgba(255,255,255,0.4)' }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
