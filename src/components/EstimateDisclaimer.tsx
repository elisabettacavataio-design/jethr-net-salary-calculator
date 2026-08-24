import styles from './EstimateDisclaimer.module.css'

/**
 * Deliberately readable and in the flow of the page, not hidden in the footer.
 */
export function EstimateDisclaimer() {
  return (
    <aside className={styles.disclaimer}>
      <p className={styles.title}>Questa è una stima</p>
      <p className={styles.text}>
        Il netto effettivo può variare in base alla situazione fiscale,
        previdenziale e contrattuale individuale.
      </p>
    </aside>
  )
}
