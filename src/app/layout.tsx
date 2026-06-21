import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'Breck Yacht Group | Luxury Performance Vessels',
  description: 'Premium yacht brokerage specializing in luxury center consoles and sportfish vessels.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />

        <main className="min-h-screen pt-16">
          {children}
        </main>

        <footer style={{ backgroundColor: '#0c1f3f' }} className="text-white/50 text-center py-8 text-sm tracking-widest uppercase">
          <p>© {new Date().getFullYear()} Breck Yacht Group · All Rights Reserved</p>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
