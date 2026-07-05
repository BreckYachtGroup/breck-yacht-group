/**
 * Next.js Edge Middleware — Site-wide bot protection and API rate limiting.
 *
 * Runs on EVERY request before it hits any route handler or page. Handles:
 *  1. Bot User-Agent blocking (scrapers, headless browsers, generic HTTP libs)
 *  2. Per-IP rate limiting on all /api/ routes
 *  3. Hardened security response headers on all responses
 *
 * NOTE: The in-memory rate limit store works correctly on Vercel because
 * each serverless function instance is single-threaded. If you ever move to
 * multiple concurrent long-lived servers, migrate the store to Upstash Redis.
 */

import { NextRequest, NextResponse } from 'next/server'

// ── Bot UA patterns to block ───────────────────────────────────────────────────
// Matches scrapers, generic HTTP libs, headless crawlers, and data harvesters.
// Checked against lower-cased User-Agent string.
const BLOCKED_UA_FRAGMENTS = [
  'scrapy', 'wget', 'curl/', 'python-requests', 'python-urllib',
  'go-http-client', 'java/', 'okhttp', 'httpclient', 'libwww-perl',
  'mechanize', 'lwp::', 'wwwoffle', 'httrack', 'webcopier',
  'offline explorer', 'teleport', 'black widow', 'harvest', 'webzip',
  'pavuk', 'petalbot', 'ahrefsbot', 'semrushbot', 'dotbot', 'mj12bot',
  'blexbot', 'gigabot', 'surdotlybot', 'seznambot', 'exabot',
  'dataminr', 'gptbot', 'chatgpt-user', 'ccbot', 'claude-web',
  'anthropic-ai', 'omgili', 'bytespider', 'headlesschrome',
]

// Legitimate search engine bots — always let through (important for SEO).
// Checked first; if matched, skip the block list entirely.
const ALLOWED_BOT_FRAGMENTS = [
  'googlebot', 'google-inspectiontool', 'bingbot', 'slurp',
  'duckduckbot', 'baiduspider', 'yandexbot', 'applebot',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'pinterestbot',
  'vercelbot',
]

// ── Rate limiting ──────────────────────────────────────────────────────────────
const WINDOW_MS      = 60_000  // 1-minute rolling window
const MAX_REQUESTS   = 60      // max API calls per IP per window
// (Generous enough for real users paginating inventory; too low for bulk scrapers)

const rateLimitStore = new Map<string, { count: number; windowStart: number }>()

function getClientIP(req: NextRequest): string {
  // Vercel sets x-forwarded-for; fall back to a generic key if missing
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function checkRateLimit(ip: string): { allowed: boolean } {
  const now   = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now })
    return { allowed: true }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false }
  }

  entry.count++
  return { allowed: true }
}

// ── Security headers applied to every response ─────────────────────────────────
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // Prevent API responses from being cached by CDNs or shared caches
  // (only set on API routes — avoids breaking Next.js page caching)
  return response
}

// ── Middleware entry point ─────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ua = (request.headers.get('user-agent') ?? '').toLowerCase()
  const ip = getClientIP(request)

  // 1. Allow legitimate search engine bots unconditionally
  const isSearchBot = ALLOWED_BOT_FRAGMENTS.some(frag => ua.includes(frag))

  if (!isSearchBot) {
    // 2. Block known bad bots and HTTP libraries by User-Agent
    const isBlockedBot = BLOCKED_UA_FRAGMENTS.some(frag => ua.includes(frag))
    if (isBlockedBot) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // 3. Block requests with no User-Agent header on API routes
    //    Real browsers always send a UA; empty UA is a strong signal of automation.
    if (!ua && pathname.startsWith('/api/')) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // 4. Rate limit all /api/ routes
    if (pathname.startsWith('/api/')) {
      const { allowed } = checkRateLimit(ip)
      if (!allowed) {
        return new NextResponse('Too Many Requests — slow down', {
          status: 429,
          headers: { 'Retry-After': '60' },
        })
      }
    }
  }

  // 5. Pass through — add security headers to response
  const response = NextResponse.next()
  applySecurityHeaders(response)
  return response
}

// Apply middleware to all routes except Next.js internals and static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
}
