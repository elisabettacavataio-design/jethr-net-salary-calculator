import { TAX_CONFIG_2026 } from './taxConfig2026'
import type { TaxBracket } from './types'

/**
 * Generic progressive (marginal) tax over a bracket scale.
 *
 * Each bracket rate applies only to the portion of income that falls inside
 * that bracket — never an average rate over the whole income.
 *
 * Shared by IRPEF and by the Lombardy regional surcharge: there must be
 * exactly one implementation of this algorithm in the codebase.
 */
export function calculateProgressiveTax(
  income: number,
  brackets: readonly TaxBracket[],
): number {
  if (income <= 0) return 0

  let tax = 0
  let lowerBound = 0

  for (const bracket of brackets) {
    if (income <= lowerBound) break

    const upperBound = Math.min(income, bracket.upTo)
    tax += (upperBound - lowerBound) * bracket.rate
    lowerBound = bracket.upTo
  }

  return tax
}

/** Gross IRPEF, before any deduction is applied. */
export function calculateGrossIrpef(taxableIncome: number): number {
  return calculateProgressiveTax(taxableIncome, TAX_CONFIG_2026.irpefBrackets)
}

/**
 * Net IRPEF, floored at zero.
 *
 * Deductions can only wipe out IRPEF; they never turn into a credit in this
 * model (the "trattamento integrativo" is deliberately not modelled — see README).
 */
export function calculateNetIrpef(
  grossIrpef: number,
  employeeDeduction: number,
  taxWedgeDeduction: number,
): number {
  return Math.max(0, grossIrpef - employeeDeduction - taxWedgeDeduction)
}
