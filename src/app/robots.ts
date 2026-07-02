import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all legitimate search engines to index the public site
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // Never expose API routes
          '/valuation-lab',  // Internal testing page — not for public index
          '/admin/',         // Future admin area
        ],
      },
    ],
    sitemap: 'https://breckyachtgroup.com/sitemap.xml',
  }
}
