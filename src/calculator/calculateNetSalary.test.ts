import { describe, expect, it } from 'vitest'

import { calculateNetSalary } from './calculateNetSalary'
import {
  calculateEmployeeContributions,
  calculateTaxableIncome,
} from './contributions'
import {
  calculateEmployeeDeduction,
  calculateTaxWedgeBonus,
  calculateTaxWedgeDeduction,
} from './deductions'
import { calculateGrossIrpef } from './irpef'
import { calculateLombardySurcharge, calculateMilanSurcharge } from './localTaxes'
import type { PaymentFrequency } from './types'

/** Rounding tolerance agreed with the reference figures (~1 euro). */
const TOLERANCE = 1

/** Asserts a monetary value matches a reference figure within the tolerance. */
function expectEuro(actual: number, expected: number, tolerance = TOLERANCE) {
  expect(actual).toBeGreaterThanOrEqual(expected - tolerance)
  expect(actual).toBeLessThanOrEqual(expected + tolerance)
}

describe('golden cases', () => {
  it('RAL 20.000 matches the reference breakdown', () => {
    const result = calculateNetSalary(20_000, 12)

    expectEuro(result.contributions, 1_838)
    expectEuro(result.taxableIncome, 18_162)
    expectEuro(result.grossIrpef, 4_177)
    expectEuro(result.employeeDeduction, 2_811)
    expect(result.taxWedgeDeduction).toBe(0)
    expectEuro(result.taxWedgeBonus, 872)
    expectEuro(result.netIrpef, 1_367)
    expectEuro(result.regionalTax, 234)
    expect(result.municipalTax).toBe(0)
    expectEuro(result.annualNet, 17_433)
  })

  it('RAL 30.000 matches the reference breakdown', () => {
    const result = calculateNetSalary(30_000, 12)

    expectEuro(result.contributions, 2_757)
    expectEuro(result.taxableIncome, 27_243)
    expectEuro(result.grossIrpef, 6_266)
    expectEuro(result.employeeDeduction, 2_044)
    expectEuro(result.taxWedgeDeduction, 1_000)
    expectEuro(result.netIrpef, 3_222)
    expectEuro(result.regionalTax, 378)
    expectEuro(result.municipalTax, 218)
    expectEuro(result.annualNet, 23_426)
  })

  it.each([
    [40_000, 27_960],
    [50_000, 32_568],
    [70_000, 42_447],
  ])('RAL %i produces an annual net of about %i', (salary, expectedNet) => {
    expectEuro(calculateNetSalary(salary, 12).annualNet, expectedNet)
  })
})

describe('result consistency', () => {
  const result = calculateNetSalary(40_000, 13)

  it('totalTaxes is net IRPEF plus both surcharges', () => {
    expect(result.totalTaxes).toBeCloseTo(
      result.netIrpef + result.regionalTax + result.municipalTax,
      6,
    )
  })

  it('totalDeductions is contributions plus total taxes', () => {
    expect(result.totalDeductions).toBeCloseTo(
      result.contributions + result.totalTaxes,
      6,
    )
  })

  it('annual net equals gross minus deductions plus the tax-wedge allowance', () => {
    expect(result.annualNet).toBeCloseTo(
      result.grossAnnualSalary - result.totalDeductions + result.taxWedgeBonus,
      6,
    )
  })

  it('taxable income equals gross salary minus contributions', () => {
    expect(result.taxableIncome).toBeCloseTo(
      result.grossAnnualSalary - result.contributions,
      6,
    )
  })
})

describe('payment frequency', () => {
  it('does not change any annual figure', () => {
    const twelve = calculateNetSalary(40_000, 12)
    const fourteen = calculateNetSalary(40_000, 14)

    expect(twelve.annualNet).toBe(fourteen.annualNet)
    expect(twelve.totalTaxes).toBe(fourteen.totalTaxes)
    expect(twelve.contributions).toBe(fourteen.contributions)
  })

  it.each([12, 13, 14] as const)(
    'splits the annual net over %i payments',
    (payments) => {
      const result = calculateNetSalary(40_000, payments)

      expect(result.averageNetPayment).toBeCloseTo(result.annualNet / payments, 6)
    },
  )
})

