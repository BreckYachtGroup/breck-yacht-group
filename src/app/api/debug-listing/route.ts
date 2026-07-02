/**
 * Temporary debug route — checks which co-brokerage listings have videos.
 * Usage: GET /api/debug-listing
 * Delete after use.
 */
import { NextResponse } from 'next/server'

const PROXY_URL = process.env.PROXY_URL ?? 'http://207.246.72.35:3001'
const BYG_BROKERAGE_ID = 40000937

export async function GET() {
  // Fetch first 3 pages of listings
  const pages = await Promise.all(
    [1, 2, 3].map(page =>
      fetch(`${PROXY_URL}/listings?page=${page}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : { 'V-Data': [] })
        .catch(() => ({ 'V-Data': [] }))
    )
  )
  const all = pages.flatMap(p => p['V-Data'] ?? [])

  // Co-brokerage only
  const cobroke = all.filter((v: any) => v.ListingOwnerBrokerageID !== BYG_BROKERAGE_ID)

  // Fetch detail for each to check Videos — run in batches of 5
  const results = []
  for (const slim of cobroke) {
    try {
      const detail = await fetch(`${PROXY_URL}/listing/${slim.ID}`, { cache: 'no-store' }).then(r => r.json())
      results.push({
        id:       slim.ID,
        name:     slim.VesselName || `${slim.Year} ${slim.Manufacturer} ${slim.Model}`,
        year:     slim.Year,
        make:     slim.Manufacturer,
        hasVideo: Array.isArray(detail.Videos) && detail.Videos.length > 0,
        videos:   detail.Videos ?? [],
      })
    } catch {
      results.push({ id: slim.ID, name: slim.VesselName, hasVideo: false, videos: [] })
    }
  }

  return NextResponse.json({
    total_cobrokerage: cobroke.length,
    with_video:    results.filter(r => r.hasVideo).length,
    without_video: results.filter(r => !r.hasVideo).length,
    listings: results,
  })
}
