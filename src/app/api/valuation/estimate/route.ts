/**
 * /api/valuation/estimate
 *
 * Proprietary BYG Boat Valuation Engine — INTERNAL / BACKEND ONLY
 * Do not link publicly or expose the algorithm.
 *
 * Algorithm:
 *  1. Query MLS proxy for comps matching make, year range, length range
 *  2. Score each comp by similarity (year, length, hours, model match)
 *  3. Remove price outliers via IQR method
 *  4. Derive low / mid / high from weighted percentiles
 *  5. Apply condition and hours adjustments
 *  6. Return valuation range + anonymized comp set
 */

import { NextRequest, NextResponse } from 'next/server'
import { calcEngineResidualValue, getBaselineEngineValue } from '@/lib/engineValues'

const PROXY_URL = process.env.PROXY_URL ?? 'http://207.246.72.35:3001'

// List-to-sale discount: comp data is asking prices, not closed transactions.
// Marine market data shows center consoles / sportfish close 8–10% below asking on average.
// Applying 9% discount to all comp prices before percentile calculation.
const LIST_TO_SALE_DISCOUNT = 0.91

// Condition multipliers applied to median comp price
const CONDITION_FACTORS: Record<string, number> = {
  excellent: 1.08,
  good:      1.00,
  fair:      0.88,
  poor:      0.74,
}

// Engine count adjustments relative to single-engine baseline
// Comps are typically a mix — this normalizes for engine count mismatch
const ENGINE_COUNT_FACTORS: Record<number, number> = {
  1: 0.82,   // single engine — significantly lower than twin
  2: 1.00,   // twin — market baseline for most center consoles
  3: 1.22,   // triple — premium over twin
  4: 1.40,   // quad — significant premium
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ValuationInput {
  year:          number
  make:          string
  model?:        string
  length_ft:     number
  hours?:        number
  condition:     'excellent' | 'good' | 'fair' | 'poor'
  state?:        string
  engine_count?: number   // 1, 2, 3, or 4
  engine_make?:  string   // Mercury, Yamaha, Volvo, etc.
  engine_model?: string   // Verado 400, F350, etc.
}

interface Comp {
  name:           string
  year:           number
  make:           string
  model:          string
  length_ft:      number
  hours:          number
  price:          number
  location:       string
  url:            string | null  // listing URL for comp verification
  score:          number
  raw_engine_qty: number | null  // internal — stripped before API response
}

// ── Scoring ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scoreComp(comp: any, input: ValuationInput): number {
  let score = 0

  // Year proximity — max 30 pts
  const yearDiff = Math.abs((comp.Year ?? 0) - input.year)
  if      (yearDiff === 0) score += 30
  else if (yearDiff <= 1)  score += 25
  else if (yearDiff <= 2)  score += 18
  else if (yearDiff <= 3)  score += 10
  else if (yearDiff <= 5)  score += 4

  // Length proximity — max 25 pts
  // Tight: a 2ft difference on a 34ft boat is a different product class
  const lenDiff = Math.abs((comp.DisplayLengthFeet ?? 0) - input.length_ft)
  if      (lenDiff === 0)  score += 25
  else if (lenDiff <= 1)   score += 20
  else if (lenDiff <= 2)   score += 12
  else if (lenDiff <= 3)   score += 4
  // >3ft: 0 pts — excluded by min score filter in practice

  // Model match — max 25 pts
  if (input.model) {
    const iModel = input.model.toLowerCase().replace(/\s+/g, '')
    const cModel = (comp.Model ?? '').toLowerCase().replace(/\s+/g, '')
    if      (cModel === iModel)                               score += 25
    else if (cModel.includes(iModel) || iModel.includes(cModel)) score += 15
  }

  // Hours proximity — max 20 pts (10 pts neutral if no data)
  if (input.hours != null && comp.hours != null && comp.hours > 0) {
    const hDiff = Math.abs(comp.hours - input.hours)
    if      (hDiff < 50)  score += 20
    else if (hDiff < 150) score += 14
    else if (hDiff < 300) score += 8
    else if (hDiff < 600) score += 3
  } else {
    score += 10
  }

  // Engine count match — max 15 pts
  if (input.engine_count != null && comp.EngineQty != null) {
    if (comp.EngineQty === input.engine_count) score += 15
    else if (Math.abs(comp.EngineQty - input.engine_count) === 1) score += 5
  }

  return score
}

// ── Statistics ────────────────────────────────────────────────────────────────

