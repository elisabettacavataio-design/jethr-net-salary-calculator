import type { SalaryCalculationResult } from '../calculator/types'

/**
 * Presentation logic for the composition bar.
 *
 * The bar answers one question — "where does my RAL go?" — so its three
 * segments must add up to the gross annual salary and nothing else.
 *
 * The net segment therefore excludes the non-taxable tax-wedge allowance: that
 * amount is added on top of the RAL rather than taken out of it, so including
 * it would make the segments describe "RAL + bonus" while claiming to describe
 * the RAL. The allowance is surfaced as its own item next to the bar.
 */

export type CompositionCategory = 'net' | 'taxes' | 'contributions'

export type CompositionSegment = {
  id: CompositionCategory
  label: string
  amount: number
  /** Share of the gross annual salary, between 0 and 1. */
  ratio: number
}

/** The part of the net that actually comes out of the gross salary. */
export function getNetFromGrossSalary(result: SalaryCalculationResult): number {
  return result.annualNet - result.taxWedgeBonus
}

export function buildComposition(
  result: SalaryCalculationResult,
): CompositionSegment[] {
  const total = result.grossAnnualSalary

  const segments: Array<Omit<CompositionSegment, 'ratio'>> = [
    { id: 'net', label: 'Netto dalla RAL', amount: getNetFromGrossSalary(result) },
    { id: 'taxes', label: 'Imposte', amount: result.totalTaxes },
    { id: 'contributions', label: 'Contributi', amount: result.contributions },
  ]

  return segments.map((segment) => ({
    ...segment,
    ratio: total > 0 ? segment.amount / total : 0,
  }))
}
