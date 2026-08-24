import { TAX_CONFIG_2026 } from '../calculator/taxConfig2026'
import type { SalaryCalculationResult } from '../calculator/types'

/**
 * Presentation logic for the RAL comparison.
 *
 * No fiscal logic here: both scenarios come from `calculateNetSalary`, the same
 * entry point the main result uses. This module only subtracts and labels.
 *
 * The comparison works in both directions — a lower RAL is as valid as a higher
 * one. It compares scenarios; it does not assume a pay rise.
 */

export type ComparisonRow = {
  id: string
  label: string
  current: number
  scenario: number
  difference: number
}

export type Comparison = {
  currentGrossSalary: number
  scenarioGrossSalary: number
  payments: number

  rows: ComparisonRow[]

  grossDifference: number
  annualNetDifference: number
  paymentNetDifference: number

  /**
   * How much net each 100 € of gross difference is worth — the marginal effect,
   * without the reader needing to know rates and brackets.
   */
  netPer100Gross: number

  /**
   * True when net moves in the opposite direction to gross. The prescribed
   * rules contain thresholds (see README), so this is a real possibility and
   * the copy must not claim otherwise.
   */
  isInverted: boolean

  /** Which mechanism causes the inversion, so the UI can name it. */
  inversion: InversionDiagnosis | null
}

export type InversionMechanism =
  | 'MUNICIPAL_SURCHARGE_STARTS'
  | 'TAX_WEDGE_ALLOWANCE_ENDS'
  | 'TAX_WEDGE_ALLOWANCE_REDUCED'
  | 'EMPLOYEE_DEDUCTION_ENDS'
  | 'UNKNOWN'

export type InversionDiagnosis = {
  mechanism: InversionMechanism
  /** Taxable income threshold that gets crossed, when the model names one. */
  threshold: number | null
}

/**
 * Works out *which* rule makes a higher gross salary produce a lower net.
 *
 * It reads no formulas: it observes which components of the two engine results
 * changed between the lower and the higher salary. "Something happens at a
 * threshold" is not a good enough explanation for a user — it reads like the
 * calculator knows it broke but not why.
 */
export function diagnoseInversion(
  current: SalaryCalculationResult,
  scenario: SalaryCalculationResult,
): InversionDiagnosis | null {
  const grossDifference = scenario.grossAnnualSalary - current.grossAnnualSalary
  const netDifference = scenario.annualNet - current.annualNet

  if (grossDifference === 0) return null
  if (grossDifference > 0 === netDifference > 0) return null

  // Always reason from the lower salary upwards, so the answer is the same
  // whichever way round the comparison was made.
  const [lower, higher] =
    grossDifference > 0 ? [current, scenario] : [scenario, current]

  // A cliff, not a rate change: above the threshold the rate applies to the
  // whole taxable income, so the charge appears at full size.
  if (lower.municipalTax === 0 && higher.municipalTax > 0) {
    return {
      mechanism: 'MUNICIPAL_SURCHARGE_STARTS',
      threshold: TAX_CONFIG_2026.milan.exemptionThreshold,
    }
  }

  if (lower.taxWedgeBonus > 0 && higher.taxWedgeBonus === 0) {
    return { mechanism: 'TAX_WEDGE_ALLOWANCE_ENDS', threshold: null }
  }

  if (
    lower.taxWedgeBonus > 0 &&
    higher.taxWedgeBonus > 0 &&
    higher.taxWedgeBonus / higher.taxableIncome <
      lower.taxWedgeBonus / lower.taxableIncome
  ) {
    return { mechanism: 'TAX_WEDGE_ALLOWANCE_REDUCED', threshold: null }
  }

  if (lower.employeeDeduction > 0 && higher.employeeDeduction === 0) {
    return { mechanism: 'EMPLOYEE_DEDUCTION_ENDS', threshold: null }
  }

  return { mechanism: 'UNKNOWN', threshold: null }
}

export function buildComparison(
  current: SalaryCalculationResult,
  scenario: SalaryCalculationResult,
): Comparison {
  const grossDifference = scenario.grossAnnualSalary - current.grossAnnualSalary
  const annualNetDifference = scenario.annualNet - current.annualNet
  const paymentNetDifference = scenario.averageNetPayment - current.averageNetPayment

  const rows: ComparisonRow[] = [
    {
      id: 'gross-annual-salary',
      label: 'RAL annuale',
      current: current.grossAnnualSalary,
      scenario: scenario.grossAnnualSalary,
      difference: grossDifference,
    },
    {
      id: 'annual-net',
      label: 'Netto annuale',
      current: current.annualNet,
      scenario: scenario.annualNet,
      difference: annualNetDifference,
    },
    {
      id: 'average-net-payment',
      label: `Netto medio × ${current.payments}`,
      current: current.averageNetPayment,
      scenario: scenario.averageNetPayment,
      difference: paymentNetDifference,
    },
  ]

  const netPer100Gross =
    grossDifference === 0 ? 0 : (annualNetDifference / grossDifference) * 100

  return {
    currentGrossSalary: current.grossAnnualSalary,
    scenarioGrossSalary: scenario.grossAnnualSalary,
    payments: current.payments,

    rows,

    grossDifference,
    annualNetDifference,
    paymentNetDifference,

    netPer100Gross,
    isInverted: netPer100Gross < 0,
    inversion: diagnoseInversion(current, scenario),
  }
}
