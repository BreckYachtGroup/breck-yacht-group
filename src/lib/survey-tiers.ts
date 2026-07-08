/**
 * Survey Deposit Tiers
 *
 * Tiered, non-refundable deposits collected before a surveyor is scheduled.
 * Deposit covers the cost of the pre-auction survey regardless of outcome.
 *
 * ⚠️  UPDATE depositAmount values after calling surveyors for current market rates.
 *     These are placeholders based on estimated industry pricing.
 *
 * Policy:
 *   - Deposit collected via Stripe before any surveyor is booked
 *   - Non-refundable under all circumstances
 *   - If survey passes and auction closes → credited back to seller at closing
 *   - If survey fails and seller backs out → deposit retained to cover survey cost
 *   - If seller wants to repair and re-list → new deposit required for re-survey
 */

export type SurveyTier = {
  /** Human-readable label shown in admin panel and emails */
  label: string
  /** Minimum vessel length in feet (inclusive). null = no minimum */
  minFt: number | null
  /** Maximum vessel length in feet (inclusive). null = no maximum */
  maxFt: number | null
  /**
   * Non-refundable deposit amount in USD cents (for Stripe).
   * ⚠️  Placeholder — update after surveyor pricing calls.
   */
  depositCents: number
}

export const SURVEY_TIERS: SurveyTier[] = [
  {
    label:        'Under 30ft',
    minFt:        null,
    maxFt:        29.9,
    depositCents: 50000,   // $500 — UPDATE after surveyor calls
  },
  {
    label:        '30–39ft',
    minFt:        30,
    maxFt:        39.9,
    depositCents: 80000,   // $800 — UPDATE after surveyor calls
  },
  {
    label:        '40ft+',
    minFt:        40,
    maxFt:        null,
    depositCents: 150000,  // $1,500 — UPDATE after surveyor calls
  },
]

/**
 * Returns the survey tier for a given vessel length.
 * Falls back to the smallest tier if length is unknown.
 */
export function getSurveyTier(lengthFt: number | null | undefined): SurveyTier {
  if (!lengthFt) return SURVEY_TIERS[0]
  return (
    SURVEY_TIERS.find(
      t =>
        (t.minFt === null || lengthFt >= t.minFt) &&
        (t.maxFt === null || lengthFt <= t.maxFt)
    ) ?? SURVEY_TIERS[SURVEY_TIERS.length - 1]
  )
}

/** Formats a depositCents value as a USD dollar string, e.g. "$1,500" */
export function formatDeposit(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })
}
