import { useId, useState } from 'react'

import type { SalaryCalculationResult } from '../calculator/types'
import { GLOSSARY } from '../content/glossary'
import {
  formatCurrency,
  formatNegativeCurrency,
  formatPositiveCurrency,
} from '../lib/formatCurrency'
import {
  buildBreakdownRows,
  buildIrpefDetailRows,
  buildTaxDetailRows,
  type BreakdownRow,
} from '../presentation/breakdown'
import { CompositionBar } from './CompositionBar'
import { InfoDisclosurePanel, InfoDisclosureTrigger } from './InfoDisclosure'
import styles from './BreakdownPanel.module.css'

type BreakdownPanelProps = {
  result: SalaryCalculationResult
}

function formatRowAmount(row: BreakdownRow): string {
  // A zero amount is neither withheld nor added: showing "− 0 €" reads as a mistake.
  if (row.amount === 0) return formatCurrency(0)

  if (row.tone === 'deduction') return formatNegativeCurrency(row.amount)
  if (row.tone === 'addition') return formatPositiveCurrency(row.amount)

  return formatCurrency(row.amount)
}

function BreakdownRowItem({ row }: { row: BreakdownRow }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const panelId = useId()

  const glossaryEntry = row.glossaryKey ? GLOSSARY[row.glossaryKey] : null

  return (
    <div className={`${styles.row} ${styles[row.tone]}`}>
      <dt className={styles.rowLabel}>
        <span className={styles.rowLabelText}>
          {row.label}
          {row.note ? <span className={styles.rowNote}>{row.note}</span> : null}
        </span>
        {glossaryEntry ? (
          <InfoDisclosureTrigger
            term={glossaryEntry.term}
            panelId={panelId}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded((value) => !value)}
          />
        ) : null}
      </dt>

      <dd className={styles.rowAmount}>{formatRowAmount(row)}</dd>

      {glossaryEntry ? (
        <InfoDisclosurePanel
          id={panelId}
          isExpanded={isExpanded}
          description={glossaryEntry.description}
        />
      ) : null}
    </div>
  )
}

function BreakdownRowList({ rows }: { rows: BreakdownRow[] }) {
  return (
    <dl className={styles.rows}>
      {rows.map((row) => (
        <BreakdownRowItem key={row.id} row={row} />
      ))}
    </dl>
  )
}

export function BreakdownPanel({ result }: BreakdownPanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="breakdown-title">
      {/* The title states the transformation, so the rows below read as a path
          rather than as an accounting table. */}
      <h2 id="breakdown-title" className={styles.title}>
        Da {formatCurrency(result.grossAnnualSalary)} lordi a{' '}
        {formatCurrency(result.annualNet)} netti
      </h2>

      {/* Contributions and taxes stay two distinct lines on purpose:
          social security contributions are not taxes. */}
      <BreakdownRowList rows={buildBreakdownRows(result)} />

      <CompositionBar result={result} />

      <details className={styles.details}>
        <summary className={styles.summary}>Dettaglio imposte</summary>
        <div className={styles.detailsBody}>
          <BreakdownRowList rows={buildTaxDetailRows(result)} />

          <h3 className={styles.detailsTitle}>Come si forma l’IRPEF</h3>
          <BreakdownRowList rows={buildIrpefDetailRows(result)} />
        </div>
      </details>
    </section>
  )
}
