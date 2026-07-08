import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Providers from '@/components/Providers'
import NewsletterSignup from '@/components/NewsletterSignup'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import MetaPixel from '@/components/MetaPixel'

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: 'Breck Yacht Group | Luxury Performance Vessels',
  description: 'Premium yacht brokerage specializing in luxury center consoles and sportfish vessels.',
  verification: {
    google: 'WZWZICCJm0Mz9BqL2h0bIiq5o7wBCeTCXPnNC2OrBHE',
  },
  openGraph: {
    title: 'Breck Yacht Group | Luxury Performance Vessels',
    description: 'Premium yacht brokerage specializing in luxury center consoles and sportfish vessels. Based in Palm Beach, FL.',
    url: 'https://www.breckyachtgroup.com',
    siteName: 'Breck Yacht Group',
    images: [{ url: 'https://i.imgur.com/G3Iiowt.jpg', width: 1200, height: 630, alt: 'Breck Yacht Group' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Breck Yacht Group | Luxury Performance Vessels',
    description: 'Premium yacht brokerage specializing in luxury center consoles and sportfish vessels.',
    images: ['https://i.imgur.com/G3Iiowt.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />

          <main className="min-h-screen pt-16">
            {children}
          </main>

        <footer style={{ backgroundColor: '#0c1f3f' }} className="text-white/50 text-sm tracking-widest uppercase">
          <div className="max-w-6xl mx-auto px-8 py-12 flex flex-col md:flex-row gap-12 md:gap-0">

            {/* Left — newsletter */}
            <div className="md:w-1/2 md:pr-16 md:border-r flex flex-col justify-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <NewsletterSignup />
            </div>

            {/* Right — contact + links */}
            <div className="md:w-1/2 md:pl-16 flex flex-col justify-center items-start md:items-end text-left md:text-right space-y-5">
              <div className="flex gap-5">
                <a href="https://www.facebook.com/BreckYachtGroup/" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" aria-label="Facebook">
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
                <a href="https://www.instagram.com/breckyachtgroup" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" aria-label="Instagram">
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
              <div className="flex items-center gap-4">
                <p>Palm Beach, FL &nbsp;·&nbsp; <a href="tel:5617235636" className="hover:text-white transition-colors">(561) 723-5636</a></p>
                <img src="/IYBALogo.gif" alt="International Yacht Brokers Association Member" className="h-14 opacity-70 hover:opacity-100 transition-opacity" />
              </div>
              <p>© {new Date().getFullYear()} Breck Yacht Group · All Rights Reserved</p>
              <p>
                <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
                &nbsp;·&nbsp;
                <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
                &nbsp;·&nbsp;
                <a href="/auctions/terms" className="hover:text-white transition-colors">Auction Terms</a>
              </p>
            </div>

          </div>
        </footer>
          <Analytics />
          <SpeedInsights />
          <MetaPixel />
        </Providers>
      </body>
    </html>
  )
}
