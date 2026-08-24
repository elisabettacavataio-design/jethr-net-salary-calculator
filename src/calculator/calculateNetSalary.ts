import {
  calculateEmployeeContributions,
  calculateTaxableIncome,
} from './contributions'
import {
  calculateEmployeeDeduction,
  calculateTaxWedgeBonus,
  calculateTaxWedgeDeduction,
} from './deductions'
import { calculateGrossIrpef, calculateNetIrpef } from './irpef'
import { calculateLombardySurcharge, calculateMilanSurcharge } from './localTaxes'
import type { PaymentFrequency, SalaryCalculationResult } from './types'
import { isSupportedPaymentFrequency, MAX_SUPPORTED_SALARY } from './validation'

/**
 * The one entry point of the tax engine.
 *
 * Everything the page renders comes from the object returned here — components
 * never recompute or re-derive a fiscal figure.
 *
 * Order of calculation:
 *   gross salary
 *     -> social security contributions
 *     -> taxable income
 *     -> gross IRPEF
 *     -> employee deduction + tax-wedge deduction
 *     -> net IRPEF
 *     -> regional + municipal surcharges
 *     -> total taxes
 *     -> annual net (+ non-taxable tax-wedge allowance)
 *     -> average net per payment
 *
 * No intermediate rounding: values are rounded for display only.
 *
 * @throws RangeError when the inputs are outside the supported domain.
 */
export function calculateNetSalary(
  grossAnnualSalary: number,
  payments: PaymentFrequency,
): SalaryCalculationResult {
  if (!Number.isFinite(grossAnnualSalary)) {
    throw new RangeError('grossAnnualSalary must be a finite number')
  }
  if (grossAnnualSalary <= 0) {
    throw new RangeError('grossAnnualSalary must be greater than zero')
  }
  if (grossAnnualSalary > MAX_SUPPORTED_SALARY) {
    throw new RangeError(
      `grossAnnualSalary must not exceed ${MAX_SUPPORTED_SALARY}`,
    )
  }
  if (!isSupportedPaymentFrequency(payments)) {
    throw new RangeError('payments must be 12, 13 or 14')
  }

  const contributions = calculateEmployeeContributions(grossAnnualSalary)
  const taxableIncome = calculateTaxableIncome(grossAnnualSalary, contributions)

  const grossIrpef = calculateGrossIrpef(taxableIncome)
  const employeeDeduction = calculateEmployeeDeduction(taxableIncome)
  const taxWedgeDeduction = calculateTaxWedgeDeduction(taxableIncome)
  const taxWedgeBonus = calculateTaxWedgeBonus(taxableIncome)

  const netIrpef = calculateNetIrpef(
    grossIrpef,
    employeeDeduction,
    taxWedgeDeduction,
  )

  const regionalTax = calculateLombardySurcharge(taxableIncome)
  const municipalTax = calculateMilanSurcharge(taxableIncome)

  const totalTaxes = netIrpef + regionalTax + municipalTax
  const totalDeductions = contributions + totalTaxes

  // The tax-wedge allowance is not taxed and not deducted: it is added to the net.
  const annualNet = grossAnnualSalary - totalDeductions + taxWedgeBonus
  const averageNetPayment = annualNet / payments

  return {
    grossAnnualSalary,
    payments,

    contributions,
    taxableIncome,

    grossIrpef,
    employeeDeduction,

    taxWedgeDeduction,
    taxWedgeBonus,

    netIrpef,

    regionalTax,
    municipalTax,

    totalTaxes,
    totalDeductions,

    annualNet,
    averageNetPayment,
  }
}
