import type { SalaryCalculationResult } from '../calculator/types'

/**
 * Presentation logic for the headline result block.
 */

/**
 * How much of the gross salary the person ends up with, as a 0-1 ratio.
 *
 * This compares the annual net to the RAL. It is not the same figure as the
 * "net" segment of the composition bar whenever the tax-wedge allowance
 * applies: the bar decomposes the RAL, while this compares the whole net —
 * allowance included — to it. The copy states which one it is, and mentions the
 * allowance when it is what makes the two differ.
 */
export function getNetToGrossRatio(result: SalaryCalculationResult): number {
  if (result.grossAnnualSalary <= 0) return 0

  return result.annualNet / result.grossAnnualSalary
}

/** True when the net is boosted by something that does not come from the RAL. */
export function hasAllowanceOutsideGrossSalary(
  result: SalaryCalculationResult,
): boolean {
  return result.taxWedgeBonus > 0
}
