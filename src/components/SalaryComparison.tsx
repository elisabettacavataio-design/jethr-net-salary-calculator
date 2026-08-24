import { useId, type FormEvent } from 'react'

import type { SalaryCalculationResult } from '../calculator/types'
import type { SalaryInputError } from '../calculator/validation'
import { validateGrossAnnualSalary } from '../calculator/validation'
import {
  formatCurrency,
  formatNumber,
  formatSignedCurrency,
} from '../lib/formatCurrency'
import {
  buildComparison,
  type Comparison,
  type InversionMechanism,
} from '../presentation/comparison'
import styles from './SalaryComparison.module.css'

export type ComparisonInputError = SalaryInputError | 'SAME_AS_CURRENT'

const ERROR_MESSAGES: Record<ComparisonInputError, string> = {
  EMPTY: 'Inserisci la RAL da confrontare.',
  NOT_A_NUMBER: 'Inserisci solo cifre, ad esempio 45.000.',
  NOT_POSITIVE: 'La RAL deve essere maggiore di zero.',
  ABOVE_SUPPORTED_RANGE:
    'Il valore è troppo alto per questa stima. Inserisci una RAL fino a 10.000.000 €.',
  SAME_AS_CURRENT:
    'È la stessa RAL del calcolo principale: inserisci un valore diverso per vedere la differenza.',
}

type SalaryComparisonProps = {
  result: SalaryCalculationResult
  scenario: SalaryCalculationResult | null
  comparisonInput: string
  error: ComparisonInputError | null
  onComparisonInputChange: (value: string) => void
  onSubmit: () => void
}

/** True when the per-payment difference is too small to state on its own. */
function headlineFallsBackToAnnual(comparison: Comparison): boolean {
  return Math.round(Math.abs(comparison.paymentNetDifference)) === 0
}

/**
 * The sentence that carries the point of the whole block.
 *
 * Falls back to the annual figure when the per-payment difference rounds to
 * zero — "circa 0 € netti in meno" would be a nonsense phrase, and it happens
 * for real: crossing a threshold can move a whole year's net by a few euro.
 */
function buildHeadline(comparison: Comparison): string {
  const gross = formatCurrency(Math.abs(comparison.grossDifference))
  const grossDirection = comparison.grossDifference > 0 ? 'in più' : 'in meno'
  const netDirection = comparison.isInverted
    ? comparison.grossDifference > 0
      ? 'in meno'
      : 'in più'
    : grossDirection

  const perPayment = Math.abs(comparison.paymentNetDifference)
  const annual = Math.abs(comparison.annualNetDifference)

  if (headlineFallsBackToAnnual(comparison)) {
    if (Math.round(annual) === 0) {
      return `${gross} di RAL ${grossDirection} non cambiano il netto in modo apprezzabile.`
    }

    return `${gross} di RAL ${grossDirection} significano circa ${formatCurrency(
      annual,
    )} netti ${netDirection} all’anno.`
  }

  return `${gross} di RAL ${grossDirection} significano circa ${formatCurrency(
    perPayment,
  )} netti ${netDirection} per mensilità.`
}

/**
 * Names the rule behind an inversion. A generic "a threshold is crossed" reads
 * like the calculator noticed something odd without understanding it.
 */
function buildInversionExplanation(comparison: Comparison): string {
  const mechanism: InversionMechanism =
    comparison.inversion?.mechanism ?? 'UNKNOWN'
  const threshold = comparison.inversion?.threshold

  const consequence =
    'Nel modello questo produce una riduzione temporanea del netto all’aumentare della RAL.'

  switch (mechanism) {
    case 'MUNICIPAL_SURCHARGE_STARTS':
      return `Superando ${
        threshold ? formatCurrency(threshold) : 'la soglia'
      } di imponibile scatta l’addizionale comunale di Milano, che si applica all’intero imponibile e non solo alla parte eccedente. ${consequence}`

    case 'TAX_WEDGE_ALLOWANCE_ENDS':
      return `Oltre questa soglia non spetta più la somma non imponibile del cuneo fiscale, che veniva aggiunta direttamente al netto. ${consequence}`

    case 'TAX_WEDGE_ALLOWANCE_REDUCED':
      return `Oltre questa soglia si riduce l’aliquota della somma non imponibile del cuneo fiscale, che viene aggiunta direttamente al netto. ${consequence}`

    case 'EMPLOYEE_DEDUCTION_ENDS':
      return `Oltre questa soglia si azzera la detrazione da lavoro dipendente, che abbatteva l’IRPEF. ${consequence}`

    default:
      return `In questo intervallo il netto si muove nella direzione opposta alla RAL. ${consequence}`
  }
}

