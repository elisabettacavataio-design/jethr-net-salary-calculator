/**
 * Presentation layer only.
 *
 * Rounding happens here and nowhere else: the tax engine works at full JS
 * precision and never rounds intermediate steps.
 */

const currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  // Deliberate, non-fiscal deviation from the spec's snippet: CLDR's default
  // for it-IT is "min2" grouping, which renders four digit amounts ungrouped
  // ("2151 €"). The headline figure of this page — the average net per payment
  // — is almost always four digits, so it would be formatted differently from
  // the annual net right beside it ("27.960 €"). Forcing grouping keeps every
  // amount on the page consistent. Documented in the README.
  useGrouping: 'always',
})

const plainNumberFormatter = new Intl.NumberFormat('it-IT', {
  maximumFractionDigits: 2,
  useGrouping: 'always',
})

const percentFormatter = new Intl.NumberFormat('it-IT', {
  style: 'percent',
  maximumFractionDigits: 1,
})

/** Formats a monetary amount as whole euros, e.g. "27.960 €". */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/** Formats a monetary amount as a deduction, e.g. "− 3.676 €". */
export function formatNegativeCurrency(value: number): string {
  return `− ${currencyFormatter.format(Math.abs(value))}`
}

/** Formats a monetary amount as an addition, e.g. "+ 959 €". */
export function formatPositiveCurrency(value: number): string {
  return `+ ${currencyFormatter.format(Math.abs(value))}`
}

/**
 * Formats a difference with its sign, e.g. "+ 5.000 €" or "− 1.240 €".
 * Rounds first, so an amount that rounds to zero is not shown as "+ 0 €".
 */
export function formatSignedCurrency(value: number): string {
  const rounded = Math.round(value)

  if (rounded === 0) return currencyFormatter.format(0)

  return rounded > 0
    ? `+ ${currencyFormatter.format(rounded)}`
    : `− ${currencyFormatter.format(Math.abs(rounded))}`
}

/** Formats a bare number with Italian separators, e.g. "40.000". */
export function formatNumber(value: number): string {
  return plainNumberFormatter.format(value)
}

/** Formats a 0-1 ratio as a percentage, e.g. "69,9%". */
export function formatPercent(ratio: number): string {
  return percentFormatter.format(ratio)
}

/**
 * Formats a percentage with its Italian definite article, e.g. "il 69,9%" but
 * "l'85,1%". Needed because the article elides before numbers read with an
 * initial vowel sound: uno, otto/ottanta, undici.
 */
export function formatPercentWithArticle(ratio: number): string {
  const formatted = formatPercent(ratio)
  const integerPart = formatted.replace(/\D.*$/, '')

  const elides =
    integerPart.startsWith('8') || integerPart === '1' || integerPart === '11'

  return elides ? `l’${formatted}` : `il ${formatted}`
}
