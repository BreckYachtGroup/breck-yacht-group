/**
 * auction-time.ts
 *
 * Single source of truth for BYG auction scheduling.
 *
 * Rules:
 *  - All auctions start and end at 20:00 Eastern Time (8 PM ET)
 *  - Auctions run exactly 7 days
 *  - DST is handled automatically via Intl — no manual offset math
 *  - Anti-sniping ("popcorn bidding") is handled in the bid API route:
 *    any bid within the last 3 minutes extends ends_at by 3 minutes,
 *    up to MAX_EXTENSIONS (10) times.
 */

const ET_TZ = 'America/New_York'

/**
 * Returns the next occurrence of 8:00 PM Eastern Time as a UTC Date.
 * If `from` is already past 8 PM ET today, returns tomorrow's 8 PM ET.
 *
 * Works correctly across EST ↔ EDT transitions.
 */
export function next8pmET(from: Date = new Date()): Date {
  // What hour is it right now in ET?
  const etHour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: ET_TZ,
      hour:     'numeric',
      hour12:   false,
    }).format(from)
  )

  // If it's already 8 PM or later in ET, target tomorrow; otherwise today
  const daysAhead = etHour >= 20 ? 1 : 0

  const base = new Date(from)
  base.setDate(base.getDate() + daysAhead)

  // Get the ET calendar date string (YYYY-MM-DD)
  const etDateStr = base.toLocaleDateString('en-CA', { timeZone: ET_TZ })

  // Try EDT (UTC-4) then EST (UTC-5).
  // 8 PM ET + offset = UTC hour:
  //   EDT: 20 + 4 = 24 → midnight UTC next calendar day (Date.setUTCHours handles rollover)
  //   EST: 20 + 5 = 25 → 01:00 UTC next calendar day
  for (const offsetHours of [4, 5]) {
    const candidate = new Date(`${etDateStr}T00:00:00Z`)
    candidate.setUTCHours(20 + offsetHours, 0, 0, 0)

    // Verify the ET wall-clock time is actually 20:00 (guards against DST edge cases)
    const check = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: ET_TZ,
        hour:     'numeric',
        hour12:   false,
      }).format(candidate)
    )

    if (check === 20) return candidate
  }

  // Should never reach here, but fall back gracefully
  console.error('[auction-time] Could not compute 8 PM ET, falling back to midnight UTC')
  return new Date(`${etDateStr}T00:00:00Z`)
}

/**
 * Returns ISO strings for a standard 7-day auction starting at the next 8 PM ET.
 *
 * Usage:
 *   const { starts_at, ends_at } = auctionSchedule()
 *   // → { starts_at: '2024-07-10T00:00:00.000Z', ends_at: '2024-07-17T00:00:00.000Z' }
 *   //   (exact UTC times depend on DST)
 */
export function auctionSchedule(from?: Date): { starts_at: string; ends_at: string } {
  const start = next8pmET(from)
  const end   = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000) // exactly +7 days

  return {
    starts_at: start.toISOString(),
    ends_at:   end.toISOString(),
  }
}

/**
 * Formats a UTC Date as the Eastern Time wall-clock string for display.
 * e.g. "Thu Jul 10 · 8:00 PM ET"
 */
export function formatAuctionTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    timeZone:     ET_TZ,
    weekday:      'short',
    month:        'short',
    day:          'numeric',
    hour:         'numeric',
    minute:       '2-digit',
    hour12:       true,
  }).format(d) + ' ET'
}
