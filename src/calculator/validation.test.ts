import { describe, expect, it } from 'vitest'

import {
  isSupportedPaymentFrequency,
  validateGrossAnnualSalary,
} from './validation'

describe('validateGrossAnnualSalary', () => {
  it.each(['', '   '])('rejects an empty field (%s)', (input) => {
    expect(validateGrossAnnualSalary(input)).toEqual({
      valid: false,
      error: 'EMPTY',
    })
  })

  it.each(['abc', '40.00.0', '12e5', '--3', '1,2,3'])(
    'rejects a non numeric value (%s)',
    (input) => {
      expect(validateGrossAnnualSalary(input)).toEqual({
        valid: false,
        error: 'NOT_A_NUMBER',
      })
    },
  )

  it.each(['0', '-1', '-40000'])('rejects a non positive value (%s)', (input) => {
    expect(validateGrossAnnualSalary(input)).toEqual({
      valid: false,
      error: 'NOT_POSITIVE',
    })
  })

  it('rejects a value above the supported range', () => {
    expect(validateGrossAnnualSalary('10000001')).toEqual({
      valid: false,
      error: 'ABOVE_SUPPORTED_RANGE',
    })
  })

  it.each([
    ['40000', 40_000],
    ['40.000', 40_000],
    ['40 000', 40_000],
    ['40000,50', 40_000.5],
    [' 40000 € ', 40_000],
  ])('accepts %s as %i', (input, expected) => {
    expect(validateGrossAnnualSalary(input)).toEqual({
      valid: true,
      value: expected,
    })
  })
})

describe('isSupportedPaymentFrequency', () => {
  it.each([12, 13, 14])('accepts %i', (value) => {
    expect(isSupportedPaymentFrequency(value)).toBe(true)
  })

  it.each([0, 11, 15, 26, NaN])('rejects %s', (value) => {
    expect(isSupportedPaymentFrequency(value)).toBe(false)
  })
})
