/**
 * Generates and verifies signed unsubscribe tokens.
 * Uses HMAC-SHA256 with CRON_SECRET so links can't be forged.
 */

import { createHmac, timingSafeEqual } from 'crypto'

function secret() {
  const s = process.env.CRON_SECRET
  if (!s) throw new Error('CRON_SECRET is not set')
  return s
}

export function generateUnsubscribeToken(userId: string): string {
  return createHmac('sha256', secret()).update(userId).digest('hex')
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  try {
    const expected = generateUnsubscribeToken(userId)
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}

export function unsubscribeUrl(userId: string, baseUrl: string): string {
  const token = generateUnsubscribeToken(userId)
  return `${baseUrl}/unsubscribe?uid=${encodeURIComponent(userId)}&token=${token}`
}
