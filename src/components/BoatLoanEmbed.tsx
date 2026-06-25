'use client'

import { useEffect, useRef, useState } from 'react'

export default function BoatLoanEmbed() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Only load the embed when it's scrolled into view
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loaded) {
          setLoaded(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // start loading 200px before it enters the viewport
    )

    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [loaded])

  useEffect(() => {
    if (!loaded) return

    const script = document.createElement('script')
    script.src = 'https://app.boatloan.com/js/iframeResizer.min.js'
    script.onload = () => {
      const container = document.getElementById('ifg-app-container-6477a530ab597')
      if (!container) return

      const iframe = document.createElement('iframe')
      iframe.id = 'ifg-iframe-6477a530ab594'
      iframe.style.cssText = 'width: 1px; min-width: 100%; border: none;'
      iframe.src = 'https://app.boatloan.com/applications/quick/59cd10cb-889c-4390-a649-f1f945a798ae?mode=embedded&hide_type=1&hide_agent=1&no_offers=1&source_name=Breck-Yacht-Group'
      container.appendChild(iframe)

      // @ts-ignore
      if (window.iFrameResize) {
        // @ts-ignore
        window.iFrameResize({}, '#ifg-iframe-6477a530ab594')
      }
    }
    document.body.appendChild(script)
  }, [loaded])

  return (
    <div ref={containerRef} className="w-full min-h-[60px]">
      {!loaded && (
        <p className="text-sm text-gray-400 text-center py-6">Loading application form...</p>
      )}
      <div id="ifg-app-container-6477a530ab597" className="w-full" />
    </div>
  )
}
