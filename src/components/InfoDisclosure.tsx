import styles from './InfoDisclosure.module.css'

/**
 * Progressive disclosure for a single fiscal term, split into two parts so the
 * caller can place the trigger next to the label and the explanation on its own
 * line, below the whole row.
 *
 * A button + region rather than a hover tooltip: it works with keyboard, screen
 * readers and touch, and needs no positioning logic.
 */

type InfoDisclosureTriggerProps = {
  term: string
  panelId: string
  isExpanded: boolean
  onToggle: () => void
}

export function InfoDisclosureTrigger({
  term,
  panelId,
  isExpanded,
  onToggle,
}: InfoDisclosureTriggerProps) {
  return (
    <button
      type="button"
      className={styles.trigger}
      aria-expanded={isExpanded}
      aria-controls={panelId}
      onClick={onToggle}
    >
      <span aria-hidden="true">i</span>
      <span className="visuallyHidden">
        {isExpanded ? `Nascondi la spiegazione di ${term}` : `Cosa significa ${term}`}
      </span>
    </button>
  )
}

type InfoDisclosurePanelProps = {
  id: string
  isExpanded: boolean
  description: string
}

export function InfoDisclosurePanel({
  id,
  isExpanded,
  description,
}: InfoDisclosurePanelProps) {
  return (
    <p id={id} className={styles.panel} hidden={!isExpanded}>
      {description}
    </p>
  )
}
