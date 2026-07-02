/**
 * engineValues.ts — Proprietary BYG Engine Valuation Module
 *
 * MSRP data sourced from official manufacturer price lists (2025-2026).
 * Mercury: rpmgroup.ca/uploads/pdf_motors/Mercury-Outboards-Verado-MY2025-Pricelist.pdf
 * Yamaha:  yamahaoutboards.com PY26-Consumer-Price-List-EFF-JULY-1-2025.pdf
 *
 * Depreciation model: marine outboard industry standard
 *   - Age: ~15% decline year 1, ~10% per year thereafter (0.85^n, floor 25%)
 *   - Hours: tiered multiplier based on usage vs expected life (~3,000 hrs)
 *
 * INTERNAL USE ONLY — do not expose this module or its data publicly.
 */

// ── Engine MSRP Table ─────────────────────────────────────────────────────────
// Key format: "make|model_keyword" (lowercase, normalized)
// Values in USD. Use mid-range shaft configuration as baseline.

interface EngineEntry {
  hp:    number
  msrp:  number   // USD retail, mid-shaft config
  brand: string
}

const ENGINE_TABLE: Record<string, EngineEntry> = {
  // ── Mercury ────────────────────────────────────────────────────────────────
  'mercury|verado 600':    { hp: 600, msrp: 120000, brand: 'Mercury' },
  'mercury|verado 500':    { hp: 500, msrp: 95000,  brand: 'Mercury' },
  'mercury|verado 400':    { hp: 400, msrp: 70000,  brand: 'Mercury' },
  'mercury|verado 350':    { hp: 350, msrp: 62000,  brand: 'Mercury' },
  'mercury|verado 300':    { hp: 300, msrp: 50000,  brand: 'Mercury' },
  'mercury|pro xs 400':    { hp: 400, msrp: 47000,  brand: 'Mercury' },
  'mercury|400r':          { hp: 400, msrp: 47000,  brand: 'Mercury' },
  'mercury|300r':          { hp: 300, msrp: 33000,  brand: 'Mercury' },
  'mercury|pro xs 300':    { hp: 300, msrp: 33000,  brand: 'Mercury' },
  'mercury|300':           { hp: 300, msrp: 29000,  brand: 'Mercury' },
  'mercury|250':           { hp: 250, msrp: 23000,  brand: 'Mercury' },
  'mercury|200':           { hp: 200, msrp: 18000,  brand: 'Mercury' },
  'mercury|150':           { hp: 150, msrp: 13000,  brand: 'Mercury' },
  'mercury|115':           { hp: 115, msrp: 10000,  brand: 'Mercury' },

  // ── Yamaha ─────────────────────────────────────────────────────────────────
  'yamaha|f450':           { hp: 450, msrp: 57000,  brand: 'Yamaha' },
  'yamaha|f350':           { hp: 350, msrp: 43000,  brand: 'Yamaha' },
  'yamaha|f300':           { hp: 300, msrp: 37000,  brand: 'Yamaha' },
  'yamaha|f250':           { hp: 250, msrp: 29000,  brand: 'Yamaha' },
  'yamaha|f200':           { hp: 200, msrp: 21000,  brand: 'Yamaha' },
  'yamaha|f150':           { hp: 150, msrp: 14500,  brand: 'Yamaha' },
  'yamaha|f115':           { hp: 115, msrp: 10500,  brand: 'Yamaha' },
  'yamaha|f90':            { hp: 90,  msrp: 8000,   brand: 'Yamaha' },

  // ── Suzuki ─────────────────────────────────────────────────────────────────
  'suzuki|df350a':         { hp: 350, msrp: 33000,  brand: 'Suzuki' },
  'suzuki|df300a':         { hp: 300, msrp: 27000,  brand: 'Suzuki' },
  'suzuki|df250':          { hp: 250, msrp: 22000,  brand: 'Suzuki' },
  'suzuki|df200':          { hp: 200, msrp: 17000,  brand: 'Suzuki' },
  'suzuki|df150':          { hp: 150, msrp: 12000,  brand: 'Suzuki' },
  'suzuki|df115':          { hp: 115, msrp: 9500,   brand: 'Suzuki' },

  // ── Honda ──────────────────────────────────────────────────────────────────
  'honda|bf350':           { hp: 350, msrp: 32000,  brand: 'Honda' },
  'honda|bf250':           { hp: 250, msrp: 22000,  brand: 'Honda' },
  'honda|bf200':           { hp: 200, msrp: 17000,  brand: 'Honda' },
  'honda|bf150':           { hp: 150, msrp: 12000,  brand: 'Honda' },

  // ── Evinrude (discontinued — discount applied) ────────────────────────────
  'evinrude|300':          { hp: 300, msrp: 18000,  brand: 'Evinrude' },
  'evinrude|250':          { hp: 250, msrp: 15000,  brand: 'Evinrude' },
  'evinrude|200':          { hp: 200, msrp: 12000,  brand: 'Evinrude' },
  'evinrude|150':          { hp: 150, msrp: 9000,   brand: 'Evinrude' },
}

