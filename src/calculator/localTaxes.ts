import { calculateProgressiveTax } from './irpef'
import { TAX_CONFIG_2026 } from './taxConfig2026'

/**
 * Lombardy regional surcharge — progressive over brackets.
 * Reuses the shared progressive algorithm; no second implementation.
 */
export function calculateLombardySurcharge(taxableIncome: number): number {
  return calculateProgressiveTax(taxableIncome, TAX_CONFIG_2026.lombardyBrackets)
}

/**
 * Milan municipal surcharge.
 *
 * 23,000 is an EXEMPTION threshold, not an allowance: below it nothing is due,
 * above it the rate applies to the entire taxable income.
 */
export function calculateMilanSurcharge(taxableIncome: number): number {
  const { exemptionThreshold, rate } = TAX_CONFIG_2026.milan

  if (taxableIncome <= exemptionThreshold) return 0

  return taxableIncome * rate
}
