import { describe, expect, it } from 'vitest'

import { calculateNetSalary } from '../calculator/calculateNetSalary'
import { buildComposition, getNetFromGrossSalary } from './composition'

describe('buildComposition', () => {
  it.each([20_000, 22_000, 30_000, 40_000, 70_000])(
    'segments of a RAL of %i add up to the gross salary',
    (salary) => {
      const result = calculateNetSalary(salary, 13)
      const total = buildComposition(result).reduce(
        (sum, segment) => sum + segment.amount,
        0,
      )

      expect(total).toBeCloseTo(result.grossAnnualSalary, 6)
    },
  )

  it.each([20_000, 22_000, 30_000, 40_000, 70_000])(
    'ratios of a RAL of %i add up to 1',
    (salary) => {
      const ratios = buildComposition(calculateNetSalary(salary, 13)).reduce(
        (sum, segment) => sum + segment.ratio,
        0,
      )

      expect(ratios).toBeCloseTo(1, 6)
    },
  )

  it('excludes the tax-wedge allowance from the net segment', () => {
    // A RAL of 22.000 is low enough for the allowance to apply.
    const result = calculateNetSalary(22_000, 13)
    expect(result.taxWedgeBonus).toBeGreaterThan(0)

    const netSegment = buildComposition(result).find(
      (segment) => segment.id === 'net',
    )

    expect(netSegment?.amount).toBeCloseTo(
      result.annualNet - result.taxWedgeBonus,
      6,
    )
    expect(netSegment?.amount).toBeLessThan(result.annualNet)
  })

  it('matches the annual net when no allowance applies', () => {
    const result = calculateNetSalary(40_000, 13)
    expect(result.taxWedgeBonus).toBe(0)

    expect(getNetFromGrossSalary(result)).toBeCloseTo(result.annualNet, 6)
  })
})