// ── Standard engine baseline by boat length ───────────────────────────────────
// Represents what a "typical" engine package looks like for that size class.
// Used to calculate the delta vs user's actual engines.
// Format: [engine_count, msrp_per_engine]

const LENGTH_BASELINES: Array<{ maxFt: number; count: number; msrpEach: number; desc: string }> = [
  { maxFt: 24,  count: 1, msrpEach: 13000, desc: 'Single 150HP'       },
  { maxFt: 28,  count: 2, msrpEach: 18000, desc: 'Twin 200HP'          },
  { maxFt: 33,  count: 2, msrpEach: 23000, desc: 'Twin 250HP'          },
  { maxFt: 38,  count: 2, msrpEach: 37000, desc: 'Twin 300HP'          },
  { maxFt: 42,  count: 3, msrpEach: 37000, desc: 'Triple 300HP'        },
  { maxFt: 48,  count: 3, msrpEach: 43000, desc: 'Triple 350HP'        },
  { maxFt: 999, count: 4, msrpEach: 43000, desc: 'Quad 350HP'          },
]

// ── Lookup ────────────────────────────────────────────────────────────────────

/**
 * Look up an engine's retail price by make + model string.
 * Returns null if no match found.
 */
export function lookupEngineMSRP(make: string, model: string): EngineEntry | null {
  const m = make.toLowerCase().trim()
  const d = model.toLowerCase().trim()

  // Try exact key match first
  const exactKey = `${m}|${d}`
  if (ENGINE_TABLE[exactKey]) return ENGINE_TABLE[exactKey]

  // Try partial match — find any entry whose model keyword appears in the input model
  for (const [key, entry] of Object.entries(ENGINE_TABLE)) {
    const [keyMake, keyModel] = key.split('|')
    if (!m.includes(keyMake) && !keyMake.includes(m)) continue
    if (d.includes(keyModel) || keyModel.includes(d.replace(/[^a-z0-9 ]/g, ''))) {
      return entry
    }
  }

  return null
}

// ── Depreciation ──────────────────────────────────────────────────────────────

/**
 * Age-based depreciation factor.
 * 15% decline year 1, ~10% per year after, floor at 25% of retail.
 */
function ageFactor(yearsOld: number): number {
  if (yearsOld <= 0) return 1.0
  return Math.max(0.25, Math.pow(0.85, yearsOld))
}

/**
 * Hours-based multiplier.
 * Low hours = slight premium; high hours = significant discount.
 */
function hoursFactor(hours: number): number {
  if (hours <= 100)  return 1.05
  if (hours <= 300)  return 1.00
  if (hours <= 600)  return 0.92
  if (hours <= 1000) return 0.82
  if (hours <= 1500) return 0.70
  if (hours <= 2000) return 0.55
  return 0.35  // 2000+ hrs — approaching rebuild territory
}

/**
 * Calculate current residual value of a set of engines.
 */
export function calcEngineResidualValue(params: {
  make:        string
  model:       string
  count:       number
  engineYear:  number   // year engines were manufactured (same as boat year usually)
  hours?:      number   // total hours on the engines
}): {
  msrpEach:      number
  residualEach:  number
  totalResidual: number
  found:         boolean
  label:         string
} {
  const { make, model, count, engineYear, hours } = params
  const entry = lookupEngineMSRP(make, model)

  if (!entry) {
    return { msrpEach: 0, residualEach: 0, totalResidual: 0, found: false, label: `${make} ${model}` }
  }

  const yearsOld    = new Date().getFullYear() - engineYear
  const age         = ageFactor(yearsOld)
  const hrs         = hours != null ? hoursFactor(hours) : 1.0
  const residualEach = Math.round(entry.msrp * age * hrs / 1000) * 1000

  return {
    msrpEach:      entry.msrp,
    residualEach,
    totalResidual: residualEach * count,
    found:         true,
    label:         `${count}x ${entry.brand} ${model.toUpperCase()}`,
  }
}

/**
 * Estimate the standard engine package value built into comps for a given boat length.
 * This is the baseline we compare against.
 */
export function getBaselineEngineValue(lengthFt: number, boatYear: number): {
  totalMSRP:      number
  totalResidual:  number
  desc:           string
} {
  const baseline = LENGTH_BASELINES.find(b => lengthFt <= b.maxFt) ?? LENGTH_BASELINES[LENGTH_BASELINES.length - 1]
  const yearsOld = new Date().getFullYear() - boatYear
  const age      = ageFactor(yearsOld)
  const totalMSRP = baseline.count * baseline.msrpEach

  return {
    totalMSRP,
    totalResidual: Math.round(totalMSRP * age / 1000) * 1000,
    desc: baseline.desc,
  }
}
