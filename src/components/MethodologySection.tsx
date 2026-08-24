import { MODEL_ASSUMPTIONS, MODEL_EXCLUSIONS } from '../content/assumptions'
import styles from './MethodologySection.module.css'

/**
 * Transparency block: the assumptions behind the estimate and, just as
 * important, what the model deliberately leaves out.
 */
export function MethodologySection() {
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>
        Come abbiamo calcolato questa stima
      </summary>

      <div className={styles.body}>
        <dl className={styles.assumptions}>
          {MODEL_ASSUMPTIONS.map((assumption) => (
            <div key={assumption.label} className={styles.assumption}>
              <dt className={styles.assumptionLabel}>{assumption.label}</dt>
              <dd className={styles.assumptionValue}>{assumption.value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <h3 className={styles.exclusionsTitle}>Cosa non consideriamo</h3>
          <ul className={styles.exclusions}>
            {MODEL_EXCLUSIONS.map((exclusion) => (
              <li key={exclusion}>{exclusion}</li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  )
}
