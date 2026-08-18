export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import CareersClient from './_components/CareersClient'
import { getPaginatedListings } from '@/lib/listings'

export const metadata: Metadata = {
  title: 'Sales Careers | Breck Yacht Group',
  description: 'Join the Breck Yacht Group sales team. Earn up to 80/20 commission splits on luxury yacht and boat sales with an industry-leading structure and no earnings cap.',
}

// Fallback used only if the MLS proxy is unreachable when this page renders.
const FALLBACK_COBROKERAGE_COUNT = 8200

async function getCoBrokerageCount(): Promise<number> {
  try {
    // Two lightweight page=1 fetches — we only need each response's `total`,
    // not the listing data itself. Co-brokerage count = all listings minus
    // BYG's own, so this stays accurate as the MLS feed changes day to day.
    const allParams = new URLSearchParams({ page: '1' })
    const bygParams  = new URLSearchParams({ page: '1', bygOnly: 'true' })
    const [all, byg] = await Promise.all([
      getPaginatedListings(allParams),
      getPaginatedListings(bygParams),
    ])
    const coBrokerage = all.total - byg.total
    if (coBrokerage <= 0) return FALLBACK_COBROKERAGE_COUNT
    // Round down to the nearest 100 so the "over X" framing stays true even
    // as the live count ticks up and down between listings syncing.
    return Math.floor(coBrokerage / 100) * 100
  } catch {
    return FALLBACK_COBROKERAGE_COUNT
  }
}

export default async function CareersPage() {
  const coBrokerageCount = await getCoBrokerageCount()
  return <CareersClient coBrokerageCount={coBrokerageCount} />
}
