/**
 * Deductions and tax-wedge relief.
 *
 * MVP assumption, documented in the README: every threshold in this file is
 * evaluated against the taxable income (`taxableIncome`), including the
 * tax-wedge ones. A production engine would use different bases for some of
 * these; the golden tests in this repo are built on the same assumption.
 */

/**
 * Employee income deduction ("detrazione da lavoro dipendente").
 * Assumes an employment relationship active for the whole fiscal year.
 */
export function calculateEmployeeDeduction(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0

  let deduction: number

  if (taxableIncome <= 15_000) {
    deduction = 1_955
  } else if (taxableIncome <= 28_000) {
    deduction = 1_910 + (1_190 * (28_000 - taxableIncome)) / 13_000
  } else if (taxableIncome <= 50_000) {
    deduction = (1_910 * (50_000 - taxableIncome)) / 22_000
  } else {
    deduction = 0
  }

  // Flat top-up on the middle band.
  if (taxableIncome > 25_000 && taxableIncome <= 35_000) {
    deduction += 65
  }

  return deduction
}

/**
 * Tax-wedge relief, part A — non-taxable allowance.
 *
 * This amount does NOT reduce the taxable income and does NOT reduce IRPEF:
 * it is added straight to the final net.
 */
export function calculateTaxWedgeBonus(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0

  if (taxableIncome <= 8_500) return taxableIncome * 0.071
  if (taxableIncome <= 15_000) return taxableIncome * 0.053
  if (taxableIncome <= 20_000) return taxableIncome * 0.048

  return 0
}

/**
 * Tax-wedge relief, part B — additional deduction that reduces IRPEF.
 * Phases out linearly between 32,000 and 40,000.
 */
export function calculateTaxWedgeDeduction(taxableIncome: number): number {
  if (taxableIncome <= 20_000) return 0
  if (taxableIncome <= 32_000) return 1_000
  if (taxableIncome <= 40_000) return (1_000 * (40_000 - taxableIncome)) / 8_000

  return 0
}
