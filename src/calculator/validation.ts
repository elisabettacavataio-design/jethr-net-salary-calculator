import type { PaymentFrequency } from './types'

/**
 * Input validation lives in the engine layer, error *copy* lives in the UI.
 * The engine returns a code; components map codes to Italian messages.
 */
export type SalaryInputError =
  | 'EMPTY'
  | 'NOT_A_NUMBER'
  | 'NOT_POSITIVE'
  | 'ABOVE_SUPPORTED_RANGE'

/** Upper sanity bound. Beyond this the model is not meaningful. */
export const MAX_SUPPORTED_SALARY = 10_000_000

export const SUPPORTED_PAYMENT_FREQUENCIES: readonly PaymentFrequency[] = [12, 13, 14]

export type ValidationResult =
  | { valid: true; value: number }
  | { valid: false; error: SalaryInputError }

/**
 * Parses and validates the raw string coming from the salary input.
 * Accepts Italian formatting: "40.000", "40000,50", "40 000".
 */
export function validateGrossAnnualSalary(rawValue: string): ValidationResult {
  const trimmed = rawValue.trim()

  if (trimmed === '') return { valid: false, error: 'EMPTY' }

  const normalised = trimmed
    .replace(/[\s€]/g, '')
    .replace(/\.(?=\d{3}\b)/g, '') // thousands separator
    .replace(',', '.')

  if (!/^-?\d+(\.\d+)?$/.test(normalised)) {
    return { valid: false, error: 'NOT_A_NUMBER' }
  }

  const value = Number(normalised)

  if (!Number.isFinite(value)) return { valid: false, error: 'NOT_A_NUMBER' }
  if (value <= 0) return { valid: false, error: 'NOT_POSITIVE' }
  if (value > MAX_SUPPORTED_SALARY) {
    return { valid: false, error: 'ABOVE_SUPPORTED_RANGE' }
  }

  return { valid: true, value }
}

export function isSupportedPaymentFrequency(
  value: number,
): value is PaymentFrequency {
  return SUPPORTED_PAYMENT_FREQUENCIES.includes(value as PaymentFrequency)
}