function ComparisonTable({ comparison }: { comparison: Comparison }) {
  return (
    <table className={styles.table}>
      <caption className="visuallyHidden">
        Confronto tra la RAL attuale e la RAL alternativa
      </caption>
      <thead>
        <tr>
          <th scope="col">Voce</th>
          <th scope="col">Oggi</th>
          <th scope="col">Nuova RAL</th>
          <th scope="col">Differenza</th>
        </tr>
      </thead>
      <tbody>
        {comparison.rows.map((row) => (
          <tr key={row.id}>
            <th scope="row" className={styles.rowHeader}>
              {row.label}
            </th>
            <td>{formatCurrency(row.current)}</td>
            <td>{formatCurrency(row.scenario)}</td>
            <td className={styles.difference}>
              {formatSignedCurrency(row.difference)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Same data, different structure. Below 600px a four column table stops being
 * readable, and the delta — not the cell by cell comparison — is what matters.
 * Only one of the two is rendered at a time by the stylesheet, so assistive
 * technology never announces the figures twice.
 */
function ComparisonCards({ comparison }: { comparison: Comparison }) {
  return (
    <div className={styles.cards}>
      <div className={styles.scenarioCards}>
        <div className={styles.scenarioCard}>
          <p className={styles.scenarioLabel}>Oggi</p>
          <dl className={styles.scenarioList}>
            {comparison.rows.map((row) => (
              <div key={row.id} className={styles.scenarioItem}>
                <dt>{row.label}</dt>
                <dd>{formatCurrency(row.current)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={styles.scenarioCard}>
          <p className={styles.scenarioLabel}>Nuova RAL</p>
          <dl className={styles.scenarioList}>
            {comparison.rows.map((row) => (
              <div key={row.id} className={styles.scenarioItem}>
                <dt>{row.label}</dt>
                <dd>{formatCurrency(row.scenario)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className={styles.differenceCard}>
        <p className={styles.differenceTitle}>Differenza</p>
        <dl className={styles.scenarioList}>
          {comparison.rows.map((row) => (
            <div key={row.id} className={styles.scenarioItem}>
              <dt>{row.label}</dt>
              <dd className={styles.differenceValue}>
                {formatSignedCurrency(row.difference)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

export function SalaryComparison({
  result,
  scenario,
  comparisonInput,
  error,
  onComparisonInputChange,
  onSubmit,
}: SalaryComparisonProps) {
  const inputId = useId()
  const errorId = useId()

  const comparison = scenario ? buildComparison(result, scenario) : null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  function handleBlur() {
    const validation = validateGrossAnnualSalary(comparisonInput)

    if (validation.valid) {
      onComparisonInputChange(formatNumber(validation.value))
    }
  }

  return (
    <section className={styles.comparison} aria-labelledby="comparison-title">
      <h2 id="comparison-title" className={styles.title}>
        Vuoi confrontare un’altra RAL?
      </h2>
      <p className={styles.subtitle}>Scopri quanto cambia davvero il tuo netto.</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={inputId} className={styles.label}>
            Nuova RAL
          </label>
          <div
            className={`${styles.inputWrapper} ${error ? styles.inputWrapperError : ''}`}
          >
            <span className={styles.currency} aria-hidden="true">
              €
            </span>
            <input
              id={inputId}
              className={styles.input}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="45.000"
              value={comparisonInput}
              aria-invalid={error !== null}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => onComparisonInputChange(event.target.value)}
              onBlur={handleBlur}
            />
          </div>
        </div>

        <button type="submit" className={styles.submit}>
          Confronta
        </button>
      </form>

      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          <span className={styles.errorIcon} aria-hidden="true">
            !
          </span>
          {ERROR_MESSAGES[error]}
        </p>
      ) : null}

      <div aria-live="polite">
        {comparison ? (
          <div className={styles.outcome}>
            <h3 className={styles.outcomeTitle}>
              Da {formatCurrency(comparison.currentGrossSalary)} a{' '}
              {formatCurrency(comparison.scenarioGrossSalary)} di RAL
            </h3>

            {/* The insight leads, the numbers support it — the same order the
                rest of the page follows: answer first, detail after. */}
            <p className={styles.headline}>{buildHeadline(comparison)}</p>

            {/* Cognitive order: per mensilità, then per year, then the detail. */}
            {headlineFallsBackToAnnual(comparison) ? null : (
              <p className={styles.annual}>
                {formatSignedCurrency(comparison.annualNetDifference)} netti
                all’anno
              </p>
            )}

            <p className={styles.marginal}>
              {comparison.isInverted
                ? buildInversionExplanation(comparison)
                : `Ogni 100 € di RAL di differenza valgono circa ${formatCurrency(
                    Math.abs(comparison.netPer100Gross),
                  )} di netto.`}
            </p>

            <ComparisonTable comparison={comparison} />
            <ComparisonCards comparison={comparison} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
