import { useState } from 'react'

import { calculateNetSalary } from './calculator/calculateNetSalary'
import type { PaymentFrequency, SalaryCalculationResult } from './calculator/types'
import {
  validateGrossAnnualSalary,
  type SalaryInputError,
} from './calculator/validation'
import { BreakdownPanel } from './components/BreakdownPanel'
import { EstimateDisclaimer } from './components/EstimateDisclaimer'
import { MethodologySection } from './components/MethodologySection'
import { NetResultSummary } from './components/NetResultSummary'
import { PageHeader } from './components/PageHeader'
import { SalaryComparison } from './components/SalaryComparison'
import type { ComparisonInputError } from './components/SalaryComparison'
import { SalaryForm } from './components/SalaryForm'
import styles from './App.module.css'

const DEFAULT_PAYMENT_FREQUENCY: PaymentFrequency = 13

export default function App() {
  const [salaryInput, setSalaryInput] = useState('')
  const [payments, setPayments] = useState<PaymentFrequency>(
    DEFAULT_PAYMENT_FREQUENCY,
  )
  const [inputError, setInputError] = useState<SalaryInputError | null>(null)
  const [result, setResult] = useState<SalaryCalculationResult | null>(null)
  const [isResultOutdated, setIsResultOutdated] = useState(false)

  const [comparisonInput, setComparisonInput] = useState('')
  const [comparisonError, setComparisonError] =
    useState<ComparisonInputError | null>(null)
  const [comparisonSalary, setComparisonSalary] = useState<number | null>(null)

  /**
   * Derived, not stored: the comparison scenario is recomputed from the same
   * engine and the same payment frequency as the main result, so the two can
   * never drift apart — changing 12/13/14 updates both at once.
   */
  const comparisonScenario =
    result && comparisonSalary !== null
      ? calculateNetSalary(comparisonSalary, payments)
      : null

  function handleSalaryInputChange(value: string) {
    if (value === salaryInput) return

    setSalaryInput(value)
    setInputError(null)

    // The visible result no longer matches the form: flag it instead of
    // silently showing figures for a salary the user has already changed.
    if (result) setIsResultOutdated(true)
  }

  function handlePaymentsChange(value: PaymentFrequency) {
    setPayments(value)

    // Payment frequency does not affect the tax calculation, only how the
    // annual net is split, so an existing result can be refreshed right away.
    if (result && !isResultOutdated) {
      setResult(calculateNetSalary(result.grossAnnualSalary, value))
    }
  }

  function handleSubmit() {
    const validation = validateGrossAnnualSalary(salaryInput)

    if (!validation.valid) {
      setInputError(validation.error)
      setResult(null)
      setIsResultOutdated(false)
      return
    }

    setInputError(null)
    setResult(calculateNetSalary(validation.value, payments))
    setIsResultOutdated(false)

    // A comparison against the new baseline would be a comparison with itself.
    if (comparisonSalary === validation.value) {
      setComparisonSalary(null)
      setComparisonError(null)
    }
  }

  function handleComparisonInputChange(value: string) {
    if (value === comparisonInput) return

    setComparisonInput(value)
    setComparisonError(null)
  }

  function handleComparisonSubmit() {
    const validation = validateGrossAnnualSalary(comparisonInput)

    if (!validation.valid) {
      setComparisonError(validation.error)
      setComparisonSalary(null)
      return
    }

    if (result && validation.value === result.grossAnnualSalary) {
      setComparisonError('SAME_AS_CURRENT')
      setComparisonSalary(null)
      return
    }

    setComparisonError(null)
    setComparisonSalary(validation.value)
  }

  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <PageHeader />

        <section className={styles.calculator} aria-label="Calcolatore">
          <SalaryForm
            salaryInput={salaryInput}
            payments={payments}
            error={inputError}
            onSalaryInputChange={handleSalaryInputChange}
            onPaymentsChange={handlePaymentsChange}
            onSubmit={handleSubmit}
          />
        </section>

        <div className={styles.results} aria-live="polite">
          {result ? (
            <>
              {isResultOutdated ? (
                <p className={styles.outdatedNotice} role="status">
                  Hai modificato la RAL. Premi «Calcola il netto» per aggiornare la
                  stima.
                </p>
              ) : null}

              <NetResultSummary result={result} />
              <BreakdownPanel result={result} />

              <SalaryComparison
                result={result}
                scenario={comparisonScenario}
                comparisonInput={comparisonInput}
                error={comparisonError}
                onComparisonInputChange={handleComparisonInputChange}
                onSubmit={handleComparisonSubmit}
              />

              <MethodologySection />
            </>
          ) : null}
        </div>

        <EstimateDisclaimer />
      </main>
    </div>
  )
}
