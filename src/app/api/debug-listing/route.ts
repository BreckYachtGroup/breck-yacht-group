/**
 * Temporary debug route — DELETE after inspecting Videos field
 * Usage: GET /api/debug-listing?id=2852250
 */
import { NextRequest, NextResponse } from 'next/server'

const PROXY_URL = process.env.PROXY_URL ?? 'http://207.246.72.35:3001'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '2852250'
  const res = await fetch(`${PROXY_URL}/listing/${id}`, { cache: 'no-store' })
  const data = await res.json()
  return NextResponse.json({
    Videos:   data.Videos   ?? data.videos   ?? null,
    Textblocks: data.Textblocks ?? null,
    keys:     Object.keys(data),
  })
}
