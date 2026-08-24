/**
 * Shared types for the tax engine.
 *
 * Naming convention: the whole codebase is written in English.
 * Italian payroll terms map to English identifiers as follows:
 *
 *   RAL                     -> grossAnnualSalary
 *   contributi previdenziali-> contributions
 *   imponibile fiscale      -> taxableIncome
 *   IRPEF lorda / netta     -> grossIrpef / netIrpef
 *   detrazione lavoro dip.  -> employeeDeduction
 *   cuneo fiscale           -> taxWedge
 *   addizionale regionale   -> regionalTax
 *   addizionale comunale    -> municipalTax
 *   mensilità               -> payments
 *   netto annuale           -> annualNet
 *   netto medio per mensilità -> averageNetPayment
 */

/** Number of salary instalments the annual net is spread over. */
export type PaymentFrequency = 12 | 13 | 14

/** A single bracket of a progressive tax scale. */
export type TaxBracket = {
  /** Upper bound of the bracket, inclusive. Use `Infinity` for the top one. */
  readonly upTo: number
  /** Rate applied to the portion of income falling inside this bracket. */
  readonly rate: number
}

/**
 * The single object every part of the UI reads from.
 * No component is allowed to recompute any of these values.
 */
export type SalaryCalculationResult = {
  grossAnnualSalary: number
  payments: PaymentFrequency

  contributions: number
  taxableIncome: number

  grossIrpef: number
  employeeDeduction: number

  taxWedgeDeduction: number
  taxWedgeBonus: number

  netIrpef: number

  regionalTax: number
  municipalTax: number

  totalTaxes: number
  totalDeductions: number

  annualNet: number
  averageNetPayment: number
}
