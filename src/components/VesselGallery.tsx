'use client'

import { useState } from 'react'

export default function VesselGallery({ images, name }: { images: string[], name: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center" style={{ backgroundColor: '#0c1f3f' }}>
        <span className="text-white/30 text-sm tracking-widest uppercase">No Photos Available</span>
      </div>
    )
  }

  const prev = () => setActiveIndex((activeIndex - 1 + images.length) % images.length)
  const next = () => setActiveIndex((activeIndex + 1) % images.length)

  return (
    <>
      {/* Main Image with arrow overlays */}
      <div
        className="relative w-full cursor-zoom-in overflow-hidden"
        style={{ maxHeight: '580px', backgroundColor: '#0c1f3f' }}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={images[activeIndex]}
          alt={`${name} - photo ${activeIndex + 1}`}
          className="w-full object-contain transition-opacity duration-300"
          style={{ maxHeight: '580px' }}
        />
        {/* Photo count badge */}
        <div className="absolute bottom-4 right-4 px-3 py-1 text-xs text-white tracking-widest" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {activeIndex + 1} / {images.length}
        </div>
        {/* Arrows overlaid on photo */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white text-xl transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              ‹
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white text-xl transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-2 px-2" style={{ backgroundColor: '#0c1f3f' }}>
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="shrink-0 overflow-hidden transition-all duration-200"
              style={{
                width: '80px',
                height: '60px',
                border: i === activeIndex ? '2px solid #c9a84c' : '2px solid transparent',
                opacity: i === activeIndex ? 1 : 0.6,
              }}
            >
              <img src={src} alt={`${name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl w-10 h-10 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            ×
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 text-white text-5xl px-4 py-2"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 text-white text-5xl px-4 py-2"
              >
                ›
              </button>
            </>
          )}
          <img
            src={images[activeIndex]}
            alt={`${name} - photo ${activeIndex + 1}`}
            className="max-w-full max-h-screen object-contain px-16"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/50 text-sm">{activeIndex + 1} / {images.length}</p>
        </div>
      )}
    </>
  )
}