describe('boundary: additional social security contribution', () => {
  it('adds nothing at or below 56.224', () => {
    expect(calculateEmployeeContributions(56_224)).toBeCloseTo(56_224 * 0.0919, 6)
  })

  it('adds 1% only on the portion above 56.224', () => {
    const salary = 66_224

    expect(calculateEmployeeContributions(salary)).toBeCloseTo(
      salary * 0.0919 + 100,
      6,
    )
  })
})

describe('boundary: IRPEF brackets', () => {
  it('applies 23% up to 28.000', () => {
    expect(calculateGrossIrpef(28_000)).toBeCloseTo(28_000 * 0.23, 6)
  })

  it('applies 33% only on the 28.000-50.000 portion', () => {
    expect(calculateGrossIrpef(50_000)).toBeCloseTo(
      28_000 * 0.23 + 22_000 * 0.33,
      6,
    )
  })

  it('applies 43% only above 50.000', () => {
    expect(calculateGrossIrpef(60_000)).toBeCloseTo(
      28_000 * 0.23 + 22_000 * 0.33 + 10_000 * 0.43,
      6,
    )
  })

  it('never uses an average rate', () => {
    // A flat 33% on 50.000 would be 16.500; progressive taxation must be lower.
    expect(calculateGrossIrpef(50_000)).toBeLessThan(50_000 * 0.33)
  })
})

describe('boundary: employee deduction', () => {
  it('is flat at 1.955 up to 15.000', () => {
    expect(calculateEmployeeDeduction(15_000)).toBeCloseTo(1_955, 6)
  })

  it('is continuous across 28.000', () => {
    const below = calculateEmployeeDeduction(27_999.99)
    const above = calculateEmployeeDeduction(28_000.01)

    expect(Math.abs(below - above)).toBeLessThan(1)
  })

  it('adds the 65 euro top-up above 25.000', () => {
    expect(calculateEmployeeDeduction(25_000)).toBeCloseTo(
      1_910 + (1_190 * (28_000 - 25_000)) / 13_000,
      6,
    )
    expect(calculateEmployeeDeduction(25_000.01)).toBeCloseTo(
      1_910 + (1_190 * (28_000 - 25_000.01)) / 13_000 + 65,
      6,
    )
  })

  it('drops the 65 euro top-up above 35.000', () => {
    expect(calculateEmployeeDeduction(35_000)).toBeCloseTo(
      (1_910 * (50_000 - 35_000)) / 22_000 + 65,
      6,
    )
    expect(calculateEmployeeDeduction(35_000.01)).toBeCloseTo(
      (1_910 * (50_000 - 35_000.01)) / 22_000,
      6,
    )
  })

  it('is zero above 50.000', () => {
    expect(calculateEmployeeDeduction(50_000.01)).toBe(0)
  })
})

describe('boundary: tax wedge', () => {
  it('steps down through the allowance bands', () => {
    expect(calculateTaxWedgeBonus(8_500)).toBeCloseTo(8_500 * 0.071, 6)
    expect(calculateTaxWedgeBonus(8_500.01)).toBeCloseTo(8_500.01 * 0.053, 6)
    expect(calculateTaxWedgeBonus(15_000)).toBeCloseTo(15_000 * 0.053, 6)
    expect(calculateTaxWedgeBonus(15_000.01)).toBeCloseTo(15_000.01 * 0.048, 6)
  })

  it('pays no allowance above 20.000', () => {
    expect(calculateTaxWedgeBonus(20_000)).toBeCloseTo(20_000 * 0.048, 6)
    expect(calculateTaxWedgeBonus(20_000.01)).toBe(0)
  })

  it('grants the flat 1.000 deduction between 20.000 and 32.000', () => {
    expect(calculateTaxWedgeDeduction(20_000)).toBe(0)
    expect(calculateTaxWedgeDeduction(20_000.01)).toBe(1_000)
    expect(calculateTaxWedgeDeduction(32_000)).toBe(1_000)
  })

  it('phases the deduction out linearly to zero at 40.000', () => {
    expect(calculateTaxWedgeDeduction(36_000)).toBeCloseTo(500, 6)
    expect(calculateTaxWedgeDeduction(40_000)).toBeCloseTo(0, 6)
    expect(calculateTaxWedgeDeduction(40_000.01)).toBe(0)
  })
})

