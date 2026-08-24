import { describe, expect, it } from 'vitest'

import {
  formatCurrency,
  formatNegativeCurrency,
  formatPercent,
  formatPercentWithArticle,
} from './formatCurrency'

/** Intl inserts a non-breaking space before the symbol. */
const normalise = (value: string) => value.replace(/\s/g, ' ')

describe('formatCurrency', () => {
  it.each([
    [27_960.24, '27.960 €'],
    [2_150.79, '2.151 €'],
    [0, '0 €'],
    [999, '999 €'],
  ])('formats %s as %s', (value, expected) => {
    expect(normalise(formatCurrency(value))).toBe(expected)
  })

  it('groups thousands consistently, including four digit amounts', () => {
    expect(normalise(formatCurrency(2_151))).toContain('2.151')
  })

  it('rounds only at presentation time', () => {
    expect(normalise(formatCurrency(27_960.49))).toBe('27.960 €')
    expect(normalise(formatCurrency(27_960.51))).toBe('27.961 €')
  })
})

describe('formatNegativeCurrency', () => {
  it('prefixes a minus sign and drops the original sign', () => {
    expect(normalise(formatNegativeCurrency(3_676))).toBe('− 3.676 €')
    expect(normalise(formatNegativeCurrency(-3_676))).toBe('− 3.676 €')
  })
})

describe('formatPercent', () => {
  it('formats a ratio with Italian decimals', () => {
    expect(formatPercent(0.699)).toBe('69,9%')
    expect(formatPercent(0)).toBe('0%')
  })
})

describe('formatPercentWithArticle', () => {
  it.each([
    [0.699, 'il 69,9%'],
    [0.5, 'il 50%'],
    [0.92, 'il 92%'],
  ])('uses "il" before %s', (ratio, expected) => {
    expect(formatPercentWithArticle(ratio)).toBe(expected)
  })

  it.each([
    [0.851, 'l’85,1%'],
    [0.8, 'l’80%'],
    [0.11, 'l’11%'],
    [0.01, 'l’1%'],
  ])('elides the article before %s', (ratio, expected) => {
    expect(formatPercentWithArticle(ratio)).toBe(expected)
  })
})
