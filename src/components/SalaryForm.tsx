import { useId, type FormEvent } from 'react'

import type { PaymentFrequency } from '../calculator/types'
import {
  SUPPORTED_PAYMENT_FREQUENCIES,
  validateGrossAnnualSalary,
} from '../calculator/validation'
import type { SalaryInputError } from '../calculator/validation'
import { formatNumber } from '../lib/formatCurrency'
import { SegmentedControl } from './SegmentedControl'
import styles from './SalaryForm.module.css'

/** Error copy lives in the UI; the engine only returns codes. */
const ERROR_MESSAGES: Record<SalaryInputError, string> = {
  EMPTY: 'Inserisci la tua RAL per calcolare il netto.',
  NOT_A_NUMBER: 'Inserisci solo cifre, ad esempio 40.000.',
  NOT_POSITIVE: 'La RAL deve essere maggiore di zero.',
  ABOVE_SUPPORTED_RANGE:
    'Il valore è troppo alto per questa stima. Inserisci una RAL fino a 10.000.000 €.',
}

const PAYMENT_OPTIONS = SUPPORTED_PAYMENT_FREQUENCIES.map((frequency) => ({
  value: frequency,
  label: String(frequency),
}))

type SalaryFormProps = {
  salaryInput: string
  payments: PaymentFrequency
  error: SalaryInputError | null
  onSalaryInputChange: (value: string) => void
  onPaymentsChange: (value: PaymentFrequency) => void
  onSubmit: () => void
}

export function SalaryForm({
  salaryInput,
  payments,
  error,
  onSalaryInputChange,
  onPaymentsChange,
  onSubmit,
}: SalaryFormProps) {
  const salaryInputId = useId()
  const salaryHintId = useId()
  const salaryErrorId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  /** Tidies a valid amount into Italian formatting; leaves invalid input alone. */
  function handleSalaryBlur() {
    const validation = validateGrossAnnualSalary(salaryInput)

    if (validation.valid) {
      onSalaryInputChange(formatNumber(validation.value))
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor={salaryInputId} className={styles.label}>
          Retribuzione annua lorda
        </label>

        <div
          className={`${styles.inputWrapper} ${error ? styles.inputWrapperError : ''}`}
        >
          <span className={styles.currency} aria-hidden="true">
            €
          </span>
          <input
            id={salaryInputId}
            className={styles.input}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="40.000"
            value={salaryInput}
            aria-invalid={error !== null}
            aria-describedby={error ? `${salaryErrorId} ${salaryHintId}` : salaryHintId}
            onChange={(event) => onSalaryInputChange(event.target.value)}
            onBlur={handleSalaryBlur}
          />
        </div>

        <p id={salaryHintId} className={styles.hint}>
          La RAL è il totale annuo lordo indicato nel contratto, prima di contributi
          e imposte.
        </p>

        {error ? (
          <p id={salaryErrorId} className={styles.error} role="alert">
            <span className={styles.errorIcon} aria-hidden="true">
              !
            </span>
            {ERROR_MESSAGES[error]}
          </p>
        ) : null}
      </div>

      <SegmentedControl
        legend="Mensilità"
        hint="Le mensilità modificano solo la distribuzione del netto annuale, non le imposte: il risultato si aggiorna subito, senza ricalcolare."
        options={PAYMENT_OPTIONS}
        value={payments}
        onChange={onPaymentsChange}
      />

      <button type="submit" className={styles.submit}>
        Calcola il netto
      </button>
    </form>
  )
}
