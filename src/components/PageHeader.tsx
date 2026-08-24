import { FISCAL_YEAR } from '../calculator/taxConfig2026'
import styles from './PageHeader.module.css'

export function PageHeader() {
  return (
    <header className={styles.header}>
      {/* Context, not a promotional badge: quiet, and more informative. */}
      <p className={styles.context}>
        Anno fiscale {FISCAL_YEAR} · Milano, Lombardia
      </p>

      <h1 className={styles.title}>Calcola il tuo stipendio netto</h1>

      <p className={styles.description}>
        Trasforma la tua RAL in una stima del netto annuale e del netto medio per
        mensilità.
      </p>
    </header>
  )
}
