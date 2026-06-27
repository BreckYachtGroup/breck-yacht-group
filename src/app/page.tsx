export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getFeaturedListings, type Listing } from '@/lib/listings'
import HeroCarousel from '@/components/HeroCarousel'
import ContactForm from '@/components/ContactForm'

async function getFeaturedVessels(): Promise<Listing[]> {
  return getFeaturedListings()
}

export default async function HomePage() {
  const featured = await getFeaturedVessels()


  return (
    <>
      <HeroCarousel />

      {/* Featured Vessels */}
      {featured.length > 0 && (
        <section className="py-20 px-6" style={{ backgroundColor: '#f8f6f1' }}>
          <div className="max-w-7xl mx-auto">
            <p className="text-xs tracking-[0.4em] uppercase text-center mb-2" style={{ color: '#c9a84c' }}>
              Hand-Selected
            </p>
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#0c1f3f' }}>
              Featured Vessels
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featured.map((vessel) => (
                <Link key={vessel.id} href={`/inventory/${vessel.slug}`} className="group block bg-white shadow-md hover:shadow-xl transition-shadow">
                  {vessel.images?.[0] && (
                    <img
                      src={vessel.images[0]}
                      alt={vessel.name}
                      className="w-full h-56 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-6">
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#c9a84c' }}>
                      {vessel.year} · {vessel.length_ft}ft
                    </p>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#0c1f3f' }}>{vessel.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">{vessel.location}</p>
                    <p className="text-2xl font-bold" style={{ color: '#0c1f3f' }}>
                      {vessel.price ? `$${vessel.price.toLocaleString()}` : 'Call for Price'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/inventory"
                className="inline-block px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white transition-colors"
                style={{ backgroundColor: '#0c1f3f' }}
              >
                View All Inventory
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Get In Touch</p>
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#0c1f3f' }}>Speak With a Broker</h2>
          <p className="text-gray-500 mb-10">Whether you&apos;re buying or selling, our team is ready to help you navigate the market.</p>
          <ContactForm />
        </div>
      </section>
    </>
  )
}