describe('boundary: local surcharges', () => {
  it('charges no Milan surcharge at or below 23.000', () => {
    expect(calculateMilanSurcharge(23_000)).toBe(0)
  })

  it('charges Milan on the whole taxable income once 23.000 is passed', () => {
    // Exemption, not allowance: the step at the threshold is intentional.
    expect(calculateMilanSurcharge(23_000.01)).toBeCloseTo(23_000.01 * 0.008, 6)
    expect(calculateMilanSurcharge(23_000.01)).toBeGreaterThan(180)
  })

  it('applies the Lombardy scale progressively', () => {
    expect(calculateLombardySurcharge(15_000)).toBeCloseTo(15_000 * 0.0123, 6)
    expect(calculateLombardySurcharge(28_000)).toBeCloseTo(
      15_000 * 0.0123 + 13_000 * 0.0158,
      6,
    )
    expect(calculateLombardySurcharge(50_000)).toBeCloseTo(
      15_000 * 0.0123 + 13_000 * 0.0158 + 22_000 * 0.0172,
      6,
    )
  })
})

describe('taxable income helper', () => {
  it('subtracts contributions from the gross salary', () => {
    expect(calculateTaxableIncome(40_000, 3_676)).toBe(36_324)
  })
})

/**
 * The rules in the spec are step functions, so the model has real cliffs:
 * a slightly higher RAL can produce a slightly lower net. These are properties
 * of the prescribed formulas, not implementation bugs — they are pinned here so
 * a future change cannot introduce or move one silently. See README, "Limiti".
 */
describe('known discontinuities of the MVP model', () => {
  const CLIFFS = [
    {
      label: 'tax-wedge allowance rate drops (taxable 8.500)',
      salary: 9_360,
      minimumStep: 100,
    },
    {
      label: 'Milan surcharge starts (taxable 23.000)',
      salary: 25_328,
      minimumStep: 100,
    },
  ]

  it.each(CLIFFS)(
    '$label produces a downward step in the net',
    ({ salary, minimumStep }) => {
      const before = calculateNetSalary(salary - 5, 12).annualNet
      const after = calculateNetSalary(salary + 5, 12).annualNet

      expect(before - after).toBeGreaterThan(minimumStep)
    },
  )

  it('hands over smoothly at taxable 20.000, where the allowance is replaced by the 1.000 deduction', () => {
    const before = calculateNetSalary(22_019, 12).annualNet
    const after = calculateNetSalary(22_029, 12).annualNet

    expect(Math.abs(after - before)).toBeLessThan(100)
  })

  it('is otherwise monotonic above the last cliff', () => {
    let previousNet = 0

    for (let salary = 40_000; salary <= 200_000; salary += 500) {
      const { annualNet } = calculateNetSalary(salary, 12)
      expect(annualNet).toBeGreaterThan(previousNet)
      previousNet = annualNet
    }
  })
})

describe('invalid input', () => {
  it.each([0, -1, -40_000])('rejects a gross salary of %i', (salary) => {
    expect(() => calculateNetSalary(salary, 12)).toThrow(RangeError)
  })

  it.each([NaN, Infinity, -Infinity])('rejects %s', (salary) => {
    expect(() => calculateNetSalary(salary, 12)).toThrow(RangeError)
  })

  it('rejects a gross salary above the supported range', () => {
    expect(() => calculateNetSalary(10_000_001, 12)).toThrow(RangeError)
  })

  it.each([0, 1, 11, 15, 26, NaN])(
    'rejects %s as a payment frequency',
    (payments) => {
      expect(() =>
        calculateNetSalary(40_000, payments as PaymentFrequency),
      ).toThrow(RangeError)
    },
  )
})
