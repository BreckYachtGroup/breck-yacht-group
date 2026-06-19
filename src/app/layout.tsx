import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Breck Yacht Group | Luxury Performance Vessels',
  description: 'Premium yacht brokerage specializing in luxury center consoles and sportfish vessels.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Navigation */}
        <nav style={{ backgroundColor: '#0c1f3f' }} className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-white text-lg font-bold tracking-widest uppercase">
              Breck Yacht Group
            </Link>
            <div className="flex gap-8">
              <Link href="/inventory" className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors">
                Inventory
              </Link>
              <Link href="/#contact" className="text-white/80 hover:text-white text-sm tracking-wider uppercase transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </nav>

        <main className="min-h-screen pt-16">
          {children}
        </main>

        <footer style={{ backgroundColor: '#0c1f3f' }} className="text-white/50 text-center py-8 text-sm tracking-widest uppercase">
          <p>© {new Date().getFullYear()} Breck Yacht Group · All Rights Reserved</p>
        </footer>
      </body>
    </html>
  )
}
