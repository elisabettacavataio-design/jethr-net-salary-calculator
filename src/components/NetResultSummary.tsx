import type { SalaryCalculationResult } from '../calculator/types'
import { formatCurrency, formatPercentWithArticle } from '../lib/formatCurrency'
import {
  getNetToGrossRatio,
  hasAllowanceOutsideGrossSalary,
} from '../presentation/summary'
import styles from './NetResultSummary.module.css'

type NetResultSummaryProps = {
  result: SalaryCalculationResult
}

/**
 * Primary result block. One number leads; the rest of the surface is used to
 * tell the transformation — from RAL to net — rather than to stack more KPIs.
 * Every value comes straight from the engine result.
 */
export function NetResultSummary({ result }: NetResultSummaryProps) {
  const netRatio = getNetToGrossRatio(result)

  return (
    <div className={styles.summary}>
      <p className={styles.headlineValue}>
        {formatCurrency(result.averageNetPayment)}
      </p>
      <p className={styles.headlineLabel}>Netto medio per mensilità</p>
      {/* No explanation here: the form above already states that the payment
          frequency only redistributes the annual net. Repeating it would cost
          space in the most important area of the page, especially on mobile. */}
      <p className={styles.headlineMeta}>× {result.payments} mensilità</p>

      <div className={styles.transformation}>
        <p className={styles.transformationLine}>
          <strong className={styles.strong}>
            {formatCurrency(result.annualNet)}
          </strong>{' '}
          netti all’anno su{' '}
          <strong className={styles.strong}>
            {formatCurrency(result.grossAnnualSalary)}
          </strong>{' '}
          di RAL
        </p>

        {/* When part of the net does not come from the RAL, the sentence says
            so: the ratio is still net-to-RAL, but calling it "what is left of
            your RAL" would overstate what the RAL alone produced. */}
        <p className={styles.insight}>
          {hasAllowanceOutsideGrossSalary(result)
            ? `Il netto annuale stimato equivale a circa ${formatPercentWithArticle(
                netRatio,
              )} della RAL, includendo la somma non imponibile.`
            : `Ti resta circa ${formatPercentWithArticle(netRatio)} della RAL.`}
        </p>
      </div>
    </div>
  )
}
