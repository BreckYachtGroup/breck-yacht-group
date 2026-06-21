'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// Desktop: video only
const VIDEO_SRC = '/Sportsmanvid2.mp4'

// Mobile slides — add more images here as you get them
const mobileImages = [
  '/hero-1.jpg', // electronics photo (placeholder until boat-running photo is added)
]

const overlay = 'linear-gradient(to bottom, rgba(12,31,63,0.55) 0%, rgba(12,31,63,0.35) 50%, rgba(12,31,63,0.65) 100%)'

export default function HeroCarousel() {
  const [mobileCurrent, setMobileCurrent] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Auto-advance mobile slides every 5 seconds (only matters once 2nd image is added)
  useEffect(() => {
    if (mobileImages.length <= 1) return
    const timer = setInterval(() => {
      setMobileCurrent((prev) => (prev + 1) % mobileImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative overflow-hidden" style={{ minHeight: '92vh' }}>

      {/* === DESKTOP: Video only === */}
      <div className="absolute inset-0 hidden md:block">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: overlay }} />
      </div>

      {/* === MOBILE: Static image slides === */}
      <div className="absolute inset-0 md:hidden">
        {mobileImages.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === mobileCurrent ? 1 : 0 }}
          >
            <img src={src} alt={`Breck Yacht Group ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: overlay }} />
          </div>
        ))}
      </div>

      {/* === Text overlay === */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center text-white px-6"
        style={{ minHeight: '92vh' }}
      >
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

      {/* === Mobile dot indicators (only shown when multiple slides) === */}
      {mobileImages.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10 md:hidden">
          {mobileImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setMobileCurrent(i)}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ backgroundColor: i === mobileCurrent ? '#c9a84c' : 'rgba(255,255,255,0.4)' }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
