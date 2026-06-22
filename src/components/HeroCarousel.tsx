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
  const [videoOpacity, setVideoOpacity] = useState(1)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Auto-advance mobile slides every 5 seconds (only matters once 2nd image is added)
  useEffect(() => {
    if (mobileImages.length <= 1) return
    const timer = setInterval(() => {
      setMobileCurrent((prev) => (prev + 1) % mobileImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Smooth loop: fade out near end, restart, fade back in
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    const remaining = video.duration - video.currentTime
    if (remaining < 0.8) {
      setVideoOpacity(0)
    }
  }

  const handleEnded = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    video.play().catch(() => {})
    setTimeout(() => setVideoOpacity(1), 100)
  }

  return (
    <section className="relative overflow-hidden" style={{ minHeight: '92vh' }}>

      {/* === VIDEO: All screen sizes === */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          autoPlay
          muted
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="w-full h-full object-cover"
          style={{ opacity: videoOpacity, transition: 'opacity 0.6s ease' }}
        />
        <div className="absolute inset-0" style={{ background: overlay }} />
      </div>

      {/* === Text overlay — fills full carousel height === */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between text-center text-white px-6 pt-24 pb-12">
        {/* Title — sits at top */}
        <div>
          <p className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: '#c9a84c' }}>
            Premium Yacht Brokerage
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Find Your Perfect<br />Performance Vessel
          </h1>
        </div>

        {/* Description + buttons — sits at bottom */}
        <div>
          <p className="text-white/80 text-sm md:text-lg mb-6 leading-relaxed max-w-2xl mx-auto">
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
