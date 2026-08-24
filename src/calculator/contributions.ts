import { TAX_CONFIG_2026 } from './taxConfig2026'

/**
 * Employee social security contributions withheld on the gross annual salary.
 *
 *   base       = grossAnnualSalary * 9.19%
 *   additional = max(0, grossAnnualSalary - 56,224) * 1%
 *   total      = base + additional
 */
export function calculateEmployeeContributions(grossAnnualSalary: number): number {
  if (grossAnnualSalary <= 0) return 0

  const baseContribution = grossAnnualSalary * TAX_CONFIG_2026.employeeContributionRate

  const { threshold, rate } = TAX_CONFIG_2026.additionalContribution
  const additionalContribution = Math.max(0, grossAnnualSalary - threshold) * rate

  return baseContribution + additionalContribution
}

/**
 * Taxable income = gross annual salary net of social security contributions.
 * This is the base every tax in this model is computed on.
 */
export function calculateTaxableIncome(
  grossAnnualSalary: number,
  contributions: number,
): number {
  return grossAnnualSalary - contributions
}
