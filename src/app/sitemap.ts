import { getAllListings } from '@/lib/listings'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.breckyachtgroup.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'daily' },
    { url: `${baseUrl}/inventory`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/blog`, priority: 0.7, changeFrequency: 'weekly' },
    { url: `${baseUrl}/about/crew`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${baseUrl}/about/testimonials`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${baseUrl}/services/financing`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${baseUrl}/services/insurance`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${baseUrl}/services/yacht-management`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${baseUrl}/services/buying-guide`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${baseUrl}/sell/value-my-vessel`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${baseUrl}/sell/sellers-guide`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${baseUrl}/contact`, priority: 0.8, changeFrequency: 'monthly' },
  ]

  // Dynamic listing pages
  const listings = await getAllListings()
  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${baseUrl}/inventory/${listing.slug}`,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }))

  return [...staticPages, ...listingPages]
}