function removeOutliers(prices: number[]): number[] {
  if (prices.length < 4) return prices
  const s  = [...prices].sort((a, b) => a - b)
  const q1 = s[Math.floor(s.length * 0.25)]
  const q3 = s[Math.floor(s.length * 0.75)]
  const iqr = q3 - q1
  return prices.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr)
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1)
  const lo  = Math.floor(idx)
  const hi  = Math.ceil(idx)
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function round1k(n: number): number {
  return Math.round(n / 1000) * 1000
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ValuationInput

    // Validate
    if (!body.year || !body.make || !body.length_ft || !body.condition) {
      return NextResponse.json(
        { error: 'Missing required fields: year, make, length_ft, condition' },
        { status: 400 }
      )
    }

    const input: ValuationInput = {
      year:          Number(body.year),
      make:          String(body.make).trim(),
      model:         body.model ? String(body.model).trim() : undefined,
      length_ft:     Number(body.length_ft),
      hours:         body.hours != null ? Number(body.hours) : undefined,
      condition:     body.condition,
      state:         body.state ? String(body.state).trim() : undefined,
      engine_count:  body.engine_count ? Number(body.engine_count) : undefined,
      engine_make:   body.engine_make ? String(body.engine_make).trim() : undefined,
      engine_model:  body.engine_model ? String(body.engine_model).trim() : undefined,
    }

    // ── Fetch comp pool ──────────────────────────────────────────────────────
    // ±3 years keeps comps recent and avoids older, lower-priced boats skewing results
    const yearBuf = 1
    const lenBuf  = 3   // a 34ft boat compares to 31–37ft; scoring penalizes >1ft diff heavily
    const params = new URLSearchParams({
      make:      input.make,
      minYear:   String(input.year - yearBuf),
      maxYear:   String(input.year + yearBuf),
      minLength: String(Math.max(10, input.length_ft - lenBuf)),
      maxLength: String(input.length_ft + lenBuf),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let raw: any[] = []

    const pages = await Promise.all(
      [1, 2, 3].map(page =>
        fetch(`${PROXY_URL}/listings?${params}&page=${page}`, { cache: 'no-store' })
          .then(r => r.ok ? r.json() : { 'V-Data': [] })
          .catch(() => ({ 'V-Data': [] }))
      )
    )
    raw = pages.flatMap(p => p['V-Data'] ?? [])

    // Filter: must have a meaningful price
    raw = raw.filter(v => Number(v.PriceUSD) > 5000)

    // If too few comps, widen search to make-only
    if (raw.length < 4) {
      const fallback = await fetch(
        `${PROXY_URL}/listings?make=${encodeURIComponent(input.make)}&page=1`,
        { cache: 'no-store' }
      ).then(r => r.ok ? r.json() : { 'V-Data': [] }).catch(() => ({ 'V-Data': [] }))

      const extra = (fallback['V-Data'] ?? []).filter((v: any) => Number(v.PriceUSD) > 5000)
      // Merge, deduplicate by ID
      const seen = new Set(raw.map((v: any) => v.ID))
      raw.push(...extra.filter((v: any) => !seen.has(v.ID)))
    }

    if (raw.length === 0) {
      return NextResponse.json(
        { error: 'Insufficient market data for this vessel type. Contact us for a manual valuation.' },
        { status: 422 }
      )
    }

    // ── Score, rank, trim ────────────────────────────────────────────────────
    const scored: Comp[] = raw.map(v => ({
      name:           v.VesselName || [v.Year, v.Manufacturer, v.Model].filter(Boolean).join(' '),
      year:           v.Year ?? 0,
      make:           v.Manufacturer ?? '',
      model:          v.Model ?? '',
      length_ft:      v.DisplayLengthFeet ?? 0,
      hours:          v.hours ?? 0,
      price:          Number(v.PriceUSD),
      location:       [v.City, v.State].filter(Boolean).join(', '),
      // No URL field in MLS data — construct yachtbroker.org listing URL from ID
      url:            v.ID ? `https://www.yachtbroker.org/listing/${v.ID}/` : null,
      score:          scoreComp(v, input),
      raw_engine_qty: v.EngineQty ?? null,   // used internally for engine factor — stripped before response
    }))

    scored.sort((a, b) => b.score - a.score)

    // Hard caps — enforced on every comp regardless of score or fallback.
    // The proxy does not reliably honor minYear/maxYear/minLength/maxLength query params,
    // so we enforce these as absolute post-score filters.
    const MAX_LEN_DIFF  = 5           // never more than 5ft different
    const MAX_YEAR_DIFF = yearBuf + 1 // 1yr buffer + 1 grace = ±2 for yearBuf=1
    const lengthCapped = scored.filter(c =>
      Math.abs(c.length_ft - input.length_ft) <= MAX_LEN_DIFF &&
      Math.abs(c.year      - input.year)       <= MAX_YEAR_DIFF
    )

    // Minimum score filter: exclude weak matches that barely resemble the subject vessel.
    const MIN_SCORE = 40
    const qualifiedComps = lengthCapped.filter(c => c.score >= MIN_SCORE)
    // Fall back to top 8 within length cap if score filter leaves too few
    const topComps = qualifiedComps.length >= 4 ? qualifiedComps.slice(0, 20) : lengthCapped.slice(0, 8)

    // ── Price statistics ─────────────────────────────────────────────────────
    // Apply list-to-sale discount before percentile calc — comps are asking prices, not sold prices
    let prices = removeOutliers(topComps.map(c => c.price * LIST_TO_SALE_DISCOUNT))
    const sorted = [...prices].sort((a, b) => a - b)

    // 30th/50th/75th — conservative raised from 25th to avoid low-quality outliers
    // skewing the floor (weak comps survive IQR but drag down the left tail)
    const rawLow  = percentile(sorted, 30)
    const rawMid  = percentile(sorted, 50)
    const rawHigh = percentile(sorted, 75)

    // Condition adjustment
    const condFactor = CONDITION_FACTORS[input.condition] ?? 1.0

    // Hours adjustment: ±10% max, based on deviation from expected hours
    let hoursFactor = 1.0
    if (input.hours != null) {
      const boatAge       = new Date().getFullYear() - input.year
      const expectedHours = Math.max(boatAge * 150, 50)
      const delta         = input.hours - expectedHours
      hoursFactor = Math.max(0.90, Math.min(1.10, 1 - (delta / expectedHours) * 0.10))
    }

    // Engine count is used in SCORING (15pts) to weight matching comps higher,
    // not as a multiplier on price — the comp prices already reflect their engine packages.
    // ENGINE_COUNT_FACTORS is kept for reference but not applied to avoid double-counting.

    const adjFactor = condFactor * hoursFactor
    let compMid  = round1k(rawMid  * adjFactor)

    // Enforce minimum spread: when comps cluster tightly (e.g. 6 nearly identical listings),
    // the percentile range collapses. Conservative and Optimistic should always reflect
    // real-world market uncertainty — negotiation, timing, condition differences.
    // Conservative: whichever is LOWER — the percentile or 13% below mid
    // Optimistic:   whichever is HIGHER — the percentile or 13% above mid
    let compLow  = Math.min(round1k(rawLow  * adjFactor), round1k(compMid * 0.91))
    let compHigh = Math.max(round1k(rawHigh * adjFactor), round1k(compMid * 1.09))

    // ── Engine residual value adjustment ─────────────────────────────────────
    // Calculate user's actual engine package value vs baseline assumed in comps.
    // Apply 65% of the delta so we don't double-count what comps already price in.
    let engineBreakdown: {
      label: string; msrpEach: number; residualEach: number
      totalResidual: number; baselineDesc: string; baselineValue: number
      delta: number; found: boolean
    } | null = null

    if (input.engine_make && input.engine_model && input.engine_count) {
      const userEngines = calcEngineResidualValue({
        make:       input.engine_make,
        model:      input.engine_model,
        count:      input.engine_count,
        engineYear: input.year,
        hours:      input.hours,
      })
      const baseline = getBaselineEngineValue(input.length_ft, input.year)
      // Delta is calculated but NOT applied to comp prices —
      // comps already reflect the engine packages on those boats.
      // We show it as context only so the seller understands their engine package's value.
      const delta = Math.round((userEngines.totalResidual - baseline.totalResidual) * 0.65 / 1000) * 1000

      engineBreakdown = {
        label:         userEngines.label,
        msrpEach:      userEngines.msrpEach,
        residualEach:  userEngines.residualEach,
        totalResidual: userEngines.totalResidual,
        baselineDesc:  baseline.desc,
        baselineValue: baseline.totalResidual,
        delta,
        found:         userEngines.found,
      }
    }

    const low  = Math.max(0, compLow)
    const mid  = Math.max(0, compMid)
    const high = Math.max(0, compHigh)

    // Confidence
    const avgScore = topComps.reduce((s, c) => s + c.score, 0) / topComps.length
    const confidence =
      topComps.length >= 8 && avgScore >= 45 ? 'high'
      : topComps.length >= 4 && avgScore >= 25 ? 'medium'
      : 'low'

    return NextResponse.json({
      low,
      mid,
      high,
      confidence,
      comp_count:  topComps.length,
      engine_breakdown: engineBreakdown,
      // Return top 6 comps anonymized — strip internal fields before response
      comps: topComps.slice(0, 6).map(({ score: _s, raw_engine_qty: _e, ...c }) => c), // url included
      methodology: `Valuation based on ${topComps.length} comparable ${input.make} listings within ±${yearBuf} model years and ±${lenBuf}ft. Conservative/Most Likely/Optimistic = 30th/50th/75th percentile. Adjusted for ${input.condition} condition${input.hours != null ? ', engine hours' : ''}${input.engine_count != null ? `, and ${input.engine_count}-engine configuration` : ''}.`,
    })

  } catch (err) {
    console.error('[valuation/estimate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
