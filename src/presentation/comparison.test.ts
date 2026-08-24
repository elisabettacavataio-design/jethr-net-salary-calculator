import { describe, expect, it } from 'vitest'

import { calculateNetSalary } from '../calculator/calculateNetSalary'
import type { PaymentFrequency } from '../calculator/types'
import { buildComparison, diagnoseInversion } from './comparison'

function compare(
  currentSalary: number,
  scenarioSalary: number,
  payments: PaymentFrequency = 13,
) {
  return buildComparison(
    calculateNetSalary(currentSalary, payments),
    calculateNetSalary(scenarioSalary, payments),
  )
}

describe('buildComparison', () => {
  it('reports the gross difference for a higher scenario', () => {
    const comparison = compare(40_000, 45_000)

    expect(comparison.grossDifference).toBe(5_000)
    expect(comparison.annualNetDifference).toBeGreaterThan(0)
    expect(comparison.paymentNetDifference).toBeGreaterThan(0)
    expect(comparison.isInverted).toBe(false)
  })

  it('works just as well downwards', () => {
    const comparison = compare(40_000, 35_000)

    expect(comparison.grossDifference).toBe(-5_000)
    expect(comparison.annualNetDifference).toBeLessThan(0)
    expect(comparison.paymentNetDifference).toBeLessThan(0)
  })

  it('is the exact mirror of the opposite comparison', () => {
    const up = compare(40_000, 45_000)
    const down = compare(45_000, 40_000)

    expect(up.grossDifference).toBeCloseTo(-down.grossDifference, 6)
    expect(up.annualNetDifference).toBeCloseTo(-down.annualNetDifference, 6)
    expect(up.netPer100Gross).toBeCloseTo(down.netPer100Gross, 6)
  })

  it('derives every row from the two engine results', () => {
    const current = calculateNetSalary(40_000, 13)
    const scenario = calculateNetSalary(45_000, 13)
    const comparison = buildComparison(current, scenario)

    for (const row of comparison.rows) {
      expect(row.difference).toBeCloseTo(row.scenario - row.current, 6)
    }

    expect(comparison.rows.map((row) => row.current)).toEqual([
      current.grossAnnualSalary,
      current.annualNet,
      current.averageNetPayment,
    ])
  })

  it.each([12, 13, 14] as const)(
    'splits both scenarios over %i payments',
    (payments) => {
      const comparison = compare(40_000, 45_000, payments)
      const paymentRow = comparison.rows.find(
        (row) => row.id === 'average-net-payment',
      )

      expect(comparison.payments).toBe(payments)
      expect(paymentRow?.label).toBe(`Netto medio × ${payments}`)
      expect(comparison.paymentNetDifference).toBeCloseTo(
        comparison.annualNetDifference / payments,
        6,
      )
    },
  )

  it('leaves annual figures untouched by the payment frequency', () => {
    expect(compare(40_000, 45_000, 12).annualNetDifference).toBeCloseTo(
      compare(40_000, 45_000, 14).annualNetDifference,
      6,
    )
  })

  it('reports a zero difference when both scenarios are the same RAL', () => {
    const comparison = compare(40_000, 40_000)

    expect(comparison.grossDifference).toBe(0)
    expect(comparison.annualNetDifference).toBe(0)
    expect(comparison.netPer100Gross).toBe(0)
    expect(comparison.isInverted).toBe(false)
  })
})

describe('marginal effect', () => {
  it('keeps less than 100 € of every 100 € of extra gross salary', () => {
    const comparison = compare(40_000, 45_000)

    expect(comparison.netPer100Gross).toBeGreaterThan(0)
    expect(comparison.netPer100Gross).toBeLessThan(100)
  })

  it('is lower on a higher salary, because the marginal rate is higher', () => {
    const lower = compare(30_000, 35_000)
    const higher = compare(70_000, 75_000)

    expect(higher.netPer100Gross).toBeLessThan(lower.netPer100Gross)
  })

  it('stays correct when the comparison crosses an IRPEF bracket', () => {
    // Taxable income crosses 50.000 between these two salaries, so part of the
    // difference is taxed at 33% and part at 43%.
    const comparison = compare(53_000, 60_000)
    const straddled = compare(53_000, 56_000)

    expect(comparison.netPer100Gross).toBeGreaterThan(0)
    expect(comparison.netPer100Gross).toBeLessThan(straddled.netPer100Gross)
  })

  it('names the Milan exemption as the cause of an inversion', () => {
    // Taxable income crosses 23.000 between these two salaries.
    const comparison = compare(25_200, 25_500)

    expect(comparison.inversion).toEqual({
      mechanism: 'MUNICIPAL_SURCHARGE_STARTS',
      threshold: 23_000,
    })
  })

  it('gives the same diagnosis whichever way round the comparison is made', () => {
    const up = compare(25_200, 25_500)
    const down = compare(25_500, 25_200)

    expect(down.inversion).toEqual(up.inversion)
  })

  it('names the tax-wedge allowance when its rate drops', () => {
    // Taxable income crosses 8.500, where the allowance rate falls to 5,3%.
    const comparison = compare(9_340, 9_380)

    expect(comparison.isInverted).toBe(true)
    expect(comparison.inversion?.mechanism).toBe('TAX_WEDGE_ALLOWANCE_REDUCED')
  })

  it('diagnoses nothing when the net follows the RAL', () => {
    expect(compare(40_000, 45_000).inversion).toBeNull()
    expect(
      diagnoseInversion(
        calculateNetSalary(40_000, 13),
        calculateNetSalary(45_000, 13),
      ),
    ).toBeNull()
  })

  it('flags the case where a higher RAL produces a lower net', () => {
    // Crossing the Milan exemption threshold: a real step in the prescribed
    // rules, so the copy must not promise that more gross always means more net.
    const comparison = compare(25_200, 25_500)

    expect(comparison.grossDifference).toBeGreaterThan(0)
    expect(comparison.annualNetDifference).toBeLessThan(0)
    expect(comparison.isInverted).toBe(true)
  })
})
