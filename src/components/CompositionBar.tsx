import type { SalaryCalculationResult } from '../calculator/types'
import { formatCurrency, formatPercent, formatPositiveCurrency } from '../lib/formatCurrency'
import { buildComposition } from '../presentation/composition'
import styles from './CompositionBar.module.css'

type CompositionBarProps = {
  result: SalaryCalculationResult
}

/**
 * Segmented bar showing how the gross annual salary splits into net, taxes and
 * contributions. Hand-built: no chart library, proportions derived from the
 * engine result.
 *
 * The segments describe the RAL and only the RAL. The non-taxable tax-wedge
 * allowance sits outside the bar because it is added on top of the gross
 * salary, not withheld from it.
 *
 * Every segment is written out in the legend, so no information is carried by
 * colour alone.
 */
export function CompositionBar({ result }: CompositionBarProps) {
  const segments = buildComposition(result)

  const textualSummary = segments
    .map((segment) => `${segment.label} ${formatPercent(segment.ratio)}`)
    .join(', ')

  return (
    <div className={styles.composition}>
      <p className={styles.caption}>Composizione della RAL</p>

      <div
        className={styles.bar}
        role="img"
        aria-label={`Composizione della RAL: ${textualSummary}`}
      >
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`${styles.segment} ${styles[segment.id]}`}
            style={{ flexGrow: segment.ratio }}
          />
        ))}
      </div>

      <ul className={styles.legend}>
        {segments.map((segment) => (
          <li key={segment.id} className={styles.legendItem}>
            <span
              className={`${styles.swatch} ${styles[segment.id]}`}
              aria-hidden="true"
            />
            <span className={styles.legendLabel}>{segment.label}</span>
            <span className={styles.legendValue}>
              {formatCurrency(segment.amount)}
            </span>
            <span className={styles.legendRatio}>
              {formatPercent(segment.ratio)}
            </span>
          </li>
        ))}
      </ul>

      {result.taxWedgeBonus > 0 ? (
        <div className={styles.outsideItem}>
          <p className={styles.outsideLabel}>
            Somma non imponibile
            <span className={styles.outsideNote}>
              Cuneo fiscale: si aggiunge alla RAL, quindi resta fuori dalla barra
            </span>
          </p>
          <p className={styles.outsideValue}>
            {formatPositiveCurrency(result.taxWedgeBonus)}
          </p>
        </div>
      ) : null}
    </div>
  )
}
