import type { TaxBracket } from './types'

/**
 * Fiscal year 2026 — single source of truth for every rate and threshold.
 *
 * Nothing in this file may be duplicated inside components. To model a
 * different fiscal year, add a sibling config file and inject it; do not
 * edit values inline in the calculation modules.
 */
export const TAX_CONFIG_2026 = {
  /** Standard employee social security rate (private sector, white collar). */
  employeeContributionRate: 0.0919,

  /** Extra 1% contribution on the portion of salary above the threshold. */
  additionalContribution: {
    threshold: 56_224,
    rate: 0.01,
  },

  irpefBrackets: [
    { upTo: 28_000, rate: 0.23 },
    { upTo: 50_000, rate: 0.33 },
    { upTo: Infinity, rate: 0.43 },
  ] as readonly TaxBracket[],

  /** Lombardy regional surcharge — progressive, same algorithm as IRPEF. */
  lombardyBrackets: [
    { upTo: 15_000, rate: 0.0123 },
    { upTo: 28_000, rate: 0.0158 },
    { upTo: 50_000, rate: 0.0172 },
    { upTo: Infinity, rate: 0.0173 },
  ] as readonly TaxBracket[],

  /**
   * Milan municipal surcharge.
   * `exemptionThreshold` is an exemption, NOT an allowance: above it the rate
   * applies to the whole taxable income, not only to the excess.
   */
  milan: {
    exemptionThreshold: 23_000,
    rate: 0.008,
  },
} as const

/** Fiscal year this configuration describes. Displayed in the UI. */
export const FISCAL_YEAR = 2026
