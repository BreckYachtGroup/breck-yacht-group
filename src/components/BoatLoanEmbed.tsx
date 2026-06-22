'use client'

import { useEffect } from 'react'

export default function BoatLoanEmbed() {
  useEffect(() => {
    // Load the iFrame resizer script
    const script = document.createElement('script')
    script.src = 'https://app.boatloan.com/js/iframeResizer.min.js'
    script.onload = () => {
      // Once script is loaded, create and inject the iframe
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
  }, [])

  return <div id="ifg-app-container-6477a530ab597" className="w-full" />
}
